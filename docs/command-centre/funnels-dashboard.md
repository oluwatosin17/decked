# Funnel analytics

The protected Funnels section computes ordered journeys from raw, validated event facts and returns aggregates only. `decked_command_centre_funnels_v2` requires a staff viewer role and never returns analytics session IDs, user IDs, room references, codes, or content.

## Rules

- Funnel entry is assigned to the UTC date of the first step.
- Every funnel has a 24-hour conversion window.
- Events are ordered by `occurred_at`, then `received_at`, then event row ID.
- Repeated events use the earliest qualifying occurrence after the previous step.
- A later step cannot qualify if an earlier step is missing or out of order.
- Cross-day conversion is included when it remains inside the 24-hour window.
- “Join opened” maps to `screen_viewed` for `play-together`; “code submitted” maps to `room_join_attempted`.
- Authoritative multiplayer currently exposes the first playable state at game start, so multiplayer first-card time uses that transition and is clearly labelled in the UI.

The interface keeps these rules visible for both populated and zero-entrant results so an empty funnel cannot be mistaken for an unordered event count. It also reports freshness as unavailable when no successful aggregate refresh fully covers the selected range.

Successful room creation and joining now enqueue non-blocking browser bridge events containing only the privacy-safe room reference. They connect the browser analytics session to authoritative database facts; failures to enrich analytics never block gameplay.

Game, play mode, device class, acquisition source, app version, environment, and UTC date filters are supported. Country is intentionally disabled because the approved pipeline does not collect it.

Apply the migration in non-production, then run `supabase test db supabase/tests/command_centre_aggregates.sql`. Rollback drops `decked_command_centre_funnels_v2`; the browser bridge events can remain harmlessly or be reverted independently.
