create table if not exists public.decked_charades_secrets (
  room_id uuid primary key references public.decked_rooms(id) on delete cascade,
  deck jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.decked_charades_secrets enable row level security;

create or replace function public.decked_set_charades_deck(p_room_id uuid, p_deck jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms;
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.host_user_id is distinct from auth.uid() then raise exception 'Only the host can configure Charades.'; end if;
  if target.game_id <> 'charades' then raise exception 'This room is not playing Charades.'; end if;
  if jsonb_typeof(p_deck) <> 'array' or jsonb_array_length(p_deck) not between 1 and 50 then raise exception 'Choose between 1 and 50 Charades cards.'; end if;
  if exists (select 1 from jsonb_array_elements(p_deck) item where jsonb_typeof(item) <> 'string') then raise exception 'Every Charades card must be text.'; end if;

  insert into public.decked_charades_secrets(room_id, deck, updated_at)
  values (p_room_id, p_deck, now())
  on conflict (room_id) do update set deck = excluded.deck, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.decked_get_charades_prompt(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare
  target public.decked_rooms;
  session jsonb;
  selected_team jsonb;
  selected_actor jsonb;
  actor_index integer;
  card_index integer;
  actor_user_id uuid;
  prompt text;
  may_see boolean := false;
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into target from public.decked_rooms where id = p_room_id;
  if target.game_id <> 'charades' then raise exception 'This room is not playing Charades.'; end if;

  session := coalesce(target.game_state->'session', '{}'::jsonb);
  selected_team := session->'teams'->coalesce((session->>'currentTeamIdx')::integer, 0);
  if selected_team is not null and jsonb_array_length(coalesce(selected_team->'players', '[]'::jsonb)) > 0 then
    actor_index := coalesce((session->'actorIdxByTeam'->>(selected_team->>'id'))::integer, 0);
    selected_actor := selected_team->'players'->(actor_index % jsonb_array_length(selected_team->'players'));
    actor_user_id := nullif(selected_actor->>'userId', '')::uuid;
  end if;

  card_index := coalesce((session->>'cardIdx')::integer, 0);
  select deck->>card_index into prompt from public.decked_charades_secrets where room_id = p_room_id;
  may_see := auth.uid() = actor_user_id or session->>'step' in ('didTheyGetIt', 'pointsGained', 'done');

  return jsonb_build_object(
    'prompt', case when may_see then prompt else null end,
    'is_actor', auth.uid() = actor_user_id,
    'actor_user_id', actor_user_id
  );
end;
$$;

revoke all on table public.decked_charades_secrets from public, anon, authenticated;
revoke execute on function public.decked_set_charades_deck(uuid, jsonb) from public, anon;
revoke execute on function public.decked_get_charades_prompt(uuid) from public, anon;
grant execute on function public.decked_set_charades_deck(uuid, jsonb) to authenticated;
grant execute on function public.decked_get_charades_prompt(uuid) to authenticated;
