-- Keep the multiplayer case catalogue aligned with the client and allow the
-- authored alternate solution for each case. The suffix is intentionally
-- strict so arbitrary case ids cannot be stored in a room.
create or replace function public.decked_start_mini_mystery(p_room_id uuid,p_case_id text,p_rounds integer)
returns void language plpgsql security definer set search_path='' as $$
declare
  target public.decked_rooms;
  player_count integer;
  selected_culprit uuid;
  next_game integer;
  base_case_id text;
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.game_id<>'mini-mystery' then raise exception 'This room is not playing Mini Mystery.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start Mini Mystery.'; end if;

  base_case_id:=regexp_replace(p_case_id,'--remix$','');
  if base_case_id not in (
    'phone-that-could-ruin-everyone','vanished-crypto-wallet','engagement-ring-came-back',
    'deepfake-confession','cancelled-at-midnight','final-interview',
    'guest-never-checked-out','last-seen-217','live-after-vanished',
    'smart-home-lockdown','wrong-person-drank-it','crash-already-online',
    'bride-never-arrived','bishops-announcement','harvest-offering','reunion-broadcast',
    'reading-of-will','cooperative-payout','last-bus-enugu','grooms-second-ring',
    'senators-empty-coffin','missing-afrobeats-star'
  ) or p_case_id not in (base_case_id,base_case_id||'--remix') then raise exception 'Choose a valid mystery case.'; end if;
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

revoke execute on function public.decked_start_mini_mystery(uuid,text,integer) from public,anon;
grant execute on function public.decked_start_mini_mystery(uuid,text,integer) to authenticated;
