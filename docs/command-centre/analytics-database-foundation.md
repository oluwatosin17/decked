# Decked Command Centre Analytics Database Foundation

**Status:** Implemented in the repository; deployment state not verified by this document  
**Migration:** `supabase/migrations/20261009120000_command_centre_analytics_foundation.sql`  
**Measurement contract:** `docs/command-centre/measurement-plan-v1.md` Version 1.1

## Scope

The migration adds an isolated analytics foundation without changing any existing gameplay table, function, grant, policy, publication, or trigger.

Created objects:

- `analytics_events`: append-only raw events with event-ID and idempotency-key uniqueness.
- `analytics_game_sessions`: rebuildable game-session lifecycle facts.
- `analytics_room_facts`: durable multiplayer lifecycle facts that survive operational-room deletion.
- `analytics_daily_aggregates`: content-free daily metrics with explicit dashboard dimensions.
- `command_centre_staff`: explicitly provisioned `admin` and `viewer` roles.
- `command_centre_audit_log`: append-only staff/security audit facts.
- `decked_ingest_analytics_events(jsonb)`: the only browser-accessible analytics write path.
- Internal validation and append-only trigger functions.

Identity-link storage, lifecycle instrumentation, sessionization jobs, retention jobs, dashboard query RPCs, and staff-management RPCs remain separate backlog items. There is deliberately no browser read path yet.

## Security and privacy behavior

- RLS is enabled on every new table and no browser-role policy is created.
- `anon` and `authenticated` have no direct table or sequence privileges.
- `anon` cannot execute the ingestion RPC.
- An `authenticated` Supabase session may execute only the bounded ingestion RPC.
- The ingestion RPC derives `supabase_user_id` from `auth.uid()` and rejects any client-supplied `supabase_user_id`.
- Unknown envelope fields, unknown property keys, nested property objects, oversized strings/arrays, batches over 25 events, payloads over 64 KiB, and timestamps outside the accepted window are rejected.
- The event and property allowlists follow Measurement Plan Version 1.
- Raw properties cannot contain player display names, room codes, prompt/question text, answers, custom cards, statements, contact details, tokens, or arbitrary free text.
- Raw events and audit rows reject updates. Deletion remains available only to the trusted service role for future approved retention processing.
- Staff roles have no self-service browser path. Provisioning must use a trusted server/service operation and must be audited when that operation is implemented.
- The service-role key must never be included in Vite variables, browser bundles, local storage, or client requests.

## Retention expectations

- Raw events: 13 months.
- Game-session and multiplayer-room facts: 25 months.
- Staff audit log: 25 months.
- Daily aggregates: indefinite until a shorter policy is approved.

This migration records retention expectations in table comments but does not schedule deletion. Deploying a retention job requires a separate reviewed migration and privacy approval.

## Local verification performed

The migration was applied to an isolated PostgreSQL database with Supabase-compatible `anon`, `authenticated`, `service_role`, `auth.uid()`, and `auth.role()` test shims. The complete repository migration chain was then applied to a second clean database.

`supabase/tests/command_centre_analytics_foundation.sql` verified:

- RLS is enabled on all six tables;
- browser roles have no direct read or mutation privileges;
- both `anon` and `authenticated` are checked for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` denial on every foundation table;
- only `authenticated`, not `anon`, can execute ingestion;
- a valid event is accepted;
- retrying the same event is classified as a duplicate and does not insert another row;
- a spoofed Supabase user ID is rejected;
- a forbidden `answer_text` property is rejected;
- the stored restricted user ID comes from `auth.uid()`;
- raw event updates are rejected by the append-only trigger.

The SQL test rolls back its fixtures.

## Non-production deployment

Use a disposable or non-production Supabase project first. Do not run these steps against production until the migration and privacy review gates are approved.

1. Link the repository to the non-production project using the normal Supabase CLI workflow for this project.
2. Confirm the target before changing it:

   ```sh
   supabase status
   supabase migration list
   ```

3. Create a database backup or restorable branch according to the project's Supabase plan.
4. Review the pending SQL:

   ```sh
   supabase db diff
   ```

5. Apply pending migrations:

   ```sh
   supabase db push
   ```

6. Run the authorization/privacy smoke test against the non-production database with an owner-level connection:

   ```sh
   psql "$NON_PRODUCTION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f supabase/tests/command_centre_analytics_foundation.sql
   ```

7. Run `npm run lint`, `npm run build`, and `npm run audit:prompts`.
8. Inspect Postgres logs for migration or permission errors and verify that gameplay room creation/join/start/advance/end still succeeds before promotion.

Never expose the owner connection string or service-role credential to the browser. Store deployment credentials only in the approved operator environment.

## Rollback

If the migration has not received production data, deliver a new forward migration that performs the following in reverse dependency order:

```sql
revoke execute on function public.decked_ingest_analytics_events(jsonb) from authenticated;
drop function if exists public.decked_ingest_analytics_events(jsonb);
drop function if exists public.decked_analytics_properties_are_safe(jsonb);
drop trigger if exists command_centre_audit_log_prevent_update on public.command_centre_audit_log;
drop trigger if exists analytics_events_prevent_update on public.analytics_events;
drop function if exists public.decked_prevent_analytics_update();
drop table if exists public.command_centre_audit_log;
drop table if exists public.command_centre_staff;
drop table if exists public.analytics_daily_aggregates;
drop table if exists public.analytics_room_facts;
drop table if exists public.analytics_game_sessions;
drop table if exists public.analytics_events;
```

Do not edit or delete an applied migration. If production rows exist, first revoke ingestion, stop future analytics jobs, export/retain data according to the approved policy, and obtain explicit deletion approval. Existing gameplay objects require no rollback because this migration does not modify them.

## Remaining work

- Add event-specific required-property and value-type validators before enabling browser emission broadly.
- Add authoritative multiplayer lifecycle writes inside reviewed gameplay RPC replacements.
- Add sessionization, aggregation, reconciliation, and retention jobs.
- Add staff authorization/query RPCs and audited role provisioning.
- Instrument approved application lifecycle points through the disabled-by-default typed client documented in `docs/command-centre/analytics-client.md`.
