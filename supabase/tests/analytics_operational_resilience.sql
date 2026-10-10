-- Run after all migrations against a disposable/non-production database.
-- Verifies the browser ingestion bounds introduced by the resilience migration.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id)
values ('a1000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.decked_ingest_analytics_events(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.decked_ingest_analytics_events_unthrottled(jsonb)', 'EXECUTE') then
    raise exception 'Browser roles can bypass bounded ingestion';
  end if;
  if not has_function_privilege('authenticated', 'public.decked_ingest_analytics_events(jsonb)', 'EXECUTE') then
    raise exception 'Authenticated browser role cannot use bounded ingestion';
  end if;
end;
$$;

select pg_catalog.set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare event_id uuid := gen_random_uuid(); payload jsonb; result jsonb;
begin
  payload := jsonb_build_array(jsonb_build_object(
    'event_id',event_id,'event_name','room_join_attempted','schema_version',1,
    'environment','development','occurred_at',clock_timestamp(),
    'analytics_user_id',gen_random_uuid(),'analytics_session_id',gen_random_uuid(),
    'app_version','resilience-test','properties','{}'::jsonb
  ));
  result := public.decked_ingest_analytics_events(payload);
  if jsonb_array_length(result->'accepted_event_ids') <> 1 then raise exception 'Initial event was not accepted'; end if;
  result := public.decked_ingest_analytics_events(payload);
  if jsonb_array_length(result->'duplicate_event_ids') <> 1 then raise exception 'Duplicate was not idempotent'; end if;

  begin
    perform public.decked_ingest_analytics_events(jsonb_build_array(jsonb_build_object(
      'event_id',gen_random_uuid(),'event_name','room_join_attempted','schema_version',1,
      'environment','development','occurred_at',clock_timestamp(),
      'analytics_user_id',gen_random_uuid(),'analytics_session_id',gen_random_uuid(),
      'app_version',repeat('x',70000),'properties','{}'::jsonb
    )));
    raise exception 'Oversized payload unexpectedly succeeded';
  exception when sqlstate '22023' then null;
  end;
end;
$$;

reset role;
delete from public.analytics_ingest_rate_limits where user_id='a1000000-0000-4000-8000-000000000001';
set local role authenticated;

do $$
declare batch_number integer; batch_size integer; payload jsonb;
begin
  for batch_number in 1..12 loop
    batch_size := case when batch_number=12 then 25 else 25 end;
    select jsonb_agg(jsonb_build_object(
      'event_id',gen_random_uuid(),'event_name','room_join_attempted','schema_version',1,
      'environment','development','occurred_at',clock_timestamp(),
      'analytics_user_id',gen_random_uuid(),'analytics_session_id',gen_random_uuid(),
      'app_version','quota-test','properties','{}'::jsonb
    )) into payload from generate_series(1,batch_size);
    perform public.decked_ingest_analytics_events(payload);
  end loop;

  begin
    perform public.decked_ingest_analytics_events(jsonb_build_array(jsonb_build_object(
      'event_id',gen_random_uuid(),'event_name','room_join_attempted','schema_version',1,
      'environment','development','occurred_at',clock_timestamp(),
      'analytics_user_id',gen_random_uuid(),'analytics_session_id',gen_random_uuid(),
      'app_version','quota-test','properties','{}'::jsonb
    )));
    raise exception '301st event in one minute unexpectedly succeeded';
  exception when sqlstate '54000' then null;
  end;
end;
$$;

rollback;
