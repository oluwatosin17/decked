-- Keep Read My Lips scoring consistent across pass-and-play and Play Together.
-- Prompt decisions stay private while a turn is live, then the next team reviews
-- the itemized turn before its score becomes final.

alter table public.decked_lips_secrets
  add column if not exists turn_history jsonb not null default '[]'::jsonb;

create or replace function public.decked_start_lips_game(
  p_room_id uuid,
  p_deck jsonb,
  p_team_names jsonb,
  p_team_player_ids jsonb,
  p_round_seconds integer,
  p_rounds_per_team integer
)
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

  insert into public.decked_lips_secrets(room_id,deck,turn_history)
  values(p_room_id,p_deck,'[]'::jsonb)
  on conflict(room_id) do update set deck=excluded.deck,turn_history='[]'::jsonb;

  update public.decked_rooms set
    status='playing',
    total_cards=jsonb_array_length(p_deck),
    game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',jsonb_build_object(
      'step','game','lips_phase','ready','lips_turn',0,'lips_card',0,'cardIndex',0,
      'lips_team_count',n/2,'lips_team_names',p_team_names,'lips_player_ids',p_team_player_ids,
      'lips_scores',to_jsonb(array_fill(0,array[n/2])),'lips_turn_start_score',0,
      'lips_turn_decision_count',0,'lips_round_seconds',p_round_seconds,
      'lips_rounds_per_team',p_rounds_per_team,'lips_skips',0,'lips_deadline',null
    ),true),
    version=version+1
  where id=p_room_id;
end;$$;

drop function if exists public.decked_lips_action(uuid,text,integer,integer);

create or replace function public.decked_get_lips_prompt(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare r public.decked_rooms; s jsonb; t integer; team_count integer; actor uuid; phrase text;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into r from public.decked_rooms where id=p_room_id;
  if r.game_id<>'read-my-lips' then raise exception 'Wrong game.'; end if;
  s:=coalesce(r.game_state->'session','{}'::jsonb);
  t:=coalesce((s->>'lips_turn')::integer,0);
  team_count:=coalesce((s->>'lips_team_count')::integer,2);
  if jsonb_typeof(s->'lips_player_ids')='array' then
    actor:=(s->'lips_player_ids'->>((t%team_count)*2+(t/team_count)%2))::uuid;
  else
    select user_id into actor from public.decked_room_players where room_id=p_room_id and position=((t%team_count)*2+(t/team_count)%2);
  end if;
  if actor=auth.uid() and s->>'lips_phase'='playing' then
    select deck->>(coalesce((s->>'lips_card')::integer,0)%jsonb_array_length(deck)) into phrase from public.decked_lips_secrets where room_id=p_room_id;
  end if;
  return jsonb_build_object('phrase',phrase,'speaker_user_id',actor);
end;$$;

create or replace function public.decked_lips_action(
  p_room_id uuid,
  p_action text,
  p_expected_turn integer,
  p_expected_card integer,
  p_review_index integer default null
)
returns void language plpgsql security definer set search_path='' as $$
declare
  r public.decked_rooms; s jsonb; t integer; c integer; actor uuid; phase text;
  score jsonb; team integer; team_count integer; rounds_per_team integer;
  reviewer_team integer; reviewer_one uuid; reviewer_two uuid; history jsonb;
  history_count integer; decision jsonb; was_correct boolean; can_review boolean;
begin
  select * into r from public.decked_rooms where id=p_room_id for update;
  if r.id is null or r.game_id<>'read-my-lips' or r.status<>'playing' or not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'Invalid room action.'; end if;
  s:=r.game_state->'session';
  t:=(s->>'lips_turn')::integer;
  c:=(s->>'lips_card')::integer;
  phase:=s->>'lips_phase';
  team_count:=coalesce((s->>'lips_team_count')::integer,2);
  rounds_per_team:=coalesce((s->>'lips_rounds_per_team')::integer,4);
  team:=t%team_count;
  reviewer_team:=(team+1)%team_count;
  if t<>p_expected_turn or c<>p_expected_card then raise exception 'Game moved forward; refresh.'; end if;

  actor:=(s->'lips_player_ids'->>(team*2+(t/team_count)%2))::uuid;
  reviewer_one:=(s->'lips_player_ids'->>(reviewer_team*2))::uuid;
  reviewer_two:=(s->'lips_player_ids'->>(reviewer_team*2+1))::uuid;
  can_review:=r.host_user_id=auth.uid() or reviewer_one=auth.uid() or reviewer_two=auth.uid();
  select turn_history into history from public.decked_lips_secrets where room_id=p_room_id for update;
  history:=coalesce(history,'[]'::jsonb);
  history_count:=jsonb_array_length(history);

  if p_action='begin' then
    if phase<>'ready' or actor<>auth.uid() then raise exception 'Only the active speaker may begin.'; end if;
    update public.decked_lips_secrets set turn_history='[]'::jsonb where room_id=p_room_id;
    s:=s||jsonb_build_object('lips_phase','playing','lips_turn_decision_count',0,'lips_deadline',now()+make_interval(secs => coalesce((s->>'lips_round_seconds')::integer,60)));

  elsif p_action in ('correct','skip') then
    if phase<>'playing' or actor<>auth.uid() or (s->>'lips_deadline')::timestamptz<=now() then raise exception 'Only the active speaker may score before time runs out.'; end if;
    history:=history||jsonb_build_array(jsonb_build_object('card',c,'correct',p_action='correct'));
    update public.decked_lips_secrets set turn_history=history where room_id=p_room_id;
    if p_action='correct' then
      score:=jsonb_set(s->'lips_scores',array[team::text],to_jsonb((s->'lips_scores'->>team)::integer+1));
      s:=jsonb_set(s,'{lips_scores}',score);
    else
      s:=jsonb_set(s,'{lips_skips}',to_jsonb(coalesce((s->>'lips_skips')::integer,0)+1));
    end if;
    s:=s||jsonb_build_object('lips_card',c+1,'cardIndex',c+1,'lips_turn_decision_count',history_count+1);

  elsif p_action='undo' then
    if phase<>'playing' or actor<>auth.uid() then raise exception 'Only the active speaker may undo.'; end if;
    if history_count=0 then raise exception 'There is no decision to undo.'; end if;
    decision:=history->(history_count-1);
    was_correct:=(decision->>'correct')::boolean;
    history:=history-(history_count-1);
    update public.decked_lips_secrets set turn_history=history where room_id=p_room_id;
    if was_correct then
      score:=jsonb_set(s->'lips_scores',array[team::text],to_jsonb(greatest(coalesce((s->>'lips_turn_start_score')::integer,0),(s->'lips_scores'->>team)::integer-1)));
      s:=jsonb_set(s,'{lips_scores}',score);
    else
      s:=jsonb_set(s,'{lips_skips}',to_jsonb(greatest(0,coalesce((s->>'lips_skips')::integer,0)-1)));
    end if;
    s:=s||jsonb_build_object('lips_card',greatest(0,c-1),'cardIndex',greatest(0,c-1),'lips_turn_decision_count',history_count-1);

  elsif p_action='toggle_review' then
    if phase<>'between' or not can_review then raise exception 'Only the next team or host may review this turn.'; end if;
    if p_review_index is null or p_review_index<0 or p_review_index>=history_count then raise exception 'Invalid review item.'; end if;
    was_correct:=(history->p_review_index->>'correct')::boolean;
    history:=jsonb_set(history,array[p_review_index::text,'correct'],to_jsonb(not was_correct));
    update public.decked_lips_secrets set turn_history=history where room_id=p_room_id;
    score:=jsonb_set(s->'lips_scores',array[team::text],to_jsonb((s->'lips_scores'->>team)::integer+case when was_correct then -1 else 1 end));
    s:=jsonb_set(s,'{lips_scores}',score);
    s:=jsonb_set(s,'{lips_skips}',to_jsonb(greatest(0,coalesce((s->>'lips_skips')::integer,0)+case when was_correct then 1 else -1 end)));

  elsif p_action='end' then
    if phase<>'playing' then raise exception 'The turn is not running.'; end if;
    if actor<>auth.uid() and (s->>'lips_deadline')::timestamptz>now() then raise exception 'Only the active speaker may end the turn early.'; end if;
    s:=s||jsonb_build_object('lips_phase','between','lips_deadline',null);

  elsif p_action='next' then
    if phase<>'between' then raise exception 'Finish the current turn first.'; end if;
    if not can_review then raise exception 'Only the next team or host may confirm this score.'; end if;
    if t>=team_count*rounds_per_team-1 then
      s:=s||jsonb_build_object('step','done','lips_phase','done');
      update public.decked_rooms set status='finished',game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;
      return;
    end if;
    update public.decked_lips_secrets set turn_history='[]'::jsonb where room_id=p_room_id;
    s:=s||jsonb_build_object('lips_turn',t+1,'lips_phase','ready','lips_turn_decision_count',0,'lips_turn_start_score',(s->'lips_scores'->>((t+1)%team_count))::integer);
  else
    raise exception 'Unknown action.';
  end if;

  update public.decked_rooms set game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_get_lips_turn_review(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms; s jsonb; history jsonb; secret_deck jsonb; result jsonb;
begin
  select * into r from public.decked_rooms where id=p_room_id;
  if r.id is null or r.game_id<>'read-my-lips' or not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'Invalid room.'; end if;
  s:=r.game_state->'session';
  if coalesce(s->>'lips_phase','') not in ('between','done') then raise exception 'Turn review is not available yet.'; end if;
  select turn_history,deck into history,secret_deck from public.decked_lips_secrets where room_id=p_room_id;
  select coalesce(jsonb_agg(jsonb_build_object('phrase',secret_deck->>((item.value->>'card')::integer%jsonb_array_length(secret_deck)),'correct',(item.value->>'correct')::boolean) order by item.ordinality),'[]'::jsonb)
  into result from jsonb_array_elements(coalesce(history,'[]'::jsonb)) with ordinality as item(value,ordinality);
  return result;
end;$$;

revoke execute on function public.decked_lips_action(uuid,text,integer,integer,integer) from public,anon;
revoke execute on function public.decked_get_lips_turn_review(uuid) from public,anon;
revoke execute on function public.decked_get_lips_prompt(uuid) from public,anon;
grant execute on function public.decked_lips_action(uuid,text,integer,integer,integer) to authenticated;
grant execute on function public.decked_get_lips_turn_review(uuid) to authenticated;
grant execute on function public.decked_get_lips_prompt(uuid) to authenticated;
