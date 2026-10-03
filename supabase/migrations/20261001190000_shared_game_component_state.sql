create or replace function public.decked_set_session_value(p_room_id uuid, p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  if char_length(p_key) not between 1 and 64 then raise exception 'Invalid state key.'; end if;
  update public.decked_rooms set
    game_state = jsonb_set(
      jsonb_set(
        coalesce(game_state, '{}'::jsonb),
        '{session}',
        case
          when jsonb_typeof(game_state->'session') = 'object' then game_state->'session'
          else '{}'::jsonb
        end,
        true
      ),
      array['session', p_key],
      coalesce(p_value, 'null'::jsonb),
      true
    ),
    version = version + 1
  where id = p_room_id and status in ('lobby','playing');
end;
$$;

revoke execute on function public.decked_set_session_value(uuid, text, jsonb) from public, anon;
grant execute on function public.decked_set_session_value(uuid, text, jsonb) to authenticated;

create or replace function public.decked_create_room(p_display_name text, p_game_id text default 'truth-or-dare')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); new_room public.decked_rooms;
supported constant text[] := array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink'];
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
  if not (p_game_id = any(supported)) then raise exception 'This game is not available for Play Together.'; end if;
  insert into public.decked_rooms(code, host_user_id, game_id) values (public.decked_generate_room_code(), uid, p_game_id) returning * into new_room;
  insert into public.decked_room_players(room_id,user_id,display_name,color,position) values(new_room.id,uid,trim(p_display_name),'#dc2827',0);
  return public.decked_room_payload(new_room.id);
end; $$;
revoke execute on function public.decked_create_room(text, text) from public, anon;
grant execute on function public.decked_create_room(text, text) to authenticated;
