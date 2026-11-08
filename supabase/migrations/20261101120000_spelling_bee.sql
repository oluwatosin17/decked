-- Spelling Bee keeps words outside the room payload and accepts only server-checked turns.
create or replace function public.decked_create_room(p_display_name text,p_game_id text default 'truth-or-dare')
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); new_room public.decked_rooms; supported constant text[]:=array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast','not-me-your-honour','bad-advice-only','read-my-lips','spelling-bee'];
begin
 if uid is null then raise exception 'A player session is required.'; end if;
 if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
 if not(p_game_id=any(supported)) then raise exception 'This game is not available for Play Together.'; end if;
 insert into public.decked_rooms(code,host_user_id,game_id) values(public.decked_generate_room_code(),uid,p_game_id) returning * into new_room;
 insert into public.decked_room_players(room_id,user_id,display_name,color,position) values(new_room.id,uid,trim(p_display_name),'#dc2827',0);
 return public.decked_room_payload(new_room.id);
end;$$;
revoke execute on function public.decked_create_room(text,text) from public,anon;
grant execute on function public.decked_create_room(text,text) to authenticated;

do $$
declare item record; definition text;
begin
 for item in select con.conname, rel.relname as table_name, pg_get_constraintdef(con.oid) as clause
 from pg_constraint con join pg_class rel on rel.oid=con.conrelid join pg_namespace ns on ns.oid=rel.relnamespace
 where ns.nspname='public' and con.conname in ('analytics_events_game_id_check','analytics_game_sessions_game_id_check','analytics_room_facts_game_id_check','analytics_daily_aggregates_game_id_check','content_categories_game_id_check','content_items_game_id_check')
 loop
  definition:=replace(item.clause,'''read-my-lips''','''read-my-lips'',''spelling-bee''');
  if definition=item.clause then raise exception 'Cannot extend % for Spelling Bee',item.conname; end if;
  execute format('alter table public.%I drop constraint %I',item.table_name,item.conname);
  execute format('alter table public.%I add constraint %I %s',item.table_name,item.conname,definition);
 end loop;
end;$$;

create table public.decked_spelling_secrets (
 room_id uuid primary key references public.decked_rooms(id) on delete cascade,
 deck jsonb not null check(jsonb_typeof(deck)='array' and jsonb_array_length(deck) between 4 and 36)
);
alter table public.decked_spelling_secrets enable row level security;
revoke all on public.decked_spelling_secrets from public,anon,authenticated;

-- The general session writers must not be able to replace authoritative scores or phases.
create or replace function public.decked_set_session_value(p_room_id uuid,p_key text,p_value jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
 if exists(select 1 from public.decked_rooms where id=p_room_id and game_id in ('read-my-lips','spelling-bee')) then raise exception 'Use game actions.'; end if;
 if char_length(p_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
 update public.decked_rooms set game_state=jsonb_set(jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',case when jsonb_typeof(game_state->'session')='object' then game_state->'session' else '{}'::jsonb end,true),array['session',p_key],coalesce(p_value,'null'::jsonb),true),version=version+1 where id=p_room_id and status in ('lobby','playing');
end;$$;
create or replace function public.decked_set_session_values(p_room_id uuid,p_values jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare k text; n integer;
begin
 if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
 if exists(select 1 from public.decked_rooms where id=p_room_id and game_id in ('read-my-lips','spelling-bee')) then raise exception 'Use game actions.'; end if;
 if jsonb_typeof(p_values)<>'object' then raise exception 'Invalid state update.'; end if;
 select count(*) into n from jsonb_object_keys(p_values); if n=0 or n>32 then raise exception 'Invalid state update.'; end if;
 for k in select jsonb_object_keys(p_values) loop if char_length(k) not between 1 and 128 then raise exception 'Invalid state key.'; end if; end loop;
 update public.decked_rooms set game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',case when jsonb_typeof(game_state->'session')='object' then game_state->'session'||p_values else p_values end,true),version=version+1 where id=p_room_id and status in ('lobby','playing');
end;$$;

create or replace function public.decked_start_spelling_game(p_room_id uuid,p_deck jsonb,p_team_names jsonb,p_team_player_ids jsonb,p_seconds integer,p_rounds integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms; n integer; teams integer;
begin
 select * into r from public.decked_rooms where id=p_room_id for update;
 if r.id is null or r.game_id<>'spelling-bee' or r.status<>'lobby' or r.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start Spelling Bee.'; end if;
 select count(*) into n from public.decked_room_players where room_id=p_room_id;
 if n<4 or n>8 or n%2<>0 then raise exception 'Spelling Bee needs pairs of players.'; end if;
 if jsonb_typeof(p_team_names)<>'array' then raise exception 'Invalid teams.'; end if;
 teams:=jsonb_array_length(p_team_names);
 if teams<>n/2 or exists(select 1 from jsonb_array_elements(p_team_names) e where jsonb_typeof(e.value)<>'string' or char_length(trim(e.value#>>'{}')) not between 1 and 18) then raise exception 'Every team needs a name and two players.'; end if;
 if jsonb_typeof(p_team_player_ids)<>'array' or jsonb_array_length(p_team_player_ids)<>n then raise exception 'Assign every player.'; end if;
 if (select count(distinct e.value#>>'{}') from jsonb_array_elements(p_team_player_ids) e)<>n then raise exception 'A player can only join one team.'; end if;
 if exists(select 1 from jsonb_array_elements(p_team_player_ids) e where jsonb_typeof(e.value)<>'string' or not exists(select 1 from public.decked_room_players p where p.room_id=p_room_id and p.user_id::text=(e.value#>>'{}'))) then raise exception 'Invalid player.'; end if;
 if p_seconds not between 5 and 300 or p_rounds not between 1 and 30 or teams*p_rounds>36 then raise exception 'Invalid timer or round count.'; end if;
 if jsonb_typeof(p_deck)<>'array' or jsonb_array_length(p_deck)<>teams*p_rounds then raise exception 'Invalid word deck.'; end if;
 if exists(select 1 from jsonb_array_elements(p_deck) e where jsonb_typeof(e.value)<>'object' or char_length(e.value->>'word') not between 3 and 32 or char_length(e.value->>'definition') not between 8 and 200 or char_length(e.value->>'sentence') not between 8 and 200) then raise exception 'Invalid word clues.'; end if;
 insert into public.decked_spelling_secrets(room_id,deck) values(p_room_id,p_deck) on conflict(room_id) do update set deck=excluded.deck;
 update public.decked_rooms set status='playing',total_cards=jsonb_array_length(p_deck),game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',jsonb_build_object('step','game','sp_phase','ready','sp_turn',0,'cardIndex',0,'sp_team_names',p_team_names,'sp_player_ids',p_team_player_ids,'sp_team_count',teams,'sp_scores',to_jsonb(array_fill(0,array[teams])),'sp_seconds',p_seconds,'sp_rounds',p_rounds,'sp_deadline',null,'sp_correct',null),true),version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_get_spelling_word(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare r public.decked_rooms; s jsonb; t integer; n integer; reader uuid; word jsonb;
begin
 if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
 select * into r from public.decked_rooms where id=p_room_id;
 if r.game_id<>'spelling-bee' then raise exception 'Wrong game.'; end if;
 s:=r.game_state->'session';t:=coalesce((s->>'sp_turn')::integer,0);n:=coalesce((s->>'sp_team_count')::integer,2);
 reader:=(s->'sp_player_ids'->>(((t%n+1)%n)*2))::uuid;
 if s->>'sp_phase'='word' and auth.uid()=reader then select deck->t into word from public.decked_spelling_secrets where room_id=p_room_id; end if;
 if s->>'sp_phase' in ('result','done') then select deck->t into word from public.decked_spelling_secrets where room_id=p_room_id; end if;
 return jsonb_build_object('word',word,'reader_user_id',reader);
end;$$;

create or replace function public.decked_spelling_action(p_room_id uuid,p_action text,p_expected_turn integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms; s jsonb; t integer; n integer; team integer; reader uuid; phase text; scores jsonb; finished boolean:=false;
begin
 select * into r from public.decked_rooms where id=p_room_id for update;
 if r.id is null or r.game_id<>'spelling-bee' or r.status<>'playing' or not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'Invalid room action.'; end if;
 s:=r.game_state->'session';t:=(s->>'sp_turn')::integer;n:=(s->>'sp_team_count')::integer;team:=t%n;phase:=s->>'sp_phase';
 if t<>p_expected_turn then raise exception 'Turn moved forward; refresh.'; end if;
 reader:=(s->'sp_player_ids'->>(((team+1)%n)*2))::uuid;
 if p_action='begin' then
  if phase<>'ready' or auth.uid()<>reader then raise exception 'Only the reader can begin.'; end if;
  s:=s||jsonb_build_object('sp_phase','word','sp_deadline',now()+make_interval(secs=>(s->>'sp_seconds')::integer));
 elsif p_action in ('correct','incorrect') then
  if phase<>'word' or auth.uid()<>reader or (s->>'sp_deadline')::timestamptz<=now() then raise exception 'Only the reader can judge before time runs out.'; end if;
  if p_action='correct' then scores:=jsonb_set(s->'sp_scores',array[team::text],to_jsonb((s->'sp_scores'->>team)::integer+1));s:=jsonb_set(s,'{sp_scores}',scores); end if;
  s:=s||jsonb_build_object('sp_phase','result','sp_deadline',null,'sp_correct',p_action='correct');
 elsif p_action='timeout' then
  if phase<>'word' or (s->>'sp_deadline')::timestamptz>now() then raise exception 'Time has not run out.'; end if;
  s:=s||jsonb_build_object('sp_phase','result','sp_deadline',null,'sp_correct',false);
 elsif p_action='next' then
  if phase<>'result' or (auth.uid()<>reader and auth.uid()<>r.host_user_id) then raise exception 'Only the reader or host can continue.'; end if;
  if t+1>=n*(s->>'sp_rounds')::integer then s:=s||jsonb_build_object('step','done','sp_phase','done');finished:=true;
  else s:=s||jsonb_build_object('sp_phase','ready','sp_turn',t+1,'cardIndex',t+1,'sp_correct',null); end if;
 else raise exception 'Unknown action.'; end if;
 update public.decked_rooms set status=case when finished then 'finished' else status end,game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;
end;$$;

revoke execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,jsonb,integer,integer) from public,anon;
revoke execute on function public.decked_get_spelling_word(uuid) from public,anon;
revoke execute on function public.decked_spelling_action(uuid,text,integer) from public,anon;
grant execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,jsonb,integer,integer) to authenticated;
grant execute on function public.decked_get_spelling_word(uuid) to authenticated;
grant execute on function public.decked_spelling_action(uuid,text,integer) to authenticated;
