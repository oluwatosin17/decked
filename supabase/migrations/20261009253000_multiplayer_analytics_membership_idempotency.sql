-- Give each operational room-membership row an opaque analytics idempotency
-- component. This distinguishes a genuine leave/rejoin cycle from an RPC retry
-- without retaining the player row UUID, auth user UUID, display name, or code.

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
      public.digest(
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

revoke all on function public.decked_capture_player_analytics() from public, anon, authenticated;

comment on function public.decked_capture_player_analytics() is
  'Best-effort authoritative membership analytics. Idempotency uses a one-way digest of the transient player-row UUID; no display name, room code, auth user ID, or operational player ID is stored.';
