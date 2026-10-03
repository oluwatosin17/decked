create or replace function public.decked_leave_room(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.decked_rooms
    where id = p_room_id and host_user_id = auth.uid()
  ) then
    raise exception 'The host must end the room for everyone.';
  end if;

  delete from public.decked_room_players
  where room_id = p_room_id and user_id = auth.uid();
end;
$$;

create or replace function public.decked_end_room(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.decked_rooms
  where id = p_room_id and host_user_id = auth.uid();

  if not found then
    raise exception 'Only the host can end this room.';
  end if;
end;
$$;

revoke execute on function public.decked_leave_room(uuid) from public, anon;
revoke execute on function public.decked_end_room(uuid) from public, anon;
grant execute on function public.decked_leave_room(uuid) to authenticated;
grant execute on function public.decked_end_room(uuid) to authenticated;
