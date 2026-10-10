-- Run after migrations against a disposable/non-production database.
-- This script rolls back its fixture data and fails immediately on an unmet assertion.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id)
values ('11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

do $$
declare
  protected_table text;
begin
  foreach protected_table in array array[
    'analytics_events',
    'analytics_game_sessions',
    'analytics_room_facts',
    'analytics_daily_aggregates',
    'command_centre_staff',
    'command_centre_audit_log'
  ]
  loop
    if not exists (
      select 1
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = protected_table
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', protected_table;
    end if;

    if has_table_privilege('anon', 'public.' || protected_table, 'SELECT')
       or has_table_privilege('anon', 'public.' || protected_table, 'INSERT')
       or has_table_privilege('anon', 'public.' || protected_table, 'UPDATE')
       or has_table_privilege('anon', 'public.' || protected_table, 'DELETE')
       or has_table_privilege('authenticated', 'public.' || protected_table, 'SELECT')
       or has_table_privilege('authenticated', 'public.' || protected_table, 'INSERT')
       or has_table_privilege('authenticated', 'public.' || protected_table, 'UPDATE')
       or has_table_privilege('authenticated', 'public.' || protected_table, 'DELETE') then
      raise exception 'Browser role has a direct privilege on public.%', protected_table;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.decked_ingest_analytics_events(jsonb)', 'EXECUTE') then
    raise exception 'anon must not execute the ingestion RPC';
  end if;
  if not has_function_privilege('authenticated', 'public.decked_ingest_analytics_events(jsonb)', 'EXECUTE') then
    raise exception 'authenticated must execute the ingestion RPC';
  end if;
end;
$$;

select pg_catalog.set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  payload jsonb := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'event_id', '22222222-2222-4222-8222-222222222222',
      'event_name', 'app_opened',
      'schema_version', 1,
      'environment', 'development',
      'occurred_at', now(),
      'analytics_user_id', '33333333-3333-4333-8333-333333333333',
      'analytics_session_id', '44444444-4444-4444-8444-444444444444',
      'app_version', 'sql-test',
      'properties', pg_catalog.jsonb_build_object(
        'initial_screen_id', 'home',
        'entry_path', '/',
        'is_pwa', false,
        'device_class', 'desktop'
      )
    )
  );
  result jsonb;
begin
  result := public.decked_ingest_analytics_events(payload);
  if pg_catalog.jsonb_array_length(result->'accepted_event_ids') <> 1
     or pg_catalog.jsonb_array_length(result->'duplicate_event_ids') <> 0
     or pg_catalog.jsonb_array_length(result->'rejected') <> 0 then
    raise exception 'Expected first event to be accepted: %', result;
  end if;

  result := public.decked_ingest_analytics_events(payload);
  if pg_catalog.jsonb_array_length(result->'accepted_event_ids') <> 0
     or pg_catalog.jsonb_array_length(result->'duplicate_event_ids') <> 1 then
    raise exception 'Expected retry to be classified as duplicate: %', result;
  end if;

  payload := pg_catalog.jsonb_set(
    payload,
    '{0,supabase_user_id}',
    '"55555555-5555-4555-8555-555555555555"'::jsonb
  );
  result := public.decked_ingest_analytics_events(payload);
  if pg_catalog.jsonb_array_length(result->'rejected') <> 1 then
    raise exception 'Expected spoofed user identifier to be rejected: %', result;
  end if;

  payload := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'event_id', '66666666-6666-4666-8666-666666666666',
      'event_name', 'frontend_error',
      'schema_version', 1,
      'environment', 'development',
      'occurred_at', now(),
      'analytics_user_id', '33333333-3333-4333-8333-333333333333',
      'analytics_session_id', '44444444-4444-4444-8444-444444444444',
      'app_version', 'sql-test',
      'properties', pg_catalog.jsonb_build_object('answer_text', 'private')
    )
  );
  result := public.decked_ingest_analytics_events(payload);
  if pg_catalog.jsonb_array_length(result->'rejected') <> 1 then
    raise exception 'Expected forbidden content property to be rejected: %', result;
  end if;

end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1 from public.analytics_events
    where event_id = '22222222-2222-4222-8222-222222222222'
      and supabase_user_id = '11111111-1111-4111-8111-111111111111'
  ) then
    raise exception 'Stored event did not derive supabase_user_id from auth.uid()';
  end if;

  begin
    update public.analytics_events
    set app_version = 'mutated'
    where event_id = '22222222-2222-4222-8222-222222222222';
    raise exception 'Append-only update unexpectedly succeeded';
  exception
    when sqlstate '55000' then null;
  end;
end;
$$;

rollback;
