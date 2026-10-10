-- Privacy-safe country attribution. Browser clients cannot write or read this table.
-- A trusted Vercel Function attaches country codes after normal authenticated ingestion.

create table public.analytics_event_geography (
  environment text not null check (environment in ('development','preview','production')),
  event_id uuid not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  continent_code text check (continent_code is null or continent_code in ('AF','AN','AS','EU','NA','OC','SA')),
  attributed_at timestamptz not null default now(),
  primary key (environment,event_id),
  foreign key (environment,event_id) references public.analytics_events(environment,event_id) on delete cascade
);

create index analytics_event_geography_country_idx
  on public.analytics_event_geography(environment,country_code,event_id);

alter table public.analytics_event_geography enable row level security;
revoke all on public.analytics_event_geography from public,anon,authenticated;
grant select,insert,delete on public.analytics_event_geography to service_role;

comment on table public.analytics_event_geography is
  'Country-level IP geolocation attached by trusted server ingestion. No IP, city, coordinates, postal code, or browser-provided location is retained. Rows follow analytics_events retention through cascade deletion.';

create function public.decked_attach_analytics_geography(p_entries jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare entry jsonb; inserted_count integer:=0; candidate_count integer:=0;
begin
  if auth.role()<>'service_role' and current_user not in ('postgres','service_role') then
    raise exception 'Service role required.' using errcode='42501';
  end if;
  if p_entries is null or jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries) not between 1 and 25 or octet_length(p_entries::text)>8192 then
    raise exception 'Invalid geography attachment batch.' using errcode='22023';
  end if;
  for entry in select value from pg_catalog.jsonb_array_elements(p_entries) loop
    candidate_count:=candidate_count+1;
    if jsonb_typeof(entry)<>'object'
      or entry-array['environment','event_id','country_code','continent_code']<>'{}'::jsonb
      or entry->>'environment' not in ('development','preview','production')
      or coalesce(entry->>'country_code','')!~'^[A-Z]{2}$'
      or (entry ? 'continent_code' and entry->>'continent_code' not in ('AF','AN','AS','EU','NA','OC','SA')) then
      raise exception 'Invalid geography attachment.' using errcode='22023';
    end if;
    insert into public.analytics_event_geography(environment,event_id,country_code,continent_code)
    values(entry->>'environment',(entry->>'event_id')::uuid,entry->>'country_code',nullif(entry->>'continent_code',''))
    on conflict(environment,event_id) do nothing;
    inserted_count:=inserted_count+case when found then 1 else 0 end;
  end loop;
  return jsonb_build_object('received',candidate_count,'inserted',inserted_count);
end $$;

revoke all on function public.decked_attach_analytics_geography(jsonb) from public,anon,authenticated;
grant execute on function public.decked_attach_analytics_geography(jsonb) to service_role;

create function public.decked_command_centre_geography(p_environment text,p_from date,p_to date)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501';end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  with located as (
    select e.*,g.country_code
    from public.analytics_events e join public.analytics_event_geography g
      on g.environment=e.environment and g.event_id=e.event_id
    where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
  ), first_seen as (
    select analytics_user_id,min((occurred_at at time zone 'UTC')::date) first_date
    from public.analytics_events where environment=p_environment and analytics_user_id is not null group by 1
  ), countries as (
    select l.country_code,
      count(distinct l.analytics_user_id) filter(where l.analytics_user_id is not null) active_players,
      count(distinct l.analytics_user_id) filter(where f.first_date between p_from and p_to) new_players,
      count(distinct l.analytics_user_id) filter(where f.first_date<p_from) returning_players,
      count(distinct l.analytics_session_id) filter(where l.analytics_session_id is not null) sessions,
      count(*) filter(where l.event_name in ('game_started','multiplayer_game_started')) game_starts,
      count(*) filter(where l.event_name in ('game_completed','multiplayer_game_completed')) completions,
      count(*) filter(where l.event_name='room_created') rooms_created
    from located l left join first_seen f using(analytics_user_id) group by l.country_code
  ), grouped_countries as (
    select case when active_players<10 then 'OTHER' else country_code end country_code,
      sum(active_players) active_players,sum(new_players) new_players,sum(returning_players) returning_players,
      sum(sessions) sessions,sum(game_starts) game_starts,sum(completions) completions,sum(rooms_created) rooms_created
    from countries group by 1
  ), daily as (
    select (occurred_at at time zone 'UTC')::date metric_date,country_code,
      count(distinct analytics_user_id) filter(where analytics_user_id is not null) active_players
    from located group by 1,2
  ), coverage as (
    select count(distinct analytics_user_id) filter(where analytics_user_id is not null) total_players,
      count(distinct analytics_user_id) filter(where analytics_user_id is not null and exists(
        select 1 from public.analytics_event_geography gx where gx.environment=e.environment and gx.event_id=e.event_id
      )) located_players
    from public.analytics_events e where environment=p_environment and (occurred_at at time zone 'UTC')::date between p_from and p_to
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'countries_reached',(select count(*) from countries),
      'located_players',coalesce((select located_players from coverage),0),
      'total_players',coalesce((select total_players from coverage),0),
      'international_players',coalesce((select sum(active_players) from countries where country_code<>'NG'),0)),
    'countries',coalesce((select jsonb_agg(jsonb_build_object(
      'country_code',country_code,'active_players',active_players,'new_players',new_players,'returning_players',returning_players,
      'sessions',sessions,'game_starts',game_starts,'completions',completions,
      'completion_rate',case when game_starts>0 then round(100.0*completions/game_starts,1) else 0 end,'rooms_created',rooms_created
    ) order by active_players desc,country_code) from grouped_countries),'[]'::jsonb),
    'daily',coalesce((select jsonb_agg(jsonb_build_object('metric_date',metric_date,'country_code',country_code,'active_players',active_players) order by metric_date,country_code) from daily),'[]'::jsonb),
    'refreshed_at',(select max(attributed_at) from public.analytics_event_geography where environment=p_environment)
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_geography(text,date,date) from public,anon;
grant execute on function public.decked_command_centre_geography(text,date,date) to authenticated;
comment on function public.decked_command_centre_geography(text,date,date) is
  'Staff-only country aggregates. Never returns IP addresses, precise locations, or analytics identities.';
