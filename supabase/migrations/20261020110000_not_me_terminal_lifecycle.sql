-- Recovered from the linked project's Supabase migration history.

-- Recognize the dedicated Not Me, Your Honour lifecycle in authoritative
-- multiplayer analytics. Courtroom secrets remain in protected tables.

create or replace function public.decked_multiplayer_session_is_terminal(p_session jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_session->>'step', '') in ('done', 'winner')
    or coalesce(p_session->>'court_phase', '') = 'results'
    or nullif(coalesce(p_session->'whotState'->>'winnerId', ''), '') is not null
    or (
      coalesce(p_session->>'step', '') in ('game', 'gameplay')
      and coalesce((p_session->>'totalCards')::integer, 0) > 0
      and coalesce(
        (p_session->>'cardIndex')::integer,
        (p_session->>'cardIdx')::integer,
        (p_session->>'gameCardIndex')::integer,
        (p_session->>'challengeIdx')::integer,
        (p_session->>'idx')::integer,
        0
      ) >= coalesce((p_session->>'totalCards')::integer, 0)
    );
$$;

revoke all on function public.decked_multiplayer_session_is_terminal(jsonb) from public, anon, authenticated;
grant execute on function public.decked_multiplayer_session_is_terminal(jsonb) to service_role;

do $$
begin
  if not public.decked_multiplayer_session_is_terminal('{"court_phase":"results"}'::jsonb)
     or public.decked_multiplayer_session_is_terminal('{"court_phase":"verdict"}'::jsonb)
     or public.decked_multiplayer_session_is_terminal('{"court_phase":"roles"}'::jsonb)
     or not public.decked_multiplayer_session_is_terminal('{"step":"done"}'::jsonb)
     or not public.decked_multiplayer_session_is_terminal('{"step":"game","whotState":{"winnerId":"opaque-player"}}'::jsonb)
  then raise exception 'Not Me terminal lifecycle preflight failed'; end if;
end $$;
