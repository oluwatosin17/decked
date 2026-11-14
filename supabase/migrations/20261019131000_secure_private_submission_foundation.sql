-- Recovered from the linked project's Supabase migration history.

-- Protected-state foundation for multiplayer games with private submissions.
-- No private table is selectable or published to browser roles. Realtime room
-- updates contain only a version bump; caller projections come from RPCs.

alter table public.decked_rooms
  add column if not exists private_state_epoch integer not null default 1
  check (private_state_epoch > 0);

create table if not exists public.decked_private_rounds (
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  epoch integer not null check (epoch > 0),
  scope text not null check (scope ~ '^[a-z0-9][a-z0-9:_-]{0,95}$'),
  game_id text not null,
  submission_kind text not null check (submission_kind ~ '^[a-z][a-z0-9_-]{0,31}$'),
  phase text not null default 'collecting' check (phase in ('collecting','revealed')),
  expected_submissions integer not null check (expected_submissions between 1 and 8),
  eligible_user_ids uuid[] not null,
  revealed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (room_id, epoch, scope)
);

create table if not exists public.decked_private_submissions (
  room_id uuid not null,
  epoch integer not null,
  scope text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (room_id, epoch, scope, user_id),
  unique (room_id, mutation_id),
  foreign key (room_id, epoch, scope)
    references public.decked_private_rounds(room_id, epoch, scope) on delete cascade,
  check (jsonb_typeof(payload) in ('object','string','number','boolean')),
  check (octet_length(payload::text) <= 4096)
);

create index if not exists decked_private_submissions_scope_idx
  on public.decked_private_submissions(room_id, epoch, scope);

alter table public.decked_private_rounds enable row level security;
alter table public.decked_private_submissions enable row level security;
revoke all on public.decked_private_rounds from public,anon,authenticated;
revoke all on public.decked_private_submissions from public,anon,authenticated;

create or replace function public.decked_begin_private_round(
  p_room_id uuid,
  p_scope text,
  p_submission_kind text,
  p_expected_submissions integer,
  p_eligible_user_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare target public.decked_rooms; existing public.decked_private_rounds;
begin
  target := public.decked_assert_secure_room(p_room_id);
  if target.host_user_id <> auth.uid() then raise exception 'Only the host can begin a private round.'; end if;
  if target.status not in ('lobby','playing') or target.multiplayer_schema_version < 2 then raise exception 'This room is not active.'; end if;
  if not public.decked_game_requires_secure_state(target.game_id) then raise exception 'This game does not use protected submissions.'; end if;
  if p_scope !~ '^[a-z0-9][a-z0-9:_-]{0,95}$' then raise exception 'Invalid private-state scope.'; end if;
  if p_submission_kind !~ '^[a-z][a-z0-9_-]{0,31}$' then raise exception 'Invalid submission kind.'; end if;
  if p_expected_submissions not between 1 and 8 then raise exception 'Invalid expected submission count.'; end if;
  if coalesce(array_length(p_eligible_user_ids,1),0)<>p_expected_submissions
     or (select count(distinct user_id) from unnest(p_eligible_user_ids) as eligible(user_id))<>p_expected_submissions
     or exists(select 1 from unnest(p_eligible_user_ids) as eligible(user_id) where not public.decked_is_room_member(target.id,user_id)) then
    raise exception 'Eligible submitters must be distinct room members.';
  end if;

  insert into public.decked_private_rounds(room_id,epoch,scope,game_id,submission_kind,expected_submissions,eligible_user_ids)
  values(target.id,target.private_state_epoch,p_scope,target.game_id,p_submission_kind,p_expected_submissions,p_eligible_user_ids)
  on conflict(room_id,epoch,scope) do nothing;

  select * into existing from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
  if existing.game_id<>target.game_id or existing.submission_kind<>p_submission_kind
     or existing.expected_submissions<>p_expected_submissions or existing.eligible_user_ids<>p_eligible_user_ids then
    raise exception 'Private round already exists with different rules.';
  end if;
  return jsonb_build_object('epoch',existing.epoch,'scope',existing.scope,'phase',existing.phase,
    'expected_submissions',existing.expected_submissions);
end;
$$;

create or replace function public.decked_submit_private_value(
  p_room_id uuid,
  p_scope text,
  p_payload jsonb,
  p_mutation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare target public.decked_rooms; private_round public.decked_private_rounds;
  prior public.decked_private_submissions; submitted integer;
begin
  target := public.decked_assert_secure_room(p_room_id);
  select * into private_round from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope for update;
  if private_round.room_id is null then raise exception 'Private round not found.'; end if;
  if private_round.phase<>'collecting' then raise exception 'Submissions are closed.'; end if;
  if not auth.uid()=any(private_round.eligible_user_ids) then raise exception 'You are not eligible to submit in this round.'; end if;
  if p_payload is null or jsonb_typeof(p_payload) not in ('object','string','number','boolean')
     or octet_length(p_payload::text)>4096 then raise exception 'Invalid private submission.'; end if;

  select * into prior from public.decked_private_submissions
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope and user_id=auth.uid();
  if prior.room_id is not null then
    if prior.mutation_id=p_mutation_id and prior.payload=p_payload then
      select count(*) into submitted from public.decked_private_submissions
      where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
      return jsonb_build_object('accepted',true,'idempotent',true,'submitted_count',submitted);
    end if;
    raise exception 'A submission is already locked for this player.';
  end if;

  insert into public.decked_private_submissions(room_id,epoch,scope,user_id,mutation_id,payload)
  values(target.id,target.private_state_epoch,p_scope,auth.uid(),p_mutation_id,p_payload);
  select count(*) into submitted from public.decked_private_submissions
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
  update public.decked_rooms set version=version+1 where id=target.id;
  return jsonb_build_object('accepted',true,'idempotent',false,'submitted_count',submitted);
end;
$$;

create or replace function public.decked_get_private_round_state(p_room_id uuid,p_scope text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare target public.decked_rooms; private_round public.decked_private_rounds;
  own_payload jsonb; submitted integer; revealed_values jsonb;
begin
  target := public.decked_assert_secure_room(p_room_id);
  select * into private_round from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
  if private_round.room_id is null then return null; end if;
  select payload into own_payload from public.decked_private_submissions
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope and user_id=auth.uid();
  select count(*) into submitted from public.decked_private_submissions
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
  if private_round.phase='revealed' then
    select coalesce(jsonb_object_agg(user_id::text,payload),'{}'::jsonb) into revealed_values
    from public.decked_private_submissions
    where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
  else revealed_values := null; end if;
  return jsonb_build_object('epoch',private_round.epoch,'scope',private_round.scope,'kind',private_round.submission_kind,
    'phase',private_round.phase,'expected_submissions',private_round.expected_submissions,
    'submitted_count',submitted,'has_submitted',own_payload is not null,'own_payload',own_payload,
    'revealed_values',revealed_values);
end;
$$;

create or replace function public.decked_reveal_private_round(p_room_id uuid,p_scope text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare target public.decked_rooms; private_round public.decked_private_rounds; submitted integer;
begin
  target := public.decked_assert_secure_room(p_room_id);
  if target.host_user_id<>auth.uid() then raise exception 'Only the host can reveal private submissions.'; end if;
  select * into private_round from public.decked_private_rounds
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope for update;
  if private_round.room_id is null then raise exception 'Private round not found.'; end if;
  select count(*) into submitted from public.decked_private_submissions
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
  if submitted<>private_round.expected_submissions then raise exception 'Not every eligible player has submitted.'; end if;
  update public.decked_private_rounds set phase='revealed',revealed_at=coalesce(revealed_at,now())
  where room_id=target.id and epoch=target.private_state_epoch and scope=p_scope;
  update public.decked_rooms set version=version+1 where id=target.id;
  return public.decked_get_private_round_state(target.id,p_scope);
end;
$$;

create or replace function public.decked_advance_private_epoch(p_room_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare target public.decked_rooms; next_epoch integer;
begin
  target := public.decked_assert_secure_room(p_room_id);
  if target.host_user_id<>auth.uid() then raise exception 'Only the host can start a secure replay.'; end if;
  update public.decked_rooms set private_state_epoch=private_state_epoch+1,version=version+1
  where id=target.id returning private_state_epoch into next_epoch;
  return next_epoch;
end;
$$;

revoke all on function public.decked_begin_private_round(uuid,text,text,integer,uuid[]) from public,anon;
revoke all on function public.decked_submit_private_value(uuid,text,jsonb,uuid) from public,anon;
revoke all on function public.decked_get_private_round_state(uuid,text) from public,anon;
revoke all on function public.decked_reveal_private_round(uuid,text) from public,anon;
revoke all on function public.decked_advance_private_epoch(uuid) from public,anon;
grant execute on function public.decked_begin_private_round(uuid,text,text,integer,uuid[]) to authenticated;
grant execute on function public.decked_submit_private_value(uuid,text,jsonb,uuid) to authenticated;
grant execute on function public.decked_get_private_round_state(uuid,text) to authenticated;
grant execute on function public.decked_reveal_private_round(uuid,text) to authenticated;
grant execute on function public.decked_advance_private_epoch(uuid) to authenticated;
