-- Atomic buzzer, private votes and server-owned scoring for Think Fast.
create table if not exists public.decked_think_fast_games(
  room_id uuid primary key references public.decked_rooms(id) on delete cascade,
  phase text not null check(phase in('thinking','answering','judging','results')),
  prompts text[] not null,
  round_number integer not null default 1,
  rounds integer not null check(rounds between 1 and 60),
  attempt_number integer not null default 1,
  buzzer_user_id uuid references auth.users(id) on delete set null,
  locked_user_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);
create table if not exists public.decked_think_fast_scores(
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  primary key(room_id,user_id)
);
create table if not exists public.decked_think_fast_votes(
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  round_number integer not null,
  attempt_number integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  approved boolean not null,
  primary key(room_id,round_number,attempt_number,user_id)
);
alter table public.decked_think_fast_games enable row level security;
alter table public.decked_think_fast_scores enable row level security;
alter table public.decked_think_fast_votes enable row level security;
revoke all on public.decked_think_fast_games,public.decked_think_fast_scores,public.decked_think_fast_votes from public,anon,authenticated;

create or replace function public.decked_start_think_fast(p_room_id uuid,p_prompts text[])
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; total integer; clean text[];
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.game_id<>'think-fast' then raise exception 'This room is not playing Think Fast.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start the game.'; end if;
  select array_agg(trim(item)) into clean from unnest(p_prompts) item where char_length(trim(item)) between 4 and 180;
  if coalesce(array_length(clean,1),0) not between 1 and 60 then raise exception 'Choose 1 to 60 valid prompts.'; end if;
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  if total not between 2 and 12 then raise exception 'Think Fast needs 2 to 12 players.'; end if;
  delete from public.decked_think_fast_scores where room_id=p_room_id;
  delete from public.decked_think_fast_votes where room_id=p_room_id;
  insert into public.decked_think_fast_scores(room_id,user_id) select p_room_id,user_id from public.decked_room_players where room_id=p_room_id;
  insert into public.decked_think_fast_games(room_id,phase,prompts,round_number,rounds,attempt_number,buzzer_user_id,locked_user_ids)
  values(p_room_id,'thinking',clean,1,array_length(clean,1),1,null,'{}')
  on conflict(room_id) do update set phase='thinking',prompts=excluded.prompts,round_number=1,rounds=excluded.rounds,attempt_number=1,buzzer_user_id=null,locked_user_ids='{}',updated_at=now();
  update public.decked_rooms set status='playing',version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_get_think_fast_state(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare g public.decked_think_fast_games; votes integer; voted boolean; score_json jsonb:='{}';
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into g from public.decked_think_fast_games where room_id=p_room_id;
  if g.room_id is null then raise exception 'This game has not started.'; end if;
  select count(*) into votes from public.decked_think_fast_votes where room_id=p_room_id and round_number=g.round_number and attempt_number=g.attempt_number;
  select exists(select 1 from public.decked_think_fast_votes where room_id=p_room_id and round_number=g.round_number and attempt_number=g.attempt_number and user_id=auth.uid()) into voted;
  select coalesce(jsonb_object_agg(user_id::text,score),'{}') into score_json from public.decked_think_fast_scores where room_id=p_room_id;
  return jsonb_build_object('phase',g.phase,'round_number',g.round_number,'rounds',g.rounds,'prompt',g.prompts[g.round_number],'attempt_number',g.attempt_number,'buzzer_user_id',g.buzzer_user_id,'locked_user_ids',g.locked_user_ids,'has_voted',voted,'vote_count',votes,'scores',score_json);
end;$$;

create or replace function public.decked_think_fast_buzz(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare g public.decked_think_fast_games;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into g from public.decked_think_fast_games where room_id=p_room_id for update;
  if g.phase<>'thinking' then raise exception 'Someone else buzzed first.'; end if;
  if auth.uid()=any(g.locked_user_ids) then raise exception 'You are locked out for this prompt.'; end if;
  update public.decked_think_fast_games set phase='answering',buzzer_user_id=auth.uid(),updated_at=now() where room_id=p_room_id;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_think_fast_judge(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare g public.decked_think_fast_games;
begin
  select * into g from public.decked_think_fast_games where room_id=p_room_id for update;
  if g.phase<>'answering' then raise exception 'This answer is not ready to judge.'; end if;
  if auth.uid()<>g.buzzer_user_id and not exists(select 1 from public.decked_rooms where id=p_room_id and host_user_id=auth.uid()) then raise exception 'Only the answerer can submit the answer.'; end if;
  update public.decked_think_fast_games set phase='judging',updated_at=now() where room_id=p_room_id;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_think_fast_vote(p_room_id uuid,p_approved boolean)
returns void language plpgsql security definer set search_path='' as $$
declare g public.decked_think_fast_games; eligible integer; submitted integer; approvals integer; correct boolean; player_total integer;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into g from public.decked_think_fast_games where room_id=p_room_id for update;
  if g.phase<>'judging' then raise exception 'Voting is closed.'; end if;
  if auth.uid()=g.buzzer_user_id then raise exception 'The answerer cannot judge their own answer.'; end if;
  insert into public.decked_think_fast_votes(room_id,round_number,attempt_number,user_id,approved) values(p_room_id,g.round_number,g.attempt_number,auth.uid(),p_approved) on conflict do nothing;
  select count(*)-1 into eligible from public.decked_room_players where room_id=p_room_id;
  select count(*),count(*) filter(where approved) into submitted,approvals from public.decked_think_fast_votes where room_id=p_room_id and round_number=g.round_number and attempt_number=g.attempt_number;
  if submitted>=eligible then
    correct:=approvals*2>eligible;
    if correct then
      update public.decked_think_fast_scores set score=score+case when g.attempt_number=1 then 2 else 1 end where room_id=p_room_id and user_id=g.buzzer_user_id;
      if g.round_number>=g.rounds then update public.decked_think_fast_games set phase='results',updated_at=now() where room_id=p_room_id;
      else update public.decked_think_fast_games set phase='thinking',round_number=round_number+1,attempt_number=1,buzzer_user_id=null,locked_user_ids='{}',updated_at=now() where room_id=p_room_id; end if;
    else
      update public.decked_think_fast_scores set score=score-1 where room_id=p_room_id and user_id=g.buzzer_user_id;
      select count(*) into player_total from public.decked_room_players where room_id=p_room_id;
      if coalesce(array_length(g.locked_user_ids,1),0)+1>=player_total then
        if g.round_number>=g.rounds then update public.decked_think_fast_games set phase='results',locked_user_ids=array_append(locked_user_ids,g.buzzer_user_id),updated_at=now() where room_id=p_room_id;
        else update public.decked_think_fast_games set phase='thinking',round_number=round_number+1,attempt_number=1,buzzer_user_id=null,locked_user_ids='{}',updated_at=now() where room_id=p_room_id; end if;
      else update public.decked_think_fast_games set phase='thinking',attempt_number=attempt_number+1,locked_user_ids=array_append(locked_user_ids,g.buzzer_user_id),buzzer_user_id=null,updated_at=now() where room_id=p_room_id; end if;
    end if;
  end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;$$;

revoke execute on function public.decked_start_think_fast(uuid,text[]),public.decked_get_think_fast_state(uuid),public.decked_think_fast_buzz(uuid),public.decked_think_fast_judge(uuid),public.decked_think_fast_vote(uuid,boolean) from public,anon;
grant execute on function public.decked_start_think_fast(uuid,text[]),public.decked_get_think_fast_state(uuid),public.decked_think_fast_buzz(uuid),public.decked_think_fast_judge(uuid),public.decked_think_fast_vote(uuid,boolean) to authenticated;

create or replace function public.decked_create_room(p_display_name text,p_game_id text default 'truth-or-dare')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); new_room public.decked_rooms; supported constant text[]:=array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast'];
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
  if not(p_game_id=any(supported)) then raise exception 'This game is not available for Play Together.'; end if;
  insert into public.decked_rooms(code,host_user_id,game_id) values(public.decked_generate_room_code(),uid,p_game_id) returning * into new_room;
  insert into public.decked_room_players(room_id,user_id,display_name,color,position) values(new_room.id,uid,trim(p_display_name),'#dc2827',0);
  return public.decked_room_payload(new_room.id);
end;$$;
revoke execute on function public.decked_create_room(text,text) from public,anon; grant execute on function public.decked_create_room(text,text) to authenticated;

alter table public.analytics_events drop constraint if exists analytics_events_game_id_check;
alter table public.analytics_events add constraint analytics_events_game_id_check check(game_id is null or game_id=any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast']));
alter table public.analytics_game_sessions drop constraint if exists analytics_game_sessions_game_id_check;
alter table public.analytics_game_sessions add constraint analytics_game_sessions_game_id_check check(game_id=any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast']));
alter table public.analytics_room_facts drop constraint if exists analytics_room_facts_game_id_check;
alter table public.analytics_room_facts add constraint analytics_room_facts_game_id_check check(game_id=any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast']));
alter table public.analytics_daily_aggregates drop constraint if exists analytics_daily_aggregates_game_id_check;
alter table public.analytics_daily_aggregates add constraint analytics_daily_aggregates_game_id_check check(game_id is null or game_id=any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast']));
alter table public.content_categories drop constraint if exists content_categories_game_id_check;
alter table public.content_categories add constraint content_categories_game_id_check check(game_id=any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast']));
alter table public.content_items drop constraint if exists content_items_game_id_check;
alter table public.content_items add constraint content_items_game_id_check check(game_id=any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast']));

create or replace function public.decked_capture_think_fast_analytics()
returns trigger language plpgsql security definer set search_path='' as $$
declare link public.analytics_room_links; player_count integer; completed_time timestamptz:=now();
begin
  begin
    if new.phase<>'results' or (tg_op='UPDATE' and old.phase='results') then return new; end if;
    select * into link from public.analytics_room_links where room_id=new.room_id for update;
    if link.room_id is null or link.current_game_session_id is null or link.game_completed then return new; end if;
    select count(*) into player_count from public.decked_room_players where room_id=new.room_id;
    update public.analytics_room_links set game_completed=true where room_id=new.room_id;
    update public.analytics_game_sessions set status='completed',completed_at=completed_time,last_activity_at=completed_time,configured_card_count=coalesce(configured_card_count,new.rounds),cards_presented=greatest(cards_presented,new.round_number),rounds_completed=greatest(rounds_completed,new.round_number),completion_reason='completed',updated_at=completed_time where game_session_id=link.current_game_session_id;
    update public.analytics_room_facts set last_game_completed_at=completed_time,last_activity_at=completed_time where multiplayer_room_ref=link.multiplayer_room_ref;
    perform public.decked_write_database_event('multiplayer_game_completed',link.multiplayer_room_ref,'think-fast',link.current_game_session_id,jsonb_build_object('game_id','think-fast','multiplayer_room_ref',link.multiplayer_room_ref,'game_session_id',link.current_game_session_id,'cards_presented',new.round_number,'cards_skipped',0,'rounds_completed',new.round_number,'duration_seconds',greatest(0,extract(epoch from completed_time-link.game_started_at)::integer),'player_count',player_count),'game-completed:'||link.current_game_session_id);
  exception when others then raise warning 'Think Fast analytics capture failed: %',sqlerrm; end;
  return new;
end;$$;
drop trigger if exists decked_capture_think_fast_game_analytics on public.decked_think_fast_games;
create trigger decked_capture_think_fast_game_analytics after insert or update of phase on public.decked_think_fast_games for each row execute function public.decked_capture_think_fast_analytics();
revoke all on function public.decked_capture_think_fast_analytics() from public,anon,authenticated;
grant execute on function public.decked_capture_think_fast_analytics() to service_role;
