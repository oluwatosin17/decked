# Command Centre query services

## Metric contract

The migration `20261009210000_command_centre_aggregates.sql` implements the approved UTC definitions as additive daily numerators and denominators. Rates are calculated only after summing the selected range; pre-averaged percentages are never combined.

- Overview: started game sessions, completed game sessions, completion rate, and multiplayer starts.
- Games: setup cohort, starts, completions, cards presented, and completion rate by canonical game ID.
- Funnels: discovery, multiplayer host, and multiplayer guest step counts. Game sessions are attributed to their setup date so a session completing after midnight stays in its original cohort.
- Multiplayer: rooms, successful joins, multiplayer starts/completions, host disconnects/handoffs, and rematches.
- Reliability: sanitized RPC failures, frontend errors, and failed Realtime subscription states, with app opens as the traffic denominator.

All query RPCs require an active, non-anonymous `command_centre_staff` account and accept environment, inclusive UTC date range, and appropriate optional filters. Responses include `refreshed_at`. Freshness is non-null only when a successful refresh covered the complete requested UTC range; a newer partial refresh cannot make a wider report appear fresh. Browser roles cannot select aggregate tables directly.

## Refresh operation

`decked_refresh_analytics_aggregates(from, to)` deletes and rebuilds a maximum 32-day UTC window. It is idempotent and uses `pg_try_advisory_xact_lock` to return `already_running` when another refresh owns the lock. Only `service_role`, the database owner (including Supabase Cron), or a future explicitly granted admin path may execute it.

Recommended Supabase Cron cadence:

```sql
select public.decked_refresh_analytics_aggregates(current_date - 2, current_date);
```

Refreshing the trailing three days incorporates late browser delivery while keeping scans bounded. A Vercel Cron alternative must call a server-only function using the service-role credential; that credential must never use a `VITE_` variable or enter the browser bundle.

## Query plans

Run these after realistic preview data is loaded:

```sql
explain (analyze, buffers)
select game_id, metric_name, sum(metric_value)
from public.analytics_daily_aggregates
where environment = 'production'
  and metric_date between current_date - 29 and current_date
group by game_id, metric_name;

explain (analyze, buffers)
select funnel_name, step_name, sum(metric_value)
from public.analytics_funnel_daily
where environment = 'production'
  and metric_date between current_date - 29 and current_date
group by funnel_name, step_name;
```

The expected plans are bounded index/bitmap scans using `analytics_daily_aggregates_dashboard_idx` and `analytics_funnel_daily_query_idx`, followed by small hash/group aggregates. Overview totals and the compact overview/games/funnel RPCs read aggregate membership or daily tables. Exact percentile calculations and the later segmented Games, Funnels, Multiplayer, and Reliability reports still use date- and environment-bounded scans of normalized facts or raw events because those dimensions are not losslessly represented in the MVP aggregates. Their source indexes cover environment, UTC timestamp, event name, game ID, play mode, and status. Hosted plans at representative volume remain a launch gate; add a new aggregate only when those plans show a material latency or scan-cost problem.

## Reconciliation and testing

`decked_reconcile_analytics_day(environment, date)` compares aggregate game starts with authoritative source sessions. The disposable SQL fixture covers zero data, a partial funnel, a duplicate event retry, a cross-midnight completed session, environment isolation, filtered results, refresh idempotency, freshness, and unauthorized access.

Local execution remains:

```sh
supabase db reset
psql "$DB_URL" -f supabase/tests/command_centre_aggregates.sql
```

Rollback requires dropping the new RPCs and indexes, then `analytics_funnel_daily` and `analytics_aggregate_refreshes`. The pre-existing raw events, sessions, room facts, and generalized daily aggregate table remain intact.
