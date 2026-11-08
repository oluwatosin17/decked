# Spelling Bee QA — 2026-11-01

## Result

Pass and play works in a local browser. Multiplayer is **blocked** because the Spelling Bee Supabase migration is not deployed. Production Command Centre counts therefore cannot be verified yet.

## Browser run

On an isolated local development origin (`localhost:4175`), I opened Spelling Bee from its game route, chose Easy, entered four players, created and named two teams, assigned both pairs, set a five-second timer and one turn per team, and started play. The first turn timed out for zero points. The second turn was marked correct and awarded one point. The final screen declared the one-point team the winner and showed the expected scores. The word was visible on the reader's screen in this shared-device run.

## Automated checks

- Vitest: 37 files, 170 tests passed. Includes Spelling Bee deck selection, turn balance, role rotation, and pass-and-play analytics event tests.
- TypeScript typecheck passed.
- Oxlint passed with existing warnings.
- Production build and prerender of 81 routes passed.

## Command Centre and backend

- The canonical game registry and Games report include `spelling-bee`; zero-activity rows appear even before events arrive.
- Pass-and-play instrumentation tests emit `game_started`, `card_presented`, and `game_completed`, including player and card counts without word or player-name payloads. Local development events require the Command Centre development environment filter.
- The authoritative multiplayer analytics triggers use the room's `playing` and `finished` transitions. The Spelling Bee SQL sets these states and advances `cardIndex`.
- A direct availability check against the configured Supabase project returned HTTP 404 / `PGRST202` for `decked_get_spelling_word`. The required `20261101120000_spelling_bee.sql` migration is absent from the live API. Four-client multiplayer play, privacy, reconnection, final results, and actual Command Centre ingestion remain unverified.
- Spelling Bee words currently come from the bundled `src/content/spellingBee.ts` library. They are not yet editable through Command Centre Content; plan that connection before ingesting new content.

## Changes during QA

- Added a leave-room action and feedback link to the multiplayer final screen.
- Corrected a stale content import SQL contract assertion.
- Removed an outdated fixed game count from the Games empty-state copy.

## Next verification gate

Apply the Spelling Bee migration, then test with four independent authenticated browser clients: room creation and joining, team setup, word privacy, start/correct/incorrect/timeout, role rotation, reconnect, final result, and the resulting Games report counts in the correct environment.
