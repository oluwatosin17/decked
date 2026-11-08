# Decked QA follow-up — 1 November 2026

## Decision

**Hold full-product release sign-off.** The local fixes build and pass 179 tests. Read My Lips and Spelling Bee pass-and-play journeys were completed in a browser, and all 11 live Command Centre sections loaded with an existing admin session. The sole Supabase project is production. The new database migrations are not deployed, the live Spelling Bee word RPC is absent, the Read My Lips game filter fails, and four-client multiplayer plus role-based Command Centre acceptance remain unverified. No production gameplay, content, feedback, or account records were intentionally created or modified for this audit.

This report continues [the earlier audit](product-audit-2026-11-01.md). It records evidence observed on the current working tree and live site on 1 November; it does not treat static tests or an older multiplayer run as current end-to-end proof.

## Corrections prepared locally

| Finding | Correction | Regression evidence | Production state |
| --- | --- | --- | --- |
| Q-02, exposed phrase handed to next team | Both pass-and-play and authoritative room action advance past the currently exposed phrase at handoff. Phrase access no longer wraps an exhausted deck; the game ends early with an explanation if no fresh phrase remains. | `src/readMyLipsTurn.test.ts`; local two-team browser game showed a third, unexposed phrase at Team 2 start. | Frontend and `20261101140000_read_my_lips_fresh_team_phrase.sql` not deployed. |
| Q-03, inaccurate Read My Lips guide | Documents even player count from four, teams of two, selected timer and rounds, turn review, role swap, music modes, and early deck exhaustion. | `src/guideData.test.ts`; local guide rendered corrected wording at `/guides/how-to-play-read-my-lips`. | Frontend not deployed. |
| Q-04, multiplayer React hook warnings | Media request generation guard stops a stream arriving after role/turn change; effect cleanup closes peers and clears media references; audio play and subscription paths guard asynchronous completion. Stable dependencies replace previous hook warning sites. | `src/multiplayer/mediaLifecycle.test.ts`; typecheck and lint. No remaining lint warnings in `ReadMyLipsMultiplayerGame.tsx`. | Frontend not deployed; real media/network behavior needs client testing. |
| Live Command Centre Read My Lips filter failure | Validator now accepts both new canonical game IDs. | `src/command-centre/newGameFilters.test.ts` compares migration IDs to registry. Live failure reproduced before fix. | `20261101150000_command_centre_new_game_filters.sql` not deployed. |

These changes sit among extensive pre-existing uncommitted product work. Nothing was committed or deployed in this audit.

## Reproducible local verification

From `app/`, run `npm test -- --reporter=dot`, `npm run typecheck`, `npm run lint`, and `npm run build`. Results: **40 files / 179 tests passed**, TypeScript passed, lint exited 0 with **112 warnings** elsewhere, build passed and prerendered **81 routes**. Vite reported one chunk above 500 kB. `git diff --check` passed. The test suite includes new handoff, guide, media lifecycle, and filter validator regressions. SQL checks are contract tests; a database integration run was unavailable.

Browser evidence at local Vite `127.0.0.1:5173`:

1. Browse displayed 30 canonical games. Opening each of the 30 game URLs showed its expected title and initial screen. An Icebreakers filter showed 13 matching cards. At 390 × 844, Browse had no horizontal document overflow (`scrollWidth=innerWidth=390`). This is route and layout smoke coverage, not a complete playthrough of 30 games or a physical-device check.
2. Read My Lips: selected category and Mixed prompts, entered four players in two teams, chose a 10-second timer and one round per team. Team 1 scored “I FOUND A TINY HORSE IN MY HANDBAG”; “MY CHAIR IS BROKEN” then became visible but unscored. Team 2 began with “FLYING MEAT PIE,” distinct from both prior phrases. Both teams scored once and the final 1–1 tie rendered.
3. Spelling Bee: four players, two teams, Easy, five seconds, one round per team. Team 1 timed out and received no point; Team 2 submitted `wrong`, saw the incorrect answer and no point; the final 0–0 tie rendered. This checked timeout, incorrect answer, and final score, not every difficulty or audio/device combination.
4. The corrected Read My Lips guide rendered player count, configurable timer and rounds, gameplay, review, and music guidance. Browser smoke also covered search/filter navigation and responsive Browse; it did not establish WCAG or multi-device compatibility.

## Command Centre: existing authorized admin access

The live account displayed **ADMIN**. I opened all 11 sections read-only. Values below are the displayed production window **3 October–1 November 2026**; they are observations, not reconciled truths. Section visits themselves generated ordinary `command centre accessed` audit entries.

| Section | Observed result | Remaining acceptance work |
| --- | --- | --- |
| Overview | Loaded; 393 active players. | Reconcile raw unique identities and date/environment filters. |
| Acquisition | Loaded; 29 attributed of 393 (7.4%). | Verify attribution event counts and export parity. |
| Games | Loaded 29 of 29; Read My Lips row appeared with zero metrics; Spelling Bee search had no match. Local registry has 30 games. | Deploy frontend, verify game listing and starts/completions against raw events. |
| Funnels | Loaded; ordered discovery journey 43/393 (10.9%). | Reconcile stage definitions and raw events. |
| Multiplayer | Loaded; 158 rooms, 233 joins, 39.5% completion, 431 realtime failures. Selecting Read My Lips in Game filter made report unavailable, repeatably. | Deploy validator fix; retest game/date filters and room/event reconciliation. |
| Geography | Loaded; 16 countries, 388 located, four unknown. | Verify source data and unknown handling. |
| Play Patterns | Loaded; 352 starts, 0% timezone attribution. | Investigate why starts lack timezone; reconcile cohort counts. |
| Reliability | Loaded; zero frontend errors, 301 failed RPCs, 431 realtime failures, 88.0% error-free rate. | Determine whether collection is complete and reconcile failures with logs. |
| Content | Loaded; 13,104 published memberships, zero draft, 35,357 archived, 194 categories below a 300-card target; Read My Lips showed 368 published cards. | Exercise edit/import/publish in isolated data only; verify runtime propagation and role limits. |
| Feedback | Loaded; zero items at all statuses. | Exercise inbox actions with isolated records only; verify audit trail. |
| Settings / Audit | Loaded; 500 audit rows shown with truncation; recent access entries appeared. | Verify viewer/editor/admin matrix, permission denials, and complete audit pagination. |

**Filters and exports:** the unfiltered dashboards loaded. The Read My Lips Multiplayer filter failed; its root cause is the deployed `decked_validate_command_centre_filters` allowlist, which excludes Read My Lips and Spelling Bee. Other filter combinations, CSV exports, and displayed-to-raw count parity were not fully verified. Exporting from the production admin UI could create audit records and would not establish count correctness without a raw-data baseline, so it was not represented as passed.

**Permissions:** only the existing admin session was available. Separate viewer and editor behavior, forbidden operations, content changes, feedback transitions, and audit actions were not exercised. The user specifically directed that new role accounts and a new Supabase project not be created for this audit.

## Multiplayer deployment and four-client status

I issued read-only RPC availability checks to the configured live Supabase REST endpoint using a nonmember UUID. `decked_get_spelling_word` returned **404 / PGRST202**, absent from the schema cache. `decked_get_lips_prompt` and `decked_get_lips_turn_review` returned **401 / permission denied**, which shows they are present and protected, but does not prove every required Read My Lips migration or action path is deployed. The new phrase-handoff migration and Command Centre validator migration are local only. Migration history and exact database revision were not available through this access.

Four independent live clients were **not** run through room creation, joining, state sync, phrase privacy, scoring, timeout, disconnect/reconnect, and final results. That would create room/gameplay/analytics records in the only Supabase project and could affect live reports. Local unit/contract tests and earlier multiplayer reports do not replace a current four-client backend run. A safe acceptance run needs an isolated database or an explicitly designated production-safe test plan with known accounts and cleanup/reconciliation rules. Separate physical devices and networks were not available in this session.

## Open release gates and next verification

1. Review and apply the pending Read My Lips, Spelling Bee, and filter migrations through the normal production change process, then confirm migration history and required RPC signatures. Do not assume the 404 clears until rechecked.
2. Deploy the tested frontend version. Repeat the two-team phrase-handoff browser run and verify the guide on the deployed site.
3. Run four isolated clients through both games, including privacy (only the active speaker receives a Read My Lips phrase), scoring/review, timeouts, reconnection, and final results. Capture room IDs and timestamps, then reconcile room/event facts to Multiplayer, Games, Funnels, and Reliability.
4. With authorized role access and isolated records, test each Command Centre permission boundary, filters, CSV row/count parity, content and feedback workflows, and audit entries. Investigate 0% timezone attribution, the 301 failed RPCs, and 431 realtime failures.
5. Expand full playthrough and responsive/assistive checks beyond the two featured games; the 30-game route smoke cannot certify all game rules.

**Current recommendation:** local fixes are ready for review, but full-product release remains **not verified**. The deployed backend and live analytics defects are concrete, and the four-client, role, export, and raw-data reconciliation gaps remain material.
