# Games analytics

The protected Games section compares every entry in `src/gameRegistry.ts`, including zero-data games. Selecting a row opens `/command-centre/games/:gameId`; filters and sorting remain in the URL.

The list reports browser-observed views and selections, authoritative game-session starts and completions, pseudonymous unique installations, first-card rate, medians, repeat play, and 7- or 30-day start trend. CSV export uses the selected trend window, contains only the currently filtered and sorted aggregate rows, and escapes spreadsheet-formula prefixes. Export authorization and audit logging are enforced by the dedicated `decked_export_command_centre_games_csv` server RPC.

The detail response contains daily trends, play-mode split, browser-observed device split, funnel steps, emitted category or mode identifiers, session-depth buckets, repeat behavior, and aggregated error classes. It never returns analytics user IDs, room references, prompt text, answers, or custom content.

Device class is only attached to `app_opened`, so the detail RPC joins starts to the matching analytics session and labels the result as partial. Unique-player counts likewise include only sessions carrying a browser analytics identity. Category and deck/mode sections remain empty for games that do not emit stable identifiers. These limitations are preferable to inferred or fabricated segmentation.

Access is enforced inside both security-definer RPCs through `decked_is_command_centre_staff('viewer')`; authenticated non-staff and anonymous users cannot execute them. Apply the migration in non-production and run `supabase test db supabase/tests/command_centre_aggregates.sql` before promotion.
