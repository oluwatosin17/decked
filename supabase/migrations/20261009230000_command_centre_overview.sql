-- Comprehensive Overview read model and first-seen identity facts.

create table public.analytics_user_first_seen (
  environment text not null check(environment in ('development','preview','production')),
  analytics_user_id uuid not null,
  first_seen_date date not null,
  updated_at timestamptz not null default now(),
  primary key(environment,analytics_user_id)
);
create index analytics_user_first_seen_date_idx on public.analytics_user_first_seen(environment,first_seen_date);
alter table public.analytics_user_first_seen enable row level security;
revoke all on public.analytics_user_first_seen from public,anon,authenticated;
grant select,insert,update,delete on public.analytics_user_first_seen to service_role;

create function public.decked_capture_analytics_first_seen()
returns trigger language plpgsql security definer set search_path='' as $$ begin
  insert into public.analytics_user_first_seen(environment,analytics_user_id,first_seen_date,updated_at)
  values(new.environment,new.analytics_user_id,new.metric_date,now())
  on conflict(environment,analytics_user_id) do update
    set first_seen_date=least(public.analytics_user_first_seen.first_seen_date,excluded.first_seen_date),updated_at=now();
  return new;
end $$;
create trigger analytics_daily_active_users_first_seen after insert on public.analytics_daily_active_users
for each row execute function public.decked_capture_analytics_first_seen();
insert into public.analytics_user_first_seen(environment,analytics_user_id,first_seen_date)
select environment,analytics_user_id,min(metric_date) from public.analytics_daily_active_users group by 1,2
on conflict(environment,analytics_user_id) do update set first_seen_date=least(public.analytics_user_first_seen.first_seen_date,excluded.first_seen_date),updated_at=now();

create function public.decked_command_centre_overview_v2(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  period_days integer:=p_to-p_from+1; previous_from date; previous_to date;
  current_metrics jsonb; previous_metrics jsonb; trend jsonb; games jsonb;
  current_active jsonb; previous_active jsonb; current_rooms jsonb; previous_rooms jsonb;
  current_health jsonb; previous_health jsonb; freshness timestamptz;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  previous_to:=p_from-1; previous_from:=previous_to-period_days+1;
  freshness:=public.decked_aggregate_freshness(p_from,p_to);

  select jsonb_build_object(
    'game_starts',coalesce(sum(metric_value) filter(where metric_name='game_starts'),0),
    'completions',coalesce(sum(metric_value) filter(where metric_name='game_completions'),0),
    'cards_played',coalesce(sum(metric_value) filter(where metric_name='cards_presented'),0),
    'replays',coalesce(sum(metric_value) filter(where metric_name='replays'),0)
  ) into current_metrics from public.analytics_daily_aggregates
  where environment=p_environment and metric_date between p_from and p_to
    and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode);
  select jsonb_build_object(
    'game_starts',coalesce(sum(metric_value) filter(where metric_name='game_starts'),0),
    'completions',coalesce(sum(metric_value) filter(where metric_name='game_completions'),0),
    'cards_played',coalesce(sum(metric_value) filter(where metric_name='cards_presented'),0),
    'replays',coalesce(sum(metric_value) filter(where metric_name='replays'),0)
  ) into previous_metrics from public.analytics_daily_aggregates
  where environment=p_environment and metric_date between previous_from and previous_to
    and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode);

  select jsonb_build_object(
    'daily_active',(select count(distinct analytics_user_id) from public.analytics_daily_active_users where environment=p_environment and metric_date=p_to),
    'weekly_active',(select count(distinct analytics_user_id) from public.analytics_daily_active_users where environment=p_environment and metric_date between p_to-6 and p_to),
    'monthly_active',(select count(distinct analytics_user_id) from public.analytics_daily_active_users where environment=p_environment and metric_date between p_to-29 and p_to),
    'new_players',(select count(*) from public.analytics_user_first_seen where environment=p_environment and first_seen_date between p_from and p_to),
    'returning_players',(select count(distinct a.analytics_user_id) from public.analytics_daily_active_users a join public.analytics_user_first_seen f using(environment,analytics_user_id) where a.environment=p_environment and a.metric_date between p_from and p_to and f.first_seen_date<p_from)
  ) into current_active;
  select jsonb_build_object(
    'daily_active',(select count(distinct analytics_user_id) from public.analytics_daily_active_users where environment=p_environment and metric_date=previous_to),
    'weekly_active',(select count(distinct analytics_user_id) from public.analytics_daily_active_users where environment=p_environment and metric_date between previous_to-6 and previous_to),
    'monthly_active',(select count(distinct analytics_user_id) from public.analytics_daily_active_users where environment=p_environment and metric_date between previous_to-29 and previous_to),
    'new_players',(select count(*) from public.analytics_user_first_seen where environment=p_environment and first_seen_date between previous_from and previous_to),
    'returning_players',(select count(distinct a.analytics_user_id) from public.analytics_daily_active_users a join public.analytics_user_first_seen f using(environment,analytics_user_id) where a.environment=p_environment and a.metric_date between previous_from and previous_to and f.first_seen_date<previous_from)
  ) into previous_active;

  select jsonb_build_object('rooms_created',count(*),'rooms_started',count(*) filter(where first_game_started_at is not null),'eligible_rooms',count(*) filter(where successful_join_count>0),'rematch_starts',coalesce(sum(rematch_start_count),0)) into current_rooms
  from public.analytics_room_facts where environment=p_environment and (created_at at time zone 'UTC')::date between p_from and p_to and (p_game_id is null or game_id=p_game_id);
  select jsonb_build_object('rooms_created',count(*),'rooms_started',count(*) filter(where first_game_started_at is not null),'eligible_rooms',count(*) filter(where successful_join_count>0),'rematch_starts',coalesce(sum(rematch_start_count),0)) into previous_rooms
  from public.analytics_room_facts where environment=p_environment and (created_at at time zone 'UTC')::date between previous_from and previous_to and (p_game_id is null or game_id=p_game_id);

  select jsonb_build_object('sessions',count(distinct analytics_session_id),'error_sessions',count(distinct analytics_session_id) filter(where had_error)) into current_health
  from public.analytics_daily_session_health where environment=p_environment and metric_date between p_from and p_to;
  select jsonb_build_object('sessions',count(distinct analytics_session_id),'error_sessions',count(distinct analytics_session_id) filter(where had_error)) into previous_health
  from public.analytics_daily_session_health where environment=p_environment and metric_date between previous_from and previous_to;

  select coalesce(jsonb_agg(to_jsonb(t) order by metric_date),'[]'::jsonb) into trend from (
    select metric_date,coalesce(sum(metric_value) filter(where metric_name='game_starts'),0) starts,coalesce(sum(metric_value) filter(where metric_name='game_completions'),0) completions
    from public.analytics_daily_aggregates where environment=p_environment and metric_date between p_from and p_to and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode) group by metric_date
  ) t;
  select coalesce(jsonb_agg(to_jsonb(g) order by starts desc,game_id),'[]'::jsonb) into games from (
    select game_id,coalesce(sum(metric_value) filter(where metric_name='game_starts'),0) starts,coalesce(sum(metric_value) filter(where metric_name='game_completions'),0) completions,case when coalesce(sum(metric_value) filter(where metric_name='game_starts'),0)=0 then 0 else round(100.0*coalesce(sum(metric_value) filter(where metric_name='game_completions'),0)/sum(metric_value) filter(where metric_name='game_starts'),1) end completion_rate
    from public.analytics_daily_aggregates where environment=p_environment and metric_date between p_from and p_to and game_id is not null and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode)
    group by game_id order by starts desc,game_id limit 10
  ) g;

  return jsonb_build_object(
    'current',current_active||current_metrics||current_rooms||current_health||jsonb_build_object(
      'median_session_duration_seconds',(select percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between p_from and p_to and status='completed' and started_at is not null and completed_at is not null and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode))),
    'previous',previous_active||previous_metrics||previous_rooms||previous_health||jsonb_build_object(
      'median_session_duration_seconds',(select percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between previous_from and previous_to and status='completed' and started_at is not null and completed_at is not null and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode))),
    'trend',trend,'top_games',games,'refreshed_at',freshness,
    'partial_warnings',case when p_game_id is not null or p_play_mode is not null then jsonb_build_array('Player and reliability metrics are not segmented by game or play mode.') else '[]'::jsonb end
  );
end $$;

revoke all on function public.decked_capture_analytics_first_seen() from public,anon,authenticated;
revoke all on function public.decked_command_centre_overview_v2(text,date,date,text,text) from public,anon;
grant execute on function public.decked_command_centre_overview_v2(text,date,date,text,text) to authenticated;
