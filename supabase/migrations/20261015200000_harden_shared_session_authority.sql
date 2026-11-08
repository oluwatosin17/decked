-- Recovered from the linked project's Supabase migration history.

-- Enforce the ownership rules already used by the shared-game client at the
-- database boundary. This intentionally remains permissive for legacy game
-- actions whose ownership has not yet been modelled; membership, key length,
-- and room-status checks still apply to those actions.

create or replace function public.decked_session_player_at(p_session jsonb, p_index integer)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  player_count integer;
  player_id text;
begin
  if jsonb_typeof(p_session->'players') <> 'array' then return null; end if;
  player_count := jsonb_array_length(p_session->'players');
  if player_count = 0 or p_index is null then return null; end if;
  player_id := coalesce(
    p_session->'players'->(((p_index % player_count) + player_count) % player_count)->>'userId',
    p_session->'players'->(((p_index % player_count) + player_count) % player_count)->>'id'
  );
  if player_id is null or player_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return null; end if;
  return player_id::uuid;
end;
$$;

create or replace function public.decked_session_write_allowed(
  p_room public.decked_rooms,
  p_key text,
  p_actor uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  session_state jsonb := case when jsonb_typeof(p_room.game_state->'session') = 'object'
    then p_room.game_state->'session' else '{}'::jsonb end;
  current_step text := coalesce(session_state->>'step', '');
  actor_suffix text := right(p_key, 36);
  active_player uuid;
  turn_index integer;
  round_index integer;
  whot_index integer;
begin
  if p_actor is null then return false; end if;

  -- Hosts retain the existing facilitator capability for setup, recovery and
  -- progression. Dedicated-game RPCs apply their own stricter rules.
  if p_actor = p_room.host_user_id then return true; end if;

  -- Private submissions are append-only by convention and end in the
  -- authenticated player's UUID. A player cannot forge another member's key.
  if p_key like 'mltVote-%'
     or p_key like 'cysVote-%'
     or p_key like 'ttbVote-%'
     or p_key like 'wstAnswer-%'
     or p_key like 'wstGuess-%' then
    return actor_suffix = p_actor::text;
  end if;

  -- Guests never configure a shared game. These keys are only written by the
  -- host setup/rematch screens in the current application.
  if p_key = any(array[
    'players','categories','customCards','deckSize','totalCards','deck',
    'questions','prompts','selectedCategories','teams','roundLength','maxLives',
    'mode','theme','relationship','depth','journey','fingers','spiceLevel',
    'truths','dares','scenarios','voteSessionId','wstSessionId','sessionId'
  ]) then return false; end if;

  -- These games accept guest input only through the scoped keys above. Their
  -- round progression, aggregate votes, scores and reveal state are host-owned.
  if p_room.game_id in ('most-likely-to', 'choose-your-side', 'who-said-that') then
    return false;
  end if;

  -- These two games use a host facilitator to record the group's physical
  -- response. No guest device should advance or replace their shared result.
  if p_room.game_id in ('never-have-i-ever', 'you-laugh') then return false; end if;

  -- Dateable or Dealbreaker assigns the card to the reader, then each vote to
  -- the currently named voter. This mirrors sharedGameOwnership.ts.
  if p_room.game_id = 'red-flag-green-flag' then
    if coalesce(session_state->>'gamePhase', 'card-front') = 'voting' then
      turn_index := coalesce((session_state->>'votingPlayerIndex')::integer, 0);
    else
      turn_index := coalesce((session_state->>'gamePlayerIndex')::integer, 0);
    end if;
    return public.decked_session_player_at(session_state, turn_index) = p_actor;
  end if;

  -- Shared pass-and-play screens with an explicit playerIndex are owned by the
  -- active player. The host fallback above preserves moderation/recovery.
  if p_room.game_id in (
    'spicy-starters','late-night-talks','dinner-table','icebreaker',
    'everyday-conversation','reconnect','strangers','finger-down','take-a-sip',
    'sip-or-spill','do-or-drink','we-just-met'
  ) and current_step = 'game' then
    turn_index := coalesce(
      (session_state->>'playerIndex')::integer,
      (session_state->>'gamePlayerIndex')::integer,
      0
    );
    return public.decked_session_player_at(session_state, turn_index) = p_actor;
  end if;

  -- The author controls their Two Truths round; guesses use scoped keys above.
  if p_room.game_id = 'two-truths-bluff' and current_step in ('write','guess','reveal','done') then
    round_index := coalesce((session_state->>'round')::integer, 0);
    return public.decked_session_player_at(session_state, round_index) = p_actor;
  end if;

  -- Whot persists one complete deterministic state object. Only the current
  -- player (or host recovery path) may replace it.
  if p_room.game_id = 'whot' and p_key = 'whotState' then
    if jsonb_typeof(session_state->'whotState'->'players') <> 'array' then return false; end if;
    whot_index := coalesce((session_state->'whotState'->>'currentPlayerIndex')::integer, 0);
    active_player := public.decked_session_player_at(session_state->'whotState', whot_index);
    return active_player = p_actor;
  end if;

  -- Setup/non-game screens are host-controlled. During gameplay, retain
  -- compatibility for games whose detailed actions are still handled by their
  -- existing dedicated RPC or legacy shared screen.
  if current_step = '' or current_step not in (
    'game','gameplay','getReady','didTheyGetIt','pointsGained','whoLaughed',
    'livesRemaining','winner','write','guess','reveal','answer','vote','done'
  ) then return false; end if;
  return true;
end;
$$;

create or replace function public.decked_set_session_value(p_room_id uuid, p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms;
begin
  if char_length(p_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.id is null or target.status not in ('lobby','playing') then raise exception 'This room is not active.'; end if;
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  if not public.decked_session_write_allowed(target, p_key, auth.uid()) then raise exception 'You cannot change this game state.'; end if;
  update public.decked_rooms set
    game_state = jsonb_set(jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', case when jsonb_typeof(game_state->'session') = 'object' then game_state->'session' else '{}'::jsonb end, true), array['session', p_key], coalesce(p_value, 'null'::jsonb), true),
    version = version + 1
  where id = p_room_id;
end;
$$;

create or replace function public.decked_set_session_values(p_room_id uuid, p_values jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms; session_key text; session_key_count integer;
begin
  if jsonb_typeof(p_values) <> 'object' then raise exception 'Invalid state update.'; end if;
  select count(*) into session_key_count from jsonb_object_keys(p_values);
  if session_key_count = 0 or session_key_count > 32 then raise exception 'Invalid state update.'; end if;
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.id is null or target.status not in ('lobby','playing') then raise exception 'This room is not active.'; end if;
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  for session_key in select jsonb_object_keys(p_values) loop
    if char_length(session_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
    if not public.decked_session_write_allowed(target, session_key, auth.uid()) then raise exception 'You cannot change this game state.'; end if;
  end loop;
  update public.decked_rooms set
    game_state = jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', case when jsonb_typeof(game_state->'session') = 'object' then (game_state->'session') || p_values else p_values end, true),
    version = version + 1
  where id = p_room_id;
end;
$$;

revoke all on function public.decked_session_player_at(jsonb, integer) from public, anon, authenticated;

revoke all on function public.decked_session_write_allowed(public.decked_rooms, text, uuid) from public, anon, authenticated;

grant execute on function public.decked_session_player_at(jsonb, integer) to service_role;

grant execute on function public.decked_session_write_allowed(public.decked_rooms, text, uuid) to service_role;

revoke execute on function public.decked_set_session_value(uuid, text, jsonb) from public, anon;

revoke execute on function public.decked_set_session_values(uuid, jsonb) from public, anon;

grant execute on function public.decked_set_session_value(uuid, text, jsonb) to authenticated;

grant execute on function public.decked_set_session_values(uuid, jsonb) to authenticated;
