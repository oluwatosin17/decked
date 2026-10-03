alter table public.decked_room_players
  add column if not exists last_seen_at timestamptz not null default now();

alter table public.decked_rooms
  add column if not exists rematch_requests uuid[] not null default '{}';

create or replace function public.decked_touch_room(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.decked_room_players
  set last_seen_at = now()
  where room_id = p_room_id and user_id = auth.uid();
  if not found then raise exception 'You are not in this room.'; end if;
end;
$$;

create or replace function public.decked_request_rematch(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;
  update public.decked_rooms
  set rematch_requests = case
    when auth.uid() = any(rematch_requests) then rematch_requests
    else array_append(rematch_requests, auth.uid())
  end,
  version = version + 1
  where id = p_room_id;
end;
$$;

create or replace function public.decked_clear_rematch_requests(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.decked_rooms
  set rematch_requests = '{}', version = version + 1
  where id = p_room_id and host_user_id = auth.uid();
  if not found then raise exception 'Only the host can clear rematch requests.'; end if;
end;
$$;

create or replace function public.decked_claim_host(p_room_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.decked_rooms;
  host_last_seen timestamptz;
  successor uuid;
begin
  select * into target from public.decked_rooms where id = p_room_id for update;
  if target.id is null then raise exception 'Room not found.'; end if;
  if not public.decked_is_room_member(p_room_id, auth.uid()) then raise exception 'You are not in this room.'; end if;

  select last_seen_at into host_last_seen
  from public.decked_room_players
  where room_id = p_room_id and user_id = target.host_user_id;

  if host_last_seen is not null and host_last_seen > now() - interval '60 seconds' then
    raise exception 'The host is still connected.';
  end if;

  select user_id into successor
  from public.decked_room_players
  where room_id = p_room_id
    and user_id <> target.host_user_id
    and last_seen_at > now() - interval '75 seconds'
  order by position
  limit 1;

  if successor is null then raise exception 'No connected player can take over yet.'; end if;
  if successor <> auth.uid() then raise exception 'Another connected player is first in line to host.'; end if;

  update public.decked_rooms
  set host_user_id = successor, rematch_requests = '{}', version = version + 1
  where id = p_room_id;
end;
$$;

revoke execute on function public.decked_touch_room(uuid) from public, anon;
revoke execute on function public.decked_request_rematch(uuid) from public, anon;
revoke execute on function public.decked_clear_rematch_requests(uuid) from public, anon;
revoke execute on function public.decked_claim_host(uuid) from public, anon;
grant execute on function public.decked_touch_room(uuid) to authenticated;
grant execute on function public.decked_request_rematch(uuid) to authenticated;
grant execute on function public.decked_clear_rematch_requests(uuid) to authenticated;
grant execute on function public.decked_claim_host(uuid) to authenticated;
