# Command Centre Overview

The Overview page is the 60-second product-health view at `/command-centre` (`/command-centre/overview` also resolves to the same section). It reads a staff-only aggregate RPC; the browser cannot read raw analytics tables.

## Metrics

- DAU, WAU, and MAU are distinct anonymous analytics installation IDs on the final selected day and its trailing 7- and 30-day windows.
- New players first appeared during the selected period. Returning players were active in the period and first appeared earlier.
- Game starts, completions, cards played, replay selections, room facts, and reliability sessions come from the daily aggregate pipeline.
- Completion rate is completions divided by starts. Multiplayer start conversion is started rooms divided by rooms with a successful guest join. Replay/rematch rate is replay selections plus authoritative rematches divided by completions.
- Error-free session rate is analytics sessions without a recorded RPC, frontend, or failed Realtime event.
- Median duration uses completed game sessions with valid start and completion timestamps.

All dates and trend buckets are UTC. Previous-period comparisons use the immediately preceding range of equal length. The UI withholds delta wording when the combined current and comparison sample is below 20.

## Filters and partial data

Environment, date range, game, and play mode are persisted in the URL. Device class is shown but disabled because current authoritative game-session facts do not retain that dimension. Player and reliability metrics are not segmented by game or play mode; the RPC returns a partial-data warning whenever either filter is active.

## Security and privacy

`decked_command_centre_overview_v2` checks `decked_is_command_centre_staff('viewer')` before reading data. Anonymous gameplay users receive no dashboard data. The first-seen table stores only an environment, anonymous analytics UUID, and date. It stores no display name, room code, answer, or prompt text.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. With local Supabase running, apply migrations and run `supabase test db supabase/tests/command_centre_aggregates.sql`. That fixture covers authorization denial, current metrics, an error session, game/play-mode filtering, partial warnings, and zero data.

The responsive layout uses five KPI columns on wide desktop, three on compact desktop, two on tablet, and one on mobile. Form controls are labelled, tables have accessible names, the trend SVG has a title and description, and focus indicators use the shared Command Centre styles.
