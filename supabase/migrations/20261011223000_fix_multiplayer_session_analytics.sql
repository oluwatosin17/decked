-- Align authoritative multiplayer analytics with every shared-session game.
-- Shared game state is content-free here: only lifecycle steps, numeric progress,
-- deck sizes, and Whot's opaque winner id are inspected.

create or replace function public.decked_multiplayer_session_is_terminal(p_session jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_session->>'step', '') in ('done', 'winner')
    or nullif(p_session->'whotState'->>'winnerId', '') is not null
    or (
      coalesce(p_session->>'step', '') in ('game', 'gameplay')
      and coalesce((p_session->>'totalCards')::integer, 0) > 0
      and public.decked_multiplayer_card_number(p_session)
        >= coalesce((p_session->>'totalCards')::integer, 0)
    );
$$;

create or replace function public.decked_multiplayer_card_number(p_session jsonb)
returns integer language sql immutable set search_path = '' as $$
  select greatest(0, coalesce(
    (p_session->>'cardIndex')::integer,
    (p_session->>'cardIdx')::integer,
    (p_session->>'gameCardIndex')::integer,
    (p_session->>'challengeIdx')::integer,
    (p_session->>'idx')::integer,
    (p_session->>'round')::integer,
    (p_session->'whotState'->>'turn')::integer,
    0
  ));
$$;

create function public.decked_multiplayer_configured_card_count(
  p_game_id text,
  p_session jsonb,
  p_fallback integer default null
)
returns integer language sql immutable set search_path = '' as $$
  select nullif(greatest(0, coalesce(
    case when p_game_id = 'whot' then 54 end,
    (p_session->>'totalCards')::integer,
    (p_session->>'deckSize')::integer,
    case when jsonb_typeof(p_session->'deck') = 'array' then jsonb_array_length(p_session->'deck') end,
    case when jsonb_typeof(p_session->'questions') = 'array' then jsonb_array_length(p_session->'questions') end,
    case when jsonb_typeof(p_session->'prompts') = 'array' then jsonb_array_length(p_session->'prompts') end,
    case when jsonb_typeof(p_session->'scenarios') = 'array' then jsonb_array_length(p_session->'scenarios') end,
    case when jsonb_typeof(p_session->'challenges') = 'array' then jsonb_array_length(p_session->'challenges') end,
    p_fallback,
    0
  )), 0);
$$;

create function public.decked_sync_multiplayer_session_metrics()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  link public.analytics_room_links;
  room_session jsonb := coalesce(new.game_state->'session', '{}'::jsonb);
  configured_count integer;
  progress integer;
begin
  begin
    select * into link from public.analytics_room_links where room_id = new.id;
    if link.current_game_session_id is null then return new; end if;

    configured_count := public.decked_multiplayer_configured_card_count(new.game_id, room_session, new.total_cards);
    progress := public.decked_multiplayer_card_number(room_session);
    update public.analytics_game_sessions
      set configured_card_count = coalesce(configured_count, configured_card_count),
          cards_presented = greatest(cards_presented, case when progress > 0 then progress + 1 else 0 end),
          last_activity_at = greatest(last_activity_at, now()),
          updated_at = now()
      where game_session_id = link.current_game_session_id;
  exception when others then
    raise warning 'Decked multiplayer metric synchronization failed: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists zz_decked_rooms_sync_session_metrics on public.decked_rooms;
create trigger zz_decked_rooms_sync_session_metrics
after update of game_state on public.decked_rooms
for each row execute function public.decked_sync_multiplayer_session_metrics();

revoke all on function public.decked_multiplayer_configured_card_count(text,jsonb,integer) from public,anon,authenticated;
revoke all on function public.decked_sync_multiplayer_session_metrics() from public,anon,authenticated;

comment on function public.decked_multiplayer_configured_card_count(text,jsonb,integer) is
  'Returns a content-free configured-card count for every supported shared-session shape.';
comment on function public.decked_sync_multiplayer_session_metrics() is
  'Keeps authoritative multiplayer session depth and configured-card counts aligned with shared game state.';

-- Fail the migration rather than silently shipping another unsupported state shape.
do $$
begin
  if not public.decked_multiplayer_session_is_terminal('{"step":"done"}'::jsonb)
    or not public.decked_multiplayer_session_is_terminal('{"step":"winner"}'::jsonb)
    or not public.decked_multiplayer_session_is_terminal('{"step":"game","totalCards":10,"cardIndex":10}'::jsonb)
    or not public.decked_multiplayer_session_is_terminal('{"step":"game","whotState":{"winnerId":"opaque-player"}}'::jsonb)
    or public.decked_multiplayer_session_is_terminal('{"step":"game","totalCards":10,"cardIndex":9}'::jsonb)
  then raise exception 'Multiplayer terminal-state regression'; end if;

  if public.decked_multiplayer_card_number('{"cardIndex":1}'::jsonb) <> 1
    or public.decked_multiplayer_card_number('{"cardIdx":2}'::jsonb) <> 2
    or public.decked_multiplayer_card_number('{"gameCardIndex":3}'::jsonb) <> 3
    or public.decked_multiplayer_card_number('{"challengeIdx":4}'::jsonb) <> 4
    or public.decked_multiplayer_card_number('{"idx":5}'::jsonb) <> 5
    or public.decked_multiplayer_card_number('{"round":6}'::jsonb) <> 6
    or public.decked_multiplayer_card_number('{"whotState":{"turn":7}}'::jsonb) <> 7
  then raise exception 'Multiplayer progress-shape regression'; end if;

  if public.decked_multiplayer_configured_card_count('whot','{}'::jsonb,1) <> 54
    or public.decked_multiplayer_configured_card_count('charades','{"deckSize":12}'::jsonb,1) <> 12
    or public.decked_multiplayer_configured_card_count('who-said-that','{"deck":[1,2,3]}'::jsonb,1) <> 3
  then raise exception 'Multiplayer configured-card regression'; end if;
end;
$$;

-- Repair currently retained room sessions. This recovers Whot completions that
-- occurred before the terminal detector understood whotState.winnerId, and
-- corrects depth/configuration for every active shared-session game.
do $$
declare
  item record;
  room_session jsonb;
  progress integer;
  configured_count integer;
  player_count integer;
  completed_time timestamptz;
begin
  for item in
    select r.*, l.multiplayer_room_ref, l.current_game_session_id, l.game_started_at, l.game_completed
    from public.decked_rooms r
    join public.analytics_room_links l on l.room_id = r.id
    where l.current_game_session_id is not null
  loop
    room_session := coalesce(item.game_state->'session', '{}'::jsonb);
    progress := public.decked_multiplayer_card_number(room_session);
    configured_count := public.decked_multiplayer_configured_card_count(item.game_id, room_session, item.total_cards);
    select count(*) into player_count from public.decked_room_players where room_id = item.id;

    update public.analytics_game_sessions
      set configured_card_count = coalesce(configured_count, configured_card_count),
          cards_presented = greatest(cards_presented, case when progress > 0 then progress + 1 else 0 end),
          player_count = greatest(coalesce(analytics_game_sessions.player_count, 1), player_count),
          updated_at = now()
      where game_session_id = item.current_game_session_id;

    if not item.game_completed and public.decked_multiplayer_session_is_terminal(room_session) then
      completed_time := now();
      update public.analytics_room_links set game_completed = true where room_id = item.id;
      update public.analytics_game_sessions
        set status = 'completed', completed_at = completed_time, last_activity_at = completed_time,
            cards_presented = greatest(cards_presented, progress + 1), rounds_completed = greatest(rounds_completed, 1),
            completion_reason = 'completed', updated_at = completed_time
        where game_session_id = item.current_game_session_id;
      update public.analytics_room_facts
        set last_game_completed_at = completed_time, last_activity_at = completed_time
        where multiplayer_room_ref = item.multiplayer_room_ref;
      perform public.decked_write_database_event(
        'multiplayer_game_completed', item.multiplayer_room_ref, item.game_id, item.current_game_session_id,
        jsonb_build_object(
          'game_id', item.game_id, 'multiplayer_room_ref', item.multiplayer_room_ref,
          'game_session_id', item.current_game_session_id, 'cards_presented', progress + 1,
          'cards_skipped', 0, 'rounds_completed', 1,
          'duration_seconds', greatest(0, extract(epoch from completed_time - item.game_started_at)::integer),
          'player_count', player_count
        ),
        'game-completed:' || item.current_game_session_id
      );
    end if;
  end loop;
end;
$$;
