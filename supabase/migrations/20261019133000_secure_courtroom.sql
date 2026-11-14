-- Recovered from the linked project's Supabase migration history.

-- Server-owned roles, responsibility and secret ballots for Not Me, Your Honour.
create table public.decked_court_rounds(
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  epoch integer not null, round_number integer not null check(round_number>=0),
  accused_user_id uuid not null references auth.users(id), prosecutor_user_id uuid not null references auth.users(id),
  judge_user_id uuid not null references auth.users(id), responsible boolean not null,
  revealed_at timestamptz, primary key(room_id,epoch,round_number)
);
create table public.decked_court_ballots(
  room_id uuid not null, epoch integer not null, round_number integer not null,
  voter_user_id uuid not null references auth.users(id), verdict text not null check(verdict in('guilty','not-guilty')),
  mutation_id uuid not null, primary key(room_id,epoch,round_number,voter_user_id), unique(room_id,mutation_id),
  foreign key(room_id,epoch,round_number) references public.decked_court_rounds on delete cascade
);
alter table public.decked_court_rounds enable row level security; alter table public.decked_court_ballots enable row level security;
revoke all on public.decked_court_rounds,public.decked_court_ballots from public,anon,authenticated;

create or replace function public.decked_begin_court_round(p_room_id uuid,p_round integer)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; ids uuid[]; inserted integer;
begin
 target:=public.decked_assert_secure_room(p_room_id);
 if target.game_id<>'not-me-your-honour' or target.host_user_id<>auth.uid() then raise exception 'Only the host can begin a courtroom round.'; end if;
 select array_agg(user_id order by position) into ids from public.decked_room_players where room_id=target.id;
 if array_length(ids,1)<3 then raise exception 'At least three players are required.'; end if;
 insert into public.decked_court_rounds values(target.id,target.private_state_epoch,p_round,
   ids[1+(p_round%array_length(ids,1))],ids[1+((p_round+1)%array_length(ids,1))],ids[1+((p_round+2)%array_length(ids,1))],
   (get_byte(extensions.gen_random_bytes(1),0)%2)=1,null) on conflict do nothing;
 get diagnostics inserted = row_count;
 if inserted > 0 then update public.decked_rooms set version=version+1 where id=target.id; end if;
end$$;

create or replace function public.decked_get_court_state(p_room_id uuid,p_round integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target public.decked_rooms; s public.decked_court_rounds; role_name text; my_vote text; tally jsonb; total integer;
begin
 target:=public.decked_assert_secure_room(p_room_id);
 select * into s from public.decked_court_rounds where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
 if s.room_id is null then return null; end if;
 role_name:=case auth.uid() when s.accused_user_id then 'accused' when s.prosecutor_user_id then 'prosecutor' when s.judge_user_id then 'judge' else 'jury' end;
 select verdict into my_vote from public.decked_court_ballots where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and voter_user_id=auth.uid();
 select count(*) into total from public.decked_court_ballots where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
 if s.revealed_at is not null then select jsonb_build_object('guilty',count(*) filter(where verdict='guilty'),'not_guilty',count(*) filter(where verdict='not-guilty')) into tally from public.decked_court_ballots where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round; end if;
 return jsonb_build_object('role',role_name,'responsible',case when auth.uid()=s.accused_user_id or s.revealed_at is not null then s.responsible else null end,
   'accused_user_id',s.accused_user_id,'prosecutor_user_id',s.prosecutor_user_id,'judge_user_id',s.judge_user_id,
   'has_voted',my_vote is not null,'ballot_count',total,'revealed',s.revealed_at is not null,'tally',tally);
end$$;

create or replace function public.decked_submit_court_ballot(p_room_id uuid,p_round integer,p_verdict text,p_mutation_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; s public.decked_court_rounds; prior public.decked_court_ballots;
begin
 target:=public.decked_assert_secure_room(p_room_id);
 select * into s from public.decked_court_rounds where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round for update;
 if s.room_id is null or s.revealed_at is not null then raise exception 'Voting is closed.'; end if;
 if auth.uid() in(s.accused_user_id,s.prosecutor_user_id) then raise exception 'A party to the case cannot vote.'; end if;
 if p_verdict not in('guilty','not-guilty') then raise exception 'Invalid verdict.'; end if;
 select * into prior from public.decked_court_ballots where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round and voter_user_id=auth.uid();
 if prior.room_id is not null then if prior.mutation_id=p_mutation_id and prior.verdict=p_verdict then return; end if; raise exception 'Ballot already locked.'; end if;
 insert into public.decked_court_ballots values(target.id,target.private_state_epoch,p_round,auth.uid(),p_verdict,p_mutation_id);
 update public.decked_rooms set version=version+1 where id=target.id;
end$$;

create or replace function public.decked_reveal_court_verdict(p_room_id uuid,p_round integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; s public.decked_court_rounds; expected integer; actual integer; guilty integer; judge_vote text; verdict text;
begin
 target:=public.decked_assert_secure_room(p_room_id); if target.host_user_id<>auth.uid() then raise exception 'Only the host can reveal.'; end if;
 select * into s from public.decked_court_rounds where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round for update;
 select count(*)-2 into expected from public.decked_room_players where room_id=target.id;
 select count(*),count(*) filter(where b.verdict='guilty') into actual,guilty from public.decked_court_ballots b where b.room_id=target.id and b.epoch=target.private_state_epoch and b.round_number=p_round;
 if actual<>expected then raise exception 'Not every eligible voter has voted.'; end if;
 select b.verdict into judge_vote from public.decked_court_ballots b where b.room_id=target.id and b.epoch=target.private_state_epoch and b.round_number=p_round and b.voter_user_id=s.judge_user_id;
 verdict:=case when guilty*2=actual then coalesce(judge_vote,'not-guilty') when guilty*2>actual then 'guilty' else 'not-guilty' end;
 update public.decked_court_rounds set revealed_at=coalesce(revealed_at,now()) where room_id=target.id and epoch=target.private_state_epoch and round_number=p_round;
 update public.decked_rooms set version=version+1 where id=target.id;
 return jsonb_build_object('verdict',verdict,'responsible',s.responsible,'guilty',guilty,'not_guilty',actual-guilty);
end$$;
revoke all on function public.decked_begin_court_round(uuid,integer),public.decked_get_court_state(uuid,integer),public.decked_submit_court_ballot(uuid,integer,text,uuid),public.decked_reveal_court_verdict(uuid,integer) from public,anon;
grant execute on function public.decked_begin_court_round(uuid,integer),public.decked_get_court_state(uuid,integer),public.decked_submit_court_ballot(uuid,integer,text,uuid),public.decked_reveal_court_verdict(uuid,integer) to authenticated;
