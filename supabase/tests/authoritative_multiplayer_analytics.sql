-- Run after all migrations against a disposable/non-production database.
\set ON_ERROR_STOP on

begin;
select pg_catalog.set_config('app.settings.analytics_environment', 'development', true);

insert into auth.users (id) values
  ('a1111111-1111-4111-8111-111111111111'),
  ('b2222222-2222-4222-8222-222222222222'),
  ('c3333333-3333-4333-8333-333333333333')
on conflict (id) do nothing;

do $$
begin
  if has_table_privilege('anon', 'public.analytics_room_links', 'SELECT')
     or has_table_privilege('anon', 'public.analytics_room_links', 'INSERT')
     or has_table_privilege('anon', 'public.analytics_room_links', 'UPDATE')
     or has_table_privilege('anon', 'public.analytics_room_links', 'DELETE')
     or has_table_privilege('authenticated', 'public.analytics_room_links', 'SELECT')
     or has_table_privilege('authenticated', 'public.analytics_room_links', 'INSERT')
     or has_table_privilege('authenticated', 'public.analytics_room_links', 'UPDATE')
     or has_table_privilege('authenticated', 'public.analytics_room_links', 'DELETE') then
    raise exception 'Browser roles must not access analytics room links';
  end if;
  if not has_function_privilege('authenticated', 'public.decked_get_room_analytics_ref(uuid)', 'EXECUTE') then
    raise exception 'Authenticated room members need the restricted analytics-ref RPC';
  end if;
end;
$$;

select pg_catalog.set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

create temp table analytics_test_state(room_id uuid, room_ref uuid, game_session_id uuid, code text) on commit drop;
create temp table expired_room_state(room_id uuid, room_ref uuid, code text) on commit drop;
do $$
declare payload jsonb; created_room_id uuid; safe_ref uuid;
begin
  payload := public.decked_create_room('Host private name', 'truth-or-dare');
  created_room_id := (payload->'room'->>'id')::uuid;
  safe_ref := public.decked_get_room_analytics_ref(created_room_id);
  insert into analytics_test_state(room_id, room_ref, code)
  select created_room_id, safe_ref, code from public.decked_rooms where id = created_room_id;
  if safe_ref is null or payload::text like '%' || safe_ref::text || '%' then
    raise exception 'Room response shape exposed or omitted the restricted analytics reference';
  end if;
end;
$$;

do $$
declare payload jsonb; expired_id uuid;
begin
  payload := public.decked_create_room('Second host', 'icebreaker');
  expired_id := (payload->'room'->>'id')::uuid;
  insert into expired_room_state(room_id, room_ref, code)
  select expired_id, public.decked_get_room_analytics_ref(expired_id), r.code
  from public.decked_rooms r where r.id = expired_id;
end;
$$;

reset role;
update public.decked_rooms set expires_at = now() - interval '1 minute'
where id = (select room_id from expired_room_state);
set local role authenticated;

select pg_catalog.set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
do $$
declare payload jsonb; joined_room uuid;
begin
  begin
    perform public.decked_join_room((select code from expired_room_state), 'Guest private name');
    raise exception 'Expired room join unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Expired room join unexpectedly succeeded' then raise; end if;
  end;

  select public.decked_join_room(r.code, 'Guest private name') into payload
  from public.decked_rooms r join analytics_test_state s on s.room_id = r.id;
  joined_room := (payload->'room'->>'id')::uuid;
  -- A retry updates the operational player but must not duplicate the join fact.
  perform public.decked_join_room(r.code, 'Guest private name')
  from public.decked_rooms r where r.id = joined_room;

  begin
    perform public.decked_start_multi_game(joined_room, 2, 2, '{}'::jsonb);
    raise exception 'Non-host start unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Non-host start unexpectedly succeeded' then raise; end if;
  end;
end;
$$;

select pg_catalog.set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', true);
do $$
declare target uuid; target_code text;
begin
  select room_id, code into target, target_code from analytics_test_state;
  perform public.decked_join_room(target_code, 'Temporary private guest');
  perform public.decked_leave_room(target);
  perform public.decked_join_room(target_code, 'Temporary private guest');
  perform public.decked_leave_room(target);

  begin
    perform public.decked_get_room_analytics_ref(target);
    raise exception 'Non-member analytics reference lookup unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Non-member analytics reference lookup unexpectedly succeeded' then raise; end if;
  end;
end;
$$;

select pg_catalog.set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
do $$
declare target uuid;
begin
  select room_id into target from analytics_test_state;
  perform public.decked_start_multi_game(target, 2, 2, '{}'::jsonb);
  perform public.decked_set_session_value(target, 'step', '"game"'::jsonb);
  perform public.decked_set_session_value(target, 'totalCards', '2'::jsonb);
  perform public.decked_set_session_value(target, 'cardIndex', '1'::jsonb);
  perform public.decked_set_session_value(target, 'step', '"done"'::jsonb);
end;
$$;

reset role;
update public.decked_room_players set last_seen_at = now() - interval '2 minutes'
where user_id = 'a1111111-1111-4111-8111-111111111111';
set local role authenticated;
select pg_catalog.set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
do $$
declare target uuid;
begin
  select room_id into target from analytics_test_state;
  perform public.decked_request_rematch(target);
  perform public.decked_claim_host(target);
  perform public.decked_set_session_value(target, 'step', '"game"'::jsonb);
  perform public.decked_end_room(target);
end;
$$;

reset role;
do $$
declare state analytics_test_state; join_events integer; leave_events integer; stored_sensitive boolean;
begin
  select * into state from analytics_test_state;
  select count(*) into join_events from public.analytics_events
    where multiplayer_room_ref = state.room_ref and event_name = 'room_joined';
  if join_events <> 3 then raise exception 'Expected three durable join facts, got %', join_events; end if;
  select count(*) into leave_events from public.analytics_events
    where multiplayer_room_ref = state.room_ref and event_name = 'player_left_room';
  if leave_events <> 2 then raise exception 'Expected two durable leave facts, got %', leave_events; end if;
  if exists (
    select 1 from public.analytics_events e join expired_room_state x on x.room_ref = e.multiplayer_room_ref
    where e.event_name = 'room_joined'
  ) then raise exception 'Expired room denial created a successful join fact'; end if;
  if exists (select 1 from public.analytics_room_links where room_id = state.room_id) then
    raise exception 'Operational analytics link survived room deletion';
  end if;
  if not exists (select 1 from public.analytics_room_facts
      where multiplayer_room_ref = state.room_ref and ended_at is not null
        and host_handoff_count = 1 and host_disconnect_count = 1
        and rematch_request_count = 1 and rematch_start_count = 1
        and successful_join_count = 3) then
    raise exception 'Durable room facts did not survive room deletion';
  end if;
  if not exists (select 1 from public.analytics_game_sessions
      where multiplayer_room_ref = state.room_ref and status = 'completed') then
    raise exception 'Completed game session did not survive room deletion';
  end if;
  select exists (
    select 1 from public.analytics_events
    where multiplayer_room_ref = state.room_ref
      and (
        properties::text ilike '%Host private name%'
        or properties::text ilike '%Guest private name%'
        or properties::text ilike '%Temporary private guest%'
        or properties::text ilike '%' || state.code || '%'
      )
  ) into stored_sensitive;
  if stored_sensitive then raise exception 'Analytics stored a display name or room code'; end if;
  if not exists (select 1 from public.analytics_events where multiplayer_room_ref = state.room_ref and event_name = 'room_ended')
     or not exists (select 1 from public.analytics_events where multiplayer_room_ref = state.room_ref and event_name = 'host_handoff_completed')
     or not exists (select 1 from public.analytics_events where multiplayer_room_ref = state.room_ref and event_name = 'rematch_started')
     or not exists (select 1 from public.analytics_events where multiplayer_room_ref = state.room_ref and event_name = 'multiplayer_game_completed') then
    raise exception 'Expected lifecycle events are missing';
  end if;
end;
$$;

rollback;
