# Read My Lips multiplayer QA — 30 October 2026 (Lagos)

## Scope and evidence

Tested the live Supabase production API using four separate anonymous player sessions. Created and joined a room, assigned two teams of two, started a 50-prompt deck with two rounds per team, ran four turns, reviewed each turn, and reached a finished result.

Also played through the live website in isolated headless Chrome with four independent mobile-sized browser contexts. Three UI rooms reached the final score on all four screens; the third repeated the review flow with a delayed API response. Together with four API QA rooms, this generated seven test rooms whose activity may appear in production Command Centre aggregates. The host exited completed UI rooms through the Games button where tested. A final-screen screenshot is saved at [assets/read-my-lips-ui-final-2026-10-30.png](assets/read-my-lips-ui-final-2026-10-30.png).

## Results

| Boundary | Result | Evidence |
| --- | --- | --- |
| Room creation and joining | Passed | Four distinct signed-in anonymous players reached one lobby. |
| Host-only start | Passed | A guest start was rejected; the host started the 50-card game. |
| Speaker and prompt privacy | Passed | Each active speaker received the phrase; the opposing reviewer received `phrase: null`. Other players could not begin or score the active turn. |
| Turn actions | Passed | Correct, skip, undo, end, review toggle, and next advanced all four turns. Scores matched the reviewed decisions. |
| Opposing team review | Failed, then fixed and retested | Initially a host on the active team could confirm its own score. After the database fix, the host's own-team confirmation was rejected and opposing players completed all four reviews. |
| Final result | Passed | After four turns, the room had `status: finished`, `lips_phase: done`, and scores `[2,2]`. |
| Analytics link | Passed | The completed room returned a nonempty analytics room reference. |
| Command Centre visible totals | Unverified | The staff-only multiplayer report rejected the anonymous QA account with error `42501`; direct analytics fact reads were also denied. Signed-in Chrome control timed out twice. |
| Browser room and setup UI | Passed | Host created the room, three guests joined by invite code, the host assigned two teams, chose Mixed prompts and one round per team, and Start Game moved all four screens to Turn 1. |
| Browser scoring and realtime screens | Passed after fixes | Speaker-only prompt, Correct, Skip, End Turn, opposing-team review, score changes, turn switch and final results appeared across all four browser contexts. One completed UI run ended 1–1 and another 1–0; all four screens agreed each time. No browser JavaScript errors were observed. |
| Browser media | Passed in isolated Chrome only | Chrome's fake camera and microphone permissions were accepted. Speaker video and guesser remote video both reached media `readyState 4` during play. Real phones on different networks were not tested. |
| Review loading | Passed after fix | With the review RPC deliberately delayed, the reviewer saw “Loading turn review…” and Confirm was disabled. The saved prompt then appeared and Confirm became enabled. |

## Issue and prepared fix

The original `decked_lips_action` function calculated review permission as host **or** opposing team. The frontend had the same host override. This allowed a host to confirm its own team's turn. Changed the frontend helper and database function so only a member of the opposing team can review or confirm. The complete four-turn live API test passed again after the database update, including explicit host-own-team rejection.

The UI run exposed three more issues: End Turn immediately after Skip could show “Game moved forward; refresh”; the review list briefly showed “No prompts were marked” while its RPC was still loading; and spectators saw “Connecting video” despite not using video. The frontend now retries End Turn once against the latest card when it meets a stale-card race, shows an explicit review loading state with Confirm disabled until decisions arrive, and hides video-connection status for spectators. The affected UI flows passed after deployment. Typecheck and 10 focused tests pass. Current Cloudflare version: `7e37f11c-0e0c-42bc-98e2-7608e4e8a79c`.

The checkout lacks many remote migration-history files from 15–20 October, so a normal `supabase db push` dry run stopped. An isolated temporary migration directory containing placeholders for the 103 already applied remote versions allowed a dry run that listed **only** `20261030120000_read_my_lips_opposing_team_review.sql`. That single migration was applied. The checkout's broader migration-history mismatch remains and should be reconciled before a normal database push.

## Next verification

1. Reconcile the local and remote Supabase migration histories before future normal database pushes.
2. Verify camera and microphone between real phones on separate networks, and inspect the staff Command Centre Multiplayer report filtered to Read My Lips for 30 October 2026. The isolated Chrome QA contexts do not have staff access; the signed-in browser controller timed out.

## Follow-up on 30 October 2026

After the first report, a fresh four-player Chrome run exposed an authentication race: Create Room could be clicked before anonymous sign-in finished, causing `permission denied for function decked_create_room`. The room API now waits for one shared sign-in operation before Create or Join. A fresh browser run created and joined a room successfully.

The media code discarded ICE candidates that arrived before the remote session description. It now queues and applies them after description setup. It also retries a stalled connection and offers a Retry Video button. Turn expiry now lets the speaker end immediately and the guesser act as a backup after five seconds, avoiding duplicate expiry requests from spectators. Cloudflare TURN is not configured; real phones on distinct networks remain untested.

Ran a complete two-turn game in four independent mobile-sized Chrome contexts against both the local build and the deployed site. The host created the room; three guests joined; the host assigned teams, selected Mixed prompts, set a 60-second turn and one round per team, and started the game. Each team scored once, the opposing team confirmed each turn, and all four screens reached the same 1–1 final score. The deployed run's speaker and guesser video elements both reached `readyState 4` with a video track using Chrome's fake media devices. See [live final screenshot](assets/read-my-lips-live-final-2026-10-30.png). A fast End Turn after Correct initially made a stale-card HTTP request before its retry. End Turn now reads the current card first. The final deployed four-player run reached the same 1–1 result with no HTTP 400 responses or JavaScript errors.

Frontend typecheck, 33 focused tests, and the production build passed. Deployed Cloudflare version `bd376034-6d8a-42ce-ae7d-a14defb770af`. The live analytics ingest endpoint rejected an invalid token with HTTP 401, and Worker secret names for the Supabase URL, publishable key and service role key are present. This confirms endpoint configuration, not that a specific room appears in the staff report. Command Centre's signed-in browser controller timed out again, so visible totals remain unverified.

Recovered 42 missing SQL migration files from the linked project's migration metadata into `supabase/migrations`. They contain no detected private keys or API key assignments. A normal dry run now identifies 12 local migrations dated 27–30 October that are not recorded in remote history. A schema-only live dump was captured for comparison, but it cannot prove that data migrations ran. No migration repair or database push was attempted for those 12 entries.
