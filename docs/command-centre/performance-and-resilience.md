# Performance and operational resilience — 9 October 2026

## Launch status

Application resilience checks pass. Database timing and query-plan gates remain **blocked** until the migrations and fixtures can run in a disposable Supabase project; the linked project is production and was not load-tested.

## Measured local results

| Check | Before | After | Target |
| --- | ---: | ---: | ---: |
| Analytics work in gameplay call stack | transport not called | transport not called | 0 network calls |
| Browser batch ceiling | 25 events only | 25 events and 60 KiB | ≤25 and <64 KiB |
| RPC payload ceiling | 64 KiB, not mirrored by client | 64 KiB server / 60 KiB client | ≤64 KiB |
| Retry synchronization | deterministic exponential delay | ±20% jitter, 60s cap | bounded/backed off |
| Retry concurrency | one in-flight send | one in-flight send | 1 |
| Ingestion rate | unbounded per authenticated user | 300 events/minute/user | ≤300/minute |
| Controlled reconciliation discrepancy | 0% | 0% | ≤1% |
| Oversized valid browser batch | could exceed the RPC limit and retry indefinitely | split before 60 KiB | no repeated 64 KiB rejection |
| Approved `custom_card_count` | rejected by an over-broad privacy matcher | accepted as a numeric aggregate; content fields remain rejected | no lost deck-configuration event |
| Local `track()` profile (1,000 calls) | not measured | p95 0.061 ms; max 2.873 ms; 0 network calls | p95 <10 ms; 0 network calls |
| Production build | not recorded | 2.47 s; initial app JS 291.82 KiB / 84.29 KiB gzip; Supabase chunk 214.85 KiB / 55.26 KiB gzip | build succeeds; Command Centre remains lazy |
| Command Centre lazy chunk | not recorded | 51.48 KiB / 11.82 KiB gzip, plus 9.59 KiB / 2.80 KiB gzip CSS | excluded from ordinary gameplay navigation |
| Reconciliation | 0% controlled discrepancy | 0% controlled discrepancy | ≤1% |
| Automated suite | 46 passing | 49 passing across 10 files | all passing |

The local interaction profile is produced by `pnpm profile:analytics`. It executes 1,000 synchronous `track()` calls and proves zero transport calls occur in that interaction stack. The production asset measurements above come from Vite's gzip report on the same machine; they are engineering baselines, not field Core Web Vitals.

The browser queue is capped at 100 events and persisted best-effort. `track()` performs validation and bounded local persistence, schedules delivery, and never awaits authentication or network work. Duplicate retries retain the original event ID and the database uniqueness constraints make resubmission idempotent.

## Service targets

- Event delivery: 99% of accepted browser events delivered within 5 minutes when Supabase is healthy; queue never blocks gameplay.
- Dashboard freshness: trailing three UTC days refreshed every 15 minutes; warn when freshness exceeds 30 minutes.
- Dashboard RPCs: p95 below 1 second and p99 below 2 seconds for a 90-day filtered range.
- CSV export: complete within 10 seconds and remain below 5 MiB; current reports are aggregate-bounded, with Games capped by the 21-game registry and audit results capped at 500 rows.
- Analytics-induced gameplay error rate: below 0.1%; delivery failures remain silent to players.
- Reconciliation: unexplained controlled-fixture discrepancy no higher than 1%.

## Capacity assumptions

Initial capacity assumes 10,000 daily active browser installations, 100 events per active day, roughly one million browser events/day, batches of 25 or fewer, and a three-day aggregate refresh window. The quota permits short bursts while limiting a single anonymous-auth identity to 432,000 events/day only if it continuously reaches the ceiling; upstream WAF/project limits should be added before traffic materially approaches this bound.

## Database verification gate

On a disposable project, capture `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for overview, games, funnels, multiplayer, reliability, the three-day refresh, and the largest export. Record p50/p95 over at least 20 warm calls. Existing indexes already match environment/date/event, session, room, and aggregate filter patterns; no speculative index was added. Reliability-group export cardinality is data-dependent and must be measured before the 5 MiB target can be approved.

Run `supabase/tests/analytics_operational_resilience.sql` to test a 300-event accepted minute followed by a rejected event, an oversized payload, duplicate submission, and browser grants. Also test a 60-second database outage, concurrent refresh attempts, a stale aggregate timestamp, and a maximum export. Confirm gameplay RPCs remain successful throughout.

## Recovery and rollback

1. Temporary Supabase failure: client queues locally and retries with exponential jitter; gameplay continues.
2. Retry storm: confirm quota rejections and Supabase health, then disable analytics with the existing environment flag if needed.
3. Stale aggregates: rerun the idempotent trailing-three-day refresh; overlapping refreshes return `already_running`.
4. Slow dashboard: restrict the date range, inspect plans, and disable the affected report without changing gameplay paths.
5. Roll back the quota migration by dropping the wrapper and quota helper/table, renaming `decked_ingest_analytics_events_unthrottled(jsonb)` back to `decked_ingest_analytics_events`, restoring grants, and reverting the client jitter change. Raw events and aggregates are unaffected.

The property-validation correction can be rolled back by restoring the prior function definition, but doing so will again reject `custom_card_count`; no stored rows need modification. The client payload cap can be rolled back independently by reverting `MAX_ANALYTICS_BATCH_BYTES` and `nextBatch()`.

## Verification status

Local client, reconciliation, privacy regression, type checking, lint, production build, and browser-bundle secret checks pass. The local Supabase stack could not start because Docker was unavailable. Therefore ingestion throughput, query p50/p95, query plans, aggregate refresh duration/concurrency, outage recovery against Postgres, stale-data behavior, and maximum export duration/size are **not measured**, and launch is not approved.
