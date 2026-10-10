-- Zero-filled Daily/Weekly/Monthly/Yearly play-pattern timeline.
-- Uses browser-local dates and returns aggregates only; raw identities never leave Postgres.
create function public.decked_command_centre_play_patterns_timeline(
  p_environment text,p_from date,p_to date,p_game_id text default null,
  p_play_mode text default null,p_device_class text default null,
  p_country text default null,p_timezone text default null,
  p_granularity text default 'week'
) returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;step interval;range_start date;range_end date;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in('pass_and_play','play_together') then raise exception 'Invalid play mode.' using errcode='22023'; end if;
  if p_device_class is not null and p_device_class not in('mobile','tablet','desktop','unknown') then raise exception 'Invalid device class.' using errcode='22023'; end if;
  if p_country is not null and p_country!~'^[A-Z]{2}$' then raise exception 'Invalid country.' using errcode='22023'; end if;
  if p_timezone is not null and not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone.' using errcode='22023'; end if;
  if p_granularity not in('day','week','month','year') then raise exception 'Invalid timeline granularity.' using errcode='22023'; end if;
  step:=case p_granularity when 'day' then interval '1 day' when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end;
  range_start:=date_trunc(p_granularity,p_from::timestamp)::date;
  range_end:=date_trunc(p_granularity,p_to::timestamp)::date;

  with opens as (
    select distinct on(e.analytics_session_id) e.analytics_session_id,e.properties->>'timezone' timezone_name,
      case when e.properties->>'device_class' in('mobile','tablet','desktop') then e.properties->>'device_class' else 'unknown' end device_class,
      g.country_code
    from public.analytics_events e left join public.analytics_event_geography g on g.environment=e.environment and g.event_id=e.event_id
    where e.environment=p_environment and e.event_name='app_opened' and e.analytics_session_id is not null
    order by e.analytics_session_id,e.occurred_at,e.event_id
  ), starts as (
    select distinct on(e.game_session_id) e.game_session_id,e.occurred_at,e.game_id,e.play_mode,e.analytics_session_id,e.analytics_user_id,
      o.timezone_name,o.device_class,o.country_code,tz.name valid_timezone
    from public.analytics_events e left join opens o using(analytics_session_id)
    left join pg_catalog.pg_timezone_names tz on tz.name=o.timezone_name
    where e.environment=p_environment and e.event_name in('game_started','multiplayer_game_started','rematch_started')
      and e.game_session_id is not null and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
      and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode)
      and (p_device_class is null or o.device_class=p_device_class) and (p_country is null or o.country_code=p_country)
      and (p_timezone is null or tz.name=p_timezone)
    order by e.game_session_id,(e.analytics_session_id is not null) desc,e.occurred_at
  ), outcomes as (
    select e.game_session_id,
      count(distinct e.event_id) filter(where e.event_name in('game_completed','multiplayer_game_completed'))::int completions,
      count(distinct e.event_id) filter(where e.event_name='card_presented')::int cards_played
    from public.analytics_events e join starts s using(game_session_id)
    where e.environment=p_environment group by e.game_session_id
  ), facts as (
    select s.*,timezone(valid_timezone,occurred_at) local_at,coalesce(o.completions,0) completions,coalesce(o.cards_played,0) cards_played
    from starts s left join outcomes o using(game_session_id) where valid_timezone is not null
  ), buckets as (
    select generated::date bucket_start,least((generated+step-interval '1 day')::date,p_to) bucket_end
    from generate_series(range_start::timestamp,range_end::timestamp,step) generated
  ), rows as (
    select b.bucket_start,b.bucket_end,
      count(distinct f.analytics_user_id)::int active_players,count(f.game_session_id)::int game_starts,
      count(f.game_session_id) filter(where f.completions>0)::int completions,
      coalesce(round(100.0*count(f.game_session_id) filter(where f.completions>0)/nullif(count(f.game_session_id),0),1),0) completion_rate,
      coalesce(sum(f.cards_played),0)::int cards_played,
      count(f.game_session_id) filter(where f.play_mode='pass_and_play')::int pass_and_play_starts,
      count(f.game_session_id) filter(where f.play_mode='play_together')::int play_together_starts
    from buckets b left join facts f on date_trunc(p_granularity,f.local_at)::date=b.bucket_start
    group by b.bucket_start,b.bucket_end
  )
  select jsonb_build_object(
    'granularity',p_granularity,
    'rows',coalesce((select jsonb_agg(to_jsonb(r) order by bucket_start) from rows r),'[]'::jsonb),
    'timezone_attributed_starts',(select count(*) from facts),
    'unattributed_starts',(select count(*) from starts where valid_timezone is null),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to)
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_play_patterns_timeline(text,date,date,text,text,text,text,text,text) from public,anon;
grant execute on function public.decked_command_centre_play_patterns_timeline(text,date,date,text,text,text,text,text,text) to authenticated;
comment on function public.decked_command_centre_play_patterns_timeline(text,date,date,text,text,text,text,text,text) is 'Staff-only zero-filled local-time play timeline with daily, weekly, monthly, or yearly aggregation and no raw identities.';
