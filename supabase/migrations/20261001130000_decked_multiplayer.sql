create extension if not exists pgcrypto;

create table if not exists public.decked_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  game_id text not null default 'truth-or-dare' check (game_id = 'truth-or-dare'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  current_player_index integer not null default 0 check (current_player_index >= 0),
  card_index integer not null default 0 check (card_index >= 0),
  total_cards integer not null default 10 check (total_cards between 1 and 50),
  truth_deck_size integer not null default 1 check (truth_deck_size between 1 and 500),
  dare_deck_size integer not null default 1 check (dare_deck_size between 1 and 500),
  prompt_type text check (prompt_type in ('truth', 'dare')),
  prompt_index integer,
  used_truth_indexes integer[] not null default '{}',
  used_dare_indexes integer[] not null default '{}',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.decked_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  color text not null default '#dc2827',
  position integer not null check (position >= 0),
  score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, position)
);

create index if not exists decked_rooms_code_idx on public.decked_rooms(code);
create index if not exists decked_room_players_room_idx on public.decked_room_players(room_id, position);

alter table public.decked_rooms enable row level security;
alter table public.decked_room_players enable row level security;

create or replace function public.decked_is_room_member(p_room_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.decked_room_players
    where room_id = p_room_id and user_id = p_user_id
  );
$$;

drop policy if exists "decked members read rooms" on public.decked_rooms;
create policy "decked members read rooms" on public.decked_rooms
for select to authenticated using (public.decked_is_room_member(id));

drop policy if exists "decked members read players" on public.decked_room_players;
create policy "decked members read players" on public.decked_room_players
for select to authenticated using (public.decked_is_room_member(room_id));

revoke all on public.decked_rooms from anon, authenticated;
revoke all on public.decked_room_players from anon, authenticated;
grant select on public.decked_rooms to authenticated;
grant select on public.decked_room_players to authenticated;

create or replace function public.decked_room_payload(p_room_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'room', to_jsonb(r),
    'players', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.position)
      from public.decked_room_players p where p.room_id = r.id
    ), '[]'::jsonb)
  )
  from public.decked_rooms r where r.id = p_room_id;
$$;

create or replace function public.decked_generate_room_code()
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1), '')
      into candidate from generate_series(1, 6);
    exit when not exists (select 1 from public.decked_rooms where code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.decked_create_room(p_display_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  new_room public.decked_rooms;
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
  insert into public.decked_rooms(code, host_user_id)
  values (public.decked_generate_room_code(), uid) returning * into new_room;
  insert into public.decked_room_players(room_id, user_id, display_name, color, position)
  values (new_room.id, uid, trim(p_display_name), '#dc2827', 0);
  return public.decked_room_payload(new_room.id);
end;
$$;

create or replace function public.decked_join_room(p_code text, p_display_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  target public.decked_rooms;
  next_position integer;
  colors constant text[] := array['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63'];
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
  select * into target from public.decked_rooms where code = upper(trim(p_code)) and expires_at > now() for update;
  if target.id is null then raise exception 'Room not found or expired.'; end if;
  if target.status <> 'lobby' then raise exception 'This game has already started.'; end if;
  select coalesce(max(position) + 1, 0) into next_position from public.decked_room_players where room_id = target.id;
  if next_position >= 8 then raise exception 'This room is full.'; end if;
  insert into public.decked_room_players(room_id, user_id, display_name, color, position)
  values (target.id, uid, trim(p_display_name), colors[1 + (next_position % array_length(colors, 1))], next_position)
  on conflict (room_id, user_id) do update set display_name = excluded.display_name;
  return public.decked_room_payload(target.id);
end;
$$;

create or replace function public.decked_start_room(p_room_id uuid, p_total_cards integer, p_truth_count integer, p_dare_count integer)
returns void language plpgsql security definer set search_path = '' as $$
declare player_count integer;
begin
  if p_total_cards not between 1 and 50 then raise exception 'Choose between 1 and 50 cards.'; end if;
  if p_truth_count not between 1 and 500 or p_dare_count not between 1 and 500 then raise exception 'Invalid deck configuration.'; end if;
  if not exists (select 1 from public.decked_rooms where id = p_room_id and host_user_id = auth.uid() and status = 'lobby') then raise exception 'Only the host can start this room.'; end if;
  select count(*) into player_count from public.decked_room_players where room_id = p_room_id;
  if player_count < 2 then raise exception 'At least two players are required.'; end if;
  update public.decked_rooms set status = 'playing', total_cards = p_total_cards, card_index = 0,
    current_player_index = 0, prompt_type = null, prompt_index = null, truth_deck_size = p_truth_count, dare_deck_size = p_dare_count,
    used_truth_indexes = '{}', used_dare_indexes = '{}', version = version + 1
  where id = p_room_id;
end;
$$;

create or replace function public.decked_choose_prompt(p_room_id uuid, p_prompt_type text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.decked_rooms;
  current_uid uuid;
  selected_index integer;
  deck_size integer;
  used_indexes integer[];
begin
  if p_prompt_type not in ('truth', 'dare') then raise exception 'Choose Truth or Dare.'; end if;
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.status <> 'playing' or target.prompt_type is not null then raise exception 'This turn is not waiting for a choice.'; end if;
  select user_id into current_uid from public.decked_room_players where room_id = p_room_id order by position offset target.current_player_index limit 1;
  if current_uid is distinct from auth.uid() then raise exception 'Only the current player can choose.'; end if;
  deck_size := case when p_prompt_type = 'truth' then target.truth_deck_size else target.dare_deck_size end;
  used_indexes := case when p_prompt_type = 'truth' then target.used_truth_indexes else target.used_dare_indexes end;
  if coalesce(array_length(used_indexes, 1), 0) >= deck_size then used_indexes := '{}'; end if;
  loop
    selected_index := floor(random() * deck_size)::integer;
    exit when not (selected_index = any(used_indexes));
  end loop;
  update public.decked_rooms set prompt_type = p_prompt_type, prompt_index = selected_index,
    used_truth_indexes = case when p_prompt_type = 'truth' then array_append(used_indexes, selected_index) else used_truth_indexes end,
    used_dare_indexes = case when p_prompt_type = 'dare' then array_append(used_indexes, selected_index) else used_dare_indexes end,
    version = version + 1 where id = p_room_id;
end;
$$;

create or replace function public.decked_advance_turn(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.decked_rooms;
  player_count integer;
  current_uid uuid;
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.status <> 'playing' or target.prompt_type is null then raise exception 'There is no completed turn to advance.'; end if;
  select count(*) into player_count from public.decked_room_players where room_id = p_room_id;
  select user_id into current_uid from public.decked_room_players where room_id = p_room_id order by position offset target.current_player_index limit 1;
  if auth.uid() not in (target.host_user_id, current_uid) then raise exception 'Only the current player or host can advance.'; end if;
  if target.card_index + 1 >= target.total_cards then
    update public.decked_rooms set status = 'finished', version = version + 1 where id = p_room_id;
  else
    update public.decked_rooms set card_index = card_index + 1,
      current_player_index = (current_player_index + 1) % player_count,
      prompt_type = null, prompt_index = null, version = version + 1 where id = p_room_id;
  end if;
end;
$$;

revoke execute on function public.decked_is_room_member(uuid, uuid) from public, anon;
revoke execute on function public.decked_room_payload(uuid) from public, anon;
revoke execute on function public.decked_generate_room_code() from public, anon, authenticated;
revoke execute on function public.decked_create_room(text) from public, anon;
revoke execute on function public.decked_join_room(text, text) from public, anon;
revoke execute on function public.decked_start_room(uuid, integer, integer, integer) from public, anon;
revoke execute on function public.decked_choose_prompt(uuid, text) from public, anon;
revoke execute on function public.decked_advance_turn(uuid) from public, anon;
grant execute on function public.decked_is_room_member(uuid, uuid) to authenticated;
grant execute on function public.decked_create_room(text) to authenticated;
grant execute on function public.decked_join_room(text, text) to authenticated;
grant execute on function public.decked_start_room(uuid, integer, integer, integer) to authenticated;
grant execute on function public.decked_choose_prompt(uuid, text) to authenticated;
grant execute on function public.decked_advance_turn(uuid) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.decked_rooms;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.decked_room_players;
exception when duplicate_object then null;
end $$;
