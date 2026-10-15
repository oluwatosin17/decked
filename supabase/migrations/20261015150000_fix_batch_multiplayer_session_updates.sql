-- PostgreSQL provides jsonb_array_length but not jsonb_object_length.
-- Count keys explicitly so batched multiplayer progression works in production.
create or replace function public.decked_set_session_values(p_room_id uuid, p_values jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  session_key text;
  session_key_count integer;
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then
    raise exception 'You are not in this room.';
  end if;
  if jsonb_typeof(p_values) <> 'object' then
    raise exception 'Invalid state update.';
  end if;

  select count(*) into session_key_count from jsonb_object_keys(p_values);
  if session_key_count = 0 or session_key_count > 32 then
    raise exception 'Invalid state update.';
  end if;

  for session_key in select jsonb_object_keys(p_values)
  loop
    if char_length(session_key) not between 1 and 64 then
      raise exception 'Invalid state key.';
    end if;
  end loop;

  update public.decked_rooms set
    game_state = jsonb_set(
      coalesce(game_state, '{}'::jsonb),
      '{session}',
      case
        when jsonb_typeof(game_state->'session') = 'object' then (game_state->'session') || p_values
        else p_values
      end,
      true
    ),
    version = version + 1
  where id = p_room_id and status in ('lobby','playing');
end;
$$;

revoke execute on function public.decked_set_session_values(uuid, jsonb) from public, anon;
grant execute on function public.decked_set_session_values(uuid, jsonb) to authenticated;
