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

create or replace function public.decked_start_multi_game(
  p_room_id uuid,
  p_total_cards integer,
  p_deck_count integer,
  p_settings jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = '' as $$
declare player_count integer;
begin
  if p_total_cards not between 1 and 50 then raise exception 'Choose between 1 and 50 cards.'; end if;
  if p_deck_count < 1 then raise exception 'This deck is empty.'; end if;
  if not exists (select 1 from public.decked_rooms where id = p_room_id and host_user_id = auth.uid() and status = 'lobby') then
    raise exception 'Only the host can start this room.';
  end if;
  select count(*) into player_count from public.decked_room_players where room_id = p_room_id;
  if player_count < 2 then raise exception 'At least two players are required.'; end if;
  update public.decked_room_players set score = 0 where room_id = p_room_id;
  update public.decked_rooms set
    status = 'playing', total_cards = least(p_total_cards, p_deck_count), deck_size = least(p_total_cards, p_deck_count),
    deck_count = p_deck_count, card_index = 0, current_player_index = 0,
    prompt_type = null, prompt_index = null,
    game_state = jsonb_build_object(
      'used', '[]'::jsonb,
      'revealed', false,
      'answers', '{}'::jsonb,
      'settings', coalesce(p_settings, '{}'::jsonb),
      'session', '{}'::jsonb
    ),
    version = version + 1
  where id = p_room_id;
end;
$$;

revoke execute on function public.decked_start_multi_game(uuid, integer, integer, jsonb) from public, anon;
grant execute on function public.decked_start_multi_game(uuid, integer, integer, jsonb) to authenticated;
