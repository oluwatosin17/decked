-- Imposter and Mini Mystery keep their lifecycle in dedicated private tables,
-- rather than decked_rooms.game_state. Mirror terminal phases and rematches into
-- the same authoritative analytics session model used by every other game.

create or replace function public.decked_capture_dedicated_game_analytics()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  link public.analytics_room_links;
  game_id text := tg_argv[0];
  initial_phase text := tg_argv[1];
  player_count integer;
  progress integer;
  configured_count integer;
  completed_time timestamptz := now();
  new_session_id uuid;
  previous_session_id uuid;
begin
  begin
    select * into link
    from public.analytics_room_links
    where room_id = new.room_id
    for update;

    if link.room_id is null then return new; end if;

    select count(*) into player_count
    from public.decked_room_players
    where room_id = new.room_id;

    if game_id = 'mini-mystery' then
      progress := greatest(1, new.round_number);
      configured_count := greatest(1, new.rounds);
    else
      progress := greatest(1, new.clue_round);
      configured_count := 3;
    end if;

    -- A replay updates the dedicated game row while the room remains in the
    -- playing state, so create the next analytics session here.
    if tg_op = 'UPDATE' and old.phase = 'results' and new.phase = initial_phase
       and link.game_completed then
      previous_session_id := link.current_game_session_id;
      new_session_id := gen_random_uuid();

      update public.analytics_room_links
      set current_game_session_id = new_session_id,
          game_started_at = completed_time,
          game_completed = false
      where room_id = new.room_id
      returning * into link;

      insert into public.analytics_game_sessions(
        game_session_id, environment, multiplayer_room_ref, game_id, play_mode,
        status, setup_started_at, started_at, last_activity_at,
        configured_card_count, player_count, app_version_started
      ) values (
        new_session_id, link.environment, link.multiplayer_room_ref, game_id,
        'play_together', 'started', completed_time, completed_time,
        completed_time, configured_count, player_count, 'database'
      );

      update public.analytics_room_facts
      set rematch_start_count = rematch_start_count + 1,
          last_activity_at = completed_time
      where multiplayer_room_ref = link.multiplayer_room_ref;

      perform public.decked_write_database_event(
        'rematch_started', link.multiplayer_room_ref, game_id, new_session_id,
        jsonb_build_object(
          'game_id', game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref,
          'previous_game_session_id', previous_session_id,
          'new_game_session_id', new_session_id,
          'request_count', 0,
          'player_count', player_count
        ),
        'game-rematch-started:' || new_session_id
      );
    end if;

    if new.phase = 'results'
       and (tg_op = 'INSERT' or old.phase is distinct from 'results')
       and link.current_game_session_id is not null
       and not link.game_completed then
      update public.analytics_room_links
      set game_completed = true
      where room_id = new.room_id;

      update public.analytics_game_sessions
      set status = 'completed',
          completed_at = completed_time,
          last_activity_at = completed_time,
          configured_card_count = coalesce(configured_card_count, configured_count),
          cards_presented = greatest(cards_presented, progress),
          rounds_completed = greatest(rounds_completed, progress),
          completion_reason = 'completed',
          updated_at = completed_time
      where game_session_id = link.current_game_session_id;

      update public.analytics_room_facts
      set last_game_completed_at = completed_time,
          last_activity_at = completed_time
      where multiplayer_room_ref = link.multiplayer_room_ref;

      perform public.decked_write_database_event(
        'multiplayer_game_completed', link.multiplayer_room_ref, game_id,
        link.current_game_session_id,
        jsonb_build_object(
          'game_id', game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref,
          'game_session_id', link.current_game_session_id,
          'cards_presented', progress,
          'cards_skipped', 0,
          'rounds_completed', progress,
          'duration_seconds', greatest(0, extract(epoch from completed_time - link.game_started_at)::integer),
          'player_count', player_count
        ),
        'game-completed:' || link.current_game_session_id
      );
    end if;
  exception when others then
    raise warning 'Dedicated game analytics capture failed for %: %', game_id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists decked_capture_imposter_game_analytics on public.decked_imposter_games;
create trigger decked_capture_imposter_game_analytics
after insert or update of phase on public.decked_imposter_games
for each row execute function public.decked_capture_dedicated_game_analytics('imposter', 'role_reveal');

drop trigger if exists decked_capture_mini_mystery_game_analytics on public.decked_mini_mystery_games;
create trigger decked_capture_mini_mystery_game_analytics
after insert or update of phase on public.decked_mini_mystery_games
for each row execute function public.decked_capture_dedicated_game_analytics('mini-mystery', 'role_reveal');

revoke all on function public.decked_capture_dedicated_game_analytics() from public, anon, authenticated;
grant execute on function public.decked_capture_dedicated_game_analytics() to service_role;
