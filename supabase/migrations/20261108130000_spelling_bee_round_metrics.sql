-- Count completed Spelling Bee team rounds in authoritative analytics.
create or replace function public.decked_authoritative_gameplay_metrics(
  p_game_id text,
  p_session jsonb,
  p_fallback_total integer default null
)
returns table(cards_presented integer, rounds_completed integer)
language plpgsql immutable set search_path = '' as $$
declare
  configured integer;
  progress integer;
  terminal boolean;
  total_turns integer;
  spelling_teams integer;
  completed_turns integer;
begin
  configured := public.decked_multiplayer_configured_card_count(p_game_id,p_session,p_fallback_total);
  progress := public.decked_multiplayer_card_number(p_session);
  terminal := public.decked_multiplayer_session_is_terminal(p_session);

  if p_game_id='charades' then
    total_turns := nullif(greatest(0,coalesce(
      (p_session->>'totalTurns')::integer,
      case when jsonb_typeof(p_session->'teams')='array'
        then jsonb_array_length(p_session->'teams')*coalesce((p_session->>'deckSize')::integer,0) end,
      0)),0);
    cards_presented := case when terminal and total_turns is not null then total_turns
      else least(coalesce(total_turns,progress+1),progress+1) end;
    rounds_completed := cards_presented;
    return next; return;
  end if;

  cards_presented := case
    when configured is null then greatest(0,progress+1)
    when terminal then configured
    else least(configured,greatest(0,progress+1))
  end;
  if p_game_id='spelling-bee' then
    spelling_teams := greatest(1,coalesce((p_session->>'sp_team_count')::integer,1));
    completed_turns := greatest(0,coalesce((p_session->>'sp_turn')::integer,0)
      + case when p_session->>'sp_phase' in ('result','done') then 1 else 0 end);
    rounds_completed := least(greatest(0,coalesce((p_session->>'sp_rounds')::integer,0)),completed_turns/spelling_teams);
    return next; return;
  end if;
  rounds_completed := case when p_game_id in (
    'two-truths-bluff','who-said-that','bad-advice-only','not-me-your-honour',
    'mini-mystery','imposter','do-you-know-me','think-fast','whot'
  ) then cards_presented else 0 end;
  return next;
end;
$$;
