-- Recovered from the linked project's Supabase migration history.

-- Restart dedicated multiplayer games in the same room without changing their
-- configured rules, prompts, scoring rules, or player order.
create or replace function public.decked_restart_do_you_know_me(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; g public.decked_know_me_games; first_player uuid;
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.game_id<>'do-you-know-me' then raise exception 'This room is not playing Do You Know Me?.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can restart the game.'; end if;
  select * into g from public.decked_know_me_games where room_id=p_room_id for update;
  if g.room_id is null or g.phase<>'results' then raise exception 'Finish the current game before restarting.'; end if;
  select user_id into first_player from public.decked_room_players where room_id=p_room_id order by position limit 1;
  delete from public.decked_know_me_answers where room_id=p_room_id;
  delete from public.decked_know_me_scores where room_id=p_room_id;
  insert into public.decked_know_me_scores(room_id,user_id) select p_room_id,user_id from public.decked_room_players where room_id=p_room_id;
  update public.decked_know_me_games set game_number=game_number+1,phase='answering',round_number=1,spotlight_user_id=first_player,updated_at=now() where room_id=p_room_id;
  update public.decked_rooms set status='playing',rematch_requests='{}',version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_restart_think_fast(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; g public.decked_think_fast_games;
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.game_id<>'think-fast' then raise exception 'This room is not playing Think Fast.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can restart the game.'; end if;
  select * into g from public.decked_think_fast_games where room_id=p_room_id for update;
  if g.room_id is null or g.phase<>'results' then raise exception 'Finish the current game before restarting.'; end if;
  delete from public.decked_think_fast_votes where room_id=p_room_id;
  delete from public.decked_think_fast_scores where room_id=p_room_id;
  insert into public.decked_think_fast_scores(room_id,user_id) select p_room_id,user_id from public.decked_room_players where room_id=p_room_id;
  update public.decked_think_fast_games set phase='thinking',round_number=1,attempt_number=1,buzzer_user_id=null,locked_user_ids='{}',updated_at=now() where room_id=p_room_id;
  update public.decked_rooms set status='playing',rematch_requests='{}',version=version+1 where id=p_room_id;
end;$$;

revoke execute on function public.decked_restart_do_you_know_me(uuid),public.decked_restart_think_fast(uuid) from public,anon;

grant execute on function public.decked_restart_do_you_know_me(uuid),public.decked_restart_think_fast(uuid) to authenticated;
