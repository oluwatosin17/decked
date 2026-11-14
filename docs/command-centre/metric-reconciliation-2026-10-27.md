# Command Centre metric reconciliation — 27 October 2026

## Finding

The apparent contradictions were caused by different reporting scopes, not one shared query returning different answers.

| Surface | Existing denominator | Consequence |
|---|---|---|
| Overview | Refreshed daily player membership and session-health aggregates | Whole-product totals |
| Acquisition | Sessions with an `app_opened` event in the selected period | Four attributed visitors appeared to be four total visitors |
| Funnels | Strict ordered journeys beginning with `app_opened` or the relevant multiplayer intent event | Missing journey instrumentation appeared as zero conversion |
| Geography | Any raw event with a country attachment | Players outside Overview's active-player membership could be counted |
| Reliability | Raw sessions containing a qualifying event | Error-free rate used a smaller denominator than Overview |

## Correction

- Acquisition now labels its counts as attributed traffic and displays coverage against Overview active players. Unattributed players are excluded from source conversion instead of being silently classified as Direct.
- Funnels now displays ordered-journey coverage against Overview active players and explains that its rates apply only to fully instrumented journeys.
- Geography uses the same `analytics_daily_active_users` membership as Overview, assigns one latest trusted country per active player for the selected range, and then aggregates activity within that cohort.
- Whole-product Reliability uses `analytics_daily_session_health`, matching Overview exactly. Dimension-filtered reliability continues to use raw qualifying sessions and says so explicitly.

Historical raw events are not rewritten. The correction changes the reporting contract and prevents unavailable attribution or journey evidence from being represented as zero whole-product traffic.

## Verification

- `npm run lint` completed with pre-existing warnings only.
- `npm run typecheck` passed.
- `npm test` passed: 28 files, 124 tests.
- `npm run build` passed and prerendered 81 indexable routes.
- `wrangler deploy --dry-run` passed.
- Local Supabase validation could not complete because the first-run database image download stalled.
- Supabase SQL Editor was unavailable during the attempt and displayed its platform technical-issue fallback, so the migration was not applied to production.
- Wrangler OAuth timed out, so the frontend was not deployed to production.

## Files

- `src/command-centre/AcquisitionPage.tsx`
- `src/command-centre/FunnelsPage.tsx`
- `supabase/migrations/20261027120000_command_centre_metric_reconciliation.sql`

## Production order

1. Validate and apply `20261027120000_command_centre_metric_reconciliation.sql` in Supabase.
2. Deploy the tested frontend through Cloudflare.
3. Compare Overview, Geography, and Reliability for one identical unfiltered date range.
4. Confirm Acquisition and Funnels show coverage rather than implying their instrumented samples equal total traffic.
