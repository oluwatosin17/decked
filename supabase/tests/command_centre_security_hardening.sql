\set ON_ERROR_STOP on
begin;

insert into auth.users(id,is_anonymous) values
 ('f1111111-1111-4111-8111-111111111111',false),
 ('f2222222-2222-4222-8222-222222222222',false),
 ('f3333333-3333-4333-8333-333333333333',true)
on conflict(id) do update set is_anonymous=excluded.is_anonymous;
insert into public.command_centre_staff(user_id,role) values
 ('f1111111-1111-4111-8111-111111111111','admin'),
 ('f2222222-2222-4222-8222-222222222222','viewer'),
 ('f3333333-3333-4333-8333-333333333333','admin')
on conflict(user_id) do update set role=excluded.role,status='active';

do $$ declare protected_table text; begin
  foreach protected_table in array array[
    'analytics_events','analytics_game_sessions','analytics_room_facts','analytics_daily_aggregates','analytics_room_links',
    'analytics_funnel_daily','analytics_daily_active_users','analytics_daily_session_health','analytics_aggregate_refreshes',
    'analytics_user_first_seen','analytics_ingest_rate_limits','command_centre_staff','command_centre_audit_log'
  ] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=protected_table and c.relrowsecurity) then
      raise exception 'RLS is not enabled on public.%',protected_table;
    end if;
    if has_table_privilege('anon','public.'||protected_table,'SELECT,INSERT,UPDATE,DELETE')
       or has_table_privilege('authenticated','public.'||protected_table,'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'Browser role has direct privileges on public.%',protected_table;
    end if;
  end loop;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f3333333-3333-4333-8333-333333333333',true);
do $$ begin
  if (public.decked_get_command_centre_access()->>'authorized')::boolean then raise exception 'Anonymous-auth account escalated through a staff row'; end if;
  begin perform public.decked_command_centre_overview_v2('production',current_date-7,current_date,null,null);raise exception 'Anonymous-auth aggregate read succeeded';exception when insufficient_privilege then null;end;
  begin perform public.decked_command_centre_audit_log(current_date-7,current_date,null);raise exception 'Anonymous-auth audit read succeeded';exception when insufficient_privilege then null;end;
end $$;

select set_config('request.jwt.claim.sub','f2222222-2222-4222-8222-222222222222',true);
do $$ declare result jsonb; payload jsonb; begin
  if not public.decked_analytics_properties_are_safe(jsonb_build_object('custom_card_count',2)) then
    raise exception 'Approved aggregate custom-card count was rejected';
  end if;
  begin insert into public.command_centre_staff(user_id,role) values(auth.uid(),'admin') on conflict(user_id) do update set role='admin';raise exception 'Viewer assigned itself admin';exception when insufficient_privilege then null;end;
  begin perform public.decked_set_command_centre_staff_role(auth.uid(),'admin','active','f4000000-0000-4000-8000-000000000001');raise exception 'Viewer changed its role through RPC';exception when insufficient_privilege then null;end;
  begin perform public.decked_delete_analytics_identity('f5000000-0000-4000-8000-000000000001',false,'f4000000-0000-4000-8000-000000000002');raise exception 'Viewer deleted an analytics identity';exception when insufficient_privilege then null;end;
  begin update public.command_centre_audit_log set properties='{}' where false;raise exception 'Viewer could mutate audit/settings storage';exception when insufficient_privilege then null;end;
  payload:=jsonb_build_array(jsonb_build_object('event_id','f6000000-0000-4000-8000-000000000001','event_name','frontend_error','schema_version',1,'environment','development','occurred_at',now(),'analytics_user_id','f5000000-0000-4000-8000-000000000001','analytics_session_id','f7000000-0000-4000-8000-000000000001','app_version','security-test','properties',jsonb_build_object('error_fingerprint','private answer text','error_class','render','screen_id','home')));
  result:=public.decked_ingest_analytics_events(payload);
  if jsonb_array_length(result->'rejected')<>1 then raise exception 'Free-form content in an allowed field was accepted: %',result;end if;
  payload:=jsonb_set(payload,'{0,event_name}','"invented_event"');
  result:=public.decked_ingest_analytics_events(payload);
  if jsonb_array_length(result->'rejected')<>1 then raise exception 'Unknown event name was accepted: %',result;end if;
end $$;

reset role;
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,app_version,properties,idempotency_key)
values('f6000000-0000-4000-8000-000000000010','app_opened','browser','development',now(),'f5000000-0000-4000-8000-000000000001','f7000000-0000-4000-8000-000000000001','security-test','{"initial_screen_id":"home","entry_path":"/","is_pwa":false,"device_class":"desktop"}','security-deletion-fixture');
insert into public.analytics_daily_active_users(metric_date,environment,analytics_user_id) values(current_date,'development','f5000000-0000-4000-8000-000000000001') on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f1111111-1111-4111-8111-111111111111',true);
do $$ declare preview jsonb; deleted jsonb; begin
  preview:=public.decked_delete_analytics_identity('f5000000-0000-4000-8000-000000000001',true,'f4000000-0000-4000-8000-000000000003');
  if preview->>'status'<>'preview' or (preview->>'events')::int<>1 then raise exception 'Deletion preview mismatch: %',preview;end if;
  deleted:=public.decked_delete_analytics_identity('f5000000-0000-4000-8000-000000000001',false,'f4000000-0000-4000-8000-000000000003');
  if deleted->>'status'<>'deleted' or (deleted->>'events')::int<>1 then raise exception 'Deletion execution mismatch: %',deleted;end if;
end $$;
reset role;

do $$ begin
  if exists(select 1 from public.analytics_events where analytics_user_id='f5000000-0000-4000-8000-000000000001')
     or exists(select 1 from public.analytics_daily_active_users where analytics_user_id='f5000000-0000-4000-8000-000000000001')
     or exists(select 1 from public.analytics_user_first_seen where analytics_user_id='f5000000-0000-4000-8000-000000000001') then raise exception 'Analytics identity deletion left directly linked rows';end if;
  if not exists(select 1 from public.command_centre_audit_log where request_id='f4000000-0000-4000-8000-000000000003' and action='analytics_identity_deleted' and target_ref not like '%f5000000%') then raise exception 'Deletion audit is missing or exposes the raw identity';end if;
end $$;

rollback;
