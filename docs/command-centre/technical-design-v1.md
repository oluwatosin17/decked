# Decked Command Centre Technical Design

**Status:** Implemented baseline; approval and launch-verification gates remain open  
**Version:** 1.1  
**Date:** 9 October 2026  
**Inputs:** Repository audit and Measurement Plan Version 1.1  
**Scope:** Analytics foundation, protected Command Centre, and safe-launch work  
**Change type:** Documentation only; no production code or database objects changed

## 1. Decision

Use the existing **Supabase-native append-only analytics pipeline** as the MVP system of record.

This is no longer a greenfield proposal. The working tree contains the core schema, bounded ingestion RPC, typed browser client, local-game instrumentation, database-authoritative multiplayer facts, staff authorization, aggregate/query RPCs, dashboard views, CSV exports, audit logging, reconciliation fixtures, and resilience controls. Production approval is still blocked by unresolved product decisions and the absence of database-backed verification against a disposable Supabase project.

PostHog remains a possible later destination for sanitized events and ad hoc exploration. It should not replace the repository-owned metric contract or authoritative room facts captured before operational room deletion.

## 2. Repository constraints

- React 19 and TypeScript are built with Vite and deployed as a Vercel SPA.
- Navigation is state based in `src/App.tsx` and `src/navigation.ts`; `/command-centre` is lazy loaded.
- Local games use `useGameStep` and `usePersistentGameState`; multiplayer reuses game components through `SharedSessionProvider`.
- Players are anonymous Supabase users. A player session is not staff authorization.
- Multiplayer mutations use Postgres RPCs; synchronization uses Supabase Realtime and Presence.
- The canonical TypeScript registry exposes 21 multiplayer game IDs.
- `we-just-met` exists in the app registry but is absent from the room-creation allowlist in `20261007120000_all_multiplayer_games.sql`.
- Multiplayer start still calls `startMultiGame(room.id, 1, 1)` with placeholder counts.
- `decked_end_room` deletes the operational room and cascades dependent operational data.
- Shared session state can contain names, prompts, custom cards, statements, answers, votes, and guesses. It must never be copied wholesale into analytics.
- Vitest, TypeScript checking, Oxlint, a production build, and prompt audit exist. SQL fixtures exist, but no browser-driven E2E suite or disposable hosted Supabase verification is recorded.
- The worktree contains unrelated user changes. Command Centre work must remain additive and must not weaken gameplay authorization.

## 3. Architecture comparison

### Supabase-native append-only pipeline

**Shape:** Browser events pass through `decked_ingest_analytics_events`; Postgres validates the contract; database triggers capture authoritative multiplayer facts; aggregate tables and staff-only RPCs feed the dashboard.

**Cost and operations:** It reuses Decked's Supabase project and avoids a second per-event system. Storage, compute, backups, egress, jobs, retention, reconciliation, and tuning remain Decked's responsibility. Supabase currently lists Pro from USD 25/month with 8 GB database disk and 250 GB uncached egress included. Production sizing must use measured Decked volume, not plan allowances as capacity targets.

**Validation, funnels, retention:** TypeScript and database allowlists enforce the event contract at both trust boundaries. Custom funnels, arbitrary-range medians, retention jobs, and reconciliation require repository-owned SQL and tests.

**Ownership and privacy:** Data remains in Decked's existing Postgres boundary. RLS and grants deny browser reads of raw analytics and staff tables. Room facts are recorded without sending operational identifiers to another provider.

**Integration:** Higher initial effort than a vendor SDK, but most MVP work is already implemented and aligns with the existing Auth, RPC, RLS, Realtime, migration, and TypeScript conventions.

### Managed provider such as PostHog

**Shape:** `posthog-js` would emit approved events with autocapture and replay disabled. A server/database integration would still be needed for authoritative room facts. PostHog supplies built-in trends, funnels, retention, paths, and breakdowns.

**Cost and operations:** PostHog currently advertises one million analytics events free each month, followed by usage pricing. Its free plan lists one project and one-year retention; paid usage lists six projects and seven-year retention. Free-plan overages are dropped unless billing is enabled. Decked would add vendor governance, spend controls, privacy review, and two-system reconciliation.

**Validation, funnels, retention:** Exploration is faster, but correctness still depends on Decked's schemas. Provider insight semantics can drift from the versioned measurement contract unless governed and reconciled.

**Ownership and privacy:** PostHog offers US and EU cloud regions and privacy controls, but becomes another processor. Region, DPA, access model, deletion process, and property allowlist require approval.

**Integration:** Low for browser-only analytics, but moderate for Decked because durable room facts, custom staff authorization, the internal interface, and exact metrics remain separate requirements.

| Criterion | Supabase native | PostHog or similar |
|---|---|---|
| Direct MVP cost | Existing database capacity | Free at low volume; usage pricing |
| Operational burden | Jobs, aggregates, retention, tuning | Vendor governance and reconciliation |
| Event validation | TypeScript plus database allowlists | App discipline plus provider governance |
| Authoritative room facts | Native database triggers | Still needs server/database capture |
| Funnels and retention | Custom SQL and tests | Built in |
| Data ownership | Decked Postgres | Vendor-hosted unless exported/self-hosted |
| Privacy surface | Existing processor and exact RLS | Additional processor, SDK, region, DPA |
| Repository fit | High; already implemented | Duplicates part of the pipeline |

### Recommendation

Continue with Supabase native for MVP. Transactional/durable multiplayer facts, the strict privacy allowlist, staff authorization, and exact metrics remain required even with PostHog. Reconsider a managed provider only after measuring production volume and analyst needs. Any future exporter must be opt-in, server-side, idempotent, and limited to sanitized canonical events.

## 4. Implemented system design

```text
Decked browser
  ├─ typed event contract and privacy validator
  ├─ analytics, browser-session, and game-session identities
  ├─ bounded queue, retry, and stable event_id
  └─ decked_ingest_analytics_events RPC

Existing multiplayer tables/RPCs
  └─ narrowly scoped Postgres triggers
       ├─ restricted analytics_room_links
       ├─ append-only analytics_room_facts
       └─ database-source analytics_events

Supabase Postgres
  ├─ raw events and derived session/room facts
  ├─ active-user, session-health, funnel, and generic aggregates
  ├─ serialized incremental refresh and reconciliation
  ├─ command_centre_staff and command_centre_audit_log
  └─ staff-only metric, export, and audit RPCs

/command-centre
  ├─ Auth restoration and staff gate
  ├─ Overview, Games, Funnels, Multiplayer, Reliability, Settings
  ├─ URL-persisted filters and freshness states
  └─ privacy-safe exports and audit viewer
```

### 4.1 Ingestion and identity

The browser API accepts only event/property combinations defined in `src/analytics`. It generates a stable `event_id`, persists analytics and browser-session identities, manages game-session IDs, batches non-blocking delivery, retries with the same IDs, and is disabled unless `VITE_ANALYTICS_ENABLED=true`.

The ingestion RPC is the browser's only analytics write path. It validates the authenticated user, allowlists, UUIDs, environment, timestamps, batch size, payload size, rate limit, and idempotency. Browser roles cannot insert into or read raw tables. Current controls bound a request to 25 events and 64 KiB; these values require load testing before production.

- `analytics_user_id` is a first-party browser identifier, not a verified person.
- `auth.uid()` is derived by Postgres; the browser cannot assert another user.
- `analytics_session_id` uses a 30-minute inactivity window.
- `game_session_id` changes per play attempt, replay, or rematch.
- Storage clearing, private browsing, another device, or anonymous-user replacement creates identity fragmentation. DAU/WAU/MAU represent observed identities.
- There is no implemented `analytics_identities` table.

Explicit observed exits may create abandonment facts. A scheduled inactivity finalizer and late-event correction policy are not implemented; the UI must not present inferred inactivity abandonment as complete.

### 4.2 Authoritative multiplayer facts

`20261009160000_authoritative_multiplayer_analytics.sql` uses triggers on operational room/player changes. A restricted mapping connects operational room ID to an analytics-safe reference. The mapping is deleted with the room; independent facts remain.

Browser events describe attempts, failures, Realtime status, and UX context. Database facts are authoritative for successful create/join/start/exit/end/handoff transitions. Queries must use authoritative facts or filter by source to avoid double counting browser mirrors.

Analytics trigger exceptions are caught so telemetry failure does not roll back successful gameplay. This availability-first choice permits gaps, making reconciliation and alerts mandatory controls.

No analytics function may accept display names, room codes, access tokens, prompt text, answers, free-form content, or arbitrary `game_state.session` JSON.

### 4.3 Stored data and access

| Object | Purpose | Browser access |
|---|---|---|
| `analytics_events` | Append-only canonical events | Ingest RPC only; no reads |
| `analytics_game_sessions` | Durable lifecycle summaries | None |
| `analytics_room_facts` | Durable room lifecycle facts | None |
| `analytics_room_links` | Restricted operational mapping | None |
| `analytics_daily_aggregates` | Generic daily metrics | Staff RPC only |
| `analytics_daily_active_users` | Active-identity facts | Staff RPC only |
| `analytics_daily_session_health` | Session/error facts | Staff RPC only |
| `analytics_user_first_seen` | First-observed identity dates | Staff RPC only |
| `analytics_funnel_daily` | Canonical funnel steps | Staff RPC only |
| `analytics_aggregate_refreshes` | Refresh status/freshness | Staff RPC only |
| `analytics_ingest_rate_limits` | Ingestion counters | None |
| `command_centre_staff` | Viewer/admin assignments | Staff-check RPC only |
| `command_centre_audit_log` | Staff actions | Admin RPC only |

Every analytics table has RLS. Exact grants and security-definer functions form the public boundary. Service-role credentials must never enter the Vite bundle.

### 4.4 Aggregates and queries

Aggregate refresh is bounded by UTC dates, serialized by advisory lock, records freshness, and is idempotent for unchanged source data. Staff RPCs cover overview, games/detail, funnels, multiplayer, reliability, exports, and audit history. Common views read aggregates and durable facts rather than scanning all raw events.

Index changes require hosted `EXPLAIN (ANALYZE, BUFFERS)` evidence. The refresh function exists, but no production scheduler is configured in the repository. Supabase Cron/`pg_cron` is preferred after approval: refresh recent dates every 15 minutes, reject overlap, expose last success, and alert after two missed intervals.

### 4.5 Staff authorization

Supabase Auth establishes identity; an active, non-anonymous `command_centre_staff` row establishes permission.

- `viewer`: approved aggregate queries and, if approved, aggregate exports.
- `admin`: viewer permissions plus explicitly granted staff/audit/settings actions.
- Players and ordinary authenticated users receive no analytics-table access.
- Frontend guards are presentation only; every query/export RPC enforces staff status.
- Role changes, settings changes, exports, and room-level investigations append audit entries without returned data or secrets.

Initial staff provisioning is an out-of-band database operation using the Supabase Auth UUID. Email domain checks alone are not authorization.

### 4.6 Environment, retention, and failure handling

Every raw fact, derived row, refresh, query, and export is scoped to `development`, `preview`, or `production`. The browser uses `VITE_ANALYTICS_ENVIRONMENT`; database facts use trusted `app.settings.analytics_environment`. Production must verify both because a wrong database setting contaminates environments even when the UI filter is correct.

The measurement plan proposes 13 months for raw events, but no production retention job is configured. Retention must be approved per table. A future job must dry-run counts, delete bounded batches through indexed predicates, record status, and require backup/restore review before its first destructive run.

- Browser analytics never blocks gameplay and retries transient failures with bounds.
- Invalid or forbidden events are rejected, not silently stored.
- Duplicate submissions converge on event ID/idempotency constraints.
- Multiplayer analytics failure preserves gameplay but is reconciled later.
- Stale aggregates display last-success time and a warning.
- Staff query/export failure returns a bounded error and no partial sensitive payload.

## 5. Principal risks

| Risk | Required control |
|---|---|
| Raw data exposed through RLS/grants | Disposable-project anon/player/viewer/admin negative tests |
| Swallowed trigger failure creates gaps | Reconciliation, alerting, documented availability choice |
| Browser/database mirrors double count | Authoritative facts or explicit source filtering |
| Room deletion removes evidence | Durable facts written before restricted mapping deletion |
| Shared state leaks player content | Fixed scalar allowlists; no arbitrary JSON |
| Environment misconfiguration | Deployment smoke event and isolation test |
| Retention deletes too much | Dry run, bounded batches, backup verification, approval |
| Unsafe security-definer function | Fixed `search_path`, owner/grant review, SQL tests |
| Schema rollout breaks gameplay | Additive migrations, unchanged RPC shapes, feature disable |
| Game registry and SQL drift | Repair `we-just-met`; automated contract test |
| Placeholder `1,1` corrupts facts | Define and supply authoritative counts or omit the fields |
| No hosted SQL/E2E evidence | Disposable Supabase and production-like preview verification |

## 6. Dependency-ordered backlog

Statuses describe the working tree, not confirmed production deployment.

### CC-01 Approve metric, privacy, and access contract — **blocked on decisions**

**Depends on:** none. **Independent:** yes. **Human gate:** Product, Privacy/Security, Engineering.

- **Acceptance:** Section 7 has owners and answers; changed definitions update Measurement Plan 1.1; retention, staff roles, exports, and legal basis are approved.
- **Affected areas:** specifications, privacy notice, runbook.
- **Migration risk:** none.
- **Verification:** approval record references exact versions.
- **Rollback:** keep analytics disabled and reopen the decision.

### CC-02 Reconcile the 21-game contract — **remaining**

**Depends on:** CC-01 only if a game is removed. **Independent:** yes. **Human gate:** confirm `we-just-met` support.

- **Acceptance:** TypeScript registry and SQL allowlist contain the same IDs; drift test exists; start uses real counts or affected facts omit them.
- **Affected areas:** registry, room allowlist migration, start adapter, tests.
- **Migration risk:** medium; room admission changes.
- **Verification:** create/start every canonical game in a disposable database.
- **Rollback:** follow-up migration restores prior allowlist.

### CC-03 Schema and bounded ingestion — **implemented; deployment unverified**

**Depends on:** measurement contract. **Independent:** foundation is additive. **Human gate:** security review.

- **Acceptance:** RLS and least privilege hold; allowed batches work; spoofing, forbidden keys, oversize payloads, invalid environment, and duplicates behave as specified; gameplay policies are unchanged.
- **Affected areas:** foundation/resilience migrations and SQL fixtures.
- **Migration risk:** medium; public security-definer boundary.
- **Verification:** disposable Supabase privilege/validation suite.
- **Rollback:** revoke ingestion and disable client; preserve captured rows.

### CC-04 Typed client and local lifecycle — **implemented; browser E2E pending**

**Depends on:** CC-03. **Independent:** mocked-transport tests can run. **Human gate:** privacy payload review.

- **Acceptance:** validation, identities, retry, dedupe, disable flag, and Strict Mode tests pass; all 21 games have lifecycle coverage; forbidden content is absent.
- **Affected areas:** `src/analytics`, discovery/navigation, game hooks/adapters, tests.
- **Migration risk:** none; broad instrumentation has UI regression risk.
- **Verification:** Vitest and browser journeys for three games including specialized shared state.
- **Rollback:** set `VITE_ANALYTICS_ENABLED=false`.

### CC-05 Authoritative multiplayer facts — **implemented; database E2E pending**

**Depends on:** CC-03. **Independent:** yes, alongside CC-04. **Human gate:** lifecycle and best-effort failure policy.

- **Acceptance:** observable lifecycle facts use authoritative sources; retries dedupe; history survives deletion; analytics failure cannot break gameplay and is detectable.
- **Affected areas:** authoritative migration, browser attempt/failure events, SQL tests.
- **Migration risk:** high; triggers touch core tables.
- **Verification:** create/join/start/complete/end, duplicates, denials, handoff, expiry, deletion.
- **Rollback:** follow-up migration disables triggers while preserving facts.

### CC-06 Aggregates and query services — **implemented; hosted evidence pending**

**Depends on:** CC-03, CC-05. **Independent:** query families after shared filters. **Human gate:** reconciliation approval.

- **Acceptance:** formulas match the plan; refresh is scoped/idempotent/non-overlapping; zero, duplicate, partial, cross-day, and timezone fixtures reconcile within 1%.
- **Affected areas:** aggregate and dashboard SQL migrations, typed client, fixtures.
- **Migration risk:** medium; compute and interpretation.
- **Verification:** raw reconciliation plus hosted plans/latency at representative volume.
- **Rollback:** revoke query RPCs and rebuild derived aggregates; retain raw facts.

### CC-07 Staff authorization and shell — **implemented; hosted auth test pending**

**Depends on:** CC-03. **Independent:** fixture UI work. **Human gate:** initial admin and login/recovery policy.

- **Acceptance:** anon, player, disabled staff, viewer, and admin permissions match policy; direct navigation retrieves no protected data; auth states work.
- **Affected areas:** access migration, `src/command-centre`, Auth redirects.
- **Migration risk:** medium; access-control boundary.
- **Verification:** hosted authorization matrix and recovery flow using non-shared credentials.
- **Rollback:** deactivate staff or revoke RPCs; never weaken RLS.

### CC-08 Dashboard, exports, audit — **implemented; acceptance pending**

**Depends on:** CC-06, CC-07. **Independent:** fixture pages. **Human gate:** UX/accessibility and export roles.

- **Acceptance:** URL filters and all UI states work; exports match filters, prevent formula injection, and audit; responses contain no forbidden identifiers/content.
- **Affected areas:** dashboard pages/components, export/audit migration, tests.
- **Migration risk:** medium for data exposure.
- **Verification:** fixtures, accessibility, desktop/tablet, large export, authorization.
- **Rollback:** hide pages and revoke exports; retain audit history.

### CC-09 Schedule refresh and monitoring — **remaining**

**Depends on:** CC-06, environment decision. **Independent:** runbook/alerts can be prepared. **Human gate:** schedule, owner, alert destination.

- **Acceptance:** trusted scheduler refreshes approved UTC dates; overlap is prevented; success/duration/failure are visible; missed intervals alert an owner.
- **Affected areas:** Supabase Cron configuration, monitoring, runbook.
- **Migration risk:** medium; recurring load.
- **Verification:** forced overlap, failure, stale data, catch-up.
- **Rollback:** unschedule; retain manual refresh.

### CC-10 Retention and stale-session policy — **remaining; destructive gate**

**Depends on:** CC-01, CC-09. **Independent:** dry-run reporting first. **Human gate:** retention and backup approval.

- **Acceptance:** per-table policy is encoded; deletion is bounded/indexed; if approved, stale sessions finalize idempotently with a correction window.
- **Affected areas:** new migration/job, monitoring, privacy/deletion runbook.
- **Migration risk:** high and irreversible beyond backups.
- **Verification:** time fixtures, dry run, backup confirmation, restore exercise.
- **Rollback:** unschedule; deleted data requires verified backup restoration.

### CC-11 E2E reconciliation and security review — **partial; launch blocker**

**Depends on:** CC-02 through CC-10, with retention allowed as dry run. **Independent:** no. **Human gate:** launch acceptance.

- **Acceptance:** local/multiplayer journeys reconcile raw, derived, aggregate, export, and UI values within 1%; RLS, redaction, isolation, retries, outages, slow queries, and stale data pass; no unexplained high/critical issue remains.
- **Affected areas:** SQL/browser suites, reports, targeted fixes.
- **Migration risk:** depends on fixes.
- **Verification:** disposable hosted Supabase and production-like Vercel preview.
- **Rollback:** keep analytics disabled and Command Centre unlaunched.

### CC-12 Staged launch — **blocked**

**Depends on:** CC-11. **Independent:** no. **Human gate:** explicit production approval.

- **Acceptance:** migrations, backup, staff, redirects, environments, scheduler, alerts, and rollback owners are verified; rollout proceeds disabled → limited → full only while targets hold.
- **Affected areas:** Supabase production, Vercel, privacy notice, operations.
- **Migration risk:** high; production collection begins.
- **Verification:** approved non-sensitive smoke journey and dashboard reconciliation.
- **Rollback:** disable collection, unschedule jobs, revoke query/export RPCs, hide route, preserve evidence.

## 7. Human approval gates and unresolved decisions

The design is not approved until every item has an owner and recorded answer.

### Measurement and privacy

1. Collect coarse country? Recommendation: disabled unless supplied by a trusted server layer with legal approval.
2. UTC-only reporting or a display-timezone selector? Recommendation: UTC for MVP.
3. Is `setup_abandoned` distinct from gameplay abandonment? Recommendation: yes.
4. What consent/legal basis and notice apply in each launch market?
5. What minimum denominator qualifies percentage deltas? Recommendation: visibly mark samples below 30.
6. Should DAU/WAU/MAU labels say “observed identities” rather than “players”? Recommendation: expose the limitation in definitions.

### Lifecycle semantics

7. Is inactivity abandonment required, and after what interval? Recommendation: do not infer it until a finalizer is approved.
8. How is a host-only room classified when no guest joins? Recommendation: separate lobby abandonment from expiry.
9. Should completion update operational room status to `finished` or remain analytics-only?
10. What late-event window may reverse abandonment? Recommendation: 24 hours if finalization is added.
11. Is replay/rematch constrained to the proposed 10-minute attribution window?
12. Should `we-just-met` be enabled for multiplayer?
13. What authoritative counts replace `startMultiGame(room.id, 1, 1)`?

### Access and operations

14. Which Auth UUID is initial admin, and who may provision/deactivate staff?
15. May viewers export aggregate CSVs? Recommendation: yes, with auditing.
16. Is privacy-safe room investigation allowed, for which role, with what audit metadata?
17. What retention applies to raw events, session/room facts, first-seen rows, aggregates, rate limits, and audit logs? Raw proposal: 13 months.
18. Is one Supabase project with environment scoping acceptable, or is a separate analytics project required?
19. Who owns refresh scheduling, alerts, reconciliation failures, and recovery?
20. Which service targets approve launch? Proposed: 99% accepted-event delivery within 15 minutes when Supabase is available; freshness under 30 minutes; p95 dashboard query under 2 seconds for 90 days; no blocking gameplay request.

## 8. Approval gates

1. **Design:** Section 7 resolved and measurement plan updated.
2. **Migration:** migrations and revoke/rollback paths reviewed before non-production deployment.
3. **Security/privacy:** RLS matrix, event samples, staff policy, retention, and redaction approved.
4. **Reconciliation:** controlled discrepancy at or below 1%, none unexplained.
5. **Production:** hosted evidence, backups, scheduler, alerts, staff list, environments, and rollout owner recorded.

Existing dashboard code does not waive these gates. Until they pass, analytics remains disabled by default and the Command Centre is an unlaunched internal surface.

## 9. References

Repository sources include `measurement-plan-v1.md`, `repository-audit.md`, the database/authoritative/query/resilience/verification documents in this directory, migrations `20261009120000` through `20261009250000`, and the membership-idempotency correction `20261009253000`.

Official sources checked 9 October 2026:

- [Supabase pricing](https://supabase.com/pricing)
- [Supabase billing and usage](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Supabase database functions](https://supabase.com/docs/guides/database/functions)
- [PostHog pricing and retention](https://posthog.com/pricing)
- [PostHog product analytics](https://posthog.com/docs/product-analytics)
- [PostHog privacy controls and cloud regions](https://posthog.com/docs/privacy)

Vendor prices, quotas, and features are volatile. Recheck them at procurement and capacity approval.
