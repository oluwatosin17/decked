-- Authoritative multiplayer analytics. Gameplay RPC signatures, result shapes,
-- RLS policies, and authorization checks remain unchanged.

create table public.analytics_room_links (
  room_id uuid primary key,
  multiplayer_room_ref uuid not null unique default gen_random_uuid(),
  environment text not null check (environment in ('development', 'preview', 'production')),
  current_game_session_id uuid,
  game_started_at timestamptz,
  game_completed boolean not null default false
);

comment on table public.analytics_room_links is
  'Restricted operational-to-analytics lookup. Removed when a room ends; durable analytics tables retain only multiplayer_room_ref.';
comment on column public.analytics_room_links.room_id is
  'Sensitive operational UUID. Never expose in dashboards or copy into durable analytics facts.';

alter table public.analytics_room_links enable row level security;
revoke all on table public.analytics_room_links from public, anon, authenticated;
grant select, insert, update, delete on table public.analytics_room_links to service_role;

create function public.decked_analytics_environment()
returns text language plpgsql stable set search_path = '' as $$
declare configured text := current_setting('app.settings.analytics_environment', true);
begin
  return case when configured in ('development', 'preview', 'production') then configured else 'production' end;
end;
$$;

create function public.decked_multiplayer_session_is_terminal(p_session jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_session->>'step', '') in ('done', 'winner')
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

create function public.decked_multiplayer_card_number(p_session jsonb)
returns integer language sql immutable set search_path = '' as $$
  select greatest(0, coalesce(
    (p_session->>'cardIndex')::integer,
    (p_session->>'cardIdx')::integer,
    (p_session->>'gameCardIndex')::integer,
    (p_session->>'challengeIdx')::integer,
    (p_session->>'idx')::integer,
    0
  ));
$$;

create function public.decked_write_database_event(
  p_name text, p_room_ref uuid, p_game_id text, p_game_session_id uuid,
  p_properties jsonb, p_idempotency_key text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.analytics_events (
    event_id, event_name, source, environment, occurred_at, supabase_user_id,
    game_session_id, multiplayer_room_ref, game_id, play_mode, app_version,
    properties, idempotency_key
  ) values (
    gen_random_uuid(), p_name, 'database', public.decked_analytics_environment(), now(), auth.uid(),
    p_game_session_id, p_room_ref, p_game_id, 'play_together', 'database',
    coalesce(p_properties, '{}'::jsonb), p_idempotency_key
  ) on conflict do nothing;
end;
$$;

create function public.decked_capture_room_analytics()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  link public.analytics_room_links;
  room_session jsonb;
  old_session jsonb;
  player_count integer;
  request_count integer;
  old_card integer;
  new_card integer;
  new_session_id uuid;
  previous_session_id uuid;
begin
  -- Each exception block is an implicit savepoint. A telemetry defect therefore
  -- rolls back only analytics writes, never the successful gameplay mutation.
  begin
    if tg_op = 'INSERT' then
      insert into public.analytics_room_links(room_id, environment)
      values (new.id, public.decked_analytics_environment()) returning * into link;
      insert into public.analytics_room_facts(
        multiplayer_room_ref, environment, game_id, created_at, peak_player_count, last_activity_at
      ) values (link.multiplayer_room_ref, link.environment, new.game_id, new.created_at, 1, new.created_at);
      perform public.decked_write_database_event(
        'room_created', link.multiplayer_room_ref, new.game_id, null,
        jsonb_build_object('game_id', new.game_id, 'multiplayer_room_ref', link.multiplayer_room_ref),
        'room-created:' || link.multiplayer_room_ref
      );
      return new;
    end if;

    select * into link from public.analytics_room_links where room_id = case when tg_op = 'DELETE' then old.id else new.id end for update;
    if link.room_id is null then
      if tg_op = 'DELETE' then return old; end if;
      return new;
    end if;

    if tg_op = 'DELETE' then
      select count(*) into player_count from public.decked_room_players where room_id = old.id;
      update public.analytics_room_facts set ended_at = coalesce(ended_at, now()),
        expired_at = case when old.expires_at <= now() then coalesce(expired_at, now()) else expired_at end,
        end_reason = case when old.expires_at <= now() then 'expired' else 'host_ended' end,
        last_activity_at = now() where multiplayer_room_ref = link.multiplayer_room_ref;
      perform public.decked_write_database_event(
        'room_ended', link.multiplayer_room_ref, old.game_id, link.current_game_session_id,
        jsonb_build_object('game_id', old.game_id, 'multiplayer_room_ref', link.multiplayer_room_ref,
          'lifecycle_stage', old.status, 'player_count', player_count,
          'room_age_seconds', greatest(0, extract(epoch from now() - old.created_at)::integer)),
        'room-ended:' || link.multiplayer_room_ref
      );
      delete from public.analytics_room_links where room_id = old.id;
      return old;
    end if;

    room_session := coalesce(new.game_state->'session', '{}'::jsonb);
    old_session := coalesce(old.game_state->'session', '{}'::jsonb);
    select count(*) into player_count from public.decked_room_players where room_id = new.id;

    if old.status = 'lobby' and new.status = 'playing' then
      new_session_id := gen_random_uuid();
      update public.analytics_room_links set current_game_session_id = new_session_id,
        game_started_at = now(), game_completed = false where room_id = new.id returning * into link;
      insert into public.analytics_game_sessions(
        game_session_id, environment, multiplayer_room_ref, game_id, play_mode, status,
        setup_started_at, started_at, last_activity_at, configured_card_count,
        player_count, app_version_started
      ) values (
        new_session_id, link.environment, link.multiplayer_room_ref, new.game_id, 'play_together', 'started',
        now(), now(), now(), new.total_cards, player_count, 'database'
      );
      update public.analytics_room_facts set setup_started_at = coalesce(setup_started_at, now()),
        first_game_started_at = coalesce(first_game_started_at, now()), last_activity_at = now()
        where multiplayer_room_ref = link.multiplayer_room_ref;
      perform public.decked_write_database_event(
        'multiplayer_setup_started', link.multiplayer_room_ref, new.game_id, null,
        jsonb_build_object('game_id', new.game_id, 'multiplayer_room_ref', link.multiplayer_room_ref,
          'room_player_count', player_count), 'room-setup:' || link.multiplayer_room_ref
      );
      perform public.decked_write_database_event(
        'multiplayer_game_started', link.multiplayer_room_ref, new.game_id, new_session_id,
        jsonb_build_object('game_id', new.game_id, 'multiplayer_room_ref', link.multiplayer_room_ref,
          'game_session_id', new_session_id, 'player_count', player_count),
        'game-started:' || new_session_id
      );
    end if;

    old_card := public.decked_multiplayer_card_number(old_session);
    new_card := public.decked_multiplayer_card_number(room_session);
    if link.current_game_session_id is not null and new_card > old_card then
      update public.analytics_game_sessions set cards_presented = greatest(cards_presented, new_card + 1),
        last_activity_at = now(), updated_at = now() where game_session_id = link.current_game_session_id;
      perform public.decked_write_database_event(
        'card_advanced', link.multiplayer_room_ref, new.game_id, link.current_game_session_id,
        jsonb_build_object('game_id', new.game_id, 'from_card_number', old_card + 1,
          'to_card_number', new_card + 1, 'advance_reason', 'multiplayer_progression'),
        'card-advanced:' || link.current_game_session_id || ':' || new_card
      );
    end if;

    if link.current_game_session_id is not null and not link.game_completed
       and (public.decked_multiplayer_session_is_terminal(room_session)
         or (old.status = 'playing' and new.status = 'finished')) then
      update public.analytics_room_links set game_completed = true where room_id = new.id;
      update public.analytics_game_sessions set status = 'completed', completed_at = now(),
        last_activity_at = now(), cards_presented = greatest(cards_presented, new_card + 1),
        completion_reason = 'completed', updated_at = now()
        where game_session_id = link.current_game_session_id;
      update public.analytics_room_facts set last_game_completed_at = now(), last_activity_at = now()
        where multiplayer_room_ref = link.multiplayer_room_ref;
      perform public.decked_write_database_event(
        'multiplayer_game_completed', link.multiplayer_room_ref, new.game_id, link.current_game_session_id,
        jsonb_build_object('game_id', new.game_id, 'multiplayer_room_ref', link.multiplayer_room_ref,
          'game_session_id', link.current_game_session_id, 'cards_presented', new_card + 1,
          'cards_skipped', 0, 'rounds_completed', 1,
          'duration_seconds', greatest(0, extract(epoch from now() - link.game_started_at)::integer),
          'player_count', player_count), 'game-completed:' || link.current_game_session_id
      );
    end if;

    request_count := coalesce(array_length(new.rematch_requests, 1), 0);
    if request_count > coalesce(array_length(old.rematch_requests, 1), 0) then
      update public.analytics_room_facts set rematch_request_count = rematch_request_count + 1,
        last_activity_at = now() where multiplayer_room_ref = link.multiplayer_room_ref;
      perform public.decked_write_database_event(
        'rematch_requested', link.multiplayer_room_ref, new.game_id, link.current_game_session_id,
        jsonb_build_object('game_id', new.game_id, 'multiplayer_room_ref', link.multiplayer_room_ref,
          'request_count', request_count),
        'rematch-request:' || link.multiplayer_room_ref || ':' || request_count
      );
    end if;

    if link.game_completed and public.decked_multiplayer_session_is_terminal(old_session)
       and not public.decked_multiplayer_session_is_terminal(room_session) then
      previous_session_id := link.current_game_session_id;
      new_session_id := gen_random_uuid();
      update public.analytics_room_links set current_game_session_id = new_session_id,
        game_started_at = now(), game_completed = false where room_id = new.id;
      insert into public.analytics_game_sessions(
        game_session_id, environment, multiplayer_room_ref, game_id, play_mode, status,
        setup_started_at, started_at, last_activity_at, configured_card_count, player_count, app_version_started
      ) values (new_session_id, link.environment, link.multiplayer_room_ref, new.game_id,
        'play_together', 'started', now(), now(), now(), new.total_cards, player_count, 'database');
      update public.analytics_room_facts set rematch_start_count = rematch_start_count + 1,
        last_activity_at = now() where multiplayer_room_ref = link.multiplayer_room_ref;
      perform public.decked_write_database_event(
        'rematch_started', link.multiplayer_room_ref, new.game_id, new_session_id,
        jsonb_build_object('game_id', new.game_id, 'multiplayer_room_ref', link.multiplayer_room_ref,
          'previous_game_session_id', previous_session_id, 'new_game_session_id', new_session_id,
          'request_count', coalesce(array_length(old.rematch_requests, 1), 0), 'player_count', player_count),
        'rematch-started:' || new_session_id
      );
    end if;

    if old.host_user_id is distinct from new.host_user_id then
      update public.analytics_room_facts set host_disconnect_count = host_disconnect_count + 1,
        host_handoff_count = host_handoff_count + 1, last_activity_at = now()
        where multiplayer_room_ref = link.multiplayer_room_ref;
      perform public.decked_write_database_event('host_disconnected', link.multiplayer_room_ref, new.game_id,
        link.current_game_session_id, jsonb_build_object('game_id', new.game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref, 'room_status', new.status,
          'offline_threshold_seconds', 60), 'host-disconnected:' || link.multiplayer_room_ref || ':' || new.version);
      perform public.decked_write_database_event('host_handoff_completed', link.multiplayer_room_ref, new.game_id,
        link.current_game_session_id, jsonb_build_object('game_id', new.game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref, 'room_status', new.status,
          'handoff_reason', 'host_offline'), 'host-handoff:' || link.multiplayer_room_ref || ':' || new.version);
    end if;
  exception when others then
    raise warning 'Decked analytics capture failed: %', sqlerrm;
  end;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function public.decked_capture_player_analytics()
returns trigger language plpgsql security definer set search_path = '' as $$
declare link public.analytics_room_links; room_record public.decked_rooms; player_count integer;
begin
  begin
    select * into link from public.analytics_room_links where room_id = case when tg_op = 'DELETE' then old.room_id else new.room_id end;
    select * into room_record from public.decked_rooms where id = case when tg_op = 'DELETE' then old.room_id else new.room_id end;
    if link.room_id is null or room_record.id is null then
      if tg_op = 'DELETE' then return old; end if;
      return new;
    end if;
    select count(*) into player_count from public.decked_room_players where room_id = room_record.id;
    if tg_op = 'INSERT' and new.position > 0 then
      update public.analytics_room_facts set first_guest_joined_at = coalesce(first_guest_joined_at, now()),
        successful_join_count = successful_join_count + 1,
        peak_player_count = greatest(peak_player_count, player_count), last_activity_at = now()
        where multiplayer_room_ref = link.multiplayer_room_ref;
      perform public.decked_write_database_event('room_joined', link.multiplayer_room_ref, room_record.game_id,
        link.current_game_session_id, jsonb_build_object('game_id', room_record.game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref, 'room_player_count', player_count,
          'is_rejoin', false, 'is_first_guest', player_count = 2),
        'room-joined:' || link.multiplayer_room_ref || ':' || new.position);
    elsif tg_op = 'DELETE' then
      perform public.decked_write_database_event('player_left_room', link.multiplayer_room_ref, room_record.game_id,
        link.current_game_session_id, jsonb_build_object('game_id', room_record.game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref, 'room_status_at_exit', room_record.status,
          'remaining_player_count', player_count),
        'player-left:' || link.multiplayer_room_ref || ':' || old.position || ':' || room_record.version);
      update public.analytics_room_facts set last_activity_at = now()
        where multiplayer_room_ref = link.multiplayer_room_ref;
    end if;
  exception when others then
    raise warning 'Decked player analytics capture failed: %', sqlerrm;
  end;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger decked_rooms_analytics_insert after insert on public.decked_rooms
for each row execute function public.decked_capture_room_analytics();
create trigger decked_rooms_analytics_update after update on public.decked_rooms
for each row execute function public.decked_capture_room_analytics();
create trigger decked_rooms_analytics_delete before delete on public.decked_rooms
for each row execute function public.decked_capture_room_analytics();
create trigger decked_room_players_analytics_insert after insert on public.decked_room_players
for each row execute function public.decked_capture_player_analytics();
create trigger decked_room_players_analytics_delete after delete on public.decked_room_players
for each row execute function public.decked_capture_player_analytics();

create function public.decked_get_room_analytics_ref(p_room_id uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare result uuid;
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  select multiplayer_room_ref into result from public.analytics_room_links where room_id = p_room_id;
  return result;
end;
$$;

revoke all on function public.decked_analytics_environment() from public, anon, authenticated;
revoke all on function public.decked_multiplayer_session_is_terminal(jsonb) from public, anon, authenticated;
revoke all on function public.decked_multiplayer_card_number(jsonb) from public, anon, authenticated;
revoke all on function public.decked_write_database_event(text, uuid, text, uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.decked_capture_room_analytics() from public, anon, authenticated;
revoke all on function public.decked_capture_player_analytics() from public, anon, authenticated;
revoke all on function public.decked_get_room_analytics_ref(uuid) from public, anon;
grant execute on function public.decked_get_room_analytics_ref(uuid) to authenticated;
