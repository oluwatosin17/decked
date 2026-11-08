# Decked product QA audit — 1 November 2026

## Executive result

**Overall: conditional / not end-to-end signed off.** The current local checkout builds, typechecks, passes 170 automated tests, and supports a complete Read My Lips pass-and-play run. Public navigation, the game guide, feedback validation, and the unauthenticated Command Centre gate were exercised in a browser. The staff Command Centre, production analytics, content publishing, and current multiplayer backend could not be fully verified without a provisioned staff session and a deployed database test environment. Those gaps are release gates, not assumed passes.

This report tests the working tree as found on 1 November 2026. It contains many pre-existing uncommitted changes, including new Read My Lips and Spelling Bee files. The audit did not modify product code or deploy anything.

## Scope and method

- **Local UI:** Vite at `http://127.0.0.1:5173`, inspected through the browser accessibility tree. Read My Lips was played from browse through final results on one device. The guide, feedback form, and staff gate were opened separately.
- **Automated checks:** `npm test -- --reporter=dot`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:content`, `npm run audit:prompts`, and `npm run security:bundle`.
- **Code review:** Read My Lips scoring and turn progression; Command Centre route, staff access, section inventory, API calls, and existing tests.
- **Not performed:** authenticated Command Centre UI, real multi-device play, live production data reconciliation, SQL integration tests, mobile-device and assistive-technology sessions, performance load testing, or production deployment. No staff credentials were available in the test browser; `supabase` and `psql` CLIs were unavailable locally.

## Results by product area

| Area | Result | Evidence and limit |
| --- | --- | --- |
| Home and browse | Pass for navigation | Home rendered, browse showed the canonical game cards including Read My Lips and Spelling Bee, and the Read My Lips card opened the play-mode chooser. Search/filter behavior was not exercised. |
| Read My Lips setup | Pass | Category and prompt-type selection enforced a choice; fewer than four players did not advance; four players could be assigned to two teams; timer and round count led to a two-turn game. |
| Read My Lips gameplay | Pass with observation | Speaker phrase, Correct, automatic timer expiry, turn review correction, next-team handoff, final score, and winner all worked in the local browser. The second team saw the unscored phrase left on screen at the prior turn's end; see Q-02. |
| Read My Lips guide | Pass with copy mismatch | Correct guide route rendered and linked back to play. Its fixed player/time wording does not reflect all supported setup choices; see Q-03. |
| Feedback | Partial pass | Completion URL preselected Read My Lips. Empty submission showed a required-message error and focused the message field. A real submission and staff inbox receipt were not tested. |
| Other games | Automated coverage only | Existing Vitest suite passed; no new full browser run was performed for every game. Previous Spelling Bee local pass-and-play QA is documented separately; current multiplayer deployment is not verified here. |
| Command Centre authentication | Partial pass | `/command-centre` and direct `/command-centre/content` both rendered the provisioned-staff sign-in gate. No staff session was used, so authorization, role behavior, OTP, reset, and sign-out were not exercised. |
| Command Centre reporting | Unverified end to end | Overview, Acquisition, Games, Funnels, Multiplayer, Geography, Play Patterns, and Reliability components and RPC callers exist. Their live data, filters, chart accuracy, empty/error states, and CSV exports were not exercised with staff access. |
| Command Centre operations | Unverified end to end | Content, Feedback, and Settings/Audit components exist. Import, edit, publish, release propagation, inbox actions, role restrictions, and audit entries need an authorized test session. |
| Analytics and security | Static/automated pass, live gap | Analytics tests passed and browser bundle secret audit found no Supabase service-role credential. Live event ingestion and Command Centre reconciliation for this run were not verified. |
| Build and SEO | Pass with warning | Production build completed and prerendered 81 indexable routes. One chunk exceeded Vite's 500 kB warning threshold. |

## Automated check detail

| Check | Result |
| --- | --- |
| Vitest | 37 files, **170 tests passed** |
| TypeScript | Passed |
| Oxlint | Exit 0, **119 warnings** (notably React hook dependency warnings; no errors) |
| Production build | Passed; 81 routes prerendered; large-chunk warning |
| Content inventory | 30 canonical games and 43,331 category memberships audited |
| Prompt audit | 109 decks checked, 109 passed, 0 failed |
| Browser secret audit | Passed; no Supabase service-role credential in bundle |

## Findings and risks

### Q-01 — P1: staff Command Centre has no end-to-end acceptance evidence in this audit

**Reproduce:** Open `/command-centre` or `/command-centre/content` in the local browser. Both stop at provisioned-staff sign-in. A usable staff test account was not available. The 11 navigation sections are implemented in `src/command-centre/CommandCentre.tsx`, but their live RPC responses and operations are not visible to this session.

**Impact:** A green build and unit suite cannot establish that dashboards match production events, that filters/exports agree, or that content publishing and audit trails work. The previous Read My Lips QA report also left the staff Multiplayer total unverified. This is a verification blocker, not a demonstrated application failure.

**Acceptance test:** With a provisioned viewer, editor, and admin account in a nonproduction environment, open every section; test date/environment/game/device filters, zero/error states, CSV export parity, content draft/import/publish and runtime appearance, feedback status changes, audit entries, and role-denied actions. Reconcile one known pass-and-play completion and one known multiplayer completion against raw event/room facts and dashboard totals.

### Q-02 — P3: a phrase can carry over to the next team after a timed turn

**Reproduce:** In a two-team Read My Lips game, mark a phrase Correct so the next phrase appears, let the turn expire without scoring that next phrase, then start the second team's turn. The second team receives that same visible phrase. The local run did this with “A Lizard Stole My Shoe.” In `src/ReadMyLipsGame.tsx`, `markPhrase` advances `card`, while `next` advances `turn` without advancing `card`.

**Impact:** The next team can see a phrase already exposed during handoff, which may reduce fairness if someone saw or heard it. This is a product-rule ambiguity: if carryover is intended, document it; otherwise advance to a fresh phrase at turn change. Add a focused regression test for the chosen rule.

### Q-03 — P3: Read My Lips guide describes fixed setup despite configurable play

The guide says “4 or 6” players and “Swap teams after 60 seconds.” The UI allows a numeric timer (5 seconds was accepted in this run), and the team builder is driven by the roster size rather than a fixed two- or three-team option. Update the guide to describe the actual supported player range and selected timer. This affects player expectations, not core scoring.

### Q-04 — P2: lint warning backlog includes new multiplayer hook warnings

Oxlint exited successfully but reported 119 warnings. `src/ReadMyLipsMultiplayerGame.tsx` includes missing/complex dependency and cleanup-ref warnings. These merit triage because stale closures and cleanup against a changed ref can cause intermittent realtime or media behavior. This audit did not establish a runtime failure from them.

### Q-05 — P2: current multiplayer and database migration state remain a release gate

The earlier [Spelling Bee QA report](spelling-bee-2026-11-01.md) observed a missing live RPC for `decked_get_spelling_word`; the [Read My Lips multiplayer report](read-my-lips-multiplayer-2026-10-30.md) documented successful earlier multi-client runs but left real phones across networks and Command Centre totals unverified. This audit did not re-query the live backend, so those reports are prior evidence rather than a fresh production verdict. Before release, confirm the migration history and required RPCs in the target environment, then run independent-client games and verify their analytics.

## Recommended release sequence

1. Provision a disposable staff QA session and test all 11 Command Centre sections and roles against a nonproduction dataset with known expected counts.
2. Confirm deployment of the current Read My Lips and Spelling Bee migrations, then run four independent clients through creation, join, privacy, scoring, timeout, reconnect, review, final result, and Command Centre reconciliation.
3. Decide the Q-02 phrase carryover rule and align code, tests, and guide copy. Correct the Q-03 guide wording.
4. Triage the multiplayer hook warnings, then repeat typecheck, tests, build, and browser smoke test before sign-off.

## Release judgment

**Pass for local Read My Lips pass-and-play core flow. Hold full-product sign-off** until authenticated Command Centre and current multiplayer/backend flows have observed, reproducible end-to-end results. The scope gap is material because those are central parts of the requested product audit.
