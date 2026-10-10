-- Decked Command Centre analytics foundation.
-- This migration is additive: it does not alter gameplay tables, functions, or RLS.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  event_name text not null check (event_name in (
    'app_opened', 'screen_viewed', 'navigation_back_selected',
    'browse_category_selected', 'quick_play_viewed', 'quick_play_shuffled',
    'game_selected', 'play_mode_selected', 'game_setup_started',
    'game_setup_resumed', 'game_option_selected', 'deck_configured',
    'player_setup_completed', 'game_started', 'card_presented', 'card_revealed',
    'card_advanced', 'game_completed', 'game_replay_selected',
    'game_session_abandoned', 'room_create_attempted', 'room_created',
    'room_create_failed', 'room_join_attempted', 'room_joined', 'room_join_failed',
    'multiplayer_setup_started', 'multiplayer_game_started', 'player_left_room',
    'room_ended', 'rematch_requested', 'rematch_started', 'host_handoff_completed',
    'host_disconnected', 'multiplayer_game_completed', 'realtime_status_changed',
    'rpc_failed', 'frontend_error'
  )),
  schema_version smallint not null default 1 check (schema_version between 1 and 32767),
  source text not null check (source in ('browser', 'database')),
  environment text not null check (environment in ('development', 'preview', 'production')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  analytics_user_id uuid,
  supabase_user_id uuid,
  analytics_session_id uuid,
  game_session_id uuid,
  multiplayer_room_ref uuid,
  game_id text check (game_id is null or game_id in (
    'truth-or-dare', 'spicy-starters', 'never-have-i-ever', 'late-night-talks',
    'dinner-table', 'icebreaker', 'everyday-conversation', 'reconnect',
    'red-flag-green-flag', 'charades', 'strangers', 'finger-down', 'take-a-sip',
    'sip-or-spill', 'you-laugh', 'do-or-drink', 'two-truths-bluff',
    'most-likely-to', 'choose-your-side', 'who-said-that', 'we-just-met'
  )),
  play_mode text check (play_mode is null or play_mode in ('pass_and_play', 'play_together')),
  app_version text not null check (char_length(app_version) between 1 and 100),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 128),
  unique (environment, event_id)
);

create unique index analytics_events_idempotency_idx
  on public.analytics_events (environment, idempotency_key)
  where idempotency_key is not null;
create index analytics_events_environment_occurred_idx
  on public.analytics_events (environment, occurred_at desc);
create index analytics_events_name_occurred_idx
  on public.analytics_events (environment, event_name, occurred_at desc);
create index analytics_events_game_occurred_idx
  on public.analytics_events (environment, game_id, occurred_at desc)
  where game_id is not null;
create index analytics_events_session_idx
  on public.analytics_events (environment, game_session_id, occurred_at)
  where game_session_id is not null;
create index analytics_events_room_idx
  on public.analytics_events (environment, multiplayer_room_ref, occurred_at)
  where multiplayer_room_ref is not null;

comment on table public.analytics_events is
  'Append-only analytics events. Raw production rows are retained for 13 months, then deleted by a separately approved retention job.';
comment on column public.analytics_events.supabase_user_id is
  'Sensitive anonymous-auth identifier. Derived from auth.uid(); never accepted from a browser payload or exposed in normal dashboards/exports.';
comment on column public.analytics_events.multiplayer_room_ref is
  'Privacy-safe analytics UUID. This must never contain or expose a public room code.';
comment on column public.analytics_events.properties is
  'Validated metadata only. Player names, room codes, prompts, answers, custom cards, statements, contact data, tokens, and other free text are forbidden.';

create table public.analytics_game_sessions (
  game_session_id uuid primary key,
  environment text not null check (environment in ('development', 'preview', 'production')),
  analytics_user_id uuid,
  multiplayer_room_ref uuid,
  game_id text not null check (game_id in (
    'truth-or-dare', 'spicy-starters', 'never-have-i-ever', 'late-night-talks',
    'dinner-table', 'icebreaker', 'everyday-conversation', 'reconnect',
    'red-flag-green-flag', 'charades', 'strangers', 'finger-down', 'take-a-sip',
    'sip-or-spill', 'you-laugh', 'do-or-drink', 'two-truths-bluff',
    'most-likely-to', 'choose-your-side', 'who-said-that', 'we-just-met'
  )),
  play_mode text not null check (play_mode in ('pass_and_play', 'play_together')),
  status text not null check (status in ('setup', 'started', 'completed', 'abandoned', 'superseded')),
  setup_started_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz,
  last_activity_at timestamptz not null,
  abandoned_at timestamptz,
  configured_card_count integer check (configured_card_count is null or configured_card_count >= 0),
  cards_presented integer not null default 0 check (cards_presented >= 0),
  cards_skipped integer not null default 0 check (cards_skipped >= 0),
  rounds_completed integer not null default 0 check (rounds_completed >= 0),
  player_count integer check (player_count is null or player_count between 1 and 100),
  completion_reason text check (completion_reason is null or char_length(completion_reason) between 1 and 50),
  app_version_started text not null check (char_length(app_version_started) between 1 and 100),
  updated_at timestamptz not null default now(),
  check (started_at is null or started_at >= setup_started_at),
  check (completed_at is null or (started_at is not null and completed_at >= started_at)),
  check (abandoned_at is null or abandoned_at >= setup_started_at)
);

create index analytics_game_sessions_dashboard_idx
  on public.analytics_game_sessions (environment, setup_started_at desc, game_id, play_mode, status);
create index analytics_game_sessions_activity_idx
  on public.analytics_game_sessions (environment, last_activity_at)
  where status in ('setup', 'started');
create index analytics_game_sessions_room_idx
  on public.analytics_game_sessions (environment, multiplayer_room_ref)
  where multiplayer_room_ref is not null;

comment on table public.analytics_game_sessions is
  'Rebuildable game-session facts. Retain for 25 months under the approved MVP policy; only trusted database/service processes may write.';
comment on column public.analytics_game_sessions.analytics_user_id is
  'Pseudonymous browser installation UUID; it is not a verified person and must not be included in aggregate exports.';

create table public.analytics_room_facts (
  multiplayer_room_ref uuid primary key,
  environment text not null check (environment in ('development', 'preview', 'production')),
  game_id text not null check (game_id in (
    'truth-or-dare', 'spicy-starters', 'never-have-i-ever', 'late-night-talks',
    'dinner-table', 'icebreaker', 'everyday-conversation', 'reconnect',
    'red-flag-green-flag', 'charades', 'strangers', 'finger-down', 'take-a-sip',
    'sip-or-spill', 'you-laugh', 'do-or-drink', 'two-truths-bluff',
    'most-likely-to', 'choose-your-side', 'who-said-that', 'we-just-met'
  )),
  created_at timestamptz not null,
  first_guest_joined_at timestamptz,
  setup_started_at timestamptz,
  first_game_started_at timestamptz,
  last_game_completed_at timestamptz,
  ended_at timestamptz,
  expired_at timestamptz,
  peak_player_count integer not null default 1 check (peak_player_count between 1 and 100),
  successful_join_count integer not null default 0 check (successful_join_count >= 0),
  failed_join_count integer not null default 0 check (failed_join_count >= 0),
  rematch_request_count integer not null default 0 check (rematch_request_count >= 0),
  rematch_start_count integer not null default 0 check (rematch_start_count >= 0),
  host_disconnect_count integer not null default 0 check (host_disconnect_count >= 0),
  host_handoff_count integer not null default 0 check (host_handoff_count >= 0),
  end_reason text check (end_reason is null or char_length(end_reason) between 1 and 50),
  last_activity_at timestamptz not null,
  check (last_activity_at >= created_at),
  check (ended_at is null or ended_at >= created_at),
  check (expired_at is null or expired_at >= created_at)
);

create index analytics_room_facts_dashboard_idx
  on public.analytics_room_facts (environment, created_at desc, game_id);
create index analytics_room_facts_activity_idx
  on public.analytics_room_facts (environment, last_activity_at)
  where ended_at is null and expired_at is null;

comment on table public.analytics_room_facts is
  'Durable, content-free multiplayer lifecycle facts retained for 25 months. Contains no room code, display name, prompt, answer, or operational room UUID.';
comment on column public.analytics_room_facts.multiplayer_room_ref is
  'Independent privacy-safe analytics UUID, not the public room code or the operational room UUID.';

create table public.analytics_daily_aggregates (
  id bigint generated always as identity primary key,
  metric_date date not null,
  environment text not null check (environment in ('development', 'preview', 'production')),
  metric_name text not null check (char_length(metric_name) between 1 and 80 and metric_name ~ '^[a-z][a-z0-9_]*$'),
  game_id text,
  play_mode text check (play_mode is null or play_mode in ('pass_and_play', 'play_together')),
  device_class text check (device_class is null or device_class in ('mobile', 'tablet', 'desktop', 'unknown')),
  app_version text,
  metric_value bigint not null default 0 check (metric_value >= 0),
  metric_sum numeric not null default 0,
  sample_count bigint not null default 0 check (sample_count >= 0),
  refreshed_at timestamptz not null default now(),
  check (game_id is null or game_id in (
    'truth-or-dare', 'spicy-starters', 'never-have-i-ever', 'late-night-talks',
    'dinner-table', 'icebreaker', 'everyday-conversation', 'reconnect',
    'red-flag-green-flag', 'charades', 'strangers', 'finger-down', 'take-a-sip',
    'sip-or-spill', 'you-laugh', 'do-or-drink', 'two-truths-bluff',
    'most-likely-to', 'choose-your-side', 'who-said-that', 'we-just-met'
  ))
);

create unique index analytics_daily_aggregates_dimensions_idx
  on public.analytics_daily_aggregates (
    metric_date, environment, metric_name,
    coalesce(game_id, ''), coalesce(play_mode, ''),
    coalesce(device_class, ''), coalesce(app_version, '')
  );
create index analytics_daily_aggregates_dashboard_idx
  on public.analytics_daily_aggregates (environment, metric_name, metric_date desc);
create index analytics_daily_aggregates_game_idx
  on public.analytics_daily_aggregates (environment, game_id, metric_date desc)
  where game_id is not null;

comment on table public.analytics_daily_aggregates is
  'Rebuildable, content-free daily metrics for dashboard queries. Aggregate retention is indefinite until a shorter policy is approved.';

create table public.command_centre_staff (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('admin', 'viewer')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index command_centre_staff_active_role_idx
  on public.command_centre_staff (role, user_id)
  where status = 'active';

comment on table public.command_centre_staff is
  'Explicit Command Centre authorization records. Only a trusted service/admin procedure may assign or change roles; anonymous gameplay accounts receive no automatic access.';
comment on column public.command_centre_staff.user_id is
  'Sensitive Supabase auth user identifier for an explicitly provisioned staff account.';
comment on column public.command_centre_staff.created_by is
  'Auth user that provisioned the role. Bootstrap provisioning may leave this null and must be recorded out of band.';

create table public.command_centre_audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_role text check (actor_role is null or actor_role in ('admin', 'viewer', 'service')),
  action text not null check (char_length(action) between 1 and 80 and action ~ '^[a-z][a-z0-9_]*$'),
  target_type text check (target_type is null or (char_length(target_type) between 1 and 50 and target_type ~ '^[a-z][a-z0-9_]*$')),
  target_ref text check (target_ref is null or char_length(target_ref) <= 128),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  request_id uuid
);

create unique index command_centre_audit_log_request_idx
  on public.command_centre_audit_log (request_id)
  where request_id is not null;
create index command_centre_audit_log_occurred_idx
  on public.command_centre_audit_log (occurred_at desc, action);
create index command_centre_audit_log_actor_idx
  on public.command_centre_audit_log (actor_user_id, occurred_at desc)
  where actor_user_id is not null;

comment on table public.command_centre_audit_log is
  'Append-only staff/security audit facts retained for 25 months. Deletion is limited to an approved retention process.';
comment on column public.command_centre_audit_log.target_ref is
  'Sanitized opaque target reference. Never store room codes, player names, prompt/answer content, email addresses, or access tokens.';
comment on column public.command_centre_audit_log.properties is
  'Sanitized audit metadata only; unrestricted request bodies and user-entered content are forbidden.';

-- RLS is defense in depth. No policies are created, so browser roles cannot read
-- or mutate these tables even if a table privilege is accidentally broadened.
alter table public.analytics_events enable row level security;
alter table public.analytics_game_sessions enable row level security;
alter table public.analytics_room_facts enable row level security;
alter table public.analytics_daily_aggregates enable row level security;
alter table public.command_centre_staff enable row level security;
alter table public.command_centre_audit_log enable row level security;

revoke all on table public.analytics_events from public, anon, authenticated;
revoke all on table public.analytics_game_sessions from public, anon, authenticated;
revoke all on table public.analytics_room_facts from public, anon, authenticated;
revoke all on table public.analytics_daily_aggregates from public, anon, authenticated;
revoke all on table public.command_centre_staff from public, anon, authenticated;
revoke all on table public.command_centre_audit_log from public, anon, authenticated;
revoke all on sequence public.analytics_events_id_seq from public, anon, authenticated;
revoke all on sequence public.analytics_daily_aggregates_id_seq from public, anon, authenticated;
revoke all on sequence public.command_centre_audit_log_id_seq from public, anon, authenticated;

grant select, insert, delete on table public.analytics_events to service_role;
grant select, insert, update, delete on table public.analytics_game_sessions to service_role;
grant select, insert, update, delete on table public.analytics_room_facts to service_role;
grant select, insert, update, delete on table public.analytics_daily_aggregates to service_role;
grant select, insert, update, delete on table public.command_centre_staff to service_role;
grant select, insert, delete on table public.command_centre_audit_log to service_role;
grant usage, select on sequence public.analytics_events_id_seq to service_role;
grant usage, select on sequence public.analytics_daily_aggregates_id_seq to service_role;
grant usage, select on sequence public.command_centre_audit_log_id_seq to service_role;

-- Keep raw events and audit records append-only. Retention uses DELETE rather
-- than UPDATE; owners can still deliver a reviewed repair migration if needed.
create function public.decked_prevent_analytics_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Analytics source records are append-only.' using errcode = '55000';
end;
$$;

create trigger analytics_events_prevent_update
before update on public.analytics_events
for each row execute function public.decked_prevent_analytics_update();

create trigger command_centre_audit_log_prevent_update
before update on public.command_centre_audit_log
for each row execute function public.decked_prevent_analytics_update();

revoke all on function public.decked_prevent_analytics_update() from public, anon, authenticated;

-- Returns true only for a shallow object whose keys are approved measurement
-- dimensions and whose values are scalars or arrays of scalars. This deliberately
-- rejects nested objects and unknown keys, preventing arbitrary content storage.
create function public.decked_analytics_properties_are_safe(p_properties jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  property_key text;
  property_value jsonb;
  array_value jsonb;
  allowed_keys constant text[] := array[
    'initial_screen_id', 'entry_path', 'is_pwa', 'device_class',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'referrer_domain', 'screen_id', 'previous_screen_id', 'destination_screen_id',
    'game_id', 'game_session_id', 'lifecycle_stage', 'category_id',
    'previous_category_id', 'visible_game_count', 'recommendation_set_id',
    'recommended_game_ids', 'shuffle_number', 'selection_surface',
    'browse_category_id', 'recommendation_position', 'play_mode', 'initial_step',
    'resumed', 'restored_step', 'option_type', 'option_ids', 'selected_count',
    'requested_card_count', 'actual_card_count', 'built_in_card_count',
    'custom_card_count', 'category_ids', 'mode_ids', 'player_count',
    'starting_step', 'configured_card_count', 'card_number', 'content_source',
    'from_card_number', 'to_card_number', 'advance_reason', 'completion_reason',
    'cards_presented', 'cards_skipped', 'duration_seconds', 'rounds_completed',
    'completed_game_session_id', 'last_lifecycle_stage', 'last_step',
    'multiplayer_room_ref', 'error_code', 'failure_stage', 'room_player_count',
    'is_rejoin', 'is_first_guest', 'failure_reason', 'room_status_at_exit',
    'remaining_player_count', 'room_age_seconds', 'request_count',
    'previous_game_session_id', 'new_game_session_id', 'room_status',
    'handoff_reason', 'offline_threshold_seconds', 'channel_type', 'status',
    'retry_count', 'rpc_name', 'failure_class', 'error_fingerprint',
    'error_class', 'browser_name', 'browser_major_version', 'stack_fingerprint'
  ];
begin
  if p_properties is null or jsonb_typeof(p_properties) <> 'object' then
    return false;
  end if;

  if octet_length(p_properties::text) > 16384
     or (select count(*) from pg_catalog.jsonb_object_keys(p_properties)) > 32 then
    return false;
  end if;

  for property_key, property_value in
    select key, value from pg_catalog.jsonb_each(p_properties)
  loop
    if not (property_key = any(allowed_keys)) then
      return false;
    end if;

    if jsonb_typeof(property_value) = 'object' or jsonb_typeof(property_value) = 'null' then
      return false;
    elsif jsonb_typeof(property_value) = 'array' then
      if pg_catalog.jsonb_array_length(property_value) > 50 then
        return false;
      end if;
      for array_value in select value from pg_catalog.jsonb_array_elements(property_value)
      loop
        if jsonb_typeof(array_value) not in ('string', 'number', 'boolean') then
          return false;
        end if;
        if jsonb_typeof(array_value) = 'string' and char_length(array_value #>> '{}') > 128 then
          return false;
        end if;
      end loop;
    elsif jsonb_typeof(property_value) = 'string' and char_length(property_value #>> '{}') > 256 then
      return false;
    elsif jsonb_typeof(property_value) not in ('string', 'number', 'boolean') then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.decked_analytics_properties_are_safe(jsonb) from public, anon, authenticated;

-- Authenticated Supabase sessions (including anonymous-auth players) may submit
-- bounded browser events. They cannot select the stored rows. The function ignores
-- no identity fields: a supplied supabase_user_id or unknown envelope key rejects
-- that item, and the stored user ID always comes from auth.uid().
create function public.decked_ingest_analytics_events(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_user_id uuid := auth.uid();
  event_item jsonb;
  event_identifier uuid;
  inserted_rows integer;
  accepted_ids jsonb := '[]'::jsonb;
  duplicate_ids jsonb := '[]'::jsonb;
  rejected_items jsonb := '[]'::jsonb;
  item_number integer := 0;
  item_properties jsonb;
  item_occurred_at timestamptz;
begin
  if caller_user_id is null or auth.role() <> 'authenticated' then
    raise exception 'An authenticated player session is required.' using errcode = '42501';
  end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    raise exception 'Analytics payload must be an array.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_events) < 1 or jsonb_array_length(p_events) > 25 then
    raise exception 'Analytics batches must contain between 1 and 25 events.' using errcode = '22023';
  end if;
  if octet_length(p_events::text) > 65536 then
    raise exception 'Analytics payload exceeds 64 KiB.' using errcode = '22023';
  end if;

  for event_item in select value from pg_catalog.jsonb_array_elements(p_events)
  loop
    item_number := item_number + 1;
    event_identifier := null;
    begin
      if jsonb_typeof(event_item) <> 'object'
         or event_item ? 'supabase_user_id'
         or event_item - array[
           'event_id', 'event_name', 'schema_version', 'environment', 'occurred_at',
           'analytics_user_id', 'analytics_session_id', 'game_session_id',
           'multiplayer_room_ref', 'game_id', 'play_mode', 'app_version',
           'properties', 'idempotency_key'
         ] <> '{}'::jsonb then
        raise exception 'invalid_envelope';
      end if;

      event_identifier := (event_item->>'event_id')::uuid;
      item_occurred_at := (event_item->>'occurred_at')::timestamptz;
      item_properties := coalesce(event_item->'properties', '{}'::jsonb);

      if event_identifier is null
         or event_item->>'event_name' is null
         or coalesce((event_item->>'schema_version')::smallint, 1) <> 1
         or event_item->>'environment' not in ('development', 'preview', 'production')
         or item_occurred_at < now() - interval '7 days'
         or item_occurred_at > now() + interval '10 minutes'
         or char_length(event_item->>'app_version') not between 1 and 100
         or not public.decked_analytics_properties_are_safe(item_properties) then
        raise exception 'invalid_event';
      end if;

      insert into public.analytics_events (
        event_id, event_name, schema_version, source, environment, occurred_at,
        analytics_user_id, supabase_user_id, analytics_session_id, game_session_id,
        multiplayer_room_ref, game_id, play_mode, app_version, properties,
        idempotency_key
      ) values (
        event_identifier,
        event_item->>'event_name',
        coalesce((event_item->>'schema_version')::smallint, 1),
        'browser',
        event_item->>'environment',
        item_occurred_at,
        nullif(event_item->>'analytics_user_id', '')::uuid,
        caller_user_id,
        nullif(event_item->>'analytics_session_id', '')::uuid,
        nullif(event_item->>'game_session_id', '')::uuid,
        nullif(event_item->>'multiplayer_room_ref', '')::uuid,
        nullif(event_item->>'game_id', ''),
        nullif(event_item->>'play_mode', ''),
        event_item->>'app_version',
        item_properties,
        nullif(event_item->>'idempotency_key', '')
      ) on conflict do nothing;

      get diagnostics inserted_rows = row_count;
      if inserted_rows = 1 then
        accepted_ids := accepted_ids || pg_catalog.jsonb_build_array(event_identifier);
      else
        duplicate_ids := duplicate_ids || pg_catalog.jsonb_build_array(event_identifier);
      end if;
    exception when others then
      rejected_items := rejected_items || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'index', item_number,
          'event_id', event_identifier,
          'code', 'invalid_event'
        )
      );
    end;
  end loop;

  return pg_catalog.jsonb_build_object(
    'accepted_event_ids', accepted_ids,
    'duplicate_event_ids', duplicate_ids,
    'rejected', rejected_items
  );
end;
$$;

revoke all on function public.decked_ingest_analytics_events(jsonb) from public, anon;
grant execute on function public.decked_ingest_analytics_events(jsonb) to authenticated;

