-- Ordered, privacy-safe funnel analysis. Only aggregate results leave this function.

create function public.decked_command_centre_funnels_v2(
  p_environment text, p_from date, p_to date, p_game_id text default null,
  p_play_mode text default null, p_device_class text default null,
  p_country text default null, p_acquisition_source text default null,
  p_app_version text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  if p_device_class is not null and p_device_class not in ('mobile','tablet','desktop','unknown') then raise exception 'Invalid device class filter.' using errcode='22023'; end if;
  if p_country is not null then raise exception 'Country filtering is unavailable because country is not collected.' using errcode='22023'; end if;
  if p_acquisition_source is not null and (char_length(p_acquisition_source)>100 or p_acquisition_source !~ '^[A-Za-z0-9._:/+-]+$') then raise exception 'Invalid acquisition source filter.' using errcode='22023'; end if;
  if p_app_version is not null and (char_length(p_app_version)>100 or p_app_version !~ '^[A-Za-z0-9._+-]+$') then raise exception 'Invalid app version filter.' using errcode='22023'; end if;

  with session_metadata as (
    select distinct on (analytics_session_id) analytics_session_id,
      coalesce(properties->>'device_class','unknown') device_class,
      properties->>'utm_source' acquisition_source,app_version
    from public.analytics_events where environment=p_environment and analytics_session_id is not null and event_name='app_opened' and (occurred_at at time zone 'UTC')::date between p_from-1 and p_to
    order by analytics_session_id,occurred_at,received_at,id
  ), discovery as (
    select entry.analytics_session_id::text entity_id,entry.occurred_at t1,browse.occurred_at t2,selected.occurred_at t3,
      mode.occurred_at t4,started.occurred_at t5,first_card.occurred_at t6,completed.occurred_at t7
    from public.analytics_events entry
    join session_metadata meta using(analytics_session_id)
    left join lateral (select e.occurred_at from public.analytics_events e where e.environment=entry.environment and e.analytics_session_id=entry.analytics_session_id and e.event_name='screen_viewed' and e.properties->>'screen_id'='browse' and (e.occurred_at,e.received_at,e.id)>(entry.occurred_at,entry.received_at,entry.id) and e.occurred_at<=entry.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) browse on true
    left join lateral (select e.occurred_at,e.game_id from public.analytics_events e where browse.occurred_at is not null and e.environment=entry.environment and e.analytics_session_id=entry.analytics_session_id and e.event_name='game_selected' and e.occurred_at>=browse.occurred_at and e.occurred_at<=entry.occurred_at+interval '24 hours' and (p_game_id is null or e.game_id=p_game_id) order by e.occurred_at,e.received_at,e.id limit 1) selected on true
    left join lateral (select e.occurred_at,e.play_mode from public.analytics_events e where selected.occurred_at is not null and e.environment=entry.environment and e.analytics_session_id=entry.analytics_session_id and e.event_name='play_mode_selected' and e.game_id=selected.game_id and e.occurred_at>=selected.occurred_at and e.occurred_at<=entry.occurred_at+interval '24 hours' and (p_play_mode is null or e.play_mode=p_play_mode) order by e.occurred_at,e.received_at,e.id limit 1) mode on true
    left join lateral (select e.occurred_at from public.analytics_events e where mode.occurred_at is not null and e.environment=entry.environment and e.analytics_session_id=entry.analytics_session_id and e.event_name in ('game_started','multiplayer_game_started') and e.game_id=selected.game_id and e.occurred_at>=mode.occurred_at and e.occurred_at<=entry.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) started on true
    left join lateral (select e.occurred_at from public.analytics_events e where started.occurred_at is not null and e.environment=entry.environment and e.analytics_session_id=entry.analytics_session_id and e.event_name='card_presented' and e.game_id=selected.game_id and e.occurred_at>=started.occurred_at and e.occurred_at<=entry.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) first_card on true
    left join lateral (select e.occurred_at from public.analytics_events e where first_card.occurred_at is not null and e.environment=entry.environment and e.analytics_session_id=entry.analytics_session_id and e.event_name='game_completed' and e.game_id=selected.game_id and e.occurred_at>=first_card.occurred_at and e.occurred_at<=entry.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) completed on true
    where entry.environment=p_environment and entry.event_name='app_opened' and (entry.occurred_at at time zone 'UTC')::date between p_from and p_to
      and not exists (select 1 from public.analytics_events earlier where earlier.environment=entry.environment and earlier.analytics_session_id=entry.analytics_session_id and earlier.event_name='app_opened' and (earlier.occurred_at,earlier.received_at,earlier.id)<(entry.occurred_at,entry.received_at,entry.id))
      and (p_device_class is null or meta.device_class=p_device_class) and (p_acquisition_source is null or meta.acquisition_source=p_acquisition_source) and (p_app_version is null or meta.app_version=p_app_version)
  ), host as (
    select chosen.analytics_session_id::text entity_id,chosen.occurred_at t1,created.occurred_at t2,guest.occurred_at t3,
      started.occurred_at t4,started.occurred_at t5,completed.occurred_at t6
    from public.analytics_events chosen join session_metadata meta using(analytics_session_id)
    left join lateral (select e.occurred_at,e.multiplayer_room_ref from public.analytics_events e where e.environment=chosen.environment and e.source='browser' and e.analytics_session_id=chosen.analytics_session_id and e.event_name='room_created' and e.game_id=chosen.game_id and e.occurred_at>=chosen.occurred_at and e.occurred_at<=chosen.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) created on true
    left join lateral (select e.occurred_at from public.analytics_events e where created.multiplayer_room_ref is not null and e.environment=chosen.environment and e.source='database' and e.multiplayer_room_ref=created.multiplayer_room_ref and e.event_name='room_joined' and e.properties->>'is_first_guest'='true' and e.occurred_at>=created.occurred_at and e.occurred_at<=chosen.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) guest on true
    left join lateral (select e.occurred_at from public.analytics_events e where guest.occurred_at is not null and e.environment=chosen.environment and e.source='database' and e.multiplayer_room_ref=created.multiplayer_room_ref and e.event_name='multiplayer_game_started' and e.occurred_at>=guest.occurred_at and e.occurred_at<=chosen.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) started on true
    left join lateral (select e.occurred_at from public.analytics_events e where started.occurred_at is not null and e.environment=chosen.environment and e.source='database' and e.multiplayer_room_ref=created.multiplayer_room_ref and e.event_name='multiplayer_game_completed' and e.occurred_at>=started.occurred_at and e.occurred_at<=chosen.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) completed on true
    where chosen.environment=p_environment and chosen.event_name='play_mode_selected' and chosen.play_mode='play_together' and (chosen.occurred_at at time zone 'UTC')::date between p_from and p_to
      and (p_game_id is null or chosen.game_id=p_game_id) and (p_play_mode is null or p_play_mode='play_together')
      and not exists (select 1 from public.analytics_events earlier where earlier.environment=chosen.environment and earlier.analytics_session_id=chosen.analytics_session_id and earlier.event_name='play_mode_selected' and earlier.play_mode='play_together' and (p_game_id is null or earlier.game_id=p_game_id) and (earlier.occurred_at,earlier.received_at,earlier.id)<(chosen.occurred_at,chosen.received_at,chosen.id))
      and (p_device_class is null or meta.device_class=p_device_class) and (p_acquisition_source is null or meta.acquisition_source=p_acquisition_source) and (p_app_version is null or meta.app_version=p_app_version)
  ), guest as (
    select opened.analytics_session_id::text entity_id,opened.occurred_at t1,attempted.occurred_at t2,joined.occurred_at t3,
      started.occurred_at t4,started.occurred_at t5,completed.occurred_at t6
    from public.analytics_events opened join session_metadata meta using(analytics_session_id)
    left join lateral (select e.occurred_at from public.analytics_events e where e.environment=opened.environment and e.analytics_session_id=opened.analytics_session_id and e.event_name='room_join_attempted' and e.occurred_at>=opened.occurred_at and e.occurred_at<=opened.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) attempted on true
    left join lateral (select e.occurred_at,e.multiplayer_room_ref,e.game_id from public.analytics_events e where attempted.occurred_at is not null and e.environment=opened.environment and e.source='browser' and e.analytics_session_id=opened.analytics_session_id and e.event_name='room_joined' and e.occurred_at>=attempted.occurred_at and e.occurred_at<=opened.occurred_at+interval '24 hours' and (p_game_id is null or e.game_id=p_game_id) order by e.occurred_at,e.received_at,e.id limit 1) joined on true
    left join lateral (select e.occurred_at from public.analytics_events e where joined.multiplayer_room_ref is not null and e.environment=opened.environment and e.source='database' and e.multiplayer_room_ref=joined.multiplayer_room_ref and e.event_name='multiplayer_game_started' and e.occurred_at>=joined.occurred_at and e.occurred_at<=opened.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) started on true
    left join lateral (select e.occurred_at from public.analytics_events e where started.occurred_at is not null and e.environment=opened.environment and e.source='database' and e.multiplayer_room_ref=joined.multiplayer_room_ref and e.event_name='multiplayer_game_completed' and e.occurred_at>=started.occurred_at and e.occurred_at<=opened.occurred_at+interval '24 hours' order by e.occurred_at,e.received_at,e.id limit 1) completed on true
    where opened.environment=p_environment and opened.event_name='screen_viewed' and opened.properties->>'screen_id'='play-together' and (opened.occurred_at at time zone 'UTC')::date between p_from and p_to
      and not exists (select 1 from public.analytics_events earlier where earlier.environment=opened.environment and earlier.analytics_session_id=opened.analytics_session_id and earlier.event_name='screen_viewed' and earlier.properties->>'screen_id'='play-together' and (earlier.occurred_at,earlier.received_at,earlier.id)<(opened.occurred_at,opened.received_at,opened.id))
      and (p_play_mode is null or p_play_mode='play_together') and (p_device_class is null or meta.device_class=p_device_class) and (p_acquisition_source is null or meta.acquisition_source=p_acquisition_source) and (p_app_version is null or meta.app_version=p_app_version)
  ), all_steps as (
    select 'discovery' funnel_id,'Discovery to completion' funnel_name,entity_id,v.* from discovery cross join lateral (values (1,'Landing',t1,null::timestamptz,t1),(2,'Browse',t2,t1,t1),(3,'Game selected',t3,t2,t1),(4,'Play mode selected',t4,t3,t1),(5,'Game started',t5,t4,t1),(6,'First card',t6,t5,t1),(7,'Completion',t7,t6,t1)) v(step_order,step_name,step_time,previous_time,first_time)
    union all select 'multiplayer_host','Play Together host',entity_id,v.* from host cross join lateral (values (1,'Play Together selected',t1,null::timestamptz,t1),(2,'Room created',t2,t1,t1),(3,'First guest joined',t3,t2,t1),(4,'Game started',t4,t3,t1),(5,'First card',t5,t4,t1),(6,'Completion',t6,t5,t1)) v(step_order,step_name,step_time,previous_time,first_time)
    union all select 'multiplayer_guest','Play Together guest',entity_id,v.* from guest cross join lateral (values (1,'Join opened',t1,null::timestamptz,t1),(2,'Code submitted',t2,t1,t1),(3,'Room joined',t3,t2,t1),(4,'Game started',t4,t3,t1),(5,'First card',t5,t4,t1),(6,'Completion',t6,t5,t1)) v(step_order,step_name,step_time,previous_time,first_time)
  ), counts as (
    select funnel_id,funnel_name,step_order,step_name,count(*) filter(where step_time is not null)::bigint entrants,
      percentile_cont(.5) within group(order by extract(epoch from step_time-previous_time)) filter(where step_time is not null and previous_time is not null) median_seconds_from_previous
    from all_steps group by funnel_id,funnel_name,step_order,step_name
  ), rates as (
    select *,first_value(entrants) over(partition by funnel_id order by step_order) first_entrants,lag(entrants) over(partition by funnel_id order by step_order) previous_entrants from counts
  ), funnel_json as (
    select funnel_id,funnel_name,jsonb_agg(jsonb_build_object('step_order',step_order,'step_name',step_name,'entrants',entrants,
      'conversion_from_previous',case when step_order=1 then 100 when coalesce(previous_entrants,0)=0 then 0 else round(100.0*entrants/previous_entrants,1) end,
      'conversion_from_first',case when coalesce(first_entrants,0)=0 then 0 else round(100.0*entrants/first_entrants,1) end,
      'median_seconds_from_previous',median_seconds_from_previous) order by step_order) steps
    from rates group by funnel_id,funnel_name
  )
  select jsonb_build_object(
    'funnels',coalesce(jsonb_agg(jsonb_build_object('funnel_id',funnel_id,'name',funnel_name,'steps',steps) order by funnel_id),'[]'::jsonb),
    'rules',jsonb_build_object('conversion_window_hours',24,'ordering','occurred_at, then received_at, then event id','repeat_handling','earliest qualifying occurrence after the previous step','timezone','UTC entry date','first_card_note','Multiplayer first card uses the authoritative first playable game state at game start.'),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'available_filters',jsonb_build_object('country',false,'device_class',true,'acquisition_source',true,'app_version',true)
  ) into result from funnel_json;
  return result;
end $$;

revoke all on function public.decked_command_centre_funnels_v2(text,date,date,text,text,text,text,text,text) from public,anon;
grant execute on function public.decked_command_centre_funnels_v2(text,date,date,text,text,text,text,text,text) to authenticated;
