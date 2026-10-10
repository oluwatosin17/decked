\set ON_ERROR_STOP on
begin;

insert into auth.users (id) values
 ('c1111111-1111-4111-8111-111111111111'),
 ('c2222222-2222-4222-8222-222222222222'),
 ('c3333333-3333-4333-8333-333333333333') on conflict (id) do nothing;
update auth.users set is_anonymous = true where id = 'c2222222-2222-4222-8222-222222222222';
insert into public.command_centre_staff(user_id, role) values
 ('c1111111-1111-4111-8111-111111111111', 'viewer'),
 ('c2222222-2222-4222-8222-222222222222', 'viewer')
 on conflict (user_id) do update set status = 'active';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'c2222222-2222-4222-8222-222222222222', true);
do $$ begin
  if (public.decked_get_command_centre_access()->>'authorized')::boolean then
    raise exception 'Anonymous gameplay account gained Command Centre access';
  end if;
  begin
    perform public.decked_get_command_centre_overview('production', current_date - 7, current_date, null);
    raise exception 'Unauthorized dashboard read unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', true);
do $$ begin
  if (public.decked_get_command_centre_access()->>'authorized')::boolean then
    raise exception 'Authenticated non-staff account gained Command Centre access';
  end if;
  begin
    perform public.decked_get_command_centre_overview('production', current_date - 7, current_date, null);
    raise exception 'Authenticated non-staff dashboard read unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform count(*) from public.analytics_events;
    raise exception 'Authenticated non-staff raw analytics read unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', true);
do $$ declare access jsonb; overview jsonb; begin
  access := public.decked_get_command_centre_access();
  if not (access->>'authorized')::boolean or access->>'role' <> 'viewer' then
    raise exception 'Provisioned staff access failed: %', access;
  end if;
  overview := public.decked_get_command_centre_overview('production', current_date - 7, current_date, null);
  if overview->'kpis' is null or overview->'games' is null then
    raise exception 'Overview did not return the bounded response shape';
  end if;
end $$;

reset role;
rollback;
