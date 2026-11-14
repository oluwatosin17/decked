drop function if exists public.decked_start_lips_game(uuid,jsonb,jsonb);

create or replace function public.decked_start_lips_game(p_room_id uuid,p_deck jsonb,p_team_names jsonb,p_team_player_ids jsonb)
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
 if jsonb_typeof(p_deck)<>'array' or jsonb_array_length(p_deck) not between 8 and 400 then raise exception 'Invalid phrase deck.'; end if;
 if exists(select 1 from jsonb_array_elements(p_deck) as e(value) where jsonb_typeof(e.value)<>'string' or char_length(e.value#>>'{}') not between 1 and 120) then raise exception 'Invalid phrase.'; end if;
 insert into public.decked_lips_secrets(room_id,deck) values(p_room_id,p_deck) on conflict(room_id) do update set deck=excluded.deck;
 update public.decked_rooms set status='playing',total_cards=jsonb_array_length(p_deck),game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',jsonb_build_object('step','game','lips_phase','ready','lips_turn',0,'lips_card',0,'cardIndex',0,'lips_team_count',n/2,'lips_team_names',p_team_names,'lips_player_ids',p_team_player_ids,'lips_scores',to_jsonb(array_fill(0,array[n/2])),'lips_skips',0,'lips_deadline',null),true),version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_get_lips_prompt(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare r public.decked_rooms; s jsonb; t integer; team_count integer; actor uuid; phrase text;
begin
 if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
 select * into r from public.decked_rooms where id=p_room_id;
 if r.game_id<>'read-my-lips' then raise exception 'Wrong game.'; end if;
 s:=coalesce(r.game_state->'session','{}'::jsonb);t:=coalesce((s->>'lips_turn')::integer,0);team_count:=coalesce((s->>'lips_team_count')::integer,2);
 if jsonb_typeof(s->'lips_player_ids')='array' then actor:=(s->'lips_player_ids'->>((t%team_count)*2+(t/team_count)%2))::uuid;
 else select user_id into actor from public.decked_room_players where room_id=p_room_id and position=((t%team_count)*2+(t/team_count)%2); end if;
 if actor=auth.uid() and s->>'lips_phase'='playing' then
   select deck->>(coalesce((s->>'lips_card')::integer,0)%jsonb_array_length(deck)) into phrase from public.decked_lips_secrets where room_id=p_room_id;
 end if;
 return jsonb_build_object('phrase',phrase,'speaker_user_id',actor);
end;$$;

create or replace function public.decked_lips_action(p_room_id uuid,p_action text,p_expected_turn integer,p_expected_card integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms;s jsonb;t integer;c integer;actor uuid;phase text;score jsonb;team integer;team_count integer;
begin
 select * into r from public.decked_rooms where id=p_room_id for update;
 if r.id is null or r.game_id<>'read-my-lips' or r.status<>'playing' or not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'Invalid room action.'; end if;
 s:=r.game_state->'session';t:=(s->>'lips_turn')::integer;c:=(s->>'lips_card')::integer;phase:=s->>'lips_phase';team_count:=coalesce((s->>'lips_team_count')::integer,2);team:=t%team_count;
 if t<>p_expected_turn or c<>p_expected_card then raise exception 'Game moved forward; refresh.'; end if;
 if jsonb_typeof(s->'lips_player_ids')='array' then actor:=(s->'lips_player_ids'->>(team*2+(t/team_count)%2))::uuid;
 else select user_id into actor from public.decked_room_players where room_id=p_room_id and position=(team*2+(t/team_count)%2); end if;
 if p_action='begin' then
   if phase<>'ready' or actor<>auth.uid() then raise exception 'Only the active speaker may begin.'; end if;
   s:=s||jsonb_build_object('lips_phase','playing','lips_deadline',now()+interval '60 seconds');
 elsif p_action in ('correct','skip') then
   if phase<>'playing' or actor<>auth.uid() or (s->>'lips_deadline')::timestamptz<=now() then raise exception 'Only the active speaker may score before time runs out.'; end if;
   if p_action='correct' then score:=jsonb_set(s->'lips_scores',array[team::text],to_jsonb((s->'lips_scores'->>team)::integer+1));s:=jsonb_set(s,'{lips_scores}',score); end if;
   if p_action='skip' then s:=jsonb_set(s,'{lips_skips}',to_jsonb((s->>'lips_skips')::integer+1)); end if;
   s:=s||jsonb_build_object('lips_card',c+1,'cardIndex',c+1);
 elsif p_action='end' then
   if phase<>'playing' or (s->>'lips_deadline')::timestamptz>now() then raise exception 'Turn is still running.'; end if;
   s:=s||jsonb_build_object('lips_phase','between','lips_deadline',null);
 elsif p_action='next' then
   if phase<>'between' then raise exception 'Finish the current turn first.'; end if;
   if r.host_user_id is distinct from auth.uid() and actor is distinct from auth.uid() then raise exception 'Only the host or active speaker may continue.'; end if;
   if t>=team_count*4-1 then s:=s||jsonb_build_object('step','done','lips_phase','done');update public.decked_rooms set status='finished',game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;return; end if;
   s:=s||jsonb_build_object('lips_turn',t+1,'lips_phase','ready');
 else raise exception 'Unknown action.';
 end if;
 update public.decked_rooms set game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;
end;$$;
revoke execute on function public.decked_start_lips_game(uuid,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.decked_start_lips_game(uuid,jsonb,jsonb,jsonb) to authenticated;

create or replace function public.decked_join_room(p_code text, p_display_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  target public.decked_rooms;
  next_position integer;
  colors constant text[] := array['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63'];
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then raise exception 'Enter a name between 1 and 24 characters.'; end if;
  select * into target from public.decked_rooms where code = upper(trim(p_code)) and expires_at > now() for update;
  if target.id is null then raise exception 'Room not found or expired.'; end if;
  if target.status <> 'lobby' then raise exception 'This game has already started.'; end if;
  select coalesce(max(position) + 1, 0) into next_position from public.decked_room_players where room_id = target.id;
  if next_position >= 8 and target.game_id <> 'read-my-lips' then raise exception 'This room is full.'; end if;
  insert into public.decked_room_players(room_id, user_id, display_name, color, position)
  values (target.id, uid, trim(p_display_name), colors[1 + (next_position % array_length(colors, 1))], next_position)
  on conflict (room_id, user_id) do update set display_name = excluded.display_name;
  return public.decked_room_payload(target.id);
end;
$$;
