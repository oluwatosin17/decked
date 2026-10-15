-- Let the host choose one server-owned answer window for every multiplayer device.
alter table public.decked_think_fast_games
  add column if not exists answer_seconds integer not null default 7 check(answer_seconds between 3 and 60);

drop function if exists public.decked_start_think_fast(uuid,text[]);
create or replace function public.decked_start_think_fast(p_room_id uuid,p_prompts text[],p_answer_seconds integer default 7)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; total integer; clean text[];
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.game_id<>'think-fast' then raise exception 'This room is not playing Think Fast.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start the game.'; end if;
  if p_answer_seconds not between 3 and 60 then raise exception 'Choose 3 to 60 seconds.'; end if;
  select array_agg(trim(item)) into clean from unnest(p_prompts) item where char_length(trim(item)) between 4 and 180;
  if coalesce(array_length(clean,1),0) not between 1 and 60 then raise exception 'Choose 1 to 60 valid prompts.'; end if;
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  if total not between 2 and 12 then raise exception 'Think Fast needs 2 to 12 players.'; end if;
  delete from public.decked_think_fast_scores where room_id=p_room_id;
  delete from public.decked_think_fast_votes where room_id=p_room_id;
  insert into public.decked_think_fast_scores(room_id,user_id) select p_room_id,user_id from public.decked_room_players where room_id=p_room_id;
  insert into public.decked_think_fast_games(room_id,phase,prompts,round_number,rounds,attempt_number,buzzer_user_id,locked_user_ids,answer_seconds)
  values(p_room_id,'thinking',clean,1,array_length(clean,1),1,null,'{}',p_answer_seconds)
  on conflict(room_id) do update set phase='thinking',prompts=excluded.prompts,round_number=1,rounds=excluded.rounds,attempt_number=1,buzzer_user_id=null,locked_user_ids='{}',answer_seconds=excluded.answer_seconds,updated_at=now();
  update public.decked_rooms set status='playing',version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_get_think_fast_state(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare g public.decked_think_fast_games; votes integer; voted boolean; score_json jsonb:='{}'; deadline timestamptz;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into g from public.decked_think_fast_games where room_id=p_room_id;
  if g.room_id is null then raise exception 'This game has not started.'; end if;
  select count(*) into votes from public.decked_think_fast_votes where room_id=p_room_id and round_number=g.round_number and attempt_number=g.attempt_number;
  select exists(select 1 from public.decked_think_fast_votes where room_id=p_room_id and round_number=g.round_number and attempt_number=g.attempt_number and user_id=auth.uid()) into voted;
  select coalesce(jsonb_object_agg(user_id::text,score),'{}') into score_json from public.decked_think_fast_scores where room_id=p_room_id;
  deadline:=case when g.phase='answering' then g.updated_at+make_interval(secs=>g.answer_seconds) else null end;
  return jsonb_build_object('phase',g.phase,'round_number',g.round_number,'rounds',g.rounds,'prompt',g.prompts[g.round_number],'attempt_number',g.attempt_number,'buzzer_user_id',g.buzzer_user_id,'locked_user_ids',g.locked_user_ids,'has_voted',voted,'vote_count',votes,'scores',score_json,'answer_seconds',g.answer_seconds,'answer_deadline',deadline);
end;$$;

revoke execute on function public.decked_start_think_fast(uuid,text[],integer) from public,anon;
grant execute on function public.decked_start_think_fast(uuid,text[],integer),public.decked_get_think_fast_state(uuid) to authenticated;
