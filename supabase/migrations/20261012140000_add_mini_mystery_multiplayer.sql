-- Mini Mystery keeps private roles and ballots outside decked_rooms.game_state.
-- The state RPC exposes only the caller's assignment until the public reveal.
create table if not exists public.decked_mini_mystery_games (
  room_id uuid primary key references public.decked_rooms(id) on delete cascade,
  game_number integer not null default 1,
  case_id text not null check (case_id in ('blackout-ball','last-toast','vanishing-reel','museum-after-midnight','poisoned-pitch','ruined-wedding','missing-violinist','empty-cabin','vanished-chef','midnight-express','lighthouse-signal','final-curtain','owambe-envelope','nollywood-master','detty-december-headliner','abuja-sealed-file')),
  phase text not null check (phase in ('role_reveal','opening','objective','discussion','evidence','voting','reveal','results')),
  round_number integer not null default 1 check (round_number between 1 and 4),
  rounds integer not null check (rounds between 2 and 4),
  reveal_beat integer not null default 0 check (reveal_beat between 0 and 2),
  culprit_user_id uuid not null references auth.users(id) on delete cascade,
  accused_user_id uuid references auth.users(id) on delete set null,
  group_won boolean,
  updated_at timestamptz not null default now()
);

create table if not exists public.decked_mini_mystery_assignments (
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_index integer not null check (role_index between 0 and 7),
  ready boolean not null default false,
  primary key (room_id,user_id),
  unique (room_id,role_index)
);

create table if not exists public.decked_mini_mystery_votes (
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id,voter_user_id),
  check (voter_user_id <> target_user_id)
);

alter table public.decked_mini_mystery_games enable row level security;
alter table public.decked_mini_mystery_assignments enable row level security;
alter table public.decked_mini_mystery_votes enable row level security;
revoke all on public.decked_mini_mystery_games from public,anon,authenticated;
revoke all on public.decked_mini_mystery_assignments from public,anon,authenticated;
revoke all on public.decked_mini_mystery_votes from public,anon,authenticated;

create or replace function public.decked_start_mini_mystery(p_room_id uuid,p_case_id text,p_rounds integer)
returns void language plpgsql security definer set search_path='' as $$
declare
  target public.decked_rooms;
  player_count integer;
  selected_culprit uuid;
  next_game integer;
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.game_id<>'mini-mystery' then raise exception 'This room is not playing Mini Mystery.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start Mini Mystery.'; end if;
  if p_case_id not in ('blackout-ball','last-toast','vanishing-reel','museum-after-midnight','poisoned-pitch','ruined-wedding','missing-violinist','empty-cabin','vanished-chef','midnight-express','lighthouse-signal','final-curtain','owambe-envelope','nollywood-master','detty-december-headliner','abuja-sealed-file') then raise exception 'Choose a valid mystery case.'; end if;
  if p_rounds not between 2 and 4 then raise exception 'Choose between 2 and 4 rounds.'; end if;
  if target.status='playing' and not exists(select 1 from public.decked_mini_mystery_games where room_id=p_room_id and phase='results') then raise exception 'The current case is still in progress.'; end if;
  select count(*) into player_count from public.decked_room_players where room_id=p_room_id;
  if player_count not between 4 and 8 then raise exception 'Mini Mystery needs between 4 and 8 players.'; end if;
  select coalesce(game_number,0)+1 into next_game from public.decked_mini_mystery_games where room_id=p_room_id;
  next_game:=coalesce(next_game,1);

  delete from public.decked_mini_mystery_votes where room_id=p_room_id;
  delete from public.decked_mini_mystery_assignments where room_id=p_room_id;
  insert into public.decked_mini_mystery_assignments(room_id,user_id,role_index)
  select p_room_id,user_id,(row_number() over(order by random())-1)::integer from public.decked_room_players where room_id=p_room_id;
  select user_id into selected_culprit from public.decked_mini_mystery_assignments where room_id=p_room_id and role_index=0;
  insert into public.decked_mini_mystery_games(room_id,game_number,case_id,phase,round_number,rounds,reveal_beat,culprit_user_id,accused_user_id,group_won,updated_at)
  values(p_room_id,next_game,p_case_id,'role_reveal',1,p_rounds,0,selected_culprit,null,null,now())
  on conflict(room_id) do update set game_number=excluded.game_number,case_id=excluded.case_id,phase='role_reveal',round_number=1,rounds=excluded.rounds,reveal_beat=0,culprit_user_id=excluded.culprit_user_id,accused_user_id=null,group_won=null,updated_at=now();
  update public.decked_rooms set status='playing',version=version+1 where id=p_room_id;
end;
$$;

create or replace function public.decked_get_mini_mystery_state(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare
  uid uuid:=auth.uid();
  game public.decked_mini_mystery_games;
  assignment public.decked_mini_mystery_assignments;
  ready_total integer;
  vote_total integer;
  has_voted boolean;
  culprit_name text;
  accused_name text;
  counts jsonb:='{}'::jsonb;
begin
  if not public.decked_is_room_member(p_room_id,uid) then raise exception 'You are not in this room.'; end if;
  select * into game from public.decked_mini_mystery_games where room_id=p_room_id;
  if game.room_id is null then raise exception 'This Mini Mystery case has not started.'; end if;
  select * into assignment from public.decked_mini_mystery_assignments where room_id=p_room_id and user_id=uid;
  select count(*) into ready_total from public.decked_mini_mystery_assignments where room_id=p_room_id and ready;
  select count(*) into vote_total from public.decked_mini_mystery_votes where room_id=p_room_id;
  select exists(select 1 from public.decked_mini_mystery_votes where room_id=p_room_id and voter_user_id=uid) into has_voted;
  if game.phase='results' then
    select display_name into culprit_name from public.decked_room_players where room_id=p_room_id and user_id=game.culprit_user_id;
    select display_name into accused_name from public.decked_room_players where room_id=p_room_id and user_id=game.accused_user_id;
    select coalesce(jsonb_object_agg(p.user_id::text,coalesce(v.total,0)),'{}'::jsonb) into counts
    from public.decked_room_players p left join (select mv.target_user_id,count(*) total from public.decked_mini_mystery_votes mv where mv.room_id=p_room_id group by mv.target_user_id) v on v.target_user_id=p.user_id
    where p.room_id=p_room_id;
  end if;
  return jsonb_build_object('phase',game.phase,'game_number',game.game_number,'case_id',game.case_id,'round_number',game.round_number,'rounds',game.rounds,'reveal_beat',game.reveal_beat,'role_index',assignment.role_index,'ready',assignment.ready,'ready_count',ready_total,'has_voted',has_voted,'vote_count',vote_total,'culprit_name',culprit_name,'accused_name',accused_name,'group_won',case when game.phase='results' then game.group_won else null end,'vote_counts',counts);
end;
$$;

create or replace function public.decked_mini_mystery_ready(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare game public.decked_mini_mystery_games; total integer; ready_total integer;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into game from public.decked_mini_mystery_games where room_id=p_room_id for update;
  if game.phase not in ('role_reveal','objective') then raise exception 'There is no private card to confirm.'; end if;
  update public.decked_mini_mystery_assignments set ready=true where room_id=p_room_id and user_id=auth.uid();
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  select count(*) into ready_total from public.decked_mini_mystery_assignments where room_id=p_room_id and ready;
  if ready_total=total then
    update public.decked_mini_mystery_games set phase=case when game.phase='role_reveal' then 'opening' else 'discussion' end,updated_at=now() where room_id=p_room_id;
  end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;
$$;

create or replace function public.decked_mini_mystery_advance(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare game public.decked_mini_mystery_games;
begin
  if not exists(select 1 from public.decked_rooms where id=p_room_id and host_user_id=auth.uid()) then raise exception 'Only the host can continue.'; end if;
  select * into game from public.decked_mini_mystery_games where room_id=p_room_id for update;
  if game.phase='opening' then
    update public.decked_mini_mystery_assignments set ready=false where room_id=p_room_id;
    update public.decked_mini_mystery_games set phase='objective',updated_at=now() where room_id=p_room_id;
  elsif game.phase='discussion' then
    update public.decked_mini_mystery_games set phase='evidence',updated_at=now() where room_id=p_room_id;
  elsif game.phase='evidence' and game.round_number<game.rounds then
    update public.decked_mini_mystery_assignments set ready=false where room_id=p_room_id;
    update public.decked_mini_mystery_games set phase='objective',round_number=round_number+1,updated_at=now() where room_id=p_room_id;
  elsif game.phase='evidence' then
    update public.decked_mini_mystery_games set phase='voting',updated_at=now() where room_id=p_room_id;
  elsif game.phase='reveal' and game.reveal_beat<2 then
    update public.decked_mini_mystery_games set reveal_beat=reveal_beat+1,updated_at=now() where room_id=p_room_id;
  elsif game.phase='reveal' then
    update public.decked_mini_mystery_games set phase='results',updated_at=now() where room_id=p_room_id;
  else raise exception 'The case cannot advance from this phase.';
  end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;
$$;

create or replace function public.decked_mini_mystery_vote(p_room_id uuid,p_target_user_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare total integer; vote_total integer; accused uuid; actual_culprit uuid;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) or not public.decked_is_room_member(p_room_id,p_target_user_id) then raise exception 'Choose a player in this room.'; end if;
  if auth.uid()=p_target_user_id then raise exception 'You cannot accuse yourself.'; end if;
  if not exists(select 1 from public.decked_mini_mystery_games where room_id=p_room_id and phase='voting') then raise exception 'Accusations are not open.'; end if;
  insert into public.decked_mini_mystery_votes(room_id,voter_user_id,target_user_id) values(p_room_id,auth.uid(),p_target_user_id) on conflict(room_id,voter_user_id) do nothing;
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  select count(*) into vote_total from public.decked_mini_mystery_votes where room_id=p_room_id;
  if vote_total=total then
    select v.target_user_id into accused from public.decked_mini_mystery_votes v join public.decked_room_players p on p.room_id=v.room_id and p.user_id=v.target_user_id where v.room_id=p_room_id group by v.target_user_id,p.position order by count(*) desc,p.position asc limit 1;
    select culprit_user_id into actual_culprit from public.decked_mini_mystery_games where room_id=p_room_id;
    update public.decked_mini_mystery_games set phase='reveal',reveal_beat=0,accused_user_id=accused,group_won=(accused=actual_culprit),updated_at=now() where room_id=p_room_id;
  end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;
$$;

revoke execute on function public.decked_start_mini_mystery(uuid,text,integer) from public,anon;
revoke execute on function public.decked_get_mini_mystery_state(uuid) from public,anon;
revoke execute on function public.decked_mini_mystery_ready(uuid) from public,anon;
revoke execute on function public.decked_mini_mystery_advance(uuid) from public,anon;
revoke execute on function public.decked_mini_mystery_vote(uuid,uuid) from public,anon;
grant execute on function public.decked_start_mini_mystery(uuid,text,integer) to authenticated;
grant execute on function public.decked_get_mini_mystery_state(uuid) to authenticated;
grant execute on function public.decked_mini_mystery_ready(uuid) to authenticated;
grant execute on function public.decked_mini_mystery_advance(uuid) to authenticated;
grant execute on function public.decked_mini_mystery_vote(uuid,uuid) to authenticated;

create or replace function public.decked_create_room(p_display_name text,p_game_id text default 'truth-or-dare')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); new_room public.decked_rooms;
supported constant text[]:=array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery'];
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
alter table public.analytics_events add constraint analytics_events_game_id_check check(game_id is null or game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery'));
alter table public.analytics_game_sessions drop constraint if exists analytics_game_sessions_game_id_check;
alter table public.analytics_game_sessions add constraint analytics_game_sessions_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery'));
alter table public.analytics_room_facts drop constraint if exists analytics_room_facts_game_id_check;
alter table public.analytics_room_facts add constraint analytics_room_facts_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery'));
alter table public.analytics_daily_aggregates drop constraint if exists analytics_daily_aggregates_game_id_check;
alter table public.analytics_daily_aggregates add constraint analytics_daily_aggregates_game_id_check check(game_id is null or game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery'));
