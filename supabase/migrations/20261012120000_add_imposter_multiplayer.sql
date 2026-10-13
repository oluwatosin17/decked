-- Imposter keeps words, roles, and ballots outside decked_rooms.game_state.
-- Clients can read only their own word through the security-definer state RPC.
create table if not exists public.decked_imposter_games (
  room_id uuid primary key references public.decked_rooms(id) on delete cascade,
  game_number integer not null default 1,
  phase text not null check (phase in ('role_reveal','clue','discussion','voting','results')),
  clue_round integer not null default 1 check (clue_round between 1 and 3),
  turn_index integer not null default 0 check (turn_index >= 0),
  category text not null,
  regular_word text not null,
  imposter_word text not null,
  imposter_user_id uuid not null references auth.users(id) on delete cascade,
  accused_user_id uuid references auth.users(id) on delete set null,
  group_won boolean,
  updated_at timestamptz not null default now()
);

create table if not exists public.decked_imposter_assignments (
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  is_imposter boolean not null default false,
  ready boolean not null default false,
  primary key (room_id, user_id)
);

create table if not exists public.decked_imposter_votes (
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, voter_user_id),
  check (voter_user_id <> target_user_id)
);

alter table public.decked_imposter_games enable row level security;
alter table public.decked_imposter_assignments enable row level security;
alter table public.decked_imposter_votes enable row level security;
revoke all on public.decked_imposter_games from public, anon, authenticated;
revoke all on public.decked_imposter_assignments from public, anon, authenticated;
revoke all on public.decked_imposter_votes from public, anon, authenticated;

create or replace function public.decked_start_imposter(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.decked_rooms;
  player_count integer;
  chosen_imposter uuid;
  pair_index integer;
  categories constant text[] := array['Places','Food','Animals','Travel','Home','Entertainment','Weather','Technology','Celebrations','School','Sports','Drinks'];
  regular_words constant text[] := array['Beach','Pizza','Lion','Airport','Kitchen','Cinema','Rain','Laptop','Wedding','Teacher','Football','Coffee'];
  imposter_words constant text[] := array['Desert','Burger','Tiger','Train station','Bathroom','Theatre','Snow','Tablet','Birthday','Principal','Basketball','Tea'];
  next_game integer;
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.id is null or target.game_id <> 'imposter' then raise exception 'This room is not playing Imposter.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start Imposter.'; end if;
  if target.status = 'finished' then raise exception 'This room has ended.'; end if;
  if target.status = 'playing' and not exists (select 1 from public.decked_imposter_games where room_id = p_room_id and phase = 'results') then
    raise exception 'The current game is still in progress.';
  end if;
  select count(*) into player_count from public.decked_room_players where room_id = p_room_id;
  if player_count not between 3 and 10 then raise exception 'Imposter needs between 3 and 10 players.'; end if;
  select user_id into chosen_imposter from public.decked_room_players where room_id = p_room_id order by random() limit 1;
  pair_index := 1 + floor(random() * array_length(regular_words, 1))::integer;
  select coalesce(game_number, 0) + 1 into next_game from public.decked_imposter_games where room_id = p_room_id;
  next_game := coalesce(next_game, 1);

  delete from public.decked_imposter_votes where room_id = p_room_id;
  delete from public.decked_imposter_assignments where room_id = p_room_id;
  insert into public.decked_imposter_games(room_id,game_number,phase,clue_round,turn_index,category,regular_word,imposter_word,imposter_user_id,accused_user_id,group_won,updated_at)
  values(p_room_id,next_game,'role_reveal',1,0,categories[pair_index],regular_words[pair_index],imposter_words[pair_index],chosen_imposter,null,null,now())
  on conflict (room_id) do update set game_number=excluded.game_number,phase='role_reveal',clue_round=1,turn_index=0,category=excluded.category,regular_word=excluded.regular_word,imposter_word=excluded.imposter_word,imposter_user_id=excluded.imposter_user_id,accused_user_id=null,group_won=null,updated_at=now();
  insert into public.decked_imposter_assignments(room_id,user_id,word,is_imposter)
  select p_room_id,p.user_id,case when p.user_id=chosen_imposter then imposter_words[pair_index] else regular_words[pair_index] end,p.user_id=chosen_imposter
  from public.decked_room_players p where p.room_id=p_room_id;
  update public.decked_rooms set status='playing',version=version+1 where id=p_room_id;
end;
$$;

create or replace function public.decked_get_imposter_state(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare
  uid uuid := auth.uid();
  game public.decked_imposter_games;
  assignment public.decked_imposter_assignments;
  active_uid uuid;
  ready_count integer;
  vote_count integer;
  has_voted boolean;
  imposter_name text;
  accused_name text;
begin
  if not public.decked_is_room_member(p_room_id, uid) then raise exception 'You are not in this room.'; end if;
  select * into game from public.decked_imposter_games where room_id=p_room_id;
  if game.room_id is null then raise exception 'This Imposter game has not started.'; end if;
  select * into assignment from public.decked_imposter_assignments where room_id=p_room_id and user_id=uid;
  select user_id into active_uid from public.decked_room_players where room_id=p_room_id order by position offset game.turn_index limit 1;
  select count(*) into ready_count from public.decked_imposter_assignments where room_id=p_room_id and ready;
  select count(*) into vote_count from public.decked_imposter_votes where room_id=p_room_id;
  select exists(select 1 from public.decked_imposter_votes where room_id=p_room_id and voter_user_id=uid) into has_voted;
  if game.phase='results' then
    select display_name into imposter_name from public.decked_room_players where room_id=p_room_id and user_id=game.imposter_user_id;
    select display_name into accused_name from public.decked_room_players where room_id=p_room_id and user_id=game.accused_user_id;
  end if;
  return jsonb_build_object(
    'phase',game.phase,'game_number',game.game_number,'clue_round',game.clue_round,'turn_index',game.turn_index,
    'active_user_id',case when game.phase='clue' then active_uid else null end,
    'category',game.category,'word',case when game.phase='results' then assignment.word else assignment.word end,
    'ready',assignment.ready,'ready_count',ready_count,'has_voted',has_voted,'vote_count',vote_count,
    'group_won',case when game.phase='results' then game.group_won else null end,
    'imposter_name',imposter_name,'accused_name',accused_name,
    'regular_word',case when game.phase='results' then game.regular_word else null end,
    'imposter_word',case when game.phase='results' then game.imposter_word else null end
  );
end;
$$;

create or replace function public.decked_imposter_ready(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare total integer; ready_total integer;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  if not exists(select 1 from public.decked_imposter_games where room_id=p_room_id and phase='role_reveal') then raise exception 'The reveal phase is over.'; end if;
  update public.decked_imposter_assignments set ready=true where room_id=p_room_id and user_id=auth.uid();
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  select count(*) into ready_total from public.decked_imposter_assignments where room_id=p_room_id and ready;
  if ready_total=total then update public.decked_imposter_games set phase='clue',turn_index=0,updated_at=now() where room_id=p_room_id; end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;
$$;

create or replace function public.decked_imposter_advance_clue(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare game public.decked_imposter_games; target public.decked_rooms; active_uid uuid; total integer;
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  select * into game from public.decked_imposter_games where room_id=p_room_id for update;
  if game.phase<>'clue' then raise exception 'It is not a clue turn.'; end if;
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  select user_id into active_uid from public.decked_room_players where room_id=p_room_id order by position offset game.turn_index limit 1;
  if auth.uid() not in (active_uid,target.host_user_id) then raise exception 'Only the active player or host can advance.'; end if;
  if game.turn_index+1>=total then update public.decked_imposter_games set phase='discussion',updated_at=now() where room_id=p_room_id;
  else update public.decked_imposter_games set turn_index=turn_index+1,updated_at=now() where room_id=p_room_id; end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;
$$;

create or replace function public.decked_imposter_continue(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare game public.decked_imposter_games;
begin
  if not exists(select 1 from public.decked_rooms where id=p_room_id and host_user_id=auth.uid()) then raise exception 'Only the host can continue.'; end if;
  select * into game from public.decked_imposter_games where room_id=p_room_id for update;
  if game.phase<>'discussion' then raise exception 'The group is not discussing.'; end if;
  if game.clue_round<3 then update public.decked_imposter_games set phase='clue',clue_round=clue_round+1,turn_index=0,updated_at=now() where room_id=p_room_id;
  else update public.decked_imposter_games set phase='voting',updated_at=now() where room_id=p_room_id; end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;
$$;

create or replace function public.decked_imposter_vote(p_room_id uuid,p_target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare total integer; vote_total integer; accused uuid; actual_imposter uuid;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) or not public.decked_is_room_member(p_room_id,p_target_user_id) then raise exception 'Choose a player in this room.'; end if;
  if auth.uid()=p_target_user_id then raise exception 'You cannot vote for yourself.'; end if;
  if not exists(select 1 from public.decked_imposter_games where room_id=p_room_id and phase='voting') then raise exception 'Voting is not open.'; end if;
  insert into public.decked_imposter_votes(room_id,voter_user_id,target_user_id) values(p_room_id,auth.uid(),p_target_user_id)
  on conflict (room_id,voter_user_id) do nothing;
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  select count(*) into vote_total from public.decked_imposter_votes where room_id=p_room_id;
  if vote_total=total then
    select v.target_user_id into accused from public.decked_imposter_votes v join public.decked_room_players p on p.room_id=v.room_id and p.user_id=v.target_user_id where v.room_id=p_room_id group by v.target_user_id,p.position order by count(*) desc,p.position asc limit 1;
    select imposter_user_id into actual_imposter from public.decked_imposter_games where room_id=p_room_id;
    update public.decked_imposter_games set phase='results',accused_user_id=accused,group_won=(accused=actual_imposter),updated_at=now() where room_id=p_room_id;
  end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;
$$;

revoke execute on function public.decked_start_imposter(uuid) from public,anon;
revoke execute on function public.decked_get_imposter_state(uuid) from public,anon;
revoke execute on function public.decked_imposter_ready(uuid) from public,anon;
revoke execute on function public.decked_imposter_advance_clue(uuid) from public,anon;
revoke execute on function public.decked_imposter_continue(uuid) from public,anon;
revoke execute on function public.decked_imposter_vote(uuid,uuid) from public,anon;
grant execute on function public.decked_start_imposter(uuid) to authenticated;
grant execute on function public.decked_get_imposter_state(uuid) to authenticated;
grant execute on function public.decked_imposter_ready(uuid) to authenticated;
grant execute on function public.decked_imposter_advance_clue(uuid) to authenticated;
grant execute on function public.decked_imposter_continue(uuid) to authenticated;
grant execute on function public.decked_imposter_vote(uuid,uuid) to authenticated;

-- Add Imposter to room creation without exposing any role assignment to the host.
create or replace function public.decked_create_room(p_display_name text,p_game_id text default 'truth-or-dare')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); new_room public.decked_rooms;
supported constant text[]:=array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter'];
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
  if not(p_game_id=any(supported)) then raise exception 'This game is not available for Play Together.'; end if;
  insert into public.decked_rooms(code,host_user_id,game_id) values(public.decked_generate_room_code(),uid,p_game_id) returning * into new_room;
  insert into public.decked_room_players(room_id,user_id,display_name,color,position) values(new_room.id,uid,trim(p_display_name),'#dc2827',0);
  return public.decked_room_payload(new_room.id);
end;
$$;
revoke execute on function public.decked_create_room(text,text) from public,anon;
grant execute on function public.decked_create_room(text,text) to authenticated;

alter table public.analytics_events drop constraint if exists analytics_events_game_id_check;
alter table public.analytics_events add constraint analytics_events_game_id_check check(game_id is null or game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter'));
alter table public.analytics_game_sessions drop constraint if exists analytics_game_sessions_game_id_check;
alter table public.analytics_game_sessions add constraint analytics_game_sessions_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter'));
alter table public.analytics_room_facts drop constraint if exists analytics_room_facts_game_id_check;
alter table public.analytics_room_facts add constraint analytics_room_facts_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter'));
alter table public.analytics_daily_aggregates drop constraint if exists analytics_daily_aggregates_game_id_check;
alter table public.analytics_daily_aggregates add constraint analytics_daily_aggregates_game_id_check check(game_id is null or game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter'));
