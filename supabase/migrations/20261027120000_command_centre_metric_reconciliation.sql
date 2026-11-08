-- Reconcile Command Centre denominators without rewriting historical events.
-- Overview remains the metric contract: active players come from the refreshed
-- daily membership table and whole-product reliability comes from session health.

create or replace function public.decked_command_centre_geography(p_environment text,p_from date,p_to date)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501';end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  with active_players as (
    select distinct analytics_user_id
    from public.analytics_daily_active_users
    where environment=p_environment and metric_date between p_from and p_to
  ), player_country as (
    select distinct on (e.analytics_user_id) e.analytics_user_id,g.country_code
    from public.analytics_events e
    join active_players a using(analytics_user_id)
    join public.analytics_event_geography g on g.environment=e.environment and g.event_id=e.event_id
    where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
    order by e.analytics_user_id,e.occurred_at desc,e.received_at desc,e.id desc
  ), scoped_events as (
    select e.*,pc.country_code
    from public.analytics_events e
    join player_country pc using(analytics_user_id)
    where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
  ), countries as (
    select s.country_code,
      count(distinct s.analytics_user_id) active_players,
      count(distinct s.analytics_user_id) filter(where f.first_seen_date between p_from and p_to) new_players,
      count(distinct s.analytics_user_id) filter(where f.first_seen_date<p_from) returning_players,
      count(distinct s.analytics_session_id) filter(where s.analytics_session_id is not null) sessions,
      count(distinct s.game_session_id) filter(where s.event_name in ('game_started','multiplayer_game_started') and s.game_session_id is not null) game_starts,
      count(distinct s.game_session_id) filter(where s.event_name in ('game_completed','multiplayer_game_completed') and s.game_session_id is not null) completions,
      count(*) filter(where s.event_name='room_created') rooms_created
    from scoped_events s left join public.analytics_user_first_seen f using(environment,analytics_user_id)
    group by s.country_code
  ), daily as (
    select a.metric_date,pc.country_code,count(distinct a.analytics_user_id) active_players
    from public.analytics_daily_active_users a join player_country pc using(analytics_user_id)
    where a.environment=p_environment and a.metric_date between p_from and p_to
    group by a.metric_date,pc.country_code
  ), coverage as (
    select count(*) total_players,count(*) filter(where pc.analytics_user_id is not null) located_players
    from active_players a left join player_country pc using(analytics_user_id)
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'countries_reached',(select count(*) from countries),
      'located_players',coalesce((select located_players from coverage),0),
      'total_players',coalesce((select total_players from coverage),0),
      'international_players',coalesce((select sum(active_players) from countries where country_code<>'NG'),0)
    ),
    'countries',coalesce((select jsonb_agg(jsonb_build_object(
      'country_code',country_code,'active_players',active_players,'new_players',new_players,
      'returning_players',returning_players,'sessions',sessions,'game_starts',game_starts,
      'completions',completions,'completion_rate',case when game_starts>0 then round(100.0*completions/game_starts,1) else 0 end,
      'rooms_created',rooms_created) order by active_players desc,country_code) from countries),'[]'::jsonb),
    'daily',coalesce((select jsonb_agg(jsonb_build_object('metric_date',metric_date,'country_code',country_code,'active_players',active_players) order by metric_date,country_code) from daily),'[]'::jsonb),
    'refreshed_at',(select max(attributed_at) from public.analytics_event_geography where environment=p_environment)
  ) into result;
  return result;
end $$;

create or replace function public.decked_command_centre_reliability_v2(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_device_class text default null,
  p_browser text default null,p_app_version text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_device_class is not null and p_device_class not in ('mobile','tablet','desktop','unknown') then raise exception 'Invalid device class filter.' using errcode='22023'; end if;
  if p_browser is not null and (char_length(p_browser)>80 or p_browser !~ '^[A-Za-z0-9._+-]+$') then raise exception 'Invalid browser filter.' using errcode='22023'; end if;
  if p_app_version is not null and (char_length(p_app_version)>100 or p_app_version !~ '^[A-Za-z0-9._+-]+$') then raise exception 'Invalid app version filter.' using errcode='22023'; end if;
  with meta as (
    select distinct on (analytics_session_id) analytics_session_id,coalesce(properties->>'device_class','unknown') device_class
    from public.analytics_events where environment=p_environment and analytics_session_id is not null and event_name='app_opened' and (occurred_at at time zone 'UTC')::date between p_from-1 and p_to order by analytics_session_id,occurred_at,received_at,id
  ), base as (
    select e.*,coalesce(m.device_class,'unknown') resolved_device from public.analytics_events e left join meta m using(analytics_session_id)
    where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between p_from and p_to and (p_game_id is null or e.game_id=p_game_id) and (p_device_class is null or coalesce(m.device_class,'unknown')=p_device_class) and (p_app_version is null or e.app_version=p_app_version)
  ), errors as (
    select * from base where event_name in ('frontend_error','rpc_failed','realtime_status_changed') and (event_name<>'realtime_status_changed' or properties->>'status' in ('channel_error','timed_out','closed')) and (p_browser is null or coalesce(properties->>'browser_name','unknown')=p_browser)
  ), qualifying_sessions as (
    select distinct analytics_session_id from base where analytics_session_id is not null and event_name in ('app_opened','game_selected','game_started','room_create_attempted','room_join_attempted')
  ), affected as (select distinct e.analytics_session_id from errors e join qualifying_sessions q using(analytics_session_id) where e.analytics_session_id is not null),
  whole_product_health as (
    select count(distinct analytics_session_id) sessions,count(distinct analytics_session_id) filter(where had_error) error_sessions
    from public.analytics_daily_session_health where environment=p_environment and metric_date between p_from and p_to
  ), grouped as (
    select event_name error_type,
      case when event_name='frontend_error' then coalesce(properties->>'error_fingerprint','unknown') when event_name='rpc_failed' then coalesce(properties->>'rpc_name','unknown')||':'||coalesce(properties->>'error_code','unknown') else coalesce(properties->>'channel_type','unknown')||':'||coalesce(properties->>'status','unknown') end fingerprint,
      case when event_name='frontend_error' then coalesce(properties->>'error_class','unknown') when event_name='rpc_failed' then coalesce(properties->>'failure_class','unknown') else 'realtime' end error_class,
      count(*) occurrences,count(distinct analytics_session_id) affected_sessions,min(occurred_at) first_seen,max(occurred_at) last_seen
    from errors group by 1,2,3
  ), trend as (
    select day::date metric_date,count(e.id) filter(where e.event_name='frontend_error') frontend_errors,count(e.id) filter(where e.event_name='rpc_failed') rpc_failures,count(e.id) filter(where e.event_name='realtime_status_changed') realtime_failures
    from generate_series(p_from,p_to,'1 day'::interval) day left join errors e on (e.occurred_at at time zone 'UTC')::date=day::date group by day order by day
  ), game_breakdown as (select coalesce(game_id,'unattributed') value,count(*) occurrences from errors group by 1),
  browser_breakdown as (select coalesce(properties->>'browser_name','unknown') value,count(*) occurrences from errors group by 1),
  device_breakdown as (select resolved_device value,count(*) occurrences from errors group by 1),
  version_breakdown as (select app_version value,count(*) occurrences from errors group by 1),
  denominator as (
    select
      case when p_game_id is null and p_device_class is null and p_browser is null and p_app_version is null then (select sessions from whole_product_health) else (select count(*) from qualifying_sessions) end sessions,
      case when p_game_id is null and p_device_class is null and p_browser is null and p_app_version is null then (select error_sessions from whole_product_health) else (select count(*) from affected) end error_sessions
  )
  select jsonb_build_object(
    'metrics',jsonb_build_object(
      'frontend_errors',(select count(*) from errors where event_name='frontend_error'),
      'rpc_failures',(select count(*) from errors where event_name='rpc_failed'),
      'realtime_failures',(select count(*) from errors where event_name='realtime_status_changed'),
      'affected_sessions',(select error_sessions from denominator),
      'total_sessions',case when p_browser is null then (select sessions from denominator) else null end,
      'error_free_sessions',case when p_browser is null then greatest(0,(select sessions-error_sessions from denominator)) else null end,
      'error_free_session_rate',case when p_browser is not null then null when (select sessions from denominator)=0 then 0 else round(100.0*(select sessions-error_sessions from denominator)/(select sessions from denominator),1) end
    ),
    'groups',(select coalesce(jsonb_agg(to_jsonb(grouped) order by occurrences desc,last_seen desc),'[]'::jsonb) from grouped),
    'trend',(select coalesce(jsonb_agg(to_jsonb(trend) order by metric_date),'[]'::jsonb) from trend),
    'breakdowns',jsonb_build_object(
      'game',(select coalesce(jsonb_agg(to_jsonb(game_breakdown) order by occurrences desc),'[]'::jsonb) from game_breakdown),
      'browser',(select coalesce(jsonb_agg(to_jsonb(browser_breakdown) order by occurrences desc),'[]'::jsonb) from browser_breakdown),
      'device',(select coalesce(jsonb_agg(to_jsonb(device_breakdown) order by occurrences desc),'[]'::jsonb) from device_breakdown),
      'app_version',(select coalesce(jsonb_agg(to_jsonb(version_breakdown) order by occurrences desc),'[]'::jsonb) from version_breakdown)
    ),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',case
      when p_browser is not null then jsonb_build_array('Error-free session metrics are unavailable under a browser filter because browser is not attached to every qualifying session.')
      when p_game_id is not null or p_device_class is not null or p_app_version is not null then jsonb_build_array('Filtered reliability uses raw qualifying-session coverage; whole-product Reliability and Overview use the same session-health denominator.')
      else jsonb_build_array('Whole-product error-free metrics use the same session-health denominator as Overview. Browser is reported only by frontend errors; RPC and Realtime failures may appear as unknown.') end
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_geography(text,date,date) from public,anon;
revoke all on function public.decked_command_centre_reliability_v2(text,date,date,text,text,text,text) from public,anon;
grant execute on function public.decked_command_centre_geography(text,date,date) to authenticated;
grant execute on function public.decked_command_centre_reliability_v2(text,date,date,text,text,text,text) to authenticated;
