-- Recovered from the linked project's Supabase migration history.

-- Capture secure Whot completion and replay from its authoritative private
-- table. Never copy hands, deck contents, or winner identity to shared state.

create or replace function public.decked_capture_whot_analytics()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  link public.analytics_room_links;
  player_count integer;
  progress integer;
  event_time timestamptz := now();
  previous_session_id uuid;
  new_session_id uuid;
begin
  select * into link
  from public.analytics_room_links
  where room_id = new.room_id
  for update;

  if link.room_id is null then return new; end if;

  select count(*) into player_count
  from public.decked_room_players
  where room_id = new.room_id;

  progress := greatest(1, coalesce((new.state->>'turn')::integer, 1));

  if tg_op = 'UPDATE'
     and nullif(coalesce(old.state->>'winnerId', ''), '') is null
     and nullif(coalesce(new.state->>'winnerId', ''), '') is not null
     and link.current_game_session_id is not null
     and not link.game_completed then
    update public.analytics_room_links
    set game_completed = true
    where room_id = new.room_id;

    update public.analytics_game_sessions
    set status = 'completed',
        completed_at = event_time,
        last_activity_at = event_time,
        cards_presented = greatest(cards_presented, progress),
        rounds_completed = greatest(rounds_completed, progress),
        completion_reason = 'completed',
        updated_at = event_time
    where game_session_id = link.current_game_session_id;

    update public.analytics_room_facts
    set last_game_completed_at = event_time,
        last_activity_at = event_time
    where multiplayer_room_ref = link.multiplayer_room_ref;

    perform public.decked_write_database_event(
      'multiplayer_game_completed', link.multiplayer_room_ref, 'whot',
      link.current_game_session_id,
      jsonb_build_object(
        'game_id', 'whot',
        'multiplayer_room_ref', link.multiplayer_room_ref,
        'game_session_id', link.current_game_session_id,
        'cards_presented', progress,
        'cards_skipped', 0,
        'rounds_completed', progress,
        'duration_seconds', greatest(0, extract(epoch from event_time - link.game_started_at)::integer),
        'player_count', player_count
      ),
      'game-completed:' || link.current_game_session_id
    );
  end if;

  if tg_op = 'INSERT' and link.game_completed then
    previous_session_id := link.current_game_session_id;
    new_session_id := gen_random_uuid();

    update public.analytics_room_links
    set current_game_session_id = new_session_id,
        game_started_at = event_time,
        game_completed = false
    where room_id = new.room_id;

    insert into public.analytics_game_sessions(
      game_session_id, environment, multiplayer_room_ref, game_id, play_mode,
      status, setup_started_at, started_at, last_activity_at,
      configured_card_count, player_count, app_version_started
    ) values (
      new_session_id, link.environment, link.multiplayer_room_ref, 'whot',
      'play_together', 'started', event_time, event_time, event_time,
      54, player_count, 'database'
    );

    update public.analytics_room_facts
    set rematch_start_count = rematch_start_count + 1,
        last_activity_at = event_time
    where multiplayer_room_ref = link.multiplayer_room_ref;

    perform public.decked_write_database_event(
      'rematch_started', link.multiplayer_room_ref, 'whot', new_session_id,
      jsonb_build_object(
        'game_id', 'whot',
        'multiplayer_room_ref', link.multiplayer_room_ref,
        'previous_game_session_id', previous_session_id,
        'new_game_session_id', new_session_id,
        'request_count', 0,
        'player_count', player_count
      ),
      'rematch-started:' || new_session_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists decked_capture_whot_analytics on public.decked_whot_games;

create trigger decked_capture_whot_analytics
after insert or update of state on public.decked_whot_games
for each row execute function public.decked_capture_whot_analytics();

revoke all on function public.decked_capture_whot_analytics() from public, anon, authenticated;

grant execute on function public.decked_capture_whot_analytics() to service_role;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.decked_whot_games'::regclass
      and tgname = 'decked_capture_whot_analytics'
      and not tgisinternal
  ) then raise exception 'Whot authoritative analytics trigger was not installed'; end if;
end $$;
