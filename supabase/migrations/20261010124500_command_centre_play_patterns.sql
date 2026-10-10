-- Privacy-safe player-local timing and staff-only play-pattern aggregates.
-- Timezones are browser-reported IANA identifiers. They are not treated as location.

alter function public.decked_analytics_properties_are_safe(jsonb)
  rename to decked_analytics_properties_are_safe_without_time_context;

create function public.decked_analytics_properties_are_safe(p_properties jsonb)
returns boolean language sql immutable set search_path=''
as $$
  select public.decked_analytics_properties_are_safe_without_time_context(
      p_properties - 'timezone' - 'timezone_offset_minutes'
    )
    and (
      not (p_properties ? 'timezone')
      or (
        jsonb_typeof(p_properties->'timezone')='string'
        and char_length(p_properties->>'timezone')<=64
        and (p_properties->>'timezone'='UTC' or p_properties->>'timezone' ~ '^[A-Za-z_+-]+(/[A-Za-z0-9_+-]+){1,2}$')
      )
    )
    and (
      not (p_properties ? 'timezone_offset_minutes')
      or (
        jsonb_typeof(p_properties->'timezone_offset_minutes')='number'
        and (p_properties->>'timezone_offset_minutes')::numeric=trunc((p_properties->>'timezone_offset_minutes')::numeric)
        and (p_properties->>'timezone_offset_minutes')::numeric between -840 and 840
      )
    )
$$;

revoke all on function public.decked_analytics_properties_are_safe_without_time_context(jsonb) from public,anon,authenticated;
revoke all on function public.decked_analytics_properties_are_safe(jsonb) from public,anon,authenticated;
comment on function public.decked_analytics_properties_are_safe(jsonb) is 'Strict content-free property allowlist with bounded browser timezone context; rejects names, codes, prompts, answers, secrets, and nested objects.';

create function public.decked_command_centre_play_patterns(
  p_environment text,p_from date,p_to date,p_game_id text default null,
  p_play_mode text default null,p_device_class text default null,
  p_country text default null,p_timezone text default null
) returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode.' using errcode='22023'; end if;
  if p_device_class is not null and p_device_class not in ('mobile','tablet','desktop','unknown') then raise exception 'Invalid device class.' using errcode='22023'; end if;
  if p_country is not null and p_country!~'^[A-Z]{2}$' then raise exception 'Invalid country.' using errcode='22023'; end if;
  if p_timezone is not null and not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone.' using errcode='22023'; end if;

  with opens as (
    select distinct on(e.analytics_session_id) e.analytics_session_id,e.properties->>'timezone' timezone_name,
      case when e.properties->>'device_class' in('mobile','tablet','desktop') then e.properties->>'device_class' else 'unknown' end device_class,
      g.country_code
    from public.analytics_events e
    left join public.analytics_event_geography g on g.environment=e.environment and g.event_id=e.event_id
    where e.environment=p_environment and e.event_name='app_opened' and e.analytics_session_id is not null
    order by e.analytics_session_id,e.occurred_at,e.event_id
  ), starts as (
    select distinct on(e.game_session_id) e.game_session_id,e.occurred_at,e.game_id,e.play_mode,e.analytics_session_id,
      o.timezone_name,o.device_class,o.country_code,tz.name valid_timezone
    from public.analytics_events e left join opens o using(analytics_session_id)
    left join pg_catalog.pg_timezone_names tz on tz.name=o.timezone_name
    where e.environment=p_environment and e.event_name in('game_started','multiplayer_game_started','rematch_started')
      and e.game_session_id is not null and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
      and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode)
      and (p_device_class is null or o.device_class=p_device_class) and (p_country is null or o.country_code=p_country)
      and (p_timezone is null or tz.name=p_timezone)
    order by e.game_session_id,(e.analytics_session_id is not null) desc,e.occurred_at
  ), facts as (
    select s.*,case when valid_timezone is not null then timezone(valid_timezone,occurred_at) end local_at
    from starts s
  ), localized as (
    select *,extract(isodow from local_at)::int iso_weekday,to_char(local_at,'Dy') weekday,extract(hour from local_at)::int local_hour
    from facts where local_at is not null
  ), heat_grid as (
    select day iso_weekday,trim(to_char(date '2024-01-01'+(day-1),'Dy')) weekday,local_hour as "hour",
      count(l.game_session_id)::int game_starts
    from generate_series(1,7) day cross join generate_series(0,23) as hours(local_hour)
    left join localized l on l.iso_weekday=day and l.local_hour=hours.local_hour group by day,hours.local_hour
  ), hourly_rows as (
    select hours.local_hour as "hour",count(l.game_session_id)::int game_starts from generate_series(0,23) as hours(local_hour) left join localized l on l.local_hour=hours.local_hour group by hours.local_hour
  ), weekday_rows as (
    select day iso_weekday,trim(to_char(date '2024-01-01'+(day-1),'Dy')) weekday,count(l.game_session_id)::int game_starts
    from generate_series(1,7) day left join localized l on l.iso_weekday=day group by day
  ), country_base as (
    select coalesce(country_code,'') country_code,count(*)::int game_starts,
      count(*) filter(where valid_timezone is not null)::int timezone_starts from facts group by country_code
  ), country_rows as (
    select c.*,
      (select weekday from localized l where coalesce(l.country_code,'')=c.country_code group by weekday,iso_weekday order by count(*) desc,iso_weekday limit 1) peak_weekday,
      (select local_hour from localized l where coalesce(l.country_code,'')=c.country_code group by local_hour order by count(*) desc,local_hour limit 1) peak_hour,
      round(100.0*c.timezone_starts/nullif(c.game_starts,0),1) timezone_coverage
    from country_base c where country_code<>''
  ), game_base as (
    select game_id,count(*)::int game_starts from facts where game_id is not null group by game_id
  ), game_rows as (
    select g.*,
      (select weekday from localized l where l.game_id=g.game_id group by weekday,iso_weekday order by count(*) desc,iso_weekday limit 1) peak_weekday,
      (select local_hour from localized l where l.game_id=g.game_id group by local_hour order by count(*) desc,local_hour limit 1) peak_hour
    from game_base g
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'game_starts',(select count(*) from facts),
      'timezone_attributed_starts',(select count(*) from localized),
      'timezone_coverage',coalesce((select round(100.0*count(*) filter(where local_at is not null)/nullif(count(*),0),1) from facts),0),
      'peak_weekday',(select weekday from weekday_rows where game_starts>0 order by game_starts desc,iso_weekday limit 1),
      'peak_hour',(select "hour" from hourly_rows where game_starts>0 order by game_starts desc,"hour" limit 1),
      'weekend_starts',(select count(*) from localized where iso_weekday in(6,7)),
      'weekday_starts',(select count(*) from localized where iso_weekday between 1 and 5)
    ),
    'heatmap',coalesce((select jsonb_agg(to_jsonb(h) order by iso_weekday,"hour") from heat_grid h),'[]'::jsonb),
    'hourly',coalesce((select jsonb_agg(to_jsonb(h) order by "hour") from hourly_rows h),'[]'::jsonb),
    'weekdays',coalesce((select jsonb_agg(to_jsonb(w) order by iso_weekday) from weekday_rows w),'[]'::jsonb),
    'countries',coalesce((select jsonb_agg(to_jsonb(c) order by game_starts desc,country_code) from country_rows c),'[]'::jsonb),
    'games',coalesce((select jsonb_agg(to_jsonb(g) order by game_starts desc,game_id) from game_rows g),'[]'::jsonb),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',case
      when (select count(*) from facts)=0 then jsonb_build_array('No game starts match this period. Zero values are shown instead of fabricated trends.')
      when (select count(*) from facts)<20 then jsonb_build_array('Small sample: use peak-time findings as directional only.')
      when (select count(*) from localized)<(select count(*) from facts) then jsonb_build_array('Older or server-only starts without a valid browser timezone are excluded from local-time charts.')
      else '[]'::jsonb end
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_play_patterns(text,date,date,text,text,text,text,text) from public,anon;
grant execute on function public.decked_command_centre_play_patterns(text,date,date,text,text,text,text,text) to authenticated;
comment on function public.decked_command_centre_play_patterns(text,date,date,text,text,text,text,text) is 'Staff-only zero-filled aggregate of game starts by browser-local hour and weekday; returns no raw identities or precise location.';
