-- Only the opposing team can review and confirm a Read My Lips turn.
-- The host follows the same rule as every other player.

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
  can_review:=reviewer_one=auth.uid() or reviewer_two=auth.uid();
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
