# End-to-end analytics verification — 9 October 2026

## Launch status

**BLOCKED pending database-backed execution in a disposable Supabase environment.** The deterministic application reconciliation suite passes with 0% discrepancy, but this machine has no local Docker runtime and the only linked Supabase project is production. Production was not used for synthetic journey writes.

## Evidence run

`src/analytics/reconciliation.test.ts` exercises controlled development fixtures for:

- browse, select, start, first card, cross-midnight completion, and replay (`charades`);
- setup abandonment before the first card (`icebreaker`);
- room creation, first guest join, specialized write/handoff/guess shared state, start, card, completion, host disconnect, host handoff, rematch request/start, and room end (`two-truths-bluff`);
- failed join with a repeated idempotency key;
- production/development isolation and privacy rejection.

The suite compares deduplicated raw events with reconstructed game sessions, UTC daily aggregates, durable room totals, and dashboard totals. Controlled expected/actual values reconcile exactly: 4 starts, 2 completions, 2 cards, 1 failed join, 1 replay, and 1 rematch. The unexplained discrepancy is 0%, below the 1% gate.

The fourth start is the authoritative rematch session. The previous verifier treated `rematch_started` only as a rematch counter even though Postgres creates the replacement game session with `started_at` populated. The harness now treats it as both a rematch and a start, matching the database measurement contract.

| Journey | Raw sequence | Derived/session result | Aggregate/dashboard result | Status |
|---|---|---|---|---|
| Charades local completion and replay | Open → browse → select → mode → setup → start → card → complete → replay → start | Two bounded game-session IDs; first completes across midnight | Two starts, one completion, one card, one replay | Pass |
| Icebreaker abandonment | Open → select → mode → setup → abandon | Session has no start, completion, or card | No start/completion contribution | Pass |
| Two Truths and a Bluff multiplayer | Create attempt → create → join → setup → start → card → disconnect → handoff → complete → rematch request/start → room end | Specialized shared-state journey retains two game-session IDs; rematch is a new started session | Two starts, one completion, one card, one rematch; durable room facts each equal one | Pass |
| Failed join | Join attempt → sanitized failure → duplicate retry | Duplicate idempotency key collapses to one raw failure | One failed join | Pass |
| Environment isolation | Production start mixed into development fixture | Excluded before sessionization | Zero production contribution to development totals | Pass |

Cross-midnight completion is attributed to the start date in the daily aggregate, matching `analytics_game_sessions.setup_started_at` attribution. The replay start occurs on the following UTC date.

Existing database fixtures provide complementary coverage:

- `supabase/tests/command_centre_analytics_foundation.sql`: ingestion validation, append-only behavior, duplicate rejection, privacy denials, and RLS;
- `supabase/tests/authoritative_multiplayer_analytics.sql`: creation, join, start, completion, expiry denial, disconnect/handoff, rematch, room deletion, and durable facts;
- `supabase/tests/command_centre_aggregates.sql`: raw-to-aggregate refresh, cross-day sessions, environment isolation, funnels, dashboard RPCs, authorization, idempotent refresh, and reconciliation.

## Security and privacy review

- Fixtures use opaque UUID-like/session references only; no room codes or raw anonymous-user identifiers reach dashboard results.
- The automated privacy scan rejects nested `display_name`, `room_code`, `answer`, `prompt`, `prompt_text`, and `access_token` properties.
- Browser tests already verify player names and prompt text are not emitted by pass-and-play adapters.
- Database tests assert raw analytics and staff/dashboard functions remain inaccessible to unprovisioned authenticated users.
- No service-role credential is present in browser code or a `VITE_` variable.

## Known limitations

1. The new reconciliation harness validates the measurement contract in memory; it does not replace PostgreSQL execution of migrations and RPCs.
2. Browser automation does not currently drive every game UI through Supabase because no disposable hosted project is configured.
3. Realtime disconnect timing remains deterministic SQL/fixture coverage rather than a network-fault test.
4. Country and acquisition dimensions are not asserted because the controlled journeys do not provide trusted server-side country data.

## Required database gate

Create or select a disposable Supabase project, apply migrations in timestamp order, and run:

```sh
psql "$NON_PRODUCTION_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/command_centre_analytics_foundation.sql
psql "$NON_PRODUCTION_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/authoritative_multiplayer_analytics.sql
psql "$NON_PRODUCTION_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/command_centre_aggregates.sql
psql "$NON_PRODUCTION_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/command_centre_security_hardening.sql
```

Then exercise the same three games through the browser, refresh aggregates, and compare the staff dashboard with the controlled expected totals. Launch approval requires every unexplained discrepancy to remain at or below 1%.

## Rollback

- Application-only rollback: revert `src/analytics/reconciliation.ts` and its test; no runtime behavior or stored data changes.
- Fixture rollback: all database verification files run inside `BEGIN`/`ROLLBACK`; an interrupted run should be followed by an explicit `ROLLBACK` on that connection.
- Do not roll back production analytics tables to undo test data. Synthetic journeys must run only in the disposable environment and may be removed by deleting that project.
