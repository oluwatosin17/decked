# Decked Analytics Client

The application-facing analytics API is `track` from `src/analytics`. Analytics is disabled unless `VITE_ANALYTICS_ENABLED` is exactly `true`.

```ts
import { track } from './analytics'

track('game_selected', {
  game_id: 'charades',
  selection_surface: 'browse',
  browse_category_id: 'party-games',
})
```

TypeScript discriminates properties by event name, and the runtime validator rejects missing, unknown, malformed, or forbidden fields. Do not bypass the types with casts.

## Configuration

| Variable | Allowed values | Purpose |
|---|---|---|
| `VITE_ANALYTICS_ENABLED` | `true` or unset/anything else | Explicit analytics rollout switch; disabled by default. |
| `VITE_ANALYTICS_ENVIRONMENT` | `development`, `preview`, `production` | Required data partition when analytics is enabled. Invalid values disable tracking. |
| `VITE_APP_VERSION` | Non-empty release identifier | Preferred release/build identifier; required outside development unless the commit-SHA fallback is configured. |
| `VITE_VERCEL_GIT_COMMIT_SHA` | Vercel commit SHA | Fallback release identifier. |

Only `VITE_` values are present in the browser. Never place a Supabase service-role key in any Vite environment variable. The analytics transport uses the existing publishable key and an anonymous authenticated Supabase session, then calls the restricted `decked_ingest_analytics_events` RPC.

## Identity and delivery

- `analytics_user_id` persists in first-party local storage and represents a browser installation, not a person.
- `analytics_session_id` persists across activity and rotates after 30 minutes of inactivity.
- `game_session_id` begins with setup/replay, resumes for the same game and play mode within 30 minutes, and is attached to lifecycle events.
- Every logical event receives one UUID before it enters the queue. Retries reuse that UUID.
- The queue is bounded to 100 sanitized events, sends at most 25 at a time, retries with capped exponential backoff, and never blocks navigation or gameplay.
- Persisted retry entries are restored only when their environment matches the current build, preventing a production build from forwarding stale development or preview events.
- Successfully delivered event IDs are remembered in a bounded list to prevent local duplicate delivery.
- Failures are silent for players. Development builds may log a short diagnostic without event properties.

## Privacy rules

Never pass display names, room codes, prompt/question text, answers, player-authored statements, custom-card text, emails, phone numbers, tokens, passwords, or secrets. Use stable IDs, enums, counts, durations, and sanitized fingerprints only.

The client automatically derives device class only for `app_opened`, and promotes approved `game_id`, `play_mode`, `game_session_id`, and `multiplayer_room_ref` values into the common envelope. Environment, app version, timestamps, analytics identity, and activity session are supplied by the client.

## Adding or changing an event

1. Update the approved measurement plan.
2. Update `AnalyticsEventProperties` in `src/analytics/types.ts`.
3. Update the runtime allowlist and required fields in `src/analytics/schema.ts`.
4. Deliver a database migration updating the ingestion constraint/validator if necessary.
5. Add positive, negative, privacy, and retry tests before instrumenting a screen.

Run:

```sh
npm run typecheck
npm test
npm run lint
npm run build
```
