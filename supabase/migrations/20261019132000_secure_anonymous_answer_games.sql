-- Recovered from the linked project's Supabase migration history.

-- Opaque-answer subsystem for Who Said That? and Bad Advice Only.
-- Browser clients may receive answer text after collection, but never the
-- answer->author mapping until the game-specific reveal operation allows it.

create table public.decked_anonymous_rounds(
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  epoch integer not null,
  round_number integer not null check(round_number>=0),
  game_id text not null check(game_id in('who-said-that','bad-advice-only')),
  phase text not null default 'collecting' check(phase in('collecting','board','revealed')),
  eligible_user_ids uuid[] not null,
  judge_user_id uuid,
  winning_answer_id uuid,
  created_at timestamptz not null default now(),
  primary key(room_id,epoch,round_number)
);
create table public.decked_anonymous_answers(
  room_id uuid not null, epoch integer not null, round_number integer not null,
  answer_id uuid not null default gen_random_uuid(), user_id uuid not null references auth.users(id),
  answer_text text not null check(char_length(answer_text) between 1 and 220), mutation_id uuid not null,
  revealed_at timestamptz,
  primary key(room_id,epoch,round_number,user_id), unique(room_id,epoch,answer_id), unique(room_id,mutation_id),
  foreign key(room_id,epoch,round_number) references public.decked_anonymous_rounds on delete cascade
);
create table public.decked_anonymous_guesses(
  room_id uuid not null, epoch integer not null, round_number integer not null,
  answer_id uuid not null, voter_user_id uuid not null references auth.users(id),
  guessed_user_id uuid not null references auth.users(id), mutation_id uuid not null,
  primary key(room_id,epoch,round_number,answer_id,voter_user_id), unique(room_id,mutation_id),
  foreign key(room_id,epoch,answer_id) references public.decked_anonymous_answers(room_id,epoch,answer_id) on delete cascade
);
alter table public.decked_anonymous_rounds enable row level security;
alter table public.decked_anonymous_answers enable row level security;
alter table public.decked_anonymous_guesses enable row level security;
revoke all on public.decked_anonymous_rounds,public.decked_anonymous_answers,public.decked_anonymous_guesses from public,anon,authenticated;

create or replace function public.decked_begin_anonymous_round(p_room_id uuid,p_round integer)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; member_ids uuid[]; judge_id uuid;
begin
  target:=public.decked_assert_secure_room(p_room_id);
  if target.host_user_id<>auth.uid() then raise exception 'Only the host can begin this round.'; end if;
  if target.game_id not in('who-said-that','bad-advice-only') then raise exception 'Wrong game for anonymous answers.'; end if;
  select array_agg(user_id order by position) into member_ids from public.decked_room_players where room_id=target.id;
  if target.game_id='bad-advice-only' then
    select user_id into judge_id from public.decked_room_players where room_id=target.id order by position offset (p_round%array_length(member_ids,1)) limit 1;
    member_ids:=array_remove(member_ids,judge_id);
  end if;
  insert into public.decked_anonymous_rounds(room_id,epoch,round_number,game_id,eligible_user_ids,judge_user_id)
  values(target.id,target.private_state_epoch,p_round,target.game_id,member_ids,judge_id)
  on conflict do nothing;
end;$$;

create or replace function public.decked_submit_anonymous_answer(p_room_id uuid,p_round integer,p_answer text,p_mutation_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; round_state public.decked_anonymous_rounds; prior public.decked_anonymous_answers; submitted integer;
begin
  target:=public.decked_assert_secure_room(p_room_id);
  select * into round_state from public.decked_anonymous_rounds where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round for update;
  if round_state.room_id is null or round_state.phase<>'collecting' then raise exception 'Answers are not open.'; end if;
  if not auth.uid()=any(round_state.eligible_user_ids) then raise exception 'You are not eligible to answer.'; end if;
  if char_length(trim(p_answer)) not between 1 and 220 then raise exception 'Invalid answer.'; end if;
  select * into prior from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and user_id=auth.uid();
  if prior.room_id is not null then
    if prior.mutation_id=p_mutation_id and prior.answer_text=trim(p_answer) then return jsonb_build_object('accepted',true,'idempotent',true); end if;
    raise exception 'An answer is already locked for this player.';
  end if;
  insert into public.decked_anonymous_answers(room_id,epoch,round_number,user_id,answer_text,mutation_id)
  values(target.id,target.private_state_epoch,p_round,auth.uid(),trim(p_answer),p_mutation_id);
  select count(*) into submitted from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
  if submitted=array_length(round_state.eligible_user_ids,1) then
    update public.decked_anonymous_rounds set phase='board' where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
  end if;
  update public.decked_rooms set version=version+1 where id=target.id;
  return jsonb_build_object('accepted',true,'idempotent',false);
end;$$;

create or replace function public.decked_get_anonymous_round(p_room_id uuid,p_round integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target public.decked_rooms; round_state public.decked_anonymous_rounds; submitted integer; own_id uuid; board jsonb; revealed jsonb; winner jsonb; own_guesses jsonb; guess_counts jsonb;
begin
  target:=public.decked_assert_secure_room(p_room_id);
  select * into round_state from public.decked_anonymous_rounds where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
  if round_state.room_id is null then return null; end if;
  select count(*) into submitted from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
  select answer_id into own_id from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and user_id=auth.uid();
  if round_state.phase in('board','revealed') and (round_state.game_id='who-said-that' or auth.uid()=round_state.judge_user_id or round_state.phase='revealed') then
    select coalesce(jsonb_agg(jsonb_build_object('answer_id',answer_id,'text',answer_text) order by answer_id),'[]') into board
    from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
  else board:='[]'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'answer_id',a.answer_id,
    'author_user_id',a.user_id,
    'guesses',coalesce((select jsonb_object_agg(g.voter_user_id::text,g.guessed_user_id::text)
      from public.decked_anonymous_guesses g where g.room_id=a.room_id and g.epoch=a.epoch and g.answer_id=a.answer_id),'{}'::jsonb)
  ) order by a.answer_id),'[]'::jsonb) into revealed
  from public.decked_anonymous_answers a
  where a.room_id=target.id and a.epoch=target.private_state_epoch and a.round_number=p_round and a.revealed_at is not null;
  if round_state.winning_answer_id is not null then
    select jsonb_build_object('answer_id',a.answer_id,'author_user_id',a.user_id) into winner
    from public.decked_anonymous_answers a where a.room_id=target.id and a.epoch=target.private_state_epoch and a.answer_id=round_state.winning_answer_id;
  end if;
  select coalesce(jsonb_object_agg(answer_id::text,guessed_user_id::text),'{}'::jsonb) into own_guesses
  from public.decked_anonymous_guesses where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and voter_user_id=auth.uid();
  select coalesce(jsonb_object_agg(answer_id::text,total),'{}'::jsonb) into guess_counts from (
    select answer_id,count(*) total from public.decked_anonymous_guesses
    where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round group by answer_id
  ) counted;
  return jsonb_build_object('epoch',round_state.epoch,'round_number',round_state.round_number,'phase',round_state.phase,'answer_count',submitted,'expected_count',array_length(round_state.eligible_user_ids,1),
    'has_answered',own_id is not null,'own_answer_id',own_id,'judge_user_id',round_state.judge_user_id,'answers',board,
    'revealed_answers',revealed,'winner',winner,'own_guesses',own_guesses,'guess_counts',guess_counts);
end;$$;

create or replace function public.decked_submit_anonymous_guess(p_room_id uuid,p_round integer,p_answer_id uuid,p_guessed_user_id uuid,p_mutation_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; answer_row public.decked_anonymous_answers; prior public.decked_anonymous_guesses;
begin
  target:=public.decked_assert_secure_room(p_room_id);
  if target.game_id<>'who-said-that' then raise exception 'Guesses are not supported for this game.'; end if;
  select * into answer_row from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and answer_id=p_answer_id;
  if answer_row.room_id is null or answer_row.revealed_at is not null then raise exception 'This answer is not open for guesses.'; end if;
  if answer_row.user_id=auth.uid() then raise exception 'Authors cannot guess their own answer.'; end if;
  if not public.decked_is_room_member(target.id,p_guessed_user_id) then raise exception 'Invalid guessed player.'; end if;
  select * into prior from public.decked_anonymous_guesses where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and answer_id=p_answer_id and voter_user_id=auth.uid();
  if prior.room_id is not null then
    if prior.mutation_id=p_mutation_id and prior.guessed_user_id=p_guessed_user_id then return; end if;
    raise exception 'A guess is already locked for this player.';
  end if;
  insert into public.decked_anonymous_guesses values(target.id,target.private_state_epoch,p_round,p_answer_id,auth.uid(),p_guessed_user_id,p_mutation_id);
  update public.decked_rooms set version=version+1 where id=target.id;
end;$$;

create or replace function public.decked_reveal_anonymous_answer(p_room_id uuid,p_round integer,p_answer_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; answer_row public.decked_anonymous_answers; expected integer; submitted integer; guesses jsonb;
begin
  target:=public.decked_assert_secure_room(p_room_id);
  if target.game_id<>'who-said-that' or target.host_user_id<>auth.uid() then raise exception 'Only the host can reveal this answer.'; end if;
  select * into answer_row from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and answer_id=p_answer_id for update;
  if answer_row.room_id is null then raise exception 'Answer not found.'; end if;
  select count(*)-1 into expected from public.decked_room_players where room_id=target.id;
  select count(*) into submitted from public.decked_anonymous_guesses where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and answer_id=p_answer_id;
  if submitted<>expected then raise exception 'Not every eligible player has guessed.'; end if;
  update public.decked_anonymous_answers set revealed_at=coalesce(revealed_at,now()) where room_id=target.id and epoch=target.private_state_epoch and answer_id=p_answer_id;
  select coalesce(jsonb_object_agg(voter_user_id::text,guessed_user_id::text),'{}') into guesses from public.decked_anonymous_guesses where room_id=target.id and epoch=target.private_state_epoch and answer_id=p_answer_id;
  update public.decked_rooms set version=version+1 where id=target.id;
  return jsonb_build_object('answer_id',p_answer_id,'author_user_id',answer_row.user_id,'guesses',guesses);
end;$$;

create or replace function public.decked_choose_bad_advice_winner(p_room_id uuid,p_round integer,p_answer_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; round_state public.decked_anonymous_rounds; answer_row public.decked_anonymous_answers;
begin
  target:=public.decked_assert_secure_room(p_room_id);
  if target.game_id<>'bad-advice-only' then raise exception 'Wrong game.'; end if;
  select * into round_state from public.decked_anonymous_rounds where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round for update;
  if round_state.judge_user_id<>auth.uid() then raise exception 'Only the judge can choose the winning answer.'; end if;
  select * into answer_row from public.decked_anonymous_answers where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and answer_id=p_answer_id;
  if answer_row.room_id is null then raise exception 'Answer not found.'; end if;
  if round_state.phase='revealed' then
    if round_state.winning_answer_id=p_answer_id then return jsonb_build_object('answer_id',answer_row.answer_id,'author_user_id',answer_row.user_id,'idempotent',true); end if;
    raise exception 'A winning answer is already locked.';
  end if;
  update public.decked_anonymous_rounds set phase='revealed',winning_answer_id=p_answer_id where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
  update public.decked_anonymous_answers set revealed_at=now() where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and answer_id=p_answer_id;
  update public.decked_rooms set version=version+1 where id=target.id;
  return jsonb_build_object('answer_id',answer_row.answer_id,'author_user_id',answer_row.user_id);
end;$$;

revoke all on function public.decked_begin_anonymous_round(uuid,integer),public.decked_submit_anonymous_answer(uuid,integer,text,uuid),public.decked_get_anonymous_round(uuid,integer),public.decked_submit_anonymous_guess(uuid,integer,uuid,uuid,uuid),public.decked_reveal_anonymous_answer(uuid,integer,uuid),public.decked_choose_bad_advice_winner(uuid,integer,uuid) from public,anon;
grant execute on function public.decked_begin_anonymous_round(uuid,integer),public.decked_submit_anonymous_answer(uuid,integer,text,uuid),public.decked_get_anonymous_round(uuid,integer),public.decked_submit_anonymous_guess(uuid,integer,uuid,uuid,uuid),public.decked_reveal_anonymous_answer(uuid,integer,uuid),public.decked_choose_bad_advice_winner(uuid,integer,uuid) to authenticated;
