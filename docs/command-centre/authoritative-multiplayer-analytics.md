# Authoritative multiplayer analytics

**Migration:** `supabase/migrations/20261009160000_authoritative_multiplayer_analytics.sql`

## Design

Database triggers observe successful mutations to `decked_rooms` and `decked_room_players`. This preserves every gameplay RPC signature, response shape, and authorization rule while recording room creation, first joins, setup/start, progression, completion, exits, room end/expiry, rematch requests/starts, and host disconnect/handoff.

`analytics_room_links` is a restricted, operational lookup from a room UUID to an independent `multiplayer_room_ref`. The lookup is deleted with the operational room. Events, game-session facts, and room facts retain only the independent reference, so historical analytics survives room deletion without retaining the room code, display name, prompt, answer, or custom content.

Database event idempotency keys describe immutable transitions. State comparisons suppress retries that do not change the lifecycle, and the existing unique analytics-event index is the final duplicate guard. Membership joins and exits use a one-way SHA-256 digest of the transient player-row UUID as an idempotency component. This distinguishes a genuine leave/rejoin cycle from a retried RPC without storing the operational player ID, auth user ID, display name, or room code. The corrective definition is delivered by `20261009253000_multiplayer_analytics_membership_idempotency.sql`.

## Failure policy

Analytics writes execute inside PL/pgSQL exception blocks. PostgreSQL rolls back the failed analytics sub-block while allowing the already-authorized gameplay mutation to complete. This intentionally favors gameplay availability. A warning is emitted for database operators; missing telemetry is preferable to breaking a live game. Facts that would claim a transition occurred are written only after that transition succeeds.

The browser records attempts and sanitized failures that a rolled-back database RPC cannot retain, plus Realtime database/presence subscription states. Create/join use their specific attempted/failed events. Other multiplayer mutations use `rpc_failed` with only the stable RPC name, a bounded database error code, and the fixed `rpc_rejected` class. Raw messages, arguments, room identifiers/codes, display names, answers, settings, and other user inputs are never sent.

## Environment configuration

Each Supabase project is an environment boundary. Set its database setting to the matching value:

```sql
alter database postgres set app.settings.analytics_environment = 'preview';
```

Allowed values are `development`, `preview`, and `production`. The fallback is `production` so a production project cannot silently write into a lower-trust dataset. Local SQL tests set `development` transactionally.

## Verification

With Docker and the local Supabase stack running:

```sh
supabase db reset
psql "$(supabase status -o env | sed -n 's/^DB_URL=//p')" \
  -f supabase/tests/command_centre_analytics_foundation.sql
psql "$(supabase status -o env | sed -n 's/^DB_URL=//p')" \
  -f supabase/tests/authoritative_multiplayer_analytics.sql
```

The multiplayer SQL test covers successful flows, non-host and non-member authorization denials, duplicate join RPCs, two distinct leave/rejoin cycles, progression, completion, rematch request/start, expired-room rejection, host disconnect/handoff, operational deletion, privacy, and survival of durable history.

## Rollback

Roll back only before dependent dashboard migrations are deployed. Drop the five analytics triggers, the restricted reference RPC, the capture/helper functions, and finally `analytics_room_links`. Existing gameplay tables and RPCs require no rollback because this migration does not redefine them.

If only the membership-idempotency correction must be withdrawn, use a new forward migration rather than editing an applied file. The safest operational rollback is to disable the two `decked_room_players` analytics triggers while preserving existing facts; restoring the position/version-based function would reintroduce the leave/rejoin collision. Analytics-trigger removal does not change gameplay RPC signatures, response shapes, authorization, or RLS.
