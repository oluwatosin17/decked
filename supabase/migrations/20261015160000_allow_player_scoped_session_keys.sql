-- Player-scoped vote keys include a round token and the voter's UUID. The
-- previous 64-character cap rejected valid votes from real game sessions.
create or replace function public.decked_set_session_value(p_room_id uuid, p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  if char_length(p_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
  update public.decked_rooms set
    game_state = jsonb_set(jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', case when jsonb_typeof(game_state->'session') = 'object' then game_state->'session' else '{}'::jsonb end, true), array['session', p_key], coalesce(p_value, 'null'::jsonb), true),
    version = version + 1
  where id = p_room_id and status in ('lobby','playing');
end;
$$;

create or replace function public.decked_set_session_values(p_room_id uuid, p_values jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare session_key text; session_key_count integer;
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  if jsonb_typeof(p_values) <> 'object' then raise exception 'Invalid state update.'; end if;
  select count(*) into session_key_count from jsonb_object_keys(p_values);
  if session_key_count = 0 or session_key_count > 32 then raise exception 'Invalid state update.'; end if;
  for session_key in select jsonb_object_keys(p_values) loop
    if char_length(session_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
  end loop;
  update public.decked_rooms set
    game_state = jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', case when jsonb_typeof(game_state->'session') = 'object' then (game_state->'session') || p_values else p_values end, true),
    version = version + 1
  where id = p_room_id and status in ('lobby','playing');
end;
$$;

revoke execute on function public.decked_set_session_value(uuid, text, jsonb) from public, anon;
revoke execute on function public.decked_set_session_values(uuid, jsonb) from public, anon;
grant execute on function public.decked_set_session_value(uuid, text, jsonb) to authenticated;
grant execute on function public.decked_set_session_values(uuid, jsonb) to authenticated;
