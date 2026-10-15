-- A best-effort audit write must never prevent an authorized staff member
-- from opening the Command Centre. Access remains determined exclusively by
-- the active staff record and the authenticated, non-anonymous user session.
create or replace function public.decked_get_command_centre_access()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  staff_role text;
begin
  if auth.uid() is null or not exists (
    select 1
    from auth.users
    where id = auth.uid()
      and not coalesce(is_anonymous, false)
  ) then
    return jsonb_build_object(
      'authorized', false,
      'reason', 'staff_session_required'
    );
  end if;

  select role
  into staff_role
  from public.command_centre_staff
  where user_id = auth.uid()
    and status = 'active';

  if staff_role is null then
    return jsonb_build_object(
      'authorized', false,
      'reason', 'staff_access_required'
    );
  end if;

  begin
    insert into public.command_centre_audit_log(
      actor_user_id,
      actor_role,
      action
    ) values (
      auth.uid(),
      staff_role,
      'command_centre_accessed'
    );
  exception
    when others then
      raise warning 'Command Centre access audit write failed: %', sqlerrm;
  end;

  return jsonb_build_object(
    'authorized', true,
    'role', staff_role
  );
end;
$$;

revoke all on function public.decked_get_command_centre_access() from public, anon;
grant execute on function public.decked_get_command_centre_access() to authenticated;

comment on function public.decked_get_command_centre_access() is
  'Returns active staff access. Audit logging is best-effort and cannot lock authorized staff out.';
