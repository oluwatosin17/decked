-- Staff-only Multiplayer and Reliability operational read models.

create function public.decked_command_centre_multiplayer_v2(p_environment text,p_from date,p_to date,p_game_id text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  with rooms as (
    select * from public.analytics_room_facts where environment=p_environment and (created_at at time zone 'UTC')::date between p_from and p_to and (p_game_id is null or game_id=p_game_id)
  ), sessions as (
    select * from public.analytics_game_sessions where environment=p_environment and play_mode='play_together' and (setup_started_at at time zone 'UTC')::date between p_from and p_to and (p_game_id is null or game_id=p_game_id)
  ), failures as (
    select coalesce(properties->>'failure_reason','unknown') reason,count(*) occurrences from public.analytics_events where environment=p_environment and event_name='room_join_failed' and p_game_id is null and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1
  ), sizes as (
    select peak_player_count room_size,count(*) rooms from rooms group by peak_player_count order by peak_player_count
  ), trend as (
    select day::date metric_date,
      (select count(*) from rooms where (created_at at time zone 'UTC')::date=day::date) rooms_created,
      (select count(*) from rooms where first_game_started_at is not null and (created_at at time zone 'UTC')::date=day::date) rooms_started,
      (select count(*) from sessions where status='completed' and (setup_started_at at time zone 'UTC')::date=day::date) games_completed
    from generate_series(p_from,p_to,'1 day'::interval) day
  ) select jsonb_build_object(
    'metrics',jsonb_build_object(
      'rooms_created',(select count(*) from rooms),
      'successful_joins',(select coalesce(sum(successful_join_count),0) from rooms),
      'rooms_started',(select count(*) from rooms where first_game_started_at is not null),
      'lobby_to_start_rate',(select case when count(*)=0 then 0 else round(100.0*count(*) filter(where first_game_started_at is not null)/count(*),1) end from rooms),
      'median_seconds_to_first_guest',(select percentile_cont(.5) within group(order by extract(epoch from first_guest_joined_at-created_at)) from rooms where first_guest_joined_at is not null),
      'median_seconds_to_start',(select percentile_cont(.5) within group(order by extract(epoch from first_game_started_at-created_at)) from rooms where first_game_started_at is not null),
      'games_started',(select count(*) from sessions where started_at is not null),
      'games_completed',(select count(*) from sessions where status='completed'),
      'completion_rate',(select case when count(*) filter(where started_at is not null)=0 then 0 else round(100.0*count(*) filter(where status='completed')/count(*) filter(where started_at is not null),1) end from sessions),
      'host_disconnects',(select coalesce(sum(host_disconnect_count),0) from rooms),
      'host_handoffs',(select coalesce(sum(host_handoff_count),0) from rooms),
      'host_handoff_success_rate',(select case when coalesce(sum(host_disconnect_count),0)=0 then 0 else round(100.0*sum(host_handoff_count)/sum(host_disconnect_count),1) end from rooms),
      'realtime_failures',(select count(*) from public.analytics_events where environment=p_environment and event_name='realtime_status_changed' and properties->>'status' in ('channel_error','timed_out','closed') and (occurred_at at time zone 'UTC')::date between p_from and p_to and (p_game_id is null or game_id=p_game_id)),
      'rematch_requests',(select coalesce(sum(rematch_request_count),0) from rooms),
      'rematches_started',(select coalesce(sum(rematch_start_count),0) from rooms)
    ),
    'join_failures',(select coalesce(jsonb_agg(to_jsonb(failures) order by occurrences desc,reason),'[]'::jsonb) from failures),
    'room_sizes',(select coalesce(jsonb_agg(to_jsonb(sizes) order by room_size),'[]'::jsonb) from sizes),
    'trend',(select coalesce(jsonb_agg(to_jsonb(trend) order by metric_date),'[]'::jsonb) from trend),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',case when p_game_id is null then jsonb_build_array('Join failures without a resolved room cannot be attributed to a game.') else jsonb_build_array('Join failure reasons are omitted from game-filtered attribution because failed codes do not resolve to a game.') end,
    'timeline_redacted',true
  ) into result;
  return result;
end $$;

create function public.decked_command_centre_reliability_v2(
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
  grouped as (
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
  version_breakdown as (select app_version value,count(*) occurrences from errors group by 1)
  select jsonb_build_object(
    'metrics',jsonb_build_object(
      'frontend_errors',(select count(*) from errors where event_name='frontend_error'),
      'rpc_failures',(select count(*) from errors where event_name='rpc_failed'),
      'realtime_failures',(select count(*) from errors where event_name='realtime_status_changed'),
      'affected_sessions',(select count(*) from affected),
      'total_sessions',case when p_browser is null then (select count(*) from qualifying_sessions) else null end,
      'error_free_sessions',case when p_browser is null then greatest(0,(select count(*) from qualifying_sessions)-(select count(*) from affected)) else null end,
      'error_free_session_rate',case when p_browser is not null then null when (select count(*) from qualifying_sessions)=0 then 0 else round(100.0*((select count(*) from qualifying_sessions)-(select count(*) from affected))/(select count(*) from qualifying_sessions),1) end
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
    'partial_warnings',case when p_browser is null then jsonb_build_array('Browser is reported only by frontend errors; RPC and Realtime failures may appear as unknown.') else jsonb_build_array('Error-free session metrics are unavailable under a browser filter because browser is not attached to every qualifying session.') end
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_multiplayer_v2(text,date,date,text) from public,anon;
revoke all on function public.decked_command_centre_reliability_v2(text,date,date,text,text,text,text) from public,anon;
grant execute on function public.decked_command_centre_multiplayer_v2(text,date,date,text) to authenticated;
grant execute on function public.decked_command_centre_reliability_v2(text,date,date,text,text,text,text) to authenticated;
