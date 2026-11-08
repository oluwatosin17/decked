-- Recovered from the linked project's Supabase migration history.

-- Repair authoritative multiplayer membership analytics on hosted Supabase.
-- pgcrypto is installed in the extensions schema there, while the current
-- trigger function incorrectly calls public.digest(). Gameplay RPCs, tables,
-- triggers, privileges and historical analytics rows are intentionally unchanged.

begin;

set local lock_timeout = '10s';
set local statement_timeout = '30s';
select pg_advisory_xact_lock(hashtext('decked:fix-multiplayer-membership-digest-schema:20261019'));

do $$
declare
  function_definition text;
  function_security_definer boolean;
  function_config text[];
begin
  if to_regprocedure('extensions.digest(text,text)') is null then
    raise exception 'membership analytics repair: extensions.digest(text,text) is unavailable';
  end if;

  if to_regprocedure('public.decked_capture_player_analytics()') is null then
    raise exception 'membership analytics repair: target function is missing';
  end if;

  select pg_get_functiondef(p.oid), p.prosecdef, p.proconfig
    into function_definition, function_security_definer, function_config
  from pg_proc p
  where p.oid = 'public.decked_capture_player_analytics()'::regprocedure;

  if position('public.digest(' in function_definition) = 0
     or position('extensions.digest(' in function_definition) > 0 then
    raise exception 'membership analytics repair: production function definition differs from the reviewed defective version';
  end if;

  if not function_security_definer
     or not coalesce(function_config @> array['search_path=""'], false) then
    raise exception 'membership analytics repair: security-definer/search-path contract differs';
  end if;

  if has_function_privilege('public', 'public.decked_capture_player_analytics()', 'EXECUTE')
     or has_function_privilege('anon', 'public.decked_capture_player_analytics()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.decked_capture_player_analytics()', 'EXECUTE') then
    raise exception 'membership analytics repair: browser-role execute privileges differ';
  end if;

  if (select count(*) from pg_trigger t
      where t.tgrelid = 'public.decked_room_players'::regclass
        and not t.tgisinternal
        and t.tgname in ('decked_room_players_analytics_insert', 'decked_room_players_analytics_delete')
        and t.tgenabled = 'O'
        and t.tgfoid = 'public.decked_capture_player_analytics()'::regprocedure) <> 2 then
    raise exception 'membership analytics repair: expected enabled player analytics triggers are missing or changed';
  end if;
end;
$$;

create or replace function public.decked_capture_player_analytics()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  link public.analytics_room_links;
  room_record public.decked_rooms;
  player_count integer;
  membership_key text;
begin
  begin
    select * into link
    from public.analytics_room_links
    where room_id = case when tg_op = 'DELETE' then old.room_id else new.room_id end;

    select * into room_record
    from public.decked_rooms
    where id = case when tg_op = 'DELETE' then old.room_id else new.room_id end;

    if link.room_id is null or room_record.id is null then
      if tg_op = 'DELETE' then return old; end if;
      return new;
    end if;

    membership_key := pg_catalog.encode(
      extensions.digest(
        (case when tg_op = 'DELETE' then old.id else new.id end)::text,
        'sha256'
      ),
      'hex'
    );

    select count(*) into player_count
    from public.decked_room_players
    where room_id = room_record.id;

    if tg_op = 'INSERT' and new.position > 0 then
      update public.analytics_room_facts
      set first_guest_joined_at = coalesce(first_guest_joined_at, now()),
          successful_join_count = successful_join_count + 1,
          peak_player_count = greatest(peak_player_count, player_count),
          last_activity_at = now()
      where multiplayer_room_ref = link.multiplayer_room_ref;

      perform public.decked_write_database_event(
        'room_joined',
        link.multiplayer_room_ref,
        room_record.game_id,
        link.current_game_session_id,
        jsonb_build_object(
          'game_id', room_record.game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref,
          'room_player_count', player_count,
          'is_rejoin', false,
          'is_first_guest', player_count = 2
        ),
        'room-joined:' || link.multiplayer_room_ref || ':' || membership_key
      );
    elsif tg_op = 'DELETE' then
      perform public.decked_write_database_event(
        'player_left_room',
        link.multiplayer_room_ref,
        room_record.game_id,
        link.current_game_session_id,
        jsonb_build_object(
          'game_id', room_record.game_id,
          'multiplayer_room_ref', link.multiplayer_room_ref,
          'room_status_at_exit', room_record.status,
          'remaining_player_count', player_count
        ),
        'player-left:' || link.multiplayer_room_ref || ':' || membership_key
      );

      update public.analytics_room_facts
      set last_activity_at = now()
      where multiplayer_room_ref = link.multiplayer_room_ref;
    end if;
  exception when others then
    raise warning 'Decked player analytics capture failed: %', sqlerrm;
  end;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

do $$
declare function_definition text;
begin
  select pg_get_functiondef(p.oid) into function_definition
  from pg_proc p where p.oid = 'public.decked_capture_player_analytics()'::regprocedure;

  if position('extensions.digest(' in function_definition) = 0
     or position('public.digest(' in function_definition) > 0 then
    raise exception 'membership analytics repair: corrected digest reference was not installed';
  end if;

  if not (select p.prosecdef and coalesce(p.proconfig @> array['search_path=""'], false)
          from pg_proc p where p.oid = 'public.decked_capture_player_analytics()'::regprocedure) then
    raise exception 'membership analytics repair: function security contract changed';
  end if;

  if has_function_privilege('public', 'public.decked_capture_player_analytics()', 'EXECUTE')
     or has_function_privilege('anon', 'public.decked_capture_player_analytics()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.decked_capture_player_analytics()', 'EXECUTE') then
    raise exception 'membership analytics repair: browser-role execute privileges changed';
  end if;

  if (select count(*) from pg_trigger t
      where t.tgrelid = 'public.decked_room_players'::regclass
        and not t.tgisinternal
        and t.tgname in ('decked_room_players_analytics_insert', 'decked_room_players_analytics_delete')
        and t.tgenabled = 'O'
        and t.tgfoid = 'public.decked_capture_player_analytics()'::regprocedure) <> 2 then
    raise exception 'membership analytics repair: player analytics triggers changed';
  end if;
end;
$$;

commit;
