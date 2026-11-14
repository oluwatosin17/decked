-- Recovered from the linked project's Supabase migration history.

-- Atomically reveal the paired Two Truths protected rounds and expose one
-- caller-authorized, all-or-nothing post-reveal projection.

create or replace function public.decked_get_two_truths_reveal_state(
  p_room_id uuid,
  p_bluff_scope text,
  p_guess_scope text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target public.decked_rooms;
  bluff_round public.decked_private_rounds;
  guess_round public.decked_private_rounds;
  bluff_values jsonb;
  guess_values jsonb;
  ready boolean;
begin
  target := public.decked_assert_secure_room(p_room_id);
  if target.game_id <> 'two-truths-bluff' then raise exception 'This projection is only available for Two Truths and a Bluff.'; end if;
  if p_bluff_scope !~ '^bluff:' or p_guess_scope !~ '^guess:'
     or substring(p_bluff_scope from 7) <> substring(p_guess_scope from 7) then
    raise exception 'The protected reveal scopes do not describe the same round.';
  end if;

  select * into bluff_round from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_bluff_scope;
  select * into guess_round from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_guess_scope;
  if bluff_round.room_id is null or guess_round.room_id is null
     or bluff_round.game_id <> target.game_id or guess_round.game_id <> target.game_id
     or bluff_round.submission_kind <> 'bluff' or guess_round.submission_kind <> 'guess' then
    raise exception 'The protected reveal rounds are unavailable.';
  end if;

  ready := bluff_round.phase='revealed' and guess_round.phase='revealed';
  if ready then
    select coalesce(jsonb_object_agg(user_id::text,payload),'{}'::jsonb) into bluff_values
    from public.decked_private_submissions
    where room_id=target.id and epoch=target.private_state_epoch and scope=p_bluff_scope;
    select coalesce(jsonb_object_agg(user_id::text,payload),'{}'::jsonb) into guess_values
    from public.decked_private_submissions
    where room_id=target.id and epoch=target.private_state_epoch and scope=p_guess_scope;
  end if;

  return jsonb_build_object(
    'epoch',target.private_state_epoch,
    'bluff_scope',p_bluff_scope,
    'guess_scope',p_guess_scope,
    'revealed',ready,
    'bluff_values',case when ready then bluff_values else null end,
    'guess_values',case when ready then guess_values else null end
  );
end;
$$;

create or replace function public.decked_reveal_two_truths_round(
  p_room_id uuid,
  p_bluff_scope text,
  p_guess_scope text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.decked_rooms;
  bluff_round public.decked_private_rounds;
  guess_round public.decked_private_rounds;
  bluff_count integer;
  guess_count integer;
begin
  target := public.decked_assert_secure_room(p_room_id);
  if target.game_id <> 'two-truths-bluff' then raise exception 'This reveal is only available for Two Truths and a Bluff.'; end if;
  if target.host_user_id <> auth.uid() then raise exception 'Only the host can reveal private submissions.'; end if;
  if p_bluff_scope !~ '^bluff:' or p_guess_scope !~ '^guess:'
     or substring(p_bluff_scope from 7) <> substring(p_guess_scope from 7) then
    raise exception 'The protected reveal scopes do not describe the same round.';
  end if;

  select * into bluff_round from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_bluff_scope for update;
  select * into guess_round from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_guess_scope for update;
  if bluff_round.room_id is null or guess_round.room_id is null
     or bluff_round.game_id <> target.game_id or guess_round.game_id <> target.game_id
     or bluff_round.submission_kind <> 'bluff' or guess_round.submission_kind <> 'guess' then
    raise exception 'The protected reveal rounds are unavailable.';
  end if;

  select count(*) into bluff_count from public.decked_private_submissions
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_bluff_scope;
  select count(*) into guess_count from public.decked_private_submissions
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_guess_scope;
  if bluff_count <> bluff_round.expected_submissions or guess_count <> guess_round.expected_submissions then
    raise exception 'Not every eligible player has submitted.';
  end if;

  update public.decked_private_rounds
  set phase='revealed',revealed_at=coalesce(revealed_at,now())
  where room_id=target.id and epoch=target.private_state_epoch and scope in (p_bluff_scope,p_guess_scope);
  update public.decked_rooms set version=version+1 where id=target.id;
  return public.decked_get_two_truths_reveal_state(target.id,p_bluff_scope,p_guess_scope);
end;
$$;

revoke all on function public.decked_get_two_truths_reveal_state(uuid,text,text) from public,anon;
revoke all on function public.decked_reveal_two_truths_round(uuid,text,text) from public,anon;
grant execute on function public.decked_get_two_truths_reveal_state(uuid,text,text) to authenticated;
grant execute on function public.decked_reveal_two_truths_round(uuid,text,text) to authenticated;
