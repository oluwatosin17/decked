-- Recovered from the linked project's Supabase migration history.

-- Reconcile four independently verified pre-launch QA blockers without
-- changing historical analytics or exposing private game state.

-- Mini Mystery's start RPC accepts the current 22-case catalogue and remix
-- suffix, but the table retained the original 16-case constraint.
alter table public.decked_mini_mystery_games
  drop constraint if exists decked_mini_mystery_games_case_id_check;

alter table public.decked_mini_mystery_games
  add constraint decked_mini_mystery_games_case_id_check check (
    regexp_replace(case_id, '--remix$', '') in (
      'phone-that-could-ruin-everyone','vanished-crypto-wallet','engagement-ring-came-back',
      'deepfake-confession','cancelled-at-midnight','final-interview',
      'guest-never-checked-out','last-seen-217','live-after-vanished',
      'smart-home-lockdown','wrong-person-drank-it','crash-already-online',
      'bride-never-arrived','bishops-announcement','harvest-offering','reunion-broadcast',
      'reading-of-will','cooperative-payout','last-bus-enugu','grooms-second-ring',
      'senators-empty-coffin','missing-afrobeats-star'
    )
    and case_id in (regexp_replace(case_id, '--remix$', ''), regexp_replace(case_id, '--remix$', '') || '--remix')
  ) not valid;

alter table public.decked_mini_mystery_games validate constraint decked_mini_mystery_games_case_id_check;

-- Dedicated Do You Know Me? and Think Fast state tables already produce
-- authoritative completion events. Their results -> initial-phase transitions
-- were missing the matching authoritative rematch session.
create or replace function public.decked_capture_dedicated_rematch_analytics()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  link public.analytics_room_links;
  game_id text := tg_argv[0];
  initial_phase text := tg_argv[1];
  player_count integer;
  event_time timestamptz := now();
  previous_session_id uuid;
  new_session_id uuid;
begin
  if tg_op <> 'UPDATE' or old.phase <> 'results' or new.phase <> initial_phase then return new; end if;
  select * into link from public.analytics_room_links where room_id=new.room_id for update;
  if link.room_id is null or not link.game_completed or link.current_game_session_id is null then return new; end if;
  select count(*) into player_count from public.decked_room_players where room_id=new.room_id;
  previous_session_id := link.current_game_session_id;
  new_session_id := gen_random_uuid();
  update public.analytics_room_links set current_game_session_id=new_session_id,game_started_at=event_time,game_completed=false where room_id=new.room_id;
  insert into public.analytics_game_sessions(game_session_id,environment,multiplayer_room_ref,game_id,play_mode,status,setup_started_at,started_at,last_activity_at,configured_card_count,player_count,app_version_started)
  values(new_session_id,link.environment,link.multiplayer_room_ref,game_id,'play_together','started',event_time,event_time,event_time,greatest(1,new.rounds),player_count,'database');
  update public.analytics_room_facts set rematch_start_count=rematch_start_count+1,last_activity_at=event_time where multiplayer_room_ref=link.multiplayer_room_ref;
  perform public.decked_write_database_event('rematch_started',link.multiplayer_room_ref,game_id,new_session_id,
    jsonb_build_object('game_id',game_id,'multiplayer_room_ref',link.multiplayer_room_ref,'previous_game_session_id',previous_session_id,'new_game_session_id',new_session_id,'request_count',0,'player_count',player_count),
    'rematch-started:'||new_session_id);
  return new;
end; $$;

drop trigger if exists decked_capture_know_me_rematch_analytics on public.decked_know_me_games;

create trigger decked_capture_know_me_rematch_analytics after update of phase on public.decked_know_me_games
for each row execute function public.decked_capture_dedicated_rematch_analytics('do-you-know-me','answering');

drop trigger if exists decked_capture_think_fast_rematch_analytics on public.decked_think_fast_games;

create trigger decked_capture_think_fast_rematch_analytics after update of phase on public.decked_think_fast_games
for each row execute function public.decked_capture_dedicated_rematch_analytics('think-fast','thinking');

revoke all on function public.decked_capture_dedicated_rematch_analytics() from public,anon,authenticated;

grant execute on function public.decked_capture_dedicated_rematch_analytics() to service_role;

-- Games v2 used a stale 21-game literal. Keep the report semantics unchanged
-- while including the seven supported games added later.
create or replace function public.decked_command_centre_games_v2(
  p_environment text, p_from date, p_to date, p_play_mode text default null, p_trend_days integer default 7
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  if p_trend_days not in (7,30) then raise exception 'Trend window must be 7 or 30 days.' using errcode='22023'; end if;
  with games(game_id) as (select unnest(array[
    'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast','not-me-your-honour','bad-advice-only'
  ])),
  current_sessions as (
    select game_id,count(*) setups,count(*) filter(where started_at is not null and play_mode='pass_and_play') pass_and_play_starts,count(*) filter(where started_at is not null and play_mode='play_together') multiplayer_starts,count(distinct analytics_user_id) filter(where analytics_user_id is not null) unique_players,count(*) filter(where cards_presented>0) first_cards,count(*) filter(where status='completed') completions,percentile_cont(.5) within group(order by cards_presented) filter(where started_at is not null) median_cards_played,percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) filter(where status='completed' and started_at is not null and completed_at is not null) median_duration_seconds
    from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between p_from and p_to and (p_play_mode is null or play_mode=p_play_mode) group by game_id
  ), previous_starts as (
    select game_id,count(*) filter(where started_at is not null)::numeric starts from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between p_to-p_trend_days+1 and p_to and (p_play_mode is null or play_mode=p_play_mode) group by game_id
  ), prior_starts as (
    select game_id,count(*) filter(where started_at is not null)::numeric starts from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between p_to-(p_trend_days*2)+1 and p_to-p_trend_days and (p_play_mode is null or play_mode=p_play_mode) group by game_id
  ), event_counts as (
    select game_id,count(*) filter(where event_name='screen_viewed') game_views,count(*) filter(where event_name='game_selected') selections,count(*) filter(where event_name='game_replay_selected') replays from public.analytics_events where environment=p_environment and (occurred_at at time zone 'UTC')::date between p_from and p_to and game_id is not null group by game_id
  ), rematches as (
    select game_id,coalesce(sum(rematch_start_count),0) rematches from public.analytics_room_facts where environment=p_environment and (created_at at time zone 'UTC')::date between p_from and p_to group by game_id
  ), rows as (
    select g.game_id,coalesce(e.game_views,0) game_views,coalesce(e.selections,0) selections,coalesce(s.pass_and_play_starts,0) pass_and_play_starts,coalesce(s.multiplayer_starts,0) multiplayer_starts,coalesce(s.unique_players,0) unique_players,
      case when coalesce(s.setups,0)=0 then 0 else round(100.0*s.first_cards/s.setups,1) end first_card_rate,
      case when coalesce(s.pass_and_play_starts,0)+coalesce(s.multiplayer_starts,0)=0 then 0 else round(100.0*s.completions/(s.pass_and_play_starts+s.multiplayer_starts),1) end completion_rate,
      s.median_cards_played,s.median_duration_seconds,
      case when coalesce(s.completions,0)=0 then 0 else round(100.0*(coalesce(e.replays,0)+coalesce(r.rematches,0))/s.completions,1) end replay_rate,
      case when coalesce(prior.starts,0)=0 then null else round(100.0*(coalesce(recent.starts,0)-prior.starts)/prior.starts,1) end trend_percent
    from games g left join current_sessions s using(game_id) left join event_counts e using(game_id) left join rematches r using(game_id) left join previous_starts recent using(game_id) left join prior_starts prior using(game_id)
  )
  select jsonb_build_object('rows',jsonb_agg(to_jsonb(rows) order by game_id),'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),'partial_warnings',jsonb_build_array('Unique-player counts exclude authoritative sessions without a browser analytics identity.') || case when p_play_mode is null then '[]'::jsonb else jsonb_build_array('Views and selections are not attributed to a play mode and remain unfiltered.') end) into result from rows;
  return result;
end $$;

revoke all on function public.decked_command_centre_games_v2(text,date,date,text,integer) from public,anon;

grant execute on function public.decked_command_centre_games_v2(text,date,date,text,integer) to authenticated;

do $$ begin
  if (select count(*) from unnest(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast','not-me-your-honour','bad-advice-only'])) <> 28 then raise exception 'Game inventory assertion failed'; end if;
  if not exists(select 1 from pg_trigger where tgname='decked_capture_know_me_rematch_analytics' and not tgisinternal) or not exists(select 1 from pg_trigger where tgname='decked_capture_think_fast_rematch_analytics' and not tgisinternal) then raise exception 'Dedicated rematch trigger assertion failed'; end if;
end $$;
