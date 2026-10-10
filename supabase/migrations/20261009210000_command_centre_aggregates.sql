-- Incremental UTC aggregates and staff-only Command Centre query services.

create table public.analytics_funnel_daily (
  metric_date date not null,
  environment text not null check (environment in ('development','preview','production')),
  funnel_name text not null check (funnel_name in ('discovery','multiplayer_host','multiplayer_guest')),
  step_name text not null,
  step_order smallint not null check (step_order > 0),
  game_id text not null default '',
  metric_value bigint not null default 0 check (metric_value >= 0),
  refreshed_at timestamptz not null default now(),
  primary key (metric_date, environment, funnel_name, step_name, game_id)
);
create index analytics_funnel_daily_query_idx on public.analytics_funnel_daily
  (environment, funnel_name, metric_date, game_id);
alter table public.analytics_funnel_daily enable row level security;
revoke all on public.analytics_funnel_daily from public, anon, authenticated;
grant select, insert, update, delete on public.analytics_funnel_daily to service_role;
comment on table public.analytics_funnel_daily is 'Rebuildable UTC funnel counts. Rates are calculated from summed counts at query time.';

create table public.analytics_daily_active_users (
  metric_date date not null,
  environment text not null check (environment in ('development','preview','production')),
  analytics_user_id uuid not null,
  refreshed_at timestamptz not null default now(),
  primary key(metric_date,environment,analytics_user_id)
);
create index analytics_daily_active_users_query_idx on public.analytics_daily_active_users(environment,metric_date,analytics_user_id);
alter table public.analytics_daily_active_users enable row level security;
revoke all on public.analytics_daily_active_users from public,anon,authenticated;
grant select,insert,update,delete on public.analytics_daily_active_users to service_role;
comment on table public.analytics_daily_active_users is 'Restricted pseudonymous daily membership used only for distinct active-installation counts; never returned by dashboard RPCs.';

create table public.analytics_daily_session_health (
  metric_date date not null,
  environment text not null check (environment in ('development','preview','production')),
  analytics_session_id uuid not null,
  had_error boolean not null default false,
  refreshed_at timestamptz not null default now(),
  primary key(metric_date,environment,analytics_session_id)
);
create index analytics_daily_session_health_query_idx on public.analytics_daily_session_health(environment,metric_date,had_error,analytics_session_id);
alter table public.analytics_daily_session_health enable row level security;
revoke all on public.analytics_daily_session_health from public,anon,authenticated;
grant select,insert,update,delete on public.analytics_daily_session_health to service_role;

create table public.analytics_aggregate_refreshes (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  from_date date not null,
  to_date date not null,
  status text not null check (status in ('running','completed','failed')),
  refreshed_by text not null,
  error_code text
);
create index analytics_aggregate_refreshes_latest_idx on public.analytics_aggregate_refreshes (started_at desc);
alter table public.analytics_aggregate_refreshes enable row level security;
revoke all on public.analytics_aggregate_refreshes from public, anon, authenticated;
grant select, insert, update, delete on public.analytics_aggregate_refreshes to service_role;
grant usage, select on sequence public.analytics_aggregate_refreshes_id_seq to service_role;

create index analytics_events_refresh_idx on public.analytics_events (environment, occurred_at, event_name);
create index analytics_sessions_refresh_idx on public.analytics_game_sessions (environment, setup_started_at, game_id, play_mode, status);
create index analytics_rooms_refresh_idx on public.analytics_room_facts (environment, created_at, game_id);
create index analytics_events_refresh_utc_day_idx on public.analytics_events (environment, ((occurred_at at time zone 'UTC')::date), event_name);
create index analytics_sessions_refresh_utc_day_idx on public.analytics_game_sessions (environment, ((setup_started_at at time zone 'UTC')::date), game_id, play_mode, status);
create index analytics_rooms_refresh_utc_day_idx on public.analytics_room_facts (environment, ((created_at at time zone 'UTC')::date), game_id);

create function public.decked_refresh_analytics_aggregates(p_from date default current_date - 2, p_to date default current_date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare refresh_id bigint; acquired boolean; rows_written bigint; actor text;
begin
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 31 then
    raise exception 'Refresh range must be between 1 and 32 UTC days.' using errcode = '22023';
  end if;
  if current_user not in ('postgres','service_role') and not public.decked_is_command_centre_staff('admin') then
    raise exception 'Command Centre administrator access is required.' using errcode = '42501';
  end if;
  acquired := pg_try_advisory_xact_lock(hashtext('decked:analytics:aggregate-refresh'));
  if not acquired then return jsonb_build_object('status','already_running'); end if;
  actor := case when current_user in ('postgres','service_role') then current_user else 'staff_admin' end;
  insert into public.analytics_aggregate_refreshes(from_date,to_date,status,refreshed_by)
  values (p_from,p_to,'running',actor) returning id into refresh_id;

  delete from public.analytics_daily_aggregates where metric_date between p_from and p_to;
  insert into public.analytics_daily_aggregates(
    metric_date, environment, metric_name, game_id, play_mode, metric_value, metric_sum, sample_count, refreshed_at
  )
  select metric_date, environment, metric_name, game_id, play_mode,
    sum(metric_value)::bigint, sum(metric_sum), sum(sample_count)::bigint, now()
  from (
    select (occurred_at at time zone 'UTC')::date metric_date, environment, 'app_opens' metric_name, null::text game_id, null::text play_mode,
      count(*)::bigint metric_value, 0::numeric metric_sum, count(*)::bigint sample_count
    from public.analytics_events where event_name='app_opened' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2
    union all
    select (setup_started_at at time zone 'UTC')::date, environment, 'game_setups', game_id, play_mode, count(*), 0, count(*)
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
    union all
    select (setup_started_at at time zone 'UTC')::date, environment, 'game_starts', game_id, play_mode, count(*) filter(where started_at is not null), 0, count(*) filter(where started_at is not null)
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
    union all
    select (setup_started_at at time zone 'UTC')::date, environment, 'game_completions', game_id, play_mode, count(*) filter(where status='completed'), 0, count(*) filter(where status='completed')
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
    union all
    select (setup_started_at at time zone 'UTC')::date, environment, 'cards_presented', game_id, play_mode, sum(cards_presented), 0, count(*)
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
    union all
    select (setup_started_at at time zone 'UTC')::date, environment, 'completed_duration_seconds', game_id, play_mode, count(*),
      sum(extract(epoch from completed_at-started_at)), count(*)
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to and status='completed' and completed_at is not null and started_at is not null group by 1,2,4,5
    union all
    select (created_at at time zone 'UTC')::date, environment, 'rooms_created', game_id, 'play_together', count(*), 0, count(*)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4
    union all
    select (created_at at time zone 'UTC')::date, environment, 'successful_joins', game_id, 'play_together', sum(successful_join_count), 0, count(*)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4
    union all
    select (created_at at time zone 'UTC')::date, environment, 'host_disconnects', game_id, 'play_together', sum(host_disconnect_count), 0, count(*)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4
    union all
    select (created_at at time zone 'UTC')::date, environment, 'host_handoffs', game_id, 'play_together', sum(host_handoff_count), 0, count(*)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4
    union all
    select (created_at at time zone 'UTC')::date, environment, 'rematch_requests', game_id, 'play_together', sum(rematch_request_count), 0, count(*)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4
    union all
    select (created_at at time zone 'UTC')::date, environment, 'rematch_starts', game_id, 'play_together', sum(rematch_start_count), 0, count(*)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4
    union all
    select (occurred_at at time zone 'UTC')::date, environment, 'rpc_failures', game_id, play_mode, count(*), 0, count(*)
    from public.analytics_events where event_name='rpc_failed' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
    union all
    select (occurred_at at time zone 'UTC')::date, environment, 'frontend_errors', game_id, play_mode, count(*), 0, count(*)
    from public.analytics_events where event_name='frontend_error' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
    union all
    select (occurred_at at time zone 'UTC')::date, environment, 'realtime_failures', game_id, play_mode, count(*), 0, count(*)
    from public.analytics_events where event_name='realtime_status_changed'
      and properties->>'status' in ('channel_error','timed_out','closed') and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
    union all
    select (occurred_at at time zone 'UTC')::date, environment, 'replays', game_id, play_mode, count(*), 0, count(*)
    from public.analytics_events where event_name='game_replay_selected' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2,4,5
  ) metrics group by 1,2,3,4,5;

  delete from public.analytics_daily_active_users where metric_date between p_from and p_to;
  insert into public.analytics_daily_active_users(metric_date,environment,analytics_user_id,refreshed_at)
  select distinct (occurred_at at time zone 'UTC')::date,environment,analytics_user_id,now()
  from public.analytics_events where (occurred_at at time zone 'UTC')::date between p_from and p_to
    and analytics_user_id is not null
    and event_name in ('app_opened','game_selected','game_started','room_created','room_joined');

  delete from public.analytics_daily_session_health where metric_date between p_from and p_to;
  insert into public.analytics_daily_session_health(metric_date,environment,analytics_session_id,had_error,refreshed_at)
  select (occurred_at at time zone 'UTC')::date,environment,analytics_session_id,
    bool_or(event_name in ('rpc_failed','frontend_error') or (event_name='realtime_status_changed' and properties->>'status' in ('channel_error','timed_out','closed'))),now()
  from public.analytics_events where (occurred_at at time zone 'UTC')::date between p_from and p_to and analytics_session_id is not null
  group by 1,2,3;

  delete from public.analytics_funnel_daily where metric_date between p_from and p_to;
  insert into public.analytics_funnel_daily(metric_date,environment,funnel_name,step_name,step_order,game_id,metric_value,refreshed_at)
  select metric_date,environment,funnel_name,step_name,step_order,coalesce(game_id,''),sum(metric_value),now() from (
    select (occurred_at at time zone 'UTC')::date metric_date,environment,'discovery' funnel_name,'app_opened' step_name,1::smallint step_order,null::text game_id,count(distinct analytics_session_id)::bigint metric_value
    from public.analytics_events where event_name='app_opened' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2
    union all select (occurred_at at time zone 'UTC')::date,environment,'discovery','game_selected',2,game_id,count(distinct analytics_session_id)
    from public.analytics_events where event_name='game_selected' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (setup_started_at at time zone 'UTC')::date,environment,'discovery','game_setup_started',3,game_id,count(*)
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (setup_started_at at time zone 'UTC')::date,environment,'discovery','game_started',4,game_id,count(*) filter(where started_at is not null)
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (setup_started_at at time zone 'UTC')::date,environment,'discovery','game_completed',5,game_id,count(*) filter(where status='completed')
    from public.analytics_game_sessions where (setup_started_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (created_at at time zone 'UTC')::date,environment,'multiplayer_host','room_created',1,game_id,count(*)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (created_at at time zone 'UTC')::date,environment,'multiplayer_host','guest_joined',2,game_id,count(*) filter(where successful_join_count>0)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (created_at at time zone 'UTC')::date,environment,'multiplayer_host','setup_started',3,game_id,count(*) filter(where setup_started_at is not null)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (created_at at time zone 'UTC')::date,environment,'multiplayer_host','game_started',4,game_id,count(*) filter(where first_game_started_at is not null)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (created_at at time zone 'UTC')::date,environment,'multiplayer_host','game_completed',5,game_id,count(*) filter(where last_game_completed_at is not null)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
    union all select (occurred_at at time zone 'UTC')::date,environment,'multiplayer_guest','join_attempted',1,null::text,count(*)
    from public.analytics_events where event_name='room_join_attempted' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2
    union all select (occurred_at at time zone 'UTC')::date,environment,'multiplayer_guest','join_failed',2,null::text,count(*)
    from public.analytics_events where event_name='room_join_failed' and (occurred_at at time zone 'UTC')::date between p_from and p_to group by 1,2
    union all select (created_at at time zone 'UTC')::date,environment,'multiplayer_guest','join_succeeded',3,game_id,sum(successful_join_count)
    from public.analytics_room_facts where (created_at at time zone 'UTC')::date between p_from and p_to group by 1,2,6
  ) steps group by 1,2,3,4,5,6;
  get diagnostics rows_written = row_count;
  update public.analytics_aggregate_refreshes set status='completed',completed_at=now() where id=refresh_id;
  return jsonb_build_object('status','completed','refresh_id',refresh_id,'funnel_rows',rows_written,'refreshed_at',now());
exception when others then
  if refresh_id is not null then update public.analytics_aggregate_refreshes set status='failed',completed_at=now(),error_code=sqlstate where id=refresh_id; end if;
  raise;
end;
$$;

create function public.decked_validate_command_centre_filters(p_environment text,p_from date,p_to date,p_game_id text)
returns void language plpgsql stable set search_path='' as $$ begin
  if p_environment not in ('development','preview','production') or p_from is null or p_to is null or p_from>p_to or p_to-p_from>366 then raise exception 'Invalid Command Centre filters.' using errcode='22023'; end if;
  if p_game_id is not null and not (p_game_id = any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met'])) then raise exception 'Invalid game filter.' using errcode='22023'; end if;
end $$;

create function public.decked_aggregate_freshness(p_from date,p_to date)
returns timestamptz language sql stable security definer set search_path='' as $$
  select max(completed_at) from public.analytics_aggregate_refreshes
  where status='completed' and from_date<=p_to and to_date>=p_from;
$$;

create function public.decked_command_centre_metrics(p_area text,p_environment text,p_from date,p_to date,p_game_id text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; freshness timestamptz;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  freshness:=public.decked_aggregate_freshness(p_from,p_to);
  if p_area='overview' then
    select jsonb_build_object('active_players',(select count(distinct analytics_user_id) from public.analytics_daily_active_users where environment=p_environment and metric_date between p_from and p_to),'game_sessions',coalesce(sum(metric_value) filter(where metric_name='game_starts'),0),'completed_sessions',coalesce(sum(metric_value) filter(where metric_name='game_completions'),0),'completion_rate',case when coalesce(sum(metric_value) filter(where metric_name='game_starts'),0)=0 then 0 else round(100.0*coalesce(sum(metric_value) filter(where metric_name='game_completions'),0)/sum(metric_value) filter(where metric_name='game_starts'),1) end,'multiplayer_sessions',coalesce(sum(metric_value) filter(where metric_name='game_starts' and play_mode='play_together'),0),'refreshed_at',freshness) into result
    from public.analytics_daily_aggregates where environment=p_environment and metric_date between p_from and p_to and (p_game_id is null or game_id=p_game_id);
  elsif p_area='multiplayer' then
    select jsonb_build_object('rooms_created',coalesce(sum(metric_value) filter(where metric_name='rooms_created'),0),'successful_joins',coalesce(sum(metric_value) filter(where metric_name='successful_joins'),0),'games_started',coalesce(sum(metric_value) filter(where metric_name='game_starts' and play_mode='play_together'),0),'games_completed',coalesce(sum(metric_value) filter(where metric_name='game_completions' and play_mode='play_together'),0),'host_disconnects',coalesce(sum(metric_value) filter(where metric_name='host_disconnects'),0),'host_handoffs',coalesce(sum(metric_value) filter(where metric_name='host_handoffs'),0),'rematch_requests',coalesce(sum(metric_value) filter(where metric_name='rematch_requests'),0),'rematch_starts',coalesce(sum(metric_value) filter(where metric_name='rematch_starts'),0),'refreshed_at',freshness) into result
    from public.analytics_daily_aggregates where environment=p_environment and metric_date between p_from and p_to and (p_game_id is null or game_id=p_game_id);
  elsif p_area='reliability' then
    select jsonb_build_object('rpc_failures',coalesce(sum(metric_value) filter(where metric_name='rpc_failures'),0),'frontend_errors',coalesce(sum(metric_value) filter(where metric_name='frontend_errors'),0),'realtime_failures',coalesce(sum(metric_value) filter(where metric_name='realtime_failures'),0),'app_opens',coalesce(sum(metric_value) filter(where metric_name='app_opens'),0),'refreshed_at',freshness) into result
    from public.analytics_daily_aggregates where environment=p_environment and metric_date between p_from and p_to and (p_game_id is null or game_id=p_game_id);
  else raise exception 'Unknown metrics area.' using errcode='22023'; end if;
  return result;
end $$;

create function public.decked_command_centre_games(p_environment text,p_from date,p_to date,p_game_id text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$ declare result jsonb; begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  select jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(rows) order by starts desc,game_id),'[]'::jsonb),'refreshed_at',public.decked_aggregate_freshness(p_from,p_to)) into result from (
    select game_id,coalesce(sum(metric_value) filter(where metric_name='game_setups'),0) setups,coalesce(sum(metric_value) filter(where metric_name='game_starts'),0) starts,coalesce(sum(metric_value) filter(where metric_name='game_completions'),0) completions,coalesce(sum(metric_value) filter(where metric_name='cards_presented'),0) cards_presented,case when coalesce(sum(metric_value) filter(where metric_name='game_setups'),0)=0 then 0 else round(100.0*coalesce(sum(metric_value) filter(where metric_name='game_starts'),0)/sum(metric_value) filter(where metric_name='game_setups'),1) end setup_to_first_card_rate,case when coalesce(sum(metric_value) filter(where metric_name='game_starts'),0)=0 then 0 else round(100.0*coalesce(sum(metric_value) filter(where metric_name='game_completions'),0)/sum(metric_value) filter(where metric_name='game_starts'),1) end completion_rate,(select percentile_cont(0.5) within group(order by extract(epoch from s.completed_at-s.started_at)) from public.analytics_game_sessions s where s.environment=p_environment and s.game_id=public.analytics_daily_aggregates.game_id and (s.setup_started_at at time zone 'UTC')::date between p_from and p_to and s.status='completed' and s.started_at is not null and s.completed_at is not null) median_completed_duration_seconds,max(refreshed_at) refreshed_at
    from public.analytics_daily_aggregates where environment=p_environment and metric_date between p_from and p_to and game_id is not null and (p_game_id is null or game_id=p_game_id) group by game_id
  ) rows;
  return result;
end $$;

create function public.decked_command_centre_funnels(p_environment text,p_from date,p_to date,p_game_id text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$ declare result jsonb; begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  select jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(rows) order by funnel_name,step_order),'[]'::jsonb),'refreshed_at',public.decked_aggregate_freshness(p_from,p_to)) into result from (
    select funnel_name,step_name,step_order,sum(metric_value)::bigint count,max(refreshed_at) refreshed_at from public.analytics_funnel_daily
    where environment=p_environment and metric_date between p_from and p_to and (p_game_id is null or game_id='' or game_id=p_game_id) group by funnel_name,step_name,step_order
  ) rows; return result;
end $$;

create function public.decked_reconcile_analytics_day(p_environment text,p_date date)
returns jsonb language plpgsql stable security definer set search_path='' as $$ declare aggregate_starts bigint; source_starts bigint; begin
  if not public.decked_is_command_centre_staff('admin') and current_user not in ('postgres','service_role') then raise exception 'Command Centre administrator access is required.' using errcode='42501'; end if;
  select coalesce(sum(metric_value),0) into aggregate_starts from public.analytics_daily_aggregates where environment=p_environment and metric_date=p_date and metric_name='game_starts';
  select count(*) into source_starts from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date=p_date and started_at is not null;
  return jsonb_build_object('environment',p_environment,'metric_date',p_date,'aggregate_game_starts',aggregate_starts,'source_game_starts',source_starts,'difference',aggregate_starts-source_starts,'matches',aggregate_starts=source_starts);
end $$;

revoke all on function public.decked_refresh_analytics_aggregates(date,date) from public,anon,authenticated;
revoke all on function public.decked_validate_command_centre_filters(text,date,date,text) from public,anon,authenticated;
revoke all on function public.decked_aggregate_freshness(date,date) from public,anon,authenticated;
revoke all on function public.decked_command_centre_metrics(text,text,date,date,text) from public,anon;
revoke all on function public.decked_command_centre_games(text,date,date,text) from public,anon;
revoke all on function public.decked_command_centre_funnels(text,date,date,text) from public,anon;
revoke all on function public.decked_reconcile_analytics_day(text,date) from public,anon,authenticated;
grant execute on function public.decked_command_centre_metrics(text,text,date,date,text) to authenticated;
grant execute on function public.decked_command_centre_games(text,date,date,text) to authenticated;
grant execute on function public.decked_command_centre_funnels(text,date,date,text) to authenticated;
grant execute on function public.decked_refresh_analytics_aggregates(date,date) to service_role;
grant execute on function public.decked_reconcile_analytics_day(text,date) to service_role;

-- Preserve the Prompt 8 response contract while moving it off session scans.
create or replace function public.decked_get_command_centre_overview(p_environment text,p_from date,p_to date,p_game_id text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare metrics jsonb; games jsonb; begin
  metrics:=public.decked_command_centre_metrics('overview',p_environment,p_from,p_to,p_game_id);
  games:=public.decked_command_centre_games(p_environment,p_from,p_to,p_game_id);
  return jsonb_build_object('kpis',metrics-'refreshed_at','games',games->'rows','refreshed_at',coalesce(metrics->'refreshed_at',games->'refreshed_at'));
end $$;
revoke all on function public.decked_get_command_centre_overview(text,date,date,text) from public,anon;
grant execute on function public.decked_get_command_centre_overview(text,date,date,text) to authenticated;
