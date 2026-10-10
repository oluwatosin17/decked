# Play Patterns

The staff-only **Play Patterns** report at `/command-centre/play-patterns` shows when game sessions start in each player's reported local time.

## Data contract

- `app_opened` records an optional IANA timezone (for example, `Africa/Lagos`) and UTC offset in minutes.
- `game_started`, `multiplayer_game_started`, and `rematch_started` are deduplicated by `game_session_id`.
- Country comes from the existing trusted server-side country attribution. Timezone comes from the browser and is not treated as proof of physical location.
- Sessions without a valid timezone remain in the total-start count but are excluded from local-time charts and reported through the coverage KPI.
- The heatmap is always returned as 168 cells (seven weekdays × 24 hours), including zeroes.

The report never stores or returns city, GPS coordinates, IP addresses, room codes, player names, card text, answers, or raw player/session identifiers.

## Interpreting results

Peak periods are directional when the selected sample has fewer than 20 game starts. VPNs, travel, inaccurate device settings, missing browser events, and server-only multiplayer events can reduce accuracy. Use the country table for broad scheduling decisions, not individual targeting.

## Rollback

Roll back the frontend to remove navigation and browser capture. Database rollback should revoke and drop `decked_command_centre_play_patterns`, restore the previous `decked_analytics_properties_are_safe` implementation, and only then drop its renamed helper. Existing event rows remain valid and need not be deleted.
