# Play Patterns migration replay — 8 November 2026

The fresh local migration run stopped at `20261010134000_fix_play_patterns_hour_ambiguity.sql` because the preceding migration already contained `hours.local_hour`. The correction migration expected the old unqualified text and raised an exception when it found no replacement. The migration now exits successfully if the qualified form is present, still rewrites the older form, and still raises if neither known form is present.

`supabase/tests/play_patterns_migration_replay.sql` is a rollback test. It creates a minimal already-corrected function, applies the migration, checks the output, then creates the older body, applies the migration, checks the definition, and applies it once more. The test passed in disposable Supabase Postgres 17.6.1.127:

```text
BEGIN
CREATE FUNCTION
DO
DO
CREATE FUNCTION
DO
DO
DO
ROLLBACK
```

Run from `app/` with `psql -X -v ON_ERROR_STOP=1 -f supabase/tests/play_patterns_migration_replay.sql` against a disposable Postgres database. The test uses `\i` to load the exact migration file and rolls back its function changes.

This resolves the **specific local replay failure**. It does not prove a complete fresh migration-chain run, the linked project's migration-history compatibility, or deployment in a separate staging environment. The user has one Supabase project and requested no new project or unnecessary production changes. Prior QA documented a remote migration-history mismatch; a production push remains outside this test.
