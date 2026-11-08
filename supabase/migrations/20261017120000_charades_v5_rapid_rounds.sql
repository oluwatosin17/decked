-- Recovered from the linked project's Supabase migration history.

create table if not exists public.decked_charades_mutations (
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  mutation_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (room_id, mutation_id)
);

alter table public.decked_charades_mutations enable row level security;

revoke all on table public.decked_charades_mutations from public, anon, authenticated;

create or replace function public.decked_set_charades_deck(p_room_id uuid, p_deck jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms;
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can configure Charades.'; end if;
  if target.game_id <> 'charades' then raise exception 'This room is not playing Charades.'; end if;
  if jsonb_typeof(p_deck) <> 'array' or jsonb_array_length(p_deck) not between 1 and 2884 then raise exception 'Invalid Charades allocation.'; end if;
  if exists (select 1 from jsonb_array_elements(p_deck) item where jsonb_typeof(item) <> 'string') then raise exception 'Every Charades card must be text.'; end if;
  if (select count(*) from (select distinct value from jsonb_array_elements_text(p_deck)) unique_items) <> jsonb_array_length(p_deck) then raise exception 'Charades prompts must be unique.'; end if;
  insert into public.decked_charades_secrets(room_id, deck, updated_at) values (p_room_id, p_deck, now())
  on conflict (room_id) do update set deck = excluded.deck, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.decked_charades_rapid_action(p_room_id uuid, p_action text, p_expected_card_index integer, p_mutation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms; session jsonb; selected_team jsonb; selected_actor jsonb; actor_index integer; actor_user_id uuid; team_id text; scores jsonb; next_index integer; prompt_limit integer;
begin
  if p_action not in ('correct','skip','start','end') then raise exception 'Invalid Charades action.'; end if;
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.game_id <> 'charades' then raise exception 'This room is not playing Charades.'; end if;
  session := coalesce(target.game_state->'session', '{}'::jsonb);
  if coalesce((session->>'schemaVersion')::integer, 0) <> 5 or session->>'step' <> 'game' then raise exception 'Rapid Charades is not accepting actions.'; end if;
  if coalesce((session->>'cardIdx')::integer, -1) <> p_expected_card_index then raise exception 'This prompt has already advanced.'; end if;
  selected_team := session->'teams'->coalesce((session->>'currentTeamIdx')::integer, 0);
  actor_index := coalesce((session->'actorIdxByTeam'->>(selected_team->>'id'))::integer, 0);
  selected_actor := selected_team->'players'->(actor_index % jsonb_array_length(selected_team->'players'));
  actor_user_id := nullif(selected_actor->>'userId', '')::uuid;
  if auth.uid() is distinct from actor_user_id then raise exception 'Only the current actor can score or skip.'; end if;
  insert into public.decked_charades_mutations(room_id, mutation_id) values (p_room_id, p_mutation_id) on conflict do nothing;
  if not found then return; end if;
  team_id := selected_team->>'id'; scores := coalesce(session->'scores', '{}'::jsonb);
  if p_action = 'start' then
    if session->>'timerStatus' = 'running' then return; end if;
    session := jsonb_set(session, '{timerStatus}', '"running"'::jsonb, true);
    session := jsonb_set(session, '{timerEndsAt}', to_jsonb(floor(extract(epoch from clock_timestamp()) * 1000)::bigint + coalesce((session->>'roundLength')::integer, 60) * 1000), true);
    update public.decked_rooms set game_state = jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', session, true), version = version + 1, updated_at = now() where id = p_room_id;
    return;
  end if;
  if p_action = 'end' then
    session := jsonb_set(session, '{step}', '"pointsGained"'::jsonb, true);
    session := jsonb_set(session, '{timerStatus}', '"ready"'::jsonb, true);
    update public.decked_rooms set game_state = jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', session, true), version = version + 1, updated_at = now() where id = p_room_id;
    return;
  end if;
  if session->>'timerStatus' <> 'running' then raise exception 'The Charades timer is not running.'; end if;
  if p_action = 'correct' then scores := jsonb_set(scores, array[team_id], to_jsonb(coalesce((scores->>team_id)::integer, 0) + 1), true); end if;
  next_index := p_expected_card_index + 1;
  prompt_limit := (coalesce((session->>'turnIndex')::integer, 0) + 1) * coalesce((session->>'promptsPerTurn')::integer, 1);
  session := jsonb_set(session, '{scores}', scores, true);
  if next_index >= prompt_limit then
    session := jsonb_set(session, '{step}', '"pointsGained"'::jsonb, true);
  else
    session := jsonb_set(session, '{cardIdx}', to_jsonb(next_index), true);
  end if;
  update public.decked_rooms set game_state = jsonb_set(coalesce(game_state, '{}'::jsonb), '{session}', session, true), version = version + 1, updated_at = now() where id = p_room_id;
end;
$$;

create or replace function public.decked_get_charades_prompt(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare target public.decked_rooms; session jsonb; selected_team jsonb; selected_actor jsonb; actor_index integer; card_index integer; actor_user_id uuid; prompt text; may_see boolean := false;
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into target from public.decked_rooms where id = p_room_id;
  if target.game_id <> 'charades' then raise exception 'This room is not playing Charades.'; end if;
  session := coalesce(target.game_state->'session', '{}'::jsonb); selected_team := session->'teams'->coalesce((session->>'currentTeamIdx')::integer, 0);
  if selected_team is not null and jsonb_array_length(coalesce(selected_team->'players', '[]'::jsonb)) > 0 then actor_index := coalesce((session->'actorIdxByTeam'->>(selected_team->>'id'))::integer, 0); selected_actor := selected_team->'players'->(actor_index % jsonb_array_length(selected_team->'players')); actor_user_id := nullif(selected_actor->>'userId', '')::uuid; end if;
  card_index := coalesce((session->>'cardIdx')::integer, 0); select deck->>card_index into prompt from public.decked_charades_secrets where room_id = p_room_id;
  may_see := auth.uid() = actor_user_id or (coalesce((session->>'schemaVersion')::integer, 0) <> 5 and session->>'step' in ('didTheyGetIt','pointsGained','done'));
  return jsonb_build_object('prompt', case when may_see then prompt else null end, 'is_actor', auth.uid() = actor_user_id, 'actor_user_id', actor_user_id);
end;
$$;

revoke execute on function public.decked_charades_rapid_action(uuid, text, integer, uuid) from public, anon;

grant execute on function public.decked_charades_rapid_action(uuid, text, integer, uuid) to authenticated;
