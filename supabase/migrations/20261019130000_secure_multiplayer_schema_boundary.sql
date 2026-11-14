-- Recovered from the linked project's Supabase migration history.

-- Establish a non-destructive security boundary between rooms whose shared
-- JSON may contain secrets and rooms created for the protected-state model.
-- Existing rows remain unchanged and retain their normal expiry policy.

alter table public.decked_rooms
  add column if not exists multiplayer_schema_version smallint not null default 1;

alter table public.decked_rooms
  drop constraint if exists decked_rooms_multiplayer_schema_version_check;
alter table public.decked_rooms
  add constraint decked_rooms_multiplayer_schema_version_check
  check (multiplayer_schema_version between 1 and 2);

create or replace function public.decked_game_requires_secure_state(p_game_id text)
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
  select p_game_id = any(array[
    'red-flag-green-flag','most-likely-to','choose-your-side',
    'two-truths-bluff','who-said-that','bad-advice-only',
    'whot','not-me-your-honour'
  ]);
$$;

create or replace function public.decked_assign_multiplayer_schema_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.decked_game_requires_secure_state(new.game_id) then
    new.multiplayer_schema_version := 2;
  end if;
  return new;
end;
$$;

drop trigger if exists decked_assign_multiplayer_schema_version on public.decked_rooms;
create trigger decked_assign_multiplayer_schema_version
before insert on public.decked_rooms
for each row execute function public.decked_assign_multiplayer_schema_version();

create or replace function public.decked_room_is_client_compatible(p_room public.decked_rooms)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not public.decked_game_requires_secure_state(p_room.game_id)
    or p_room.multiplayer_schema_version >= 2;
$$;

create or replace function public.decked_assert_secure_room(p_room_id uuid)
returns public.decked_rooms
language plpgsql
stable
security definer
set search_path = ''
as $$
declare target public.decked_rooms;
begin
  select * into target from public.decked_rooms where id = p_room_id;
  if target.id is null then raise exception 'Room not found or expired.'; end if;
  if not public.decked_is_room_member(target.id, auth.uid()) then
    raise exception 'You are not in this room.';
  end if;
  if not public.decked_room_is_client_compatible(target) then
    raise exception using
      errcode = 'P0001',
      message = 'This room uses an older multiplayer version. Create a new room to continue securely.';
  end if;
  return target;
end;
$$;

-- Even an old v1 browser must not be able to put concealed values back into
-- the shared JSON of a v2 room. Empty cleanup writes remain compatible.
create or replace function public.decked_secure_session_value_allowed(p_room public.decked_rooms,p_key text,p_value jsonb)
returns boolean language plpgsql immutable security definer set search_path='' as $$
declare empty_value boolean:=p_value is null or p_value='null'::jsonb or p_value='{}'::jsonb or p_value='[]'::jsonb or p_value='""'::jsonb;
begin
 if p_room.multiplayer_schema_version<2 or not public.decked_game_requires_secure_state(p_room.game_id) then return true; end if;
 if p_key like 'mltVote-%' or p_key like 'cysVote-%' or p_key like 'ttbVote-%' or p_key like 'wstAnswer-%' or p_key like 'wstGuess-%' then return empty_value; end if;
 if p_key=any(array['votes','answers','bluffId','winnerId','whotState','court_responsible_account','court_votes','court_ballots']) then return empty_value; end if;
 return true;
end$$;

drop policy if exists "decked members read rooms" on public.decked_rooms;
drop policy if exists "decked members read compatible rooms" on public.decked_rooms;
create policy "decked members read compatible rooms" on public.decked_rooms
for select to authenticated using (
  public.decked_is_room_member(id)
  and public.decked_room_is_client_compatible(decked_rooms)
);

-- SECURITY DEFINER payloads must apply the same boundary as direct SELECT and
-- Realtime RLS. Joining a legacy affected room rolls back when this raises.
create or replace function public.decked_room_payload(p_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare target public.decked_rooms;
begin
  target := public.decked_assert_secure_room(p_room_id);
  return jsonb_build_object(
    'room', to_jsonb(target),
    'players', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.position)
      from public.decked_room_players p where p.room_id = target.id
    ), '[]'::jsonb)
  );
end;
$$;

-- Old clients can otherwise keep mutating an affected v1 room through these
-- SECURITY DEFINER functions even though SELECT/Realtime is denied.
create or replace function public.decked_set_session_value(p_room_id uuid, p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms;
begin
  if char_length(p_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
  target := public.decked_assert_secure_room(p_room_id);
  if target.status not in ('lobby','playing') then raise exception 'This room is not active.'; end if;
  if not public.decked_secure_session_value_allowed(target,p_key,p_value) then raise exception 'Private game data must use the protected-state RPC.'; end if;
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
  target := public.decked_assert_secure_room(p_room_id);
  if target.status not in ('lobby','playing') then raise exception 'This room is not active.'; end if;
  for session_key in select jsonb_object_keys(p_values) loop
    if char_length(session_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
    if not public.decked_secure_session_value_allowed(target,session_key,p_values->session_key) then raise exception 'Private game data must use the protected-state RPC.'; end if;
    if not public.decked_session_write_allowed(target, session_key, auth.uid()) then raise exception 'You cannot change this game state.'; end if;
  end loop;
  update public.decked_rooms set
    game_state = jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', case when jsonb_typeof(game_state->'session') = 'object' then (game_state->'session') || p_values else p_values end, true),
    version = version + 1
  where id = p_room_id;
end;
$$;

revoke all on function public.decked_game_requires_secure_state(text) from public,anon,authenticated;
revoke all on function public.decked_room_is_client_compatible(public.decked_rooms) from public,anon,authenticated;
revoke all on function public.decked_assert_secure_room(uuid) from public,anon,authenticated;
revoke all on function public.decked_secure_session_value_allowed(public.decked_rooms,text,jsonb) from public,anon,authenticated;
grant execute on function public.decked_game_requires_secure_state(text) to service_role;
grant execute on function public.decked_room_is_client_compatible(public.decked_rooms) to service_role;
grant execute on function public.decked_assert_secure_room(uuid) to service_role;
grant execute on function public.decked_secure_session_value_allowed(public.decked_rooms,text,jsonb) to service_role;
-- The SELECT policy invokes this boolean predicate as the authenticated role.
-- Its SECURITY DEFINER body exposes no row data.
grant execute on function public.decked_room_is_client_compatible(public.decked_rooms) to authenticated;
revoke execute on function public.decked_set_session_value(uuid,text,jsonb) from public,anon;
revoke execute on function public.decked_set_session_values(uuid,jsonb) from public,anon;
grant execute on function public.decked_set_session_value(uuid,text,jsonb) to authenticated;
grant execute on function public.decked_set_session_values(uuid,jsonb) to authenticated;
