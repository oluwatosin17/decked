-- The private anonymous-answer service chooses a winner, but the Bad Advice
-- shared screen also needs its score and round advanced. Keep both changes in
-- one transaction and let only the current judge invoke this action.
create or replace function public.decked_complete_bad_advice_round(
  p_room_id uuid, p_round integer, p_answer_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target public.decked_rooms;
  session_state jsonb;
  winner jsonb;
  author_id uuid;
  score_state jsonb;
  new_score integer;
  next_state jsonb;
  player_ids uuid[];
  next_judge uuid;
  next_round integer := p_round + 1;
  total_rounds integer;
begin
  if auth.uid() is null then raise exception 'A player session is required.' using errcode = '42501'; end if;
  if p_round is null or p_round not between 0 and 29 or p_answer_id is null then
    raise exception 'Invalid Bad Advice choice.' using errcode = '22023';
  end if;
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.id is null or target.status <> 'playing' or target.game_id <> 'bad-advice-only' then
    raise exception 'Bad Advice is not active.' using errcode = '55000';
  end if;
  if not public.decked_is_room_member(p_room_id, auth.uid()) then
    raise exception 'You are not in this room.' using errcode = '42501';
  end if;
  session_state := coalesce(target.game_state->'session', '{}'::jsonb);
  if session_state->>'step' is distinct from 'reveal'
     or (session_state->>'round')::integer is distinct from p_round
     or jsonb_typeof(session_state->'deck') is distinct from 'array' then
    raise exception 'This round is not ready for judging.' using errcode = '55000';
  end if;
  total_rounds := jsonb_array_length(session_state->'deck');
  if p_round >= total_rounds then raise exception 'Invalid round.' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.decked_anonymous_rounds
    where room_id = p_room_id and epoch = target.private_state_epoch
      and round_number = p_round and phase = 'board'
  ) then raise exception 'Wait for every answer.' using errcode = '55000'; end if;

  -- Existing protected service verifies the judge, answer, private epoch and
  -- one-winner rule. Its idempotent response also supports a retried request.
  winner := public.decked_choose_bad_advice_winner(p_room_id, p_round, p_answer_id);
  author_id := (winner->>'author_user_id')::uuid;
  score_state := case when jsonb_typeof(session_state->'scores') = 'object'
    then session_state->'scores' else '{}'::jsonb end;
  new_score := coalesce((score_state->>author_id::text)::integer, 0) + 1;
  next_state := session_state || jsonb_build_object(
    'scores', jsonb_set(score_state, array[author_id::text], to_jsonb(new_score), true),
    'writerIndex', 0,
    'round', case when next_round >= total_rounds then p_round else next_round end,
    'step', case when next_round >= total_rounds then 'done' else 'answer' end
  );

  if next_round < total_rounds then
    select array_agg(user_id order by position) into player_ids
    from public.decked_room_players where room_id = p_room_id;
    if coalesce(array_length(player_ids, 1), 0) < 3 then
      raise exception 'At least three players are required.' using errcode = '55000';
    end if;
    next_judge := player_ids[1 + next_round % array_length(player_ids, 1)];
    insert into public.decked_anonymous_rounds(
      room_id, epoch, round_number, game_id, eligible_user_ids, judge_user_id
    ) values (
      p_room_id, target.private_state_epoch, next_round, 'bad-advice-only',
      array_remove(player_ids, next_judge), next_judge
    ) on conflict do nothing;
  end if;

  update public.decked_rooms set
    game_state = jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', next_state, true),
    version = version + 1
  where id = p_room_id;
  return jsonb_build_object('author_user_id', author_id, 'round', p_round);
end;
$$;

revoke execute on function public.decked_complete_bad_advice_round(uuid, integer, uuid) from public, anon;
grant execute on function public.decked_complete_bad_advice_round(uuid, integer, uuid) to authenticated;
