-- Staff-only, aggregate game comparison and detail read models.

create function public.decked_command_centre_games_v2(
  p_environment text, p_from date, p_to date, p_play_mode text default null, p_trend_days integer default 7
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  if p_trend_days not in (7,30) then raise exception 'Trend window must be 7 or 30 days.' using errcode='22023'; end if;

  with games(game_id) as (select unnest(array[
    'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met'
  ])),
  current_sessions as (
    select game_id,
      count(*) setups,
      count(*) filter(where started_at is not null and play_mode='pass_and_play') pass_and_play_starts,
      count(*) filter(where started_at is not null and play_mode='play_together') multiplayer_starts,
      count(distinct analytics_user_id) filter(where analytics_user_id is not null) unique_players,
      count(*) filter(where cards_presented>0) first_cards,
      count(*) filter(where status='completed') completions,
      percentile_cont(.5) within group(order by cards_presented) filter(where started_at is not null) median_cards_played,
      percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) filter(where status='completed' and started_at is not null and completed_at is not null) median_duration_seconds
    from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between p_from and p_to
      and (p_play_mode is null or play_mode=p_play_mode) group by game_id
  ), previous_starts as (
    select game_id,count(*) filter(where started_at is not null)::numeric starts
    from public.analytics_game_sessions where environment=p_environment
      and (setup_started_at at time zone 'UTC')::date between p_to-p_trend_days+1 and p_to
      and (p_play_mode is null or play_mode=p_play_mode) group by game_id
  ), prior_starts as (
    select game_id,count(*) filter(where started_at is not null)::numeric starts
    from public.analytics_game_sessions where environment=p_environment
      and (setup_started_at at time zone 'UTC')::date between p_to-(p_trend_days*2)+1 and p_to-p_trend_days
      and (p_play_mode is null or play_mode=p_play_mode) group by game_id
  ), event_counts as (
    select game_id,
      count(*) filter(where event_name='screen_viewed') game_views,
      count(*) filter(where event_name='game_selected') selections,
      count(*) filter(where event_name='game_replay_selected') replays
    from public.analytics_events where environment=p_environment and (occurred_at at time zone 'UTC')::date between p_from and p_to and game_id is not null group by game_id
  ), rematches as (
    select game_id,coalesce(sum(rematch_start_count),0) rematches from public.analytics_room_facts
    where environment=p_environment and (created_at at time zone 'UTC')::date between p_from and p_to group by game_id
  ), rows as (
    select g.game_id,coalesce(e.game_views,0) game_views,coalesce(e.selections,0) selections,
      coalesce(s.pass_and_play_starts,0) pass_and_play_starts,coalesce(s.multiplayer_starts,0) multiplayer_starts,
      coalesce(s.unique_players,0) unique_players,
      case when coalesce(s.setups,0)=0 then 0 else round(100.0*s.first_cards/s.setups,1) end first_card_rate,
      case when coalesce(s.pass_and_play_starts,0)+coalesce(s.multiplayer_starts,0)=0 then 0 else round(100.0*s.completions/(s.pass_and_play_starts+s.multiplayer_starts),1) end completion_rate,
      s.median_cards_played,s.median_duration_seconds,
      case when coalesce(s.completions,0)=0 then 0 else round(100.0*(coalesce(e.replays,0)+coalesce(r.rematches,0))/s.completions,1) end replay_rate,
      case when coalesce(prior.starts,0)=0 then null else round(100.0*(coalesce(recent.starts,0)-prior.starts)/prior.starts,1) end trend_percent
    from games g left join current_sessions s using(game_id) left join event_counts e using(game_id) left join rematches r using(game_id)
    left join previous_starts recent using(game_id) left join prior_starts prior using(game_id)
  )
  select jsonb_build_object(
    'rows',jsonb_agg(to_jsonb(rows) order by game_id),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',jsonb_build_array('Unique-player counts exclude authoritative sessions without a browser analytics identity.') || case when p_play_mode is null then '[]'::jsonb else jsonb_build_array('Views and selections are not attributed to a play mode and remain unfiltered.') end
  ) into result from rows;
  return result;
end $$;

create function public.decked_command_centre_game_detail(
  p_environment text, p_from date, p_to date, p_game_id text, p_trend_days integer default 7
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_game_id is null then raise exception 'Game is required.' using errcode='22023'; end if;
  if p_trend_days not in (7,30) then raise exception 'Trend window must be 7 or 30 days.' using errcode='22023'; end if;

  with date_series as (select generate_series(p_from,p_to,'1 day'::interval)::date metric_date),
  trend as (
    select d.metric_date,count(s.game_session_id) filter(where s.started_at is not null) starts,count(s.game_session_id) filter(where s.status='completed') completions
    from date_series d left join public.analytics_game_sessions s on s.environment=p_environment and s.game_id=p_game_id and (s.setup_started_at at time zone 'UTC')::date=d.metric_date group by d.metric_date order by d.metric_date
  ), mode_split as (
    select play_mode,count(*) filter(where started_at is not null) starts,count(*) filter(where status='completed') completions,
      percentile_cont(.5) within group(order by cards_presented) filter(where started_at is not null) median_cards_played
    from public.analytics_game_sessions where environment=p_environment and game_id=p_game_id and (setup_started_at at time zone 'UTC')::date between p_from and p_to group by play_mode
  ), devices as (
    select coalesce(op.properties->>'device_class','unknown') device_class,count(distinct e.analytics_session_id) sessions
    from public.analytics_events e left join lateral (
      select properties from public.analytics_events a where a.environment=e.environment and a.analytics_session_id=e.analytics_session_id and a.event_name='app_opened' order by a.occurred_at limit 1
    ) op on true where e.environment=p_environment and e.game_id=p_game_id and e.event_name='game_started' and (e.occurred_at at time zone 'UTC')::date between p_from and p_to group by 1
  ), funnel as (
    select step_name,step_order,sum(metric_value) count from public.analytics_funnel_daily where environment=p_environment and game_id=p_game_id and metric_date between p_from and p_to group by step_name,step_order order by step_order
  ), dimensions as (
    select dimension_type,dimension_id,count(*) observations from (
      select 'category' dimension_type,properties->>'category_id' dimension_id from public.analytics_events where environment=p_environment and game_id=p_game_id and event_name='card_presented' and properties ? 'category_id' and (occurred_at at time zone 'UTC')::date between p_from and p_to
      union all
      select 'category',jsonb_array_elements_text(properties->'category_ids') from public.analytics_events where environment=p_environment and game_id=p_game_id and event_name='deck_configured' and jsonb_typeof(properties->'category_ids')='array' and (occurred_at at time zone 'UTC')::date between p_from and p_to
      union all
      select 'mode',jsonb_array_elements_text(properties->'mode_ids') from public.analytics_events where environment=p_environment and game_id=p_game_id and event_name='deck_configured' and jsonb_typeof(properties->'mode_ids')='array' and (occurred_at at time zone 'UTC')::date between p_from and p_to
    ) observed where dimension_id is not null group by dimension_type,dimension_id order by observations desc,dimension_id
  ), depth as (
    select case when cards_presented=0 then '0' when cards_presented between 1 and 5 then '1–5' when cards_presented between 6 and 10 then '6–10' when cards_presented between 11 and 20 then '11–20' else '21+' end depth_bucket,count(*) sessions
    from public.analytics_game_sessions where environment=p_environment and game_id=p_game_id and (setup_started_at at time zone 'UTC')::date between p_from and p_to and started_at is not null group by 1
  ), errors as (
    select event_name error_type,coalesce(properties->>'failure_class',properties->>'status','unknown') error_class,count(*) occurrences
    from public.analytics_events where environment=p_environment and game_id=p_game_id and event_name in ('rpc_failed','frontend_error','realtime_status_changed') and (event_name<>'realtime_status_changed' or properties->>'status' in ('channel_error','timed_out','closed')) and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2 order by occurrences desc
  )
  select jsonb_build_object(
    'game_id',p_game_id,
    'trend',(select coalesce(jsonb_agg(to_jsonb(trend) order by metric_date),'[]'::jsonb) from trend),
    'mode_split',(select coalesce(jsonb_agg(to_jsonb(mode_split) order by play_mode),'[]'::jsonb) from mode_split),
    'device_split',(select coalesce(jsonb_agg(to_jsonb(devices) order by sessions desc),'[]'::jsonb) from devices),
    'funnel',(select coalesce(jsonb_agg(to_jsonb(funnel) order by step_order),'[]'::jsonb) from funnel),
    'dimensions',(select coalesce(jsonb_agg(to_jsonb(dimensions) order by dimension_type,observations desc),'[]'::jsonb) from dimensions),
    'session_depth',(select coalesce(jsonb_agg(to_jsonb(depth) order by depth_bucket),'[]'::jsonb) from depth),
    'errors',(select coalesce(jsonb_agg(to_jsonb(errors) order by occurrences desc),'[]'::jsonb) from errors),
    'replay_behavior',jsonb_build_object(
      'replays',(select count(*) from public.analytics_events where environment=p_environment and game_id=p_game_id and event_name='game_replay_selected' and (occurred_at at time zone 'UTC')::date between p_from and p_to),
      'rematches',(select coalesce(sum(rematch_start_count),0) from public.analytics_room_facts where environment=p_environment and game_id=p_game_id and (created_at at time zone 'UTC')::date between p_from and p_to)
    ),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',jsonb_build_array('Device split includes browser-observed starts only. Category and mode performance appears only where games emit those identifiers.')
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_games_v2(text,date,date,text,integer) from public,anon;
revoke all on function public.decked_command_centre_game_detail(text,date,date,text,integer) from public,anon;
grant execute on function public.decked_command_centre_games_v2(text,date,date,text,integer) to authenticated;
grant execute on function public.decked_command_centre_game_detail(text,date,date,text,integer) to authenticated;
