-- Private-answer multiplayer lifecycle for Do You Know Me?. Answers remain in
-- locked tables and are exposed to room members only after every player submits.
create table if not exists public.decked_know_me_games(
  room_id uuid primary key references public.decked_rooms(id) on delete cascade,
  game_number integer not null default 1,
  phase text not null check(phase in('answering','reveal','results')),
  mode text not null check(mode in('read-me','match-me')),
  relationship text not null,
  category_ids text[] not null,
  prompt_ids text[] not null,
  round_number integer not null default 1,
  rounds integer not null check(rounds between 3 and 30),
  spotlight_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.decked_know_me_answers(
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  round_number integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index integer not null check(option_index between 0 and 3),
  primary key(room_id,round_number,user_id)
);
create table if not exists public.decked_know_me_scores(
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  primary key(room_id,user_id)
);
alter table public.decked_know_me_games enable row level security;
alter table public.decked_know_me_answers enable row level security;
alter table public.decked_know_me_scores enable row level security;
revoke all on public.decked_know_me_games,public.decked_know_me_answers,public.decked_know_me_scores from public,anon,authenticated;

create or replace function public.decked_start_do_you_know_me(p_room_id uuid,p_mode text,p_relationship text,p_category_ids text[],p_prompt_ids text[],p_rounds integer)
returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; total integer; first_player uuid; next_game integer;
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.game_id<>'do-you-know-me' then raise exception 'This room is not playing Do You Know Me?.'; end if;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start the game.'; end if;
  if p_mode not in('read-me','match-me') then raise exception 'Choose a valid mode.'; end if;
  if p_rounds not between 3 and 30 or coalesce(array_length(p_prompt_ids,1),0)<p_rounds then raise exception 'Choose 3 to 30 available rounds.'; end if;
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  select user_id into first_player from public.decked_room_players where room_id=p_room_id order by position limit 1;
  if total not between 2 and 10 then raise exception 'Do You Know Me? needs 2 to 10 players.'; end if;
  select coalesce(game_number,0)+1 into next_game from public.decked_know_me_games where room_id=p_room_id; next_game:=coalesce(next_game,1);
  delete from public.decked_know_me_answers where room_id=p_room_id; delete from public.decked_know_me_scores where room_id=p_room_id;
  insert into public.decked_know_me_scores(room_id,user_id) select p_room_id,user_id from public.decked_room_players where room_id=p_room_id;
  insert into public.decked_know_me_games(room_id,game_number,phase,mode,relationship,category_ids,prompt_ids,round_number,rounds,spotlight_user_id)
  values(p_room_id,next_game,'answering',p_mode,p_relationship,p_category_ids,p_prompt_ids,1,p_rounds,first_player)
  on conflict(room_id) do update set game_number=excluded.game_number,phase='answering',mode=excluded.mode,relationship=excluded.relationship,category_ids=excluded.category_ids,prompt_ids=excluded.prompt_ids,round_number=1,rounds=excluded.rounds,spotlight_user_id=excluded.spotlight_user_id,updated_at=now();
  update public.decked_rooms set status='playing',version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_get_do_you_know_me_state(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare g public.decked_know_me_games; count_answers integer; answered boolean; answer_json jsonb:='{}'; score_json jsonb:='{}';
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into g from public.decked_know_me_games where room_id=p_room_id;
  if g.room_id is null then raise exception 'This game has not started.'; end if;
  select count(*) into count_answers from public.decked_know_me_answers where room_id=p_room_id and round_number=g.round_number;
  select exists(select 1 from public.decked_know_me_answers where room_id=p_room_id and round_number=g.round_number and user_id=auth.uid()) into answered;
  if g.phase in('reveal','results') then select coalesce(jsonb_object_agg(user_id::text,option_index),'{}') into answer_json from public.decked_know_me_answers where room_id=p_room_id and round_number=g.round_number; end if;
  select coalesce(jsonb_object_agg(user_id::text,score),'{}') into score_json from public.decked_know_me_scores where room_id=p_room_id;
  return jsonb_build_object('phase',g.phase,'game_number',g.game_number,'mode',g.mode,'relationship',g.relationship,'round_number',g.round_number,'rounds',g.rounds,'prompt_id',g.prompt_ids[g.round_number],'spotlight_user_id',g.spotlight_user_id,'has_answered',answered,'answer_count',count_answers,'answers',answer_json,'scores',score_json);
end;$$;

create or replace function public.decked_do_you_know_me_answer(p_room_id uuid,p_option_index integer)
returns void language plpgsql security definer set search_path='' as $$
declare g public.decked_know_me_games; total integer; submitted integer; truth integer; correct integer; item record; match_count integer;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into g from public.decked_know_me_games where room_id=p_room_id for update;
  if g.phase<>'answering' then raise exception 'Answers are closed.'; end if;
  if p_option_index not between 0 and 3 then raise exception 'Choose a valid answer.'; end if;
  insert into public.decked_know_me_answers(room_id,round_number,user_id,option_index) values(p_room_id,g.round_number,auth.uid(),p_option_index) on conflict do nothing;
  select count(*) into total from public.decked_room_players where room_id=p_room_id;
  select count(*) into submitted from public.decked_know_me_answers where room_id=p_room_id and round_number=g.round_number;
  if submitted=total then
    if g.mode='read-me' then
      select option_index into truth from public.decked_know_me_answers where room_id=p_room_id and round_number=g.round_number and user_id=g.spotlight_user_id;
      select count(*) into correct from public.decked_know_me_answers where room_id=p_room_id and round_number=g.round_number and user_id<>g.spotlight_user_id and option_index=truth;
      update public.decked_know_me_scores s set score=s.score+case when s.user_id=g.spotlight_user_id and correct=0 then 2 when s.user_id<>g.spotlight_user_id and exists(select 1 from public.decked_know_me_answers a where a.room_id=p_room_id and a.round_number=g.round_number and a.user_id=s.user_id and a.option_index=truth) then 2+case when correct=total-1 then 1 else 0 end else 0 end where s.room_id=p_room_id;
    else
      for item in select option_index,count(*)::integer amount from public.decked_know_me_answers where room_id=p_room_id and round_number=g.round_number group by option_index loop
        match_count:=item.amount;
        if match_count>=2 then update public.decked_know_me_scores s set score=s.score+case when match_count=total then 3 when match_count>=3 then 2 else 1 end where s.room_id=p_room_id and exists(select 1 from public.decked_know_me_answers a where a.room_id=p_room_id and a.round_number=g.round_number and a.user_id=s.user_id and a.option_index=item.option_index); end if;
      end loop;
    end if;
    update public.decked_know_me_games set phase='reveal',updated_at=now() where room_id=p_room_id;
  end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_do_you_know_me_advance(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare g public.decked_know_me_games; target public.decked_rooms; total integer; next_spot uuid;
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can continue.'; end if;
  select * into g from public.decked_know_me_games where room_id=p_room_id for update;
  if g.phase<>'reveal' then raise exception 'The round is not ready to continue.'; end if;
  if g.round_number>=g.rounds then update public.decked_know_me_games set phase='results',updated_at=now() where room_id=p_room_id;
  else
    select count(*) into total from public.decked_room_players where room_id=p_room_id;
    select user_id into next_spot from public.decked_room_players where room_id=p_room_id order by position offset (g.round_number%total) limit 1;
    update public.decked_know_me_games set phase='answering',round_number=round_number+1,spotlight_user_id=next_spot,updated_at=now() where room_id=p_room_id;
  end if;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;$$;

revoke execute on function public.decked_start_do_you_know_me(uuid,text,text,text[],text[],integer),public.decked_get_do_you_know_me_state(uuid),public.decked_do_you_know_me_answer(uuid,integer),public.decked_do_you_know_me_advance(uuid) from public,anon;
grant execute on function public.decked_start_do_you_know_me(uuid,text,text,text[],text[],integer),public.decked_get_do_you_know_me_state(uuid),public.decked_do_you_know_me_answer(uuid,integer),public.decked_do_you_know_me_advance(uuid) to authenticated;

create or replace function public.decked_capture_know_me_analytics()
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
    perform public.decked_write_database_event('multiplayer_game_completed',link.multiplayer_room_ref,'do-you-know-me',link.current_game_session_id,jsonb_build_object('game_id','do-you-know-me','multiplayer_room_ref',link.multiplayer_room_ref,'game_session_id',link.current_game_session_id,'cards_presented',new.round_number,'cards_skipped',0,'rounds_completed',new.round_number,'duration_seconds',greatest(0,extract(epoch from completed_time-link.game_started_at)::integer),'player_count',player_count),'game-completed:'||link.current_game_session_id);
  exception when others then raise warning 'Do You Know Me analytics capture failed: %',sqlerrm; end;
  return new;
end;$$;
drop trigger if exists decked_capture_know_me_game_analytics on public.decked_know_me_games;
create trigger decked_capture_know_me_game_analytics after insert or update of phase on public.decked_know_me_games for each row execute function public.decked_capture_know_me_analytics();
revoke all on function public.decked_capture_know_me_analytics() from public,anon,authenticated;
grant execute on function public.decked_capture_know_me_analytics() to service_role;

create or replace function public.decked_create_room(p_display_name text,p_game_id text default 'truth-or-dare')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); new_room public.decked_rooms; supported constant text[]:=array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me'];
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
alter table public.analytics_events add constraint analytics_events_game_id_check check(game_id is null or game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me'));
alter table public.analytics_game_sessions drop constraint if exists analytics_game_sessions_game_id_check;
alter table public.analytics_game_sessions add constraint analytics_game_sessions_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me'));
alter table public.analytics_room_facts drop constraint if exists analytics_room_facts_game_id_check;
alter table public.analytics_room_facts add constraint analytics_room_facts_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me'));
alter table public.analytics_daily_aggregates drop constraint if exists analytics_daily_aggregates_game_id_check;
alter table public.analytics_daily_aggregates add constraint analytics_daily_aggregates_game_id_check check(game_id is null or game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me'));
alter table public.content_categories drop constraint if exists content_categories_game_id_check;
alter table public.content_categories add constraint content_categories_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me'));
alter table public.content_items drop constraint if exists content_items_game_id_check;
alter table public.content_items add constraint content_items_game_id_check check(game_id in('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me'));
