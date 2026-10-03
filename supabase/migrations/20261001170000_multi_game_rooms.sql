alter table public.decked_rooms drop constraint if exists decked_rooms_game_id_check;
alter table public.decked_rooms
  add column if not exists deck_size integer not null default 10,
  add column if not exists deck_count integer not null default 1,
  add column if not exists game_state jsonb not null default '{}'::jsonb;

create or replace function public.decked_create_room(p_display_name text, p_game_id text default 'truth-or-dare')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  new_room public.decked_rooms;
  supported constant text[] := array[
    'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks',
    'dinner-table','icebreaker','everyday-conversation','reconnect',
    'red-flag-green-flag','charades'
  ];
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
  if not (p_game_id = any(supported)) then raise exception 'This game is not available for Play Together yet.'; end if;
  insert into public.decked_rooms(code, host_user_id, game_id)
  values (public.decked_generate_room_code(), uid, p_game_id) returning * into new_room;
  insert into public.decked_room_players(room_id, user_id, display_name, color, position)
  values (new_room.id, uid, trim(p_display_name), '#dc2827', 0);
  return public.decked_room_payload(new_room.id);
end;
$$;

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
    game_state = jsonb_build_object('used', '[]'::jsonb, 'revealed', false, 'answers', '{}'::jsonb, 'settings', coalesce(p_settings, '{}'::jsonb), 'session', '{}'::jsonb),
    version = version + 1
  where id = p_room_id;
end;
$$;

create or replace function public.decked_reveal_multi_card(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.decked_rooms;
  current_uid uuid;
  selected_index integer;
  used_indexes integer[];
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.status <> 'playing' or coalesce((target.game_state->>'revealed')::boolean, false) then raise exception 'This card is already revealed.'; end if;
  select user_id into current_uid from public.decked_room_players where room_id = p_room_id order by position offset target.current_player_index limit 1;
  if auth.uid() not in (target.host_user_id, current_uid) then raise exception 'Only the current player or host can reveal this card.'; end if;
  select coalesce(array_agg(value::integer), '{}') into used_indexes from jsonb_array_elements_text(coalesce(target.game_state->'used', '[]'::jsonb));
  loop
    selected_index := floor(random() * target.deck_count)::integer;
    exit when not (selected_index = any(used_indexes));
  end loop;
  update public.decked_rooms set prompt_index = selected_index,
    game_state = jsonb_set(jsonb_set(jsonb_set(game_state, '{revealed}', 'true'::jsonb), '{answers}', '{}'::jsonb), '{used}', to_jsonb(array_append(used_indexes, selected_index))),
    version = version + 1 where id = p_room_id;
end;
$$;

create or replace function public.decked_submit_multi_answer(p_room_id uuid, p_answer text)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms; member public.decked_room_players;
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  select * into member from public.decked_room_players where room_id = p_room_id and user_id = auth.uid();
  if member.id is null then raise exception 'You are not in this room.'; end if;
  if target.status <> 'playing' or not coalesce((target.game_state->>'revealed')::boolean, false) then raise exception 'Reveal the card first.'; end if;
  if target.game_id = 'never-have-i-ever' and p_answer not in ('have','never') then raise exception 'Choose I have or Never.'; end if;
  if target.game_id = 'red-flag-green-flag' and p_answer not in ('red','depends','green') then raise exception 'Choose a flag.'; end if;
  if target.game_id not in ('never-have-i-ever','red-flag-green-flag') then raise exception 'This game does not collect answers.'; end if;
  if target.game_state->'answers' ? auth.uid()::text then raise exception 'You already answered this card.'; end if;
  update public.decked_rooms set game_state = jsonb_set(game_state, array['answers', auth.uid()::text], to_jsonb(p_answer), true), version = version + 1 where id = p_room_id;
  if target.game_id = 'never-have-i-ever' and p_answer = 'have' then
    update public.decked_room_players set score = score + 1 where id = member.id;
  end if;
end;
$$;

create or replace function public.decked_advance_multi_game(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms; player_count integer; current_uid uuid; answer_count integer;
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.status <> 'playing' or not coalesce((target.game_state->>'revealed')::boolean, false) then raise exception 'Reveal the current card first.'; end if;
  select count(*) into player_count from public.decked_room_players where room_id = p_room_id;
  select user_id into current_uid from public.decked_room_players where room_id = p_room_id order by position offset target.current_player_index limit 1;
  if auth.uid() not in (target.host_user_id, current_uid) then raise exception 'Only the current player or host can continue.'; end if;
  if target.game_id in ('never-have-i-ever','red-flag-green-flag') then
    select count(*) into answer_count from jsonb_object_keys(coalesce(target.game_state->'answers', '{}'::jsonb));
    if answer_count < player_count then raise exception 'Wait for every player to answer.'; end if;
  end if;
  if target.card_index + 1 >= target.total_cards then
    update public.decked_rooms set status = 'finished', version = version + 1 where id = p_room_id;
  else
    update public.decked_rooms set card_index = card_index + 1,
      current_player_index = (current_player_index + 1) % player_count, prompt_index = null,
      game_state = jsonb_set(jsonb_set(game_state, '{revealed}', 'false'::jsonb), '{answers}', '{}'::jsonb),
      version = version + 1 where id = p_room_id;
  end if;
end;
$$;

revoke execute on function public.decked_create_room(text, text) from public, anon;
revoke execute on function public.decked_start_multi_game(uuid, integer, integer, jsonb) from public, anon;
revoke execute on function public.decked_reveal_multi_card(uuid) from public, anon;
revoke execute on function public.decked_submit_multi_answer(uuid, text) from public, anon;
revoke execute on function public.decked_advance_multi_game(uuid) from public, anon;
grant execute on function public.decked_create_room(text, text) to authenticated;
grant execute on function public.decked_start_multi_game(uuid, integer, integer, jsonb) to authenticated;
grant execute on function public.decked_reveal_multi_card(uuid) to authenticated;
grant execute on function public.decked_submit_multi_answer(uuid, text) to authenticated;
grant execute on function public.decked_advance_multi_game(uuid) to authenticated;
