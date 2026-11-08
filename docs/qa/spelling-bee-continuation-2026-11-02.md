# Spelling Bee QA continuation — 2026-11-02

## Release status: BLOCKED

The implementation task remains open. Local checks passed, but the production Supabase migration, four independent browser clients, and live Command Centre counts are not verified. Do not mark Spelling Bee complete or deploy the frontend in isolation.

## Implemented and verified locally

- Replaced the human-reader flow with prerecorded pronunciation audio for all 36 bundled words. The active turn hides the spelling and redacts it from sentence hints; the answer is shown only after a response or timeout. Audio files use opaque names. The speller can replay audio and request a definition or sentence hint.
- Pass & Play uses alternating team turns and swaps each team's speller on its next round. An exact answer or an explicitly configured variant earns one point; an incorrect answer, timeout, or End Turn earns zero. The result screen shows the answer and scores. Pause disables entry. Replay resets the scores.
- Multiplayer word selection is server owned. The live turn RPC returns audio and redacted hints without the spelling, while the result RPC reveals it. The active speller alone can begin and submit. The database locks the room row before judging, enforces the deadline, and rejects a second submission or an old turn. Host or speller can advance after judgement.
- Browser Pass & Play run on `localhost:4176`: four players, two teams, Easy, 30-second timer, one round. Correct spelling produced 1–0; incorrect spelling left it 1–0; final winner matched. The active screen did not expose the answer in accessibility text. Pronunciation playback produced no browser error; the sentence hint showed a blank. Pause, End Turn, reload, and replay were exercised. Previous November 1 run covered a five-second browser timeout. This is functional UI evidence, not a full security proof against a user inspecting local device storage.
- Isolated PostgreSQL test loaded a schema-only copy of the linked project's public schema and applied both Spelling Bee migrations transactionally. Four distinct simulated users joined a room. Ready and active phases hid the word. A nonspeller submission failed. Correct, incorrect, timeout, role rotation, final scores, and completion passed. Two concurrent submissions produced one accepted score and one rejection. A two-round run showed four presented words and four players in the analytics session. The original client-supplied deck RPC was not executable by `authenticated`; the new start and submit RPCs were. The word catalog and secret deck were not directly selectable by `authenticated`.
- Automated checks: 40 Vitest files / 179 tests, TypeScript typecheck, production build and 81 prerendered routes, and browser bundle secret audit passed. Lint exited successfully with existing warnings.

## Release blockers and unverified scenarios

1. `20261101120000_spelling_bee.sql` and `20261101130000_spelling_bee_fairness.sql` are not on the linked project. The live `decked_get_spelling_word` RPC returned HTTP 404 / `PGRST202`. A normal linked `supabase db push --dry-run` fails with `DbPushMissingRemoteError` because older local migrations are absent from remote history. Forcing `--include-all` would apply unrelated migrations to the only linked project, which is production. Reconcile migration history and review the exact production plan before applying these migrations through the normal deployment process.
2. Four independent authenticated browser clients have not completed a live game. Reconnection, room transitions, simultaneous actions through the live API, privacy in all network responses, and score consistency still need browser acceptance after migration. Local SQL concurrency checks do not substitute for this gate.
3. No production Spelling Bee events or Command Centre counts have been confirmed. The local pass-and-play event contract emits starts, presented words, completions, player counts, and card counts. The local database trigger test recorded a completed multiplayer session with the expected player and presented-word counts. Production ingestion, environment filtering, and Games report parity remain open. The separate `20261101150000_command_centre_new_game_filters.sql` migration is also pending for game filtering.
4. Mobile browser layout and audio quality across devices need acceptance. The generated voice files were checked for presence and loadability in the local browser, but pronunciation for all words and regional variants has not been reviewed by a human. The shipped catalog has no explicit regional variants yet; the variant rule was tested with a local fixture.
5. The generic multiplayer analytics completion trigger may report one round even when Spelling Bee is configured for multiple rounds. Word, player, and completion counts passed the local database test; reconcile `rounds_completed` before using it as a release metric.

## Command Centre Content plan

Spelling Bee currently uses a bundled structured library and a private server catalog. Command Centre's managed content path does not yet support this word schema. Add a typed Spelling Bee content type with word, level, definition, redacted sentence hint, approved variant spellings, and pronunciation asset ID. Validate that hints do not reveal the answer; review audio before publication. Publish an atomic catalog version to the private server table and keep the bundled library as a fallback. Then test editor/viewer permissions, import/export, publish/rollback, and a full game using the published version before accepting user-supplied words.

## Next release gate

Reconcile Supabase migration history, apply reviewed Spelling Bee and Command Centre migrations, then run four-client desktop and mobile browser journeys with exact/variant/wrong/timeout responses, rejoin, simultaneous submissions, final scores, and matching Command Centre production counts. Keep this task blocked until those checks pass.
