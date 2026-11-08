-- Let hosts choose an equal number of timed rounds for every Read My Lips team.
drop function if exists public.decked_start_lips_game(uuid,jsonb,jsonb,jsonb,integer);

create or replace function public.decked_start_lips_game(p_room_id uuid,p_deck jsonb,p_team_names jsonb,p_team_player_ids jsonb,p_round_seconds integer,p_rounds_per_team integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms; n integer;
begin
 select * into r from public.decked_rooms where id=p_room_id for update;
 if r.id is null or r.game_id<>'read-my-lips' or r.status<>'lobby' or r.host_user_id is distinct from auth.uid() then raise exception 'Only the host can start this game.'; end if;
 select count(*) into n from public.decked_room_players where room_id=p_room_id;
 if n<4 or n%2<>0 then raise exception 'Read My Lips needs pairs of players.'; end if;
 if jsonb_typeof(p_team_names) is distinct from 'array' then raise exception 'Invalid team names.'; end if;
 if jsonb_array_length(p_team_names)<>n/2 or exists(select 1 from jsonb_array_elements(p_team_names) as e(value) where jsonb_typeof(e.value)<>'string' or char_length(trim(e.value#>>'{}')) not between 1 and 18) then raise exception 'Invalid team names.'; end if;
 if jsonb_typeof(p_team_player_ids) is distinct from 'array' or jsonb_array_length(p_team_player_ids)<>n then raise exception 'Assign every player to one team.'; end if;
 if exists(select 1 from jsonb_array_elements(p_team_player_ids) as e(value) where jsonb_typeof(e.value)<>'string') then raise exception 'Invalid team player.'; end if;
 if (select count(distinct e.value#>>'{}') from jsonb_array_elements(p_team_player_ids) as e(value))<>n then raise exception 'A player can only join one team.'; end if;
 if exists(select 1 from jsonb_array_elements(p_team_player_ids) as e(value) where not exists(select 1 from public.decked_room_players p where p.room_id=p_room_id and p.user_id::text=(e.value#>>'{}'))) then raise exception 'Invalid room player.'; end if;
 if p_round_seconds is null or p_round_seconds not between 5 and 300 then raise exception 'Choose a turn length between 5 and 300 seconds.'; end if;
 if p_rounds_per_team is null or p_rounds_per_team not between 1 and 30 then raise exception 'Choose between 1 and 30 rounds per team.'; end if;
 if jsonb_typeof(p_deck)<>'array' or jsonb_array_length(p_deck) not between 8 and 400 then raise exception 'Invalid phrase deck.'; end if;
 if exists(select 1 from jsonb_array_elements(p_deck) as e(value) where jsonb_typeof(e.value)<>'string' or char_length(e.value#>>'{}') not between 1 and 120) then raise exception 'Invalid phrase.'; end if;
 insert into public.decked_lips_secrets(room_id,deck) values(p_room_id,p_deck) on conflict(room_id) do update set deck=excluded.deck;
 update public.decked_rooms set status='playing',total_cards=jsonb_array_length(p_deck),game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',jsonb_build_object('step','game','lips_phase','ready','lips_turn',0,'lips_card',0,'cardIndex',0,'lips_team_count',n/2,'lips_team_names',p_team_names,'lips_player_ids',p_team_player_ids,'lips_scores',to_jsonb(array_fill(0,array[n/2])),'lips_turn_start_score',0,'lips_round_seconds',p_round_seconds,'lips_rounds_per_team',p_rounds_per_team,'lips_skips',0,'lips_deadline',null),true),version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_lips_action(p_room_id uuid,p_action text,p_expected_turn integer,p_expected_card integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms;s jsonb;t integer;c integer;actor uuid;phase text;score jsonb;team integer;team_count integer;rounds_per_team integer;
begin
 select * into r from public.decked_rooms where id=p_room_id for update;
 if r.id is null or r.game_id<>'read-my-lips' or r.status<>'playing' or not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'Invalid room action.'; end if;
 s:=r.game_state->'session';t:=(s->>'lips_turn')::integer;c:=(s->>'lips_card')::integer;phase:=s->>'lips_phase';team_count:=coalesce((s->>'lips_team_count')::integer,2);rounds_per_team:=coalesce((s->>'lips_rounds_per_team')::integer,4);team:=t%team_count;
 if t<>p_expected_turn or c<>p_expected_card then raise exception 'Game moved forward; refresh.'; end if;
 if jsonb_typeof(s->'lips_player_ids')='array' then actor:=(s->'lips_player_ids'->>(team*2+(t/team_count)%2))::uuid;
 else select user_id into actor from public.decked_room_players where room_id=p_room_id and position=(team*2+(t/team_count)%2); end if;
 if p_action='begin' then
   if phase<>'ready' or actor<>auth.uid() then raise exception 'Only the active speaker may begin.'; end if;
   s:=s||jsonb_build_object('lips_phase','playing','lips_deadline',now()+make_interval(secs => coalesce((s->>'lips_round_seconds')::integer,60)));
 elsif p_action='review' then
   if phase<>'playing' or actor<>auth.uid() or (s->>'lips_deadline')::timestamptz<=now() then raise exception 'Only the active speaker may review before time runs out.'; end if;
   s:=s||jsonb_build_object('lips_phase','judge','lips_remaining_seconds',ceil(extract(epoch from (s->>'lips_deadline')::timestamptz-now()))::integer,'lips_deadline',null);
 elsif p_action in ('correct','skip') then
   if phase<>'judge' or actor<>auth.uid() then raise exception 'Only the active speaker may score this phrase.'; end if;
   if p_action='correct' then score:=jsonb_set(s->'lips_scores',array[team::text],to_jsonb((s->'lips_scores'->>team)::integer+1));s:=jsonb_set(s,'{lips_scores}',score); end if;
   if p_action='skip' then s:=jsonb_set(s,'{lips_skips}',to_jsonb((s->>'lips_skips')::integer+1)); end if;
   s:=s||jsonb_build_object('lips_card',c+1,'cardIndex',c+1,'lips_phase','result');
 elsif p_action='next_phrase' then
   if phase<>'result' or actor<>auth.uid() then raise exception 'Only the active speaker may continue.'; end if;
   s:=s||jsonb_build_object('lips_phase','playing','lips_deadline',now()+make_interval(secs => greatest(1,coalesce((s->>'lips_remaining_seconds')::integer,1))));
 elsif p_action in ('add_point','remove_point') then
   if phase<>'between' or (actor<>auth.uid() and r.host_user_id<>auth.uid()) then raise exception 'Only the speaker or host may adjust this turn score.'; end if;
   if p_action='remove_point' and (s->'lips_scores'->>team)::integer<=coalesce((s->>'lips_turn_start_score')::integer,0) then raise exception 'This turn has no points to remove.'; end if;
   score:=jsonb_set(s->'lips_scores',array[team::text],to_jsonb((s->'lips_scores'->>team)::integer+case when p_action='add_point' then 1 else -1 end));
   s:=jsonb_set(s,'{lips_scores}',score);
 elsif p_action='end' then
   if phase<>'playing' or (s->>'lips_deadline')::timestamptz>now() then raise exception 'Turn is still running.'; end if;
   s:=s||jsonb_build_object('lips_phase','between','lips_deadline',null);
 elsif p_action='next' then
   if phase<>'between' then raise exception 'Finish the current turn first.'; end if;
   if r.host_user_id is distinct from auth.uid() and actor is distinct from auth.uid() then raise exception 'Only the host or active speaker may continue.'; end if;
   if t>=team_count*rounds_per_team-1 then s:=s||jsonb_build_object('step','done','lips_phase','done');update public.decked_rooms set status='finished',game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;return; end if;
   s:=s||jsonb_build_object('lips_turn',t+1,'lips_phase','ready','lips_turn_start_score',(s->'lips_scores'->>((t+1)%team_count))::integer);
 else raise exception 'Unknown action.';
 end if;
 update public.decked_rooms set game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;
end;$$;
revoke execute on function public.decked_start_lips_game(uuid,jsonb,jsonb,jsonb,integer,integer) from public,anon;
grant execute on function public.decked_start_lips_game(uuid,jsonb,jsonb,jsonb,integer,integer) to authenticated;
