\set ON_ERROR_STOP on
begin;

do $$ begin
  if not (select relrowsecurity from pg_class where oid='public.analytics_event_geography'::regclass) then raise exception 'Geography RLS is disabled';end if;
  if has_table_privilege('anon','public.analytics_event_geography','SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated','public.analytics_event_geography','SELECT,INSERT,UPDATE,DELETE') then raise exception 'Browser role can access geography rows';end if;
  if has_function_privilege('authenticated','public.decked_attach_analytics_geography(jsonb)','EXECUTE') then raise exception 'Browser role can attach trusted geography';end if;
end $$;

insert into auth.users(id,is_anonymous) values('f9111111-1111-4111-8111-111111111111',false) on conflict(id) do nothing;
insert into public.command_centre_staff(user_id,role) values('f9111111-1111-4111-8111-111111111111','viewer') on conflict(user_id) do update set role='viewer',status='active';
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,app_version,properties)
values('f9222222-2222-4222-8222-222222222222','app_opened','browser','development',now(),'f9333333-3333-4333-8333-333333333333','f9444444-4444-4444-8444-444444444444','geo-test','{"initial_screen_id":"home","entry_path":"/","is_pwa":false,"device_class":"mobile"}');

set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select public.decked_attach_analytics_geography('[{"environment":"development","event_id":"f9222222-2222-4222-8222-222222222222","country_code":"NG","continent_code":"AF"}]');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f9111111-1111-4111-8111-111111111111',true);
do $$ declare result jsonb;begin
  result:=public.decked_command_centre_geography('development',current_date-1,current_date);
  if result#>>'{countries,0,country_code}'<>'OTHER' then raise exception 'Small sample was not grouped: %',result;end if;
  begin perform public.decked_attach_analytics_geography('[]');raise exception 'Viewer attached geography';exception when insufficient_privilege then null;end;
end $$;

rollback;
