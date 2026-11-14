-- The database Games report must count new canonical games, not rely on a
-- client-side zero row. Run after all migrations in an isolated database.
begin;
insert into auth.users(id,is_anonymous)
  values('c3333333-3333-4333-8333-333333333333',false);
insert into public.command_centre_staff(user_id,role,status)
  values('c3333333-3333-4333-8333-333333333333','viewer','active');
insert into public.analytics_game_sessions(
  game_session_id,environment,game_id,play_mode,status,setup_started_at,
  started_at,completed_at,last_activity_at,cards_presented,app_version_started
) values(
  'c9999999-9999-4999-8999-999999999999','production','spelling-bee',
  'play_together','completed','2026-11-07 10:00+00','2026-11-07 10:01+00',
  '2026-11-07 10:05+00','2026-11-07 10:05+00',4,'local-test'
);
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
do $$
declare report jsonb; spelling jsonb; lips jsonb; exported jsonb;
begin
  report:=public.decked_command_centre_games_v2(
    'production','2026-11-07','2026-11-07',null,7);
  if jsonb_array_length(report->'rows')<>30
    then raise exception 'Games report is missing canonical games'; end if;
  select value into spelling from jsonb_array_elements(report->'rows') entry
    where entry->>'game_id'='spelling-bee';
  select value into lips from jsonb_array_elements(report->'rows') entry
    where entry->>'game_id'='read-my-lips';
  if spelling is null or lips is null
    then raise exception 'New game rows are missing from the Games RPC'; end if;
  if (spelling->>'multiplayer_starts')::integer<>1
    or (spelling->>'completion_rate')::numeric<>100
    then raise exception 'Spelling Bee activity does not match the inserted session'; end if;
  exported:=public.decked_export_command_centre_games_csv(
    'production','2026-11-07','2026-11-07',null,7,
    array['spelling-bee','read-my-lips'],
    'c8888888-8888-4888-8888-888888888888');
  if (exported->>'row_count')::integer<>2
    or exported->>'csv' not like '%spelling-bee%'
    then raise exception 'Games CSV omitted a new game'; end if;
end $$;
reset role;
do $$ begin
  if not exists(select 1 from public.command_centre_audit_log
    where request_id='c8888888-8888-4888-8888-888888888888'
      and action='report_exported')
    then raise exception 'Games CSV export audit entry missing'; end if;
end $$;
rollback;
