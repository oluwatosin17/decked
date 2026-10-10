# Decked Command Centre Measurement Plan Version 1

**Status:** Implemented contract; verification gates remain open  
**Version:** 1.1  
**Date:** 9 October 2026  
**Scope:** Decked web application, pass-and-play, and Play Together multiplayer  
**Owners:** Product and Engineering

## 1. Purpose

This document defines what Decked measures, when events are emitted, how anonymous identities and sessions are assigned, and how Command Centre metrics are calculated. It is the contract for the analytics database, browser client, multiplayer instrumentation, aggregate queries, and dashboard.

The repository already implements this contract. Changes to event meaning, identity, cohort membership, or denominators require a new measurement-plan version and an explicit compatibility decision; additive optional properties may use a documented minor revision.

## 2. Approved MVP decisions

- Use a Supabase-native analytics pipeline.
- A game starts when its first playable card or player-authored round is displayed.
- A game completes when it reaches its game-specific terminal state.
- A replay creates a new `game_session_id`.
- A browser analytics session rotates after 30 minutes without activity.
- A stored game session may resume within 30 minutes when its game ID and play mode match. The current browser implementation records final abandonment only on an explicit local-game exit; inactivity-based finalization is not yet implemented.
- Retain raw events for 13 months unless legal or operational requirements dictate a shorter period.
- Never collect player display names, room codes, prompt text, custom cards, free-form answers, player-authored statements, or equivalent content.
- Separate `development`, `preview`, and `production` data using an explicit environment property.
- Support `admin` and `viewer` staff roles in the Command Centre MVP.
- Target aggregate-data freshness of 15 minutes.
- Exclude live-room monitoring, prompt-level analytics, content management, experimentation, scheduled reports, and automated alerts from MVP.
- Treat `src/gameRegistry.ts` as the canonical 21-game catalog. The missing `we-just-met` entry in the latest Supabase room-creation allowlist is a multiplayer compatibility blocker.

## 3. Measurement principles

1. **Measure decisions and lifecycle transitions, not React renders.** An event must correspond to a user action or authoritative state transition.
2. **Prefer server authority for multiplayer facts.** Room creation, joins, starts, progression, completion, exits, rematches, and host handoffs are captured from committed table transitions by restricted database triggers. RPC authorization remains the gameplay boundary.
3. **Do not duplicate facts across sources.** Browser attempt/failure events and server success events have distinct names or source rules.
4. **Keep gameplay content private.** Stable identifiers, counts, categories, and state names are allowed; prompt and answer content is not.
5. **Make retries safe.** Every event carries a unique `event_id`; authoritative operations additionally use a deterministic idempotency key.
6. **Version definitions.** Events carry `schema_version`; game and content registries use stable identifiers.
7. **Analytics must not block play.** Browser delivery failure must not prevent navigation or gameplay.

## 4. Canonical identity model

### 4.1 analytics_user_id

A random UUID generated on first use and stored in first-party browser storage. It represents a browser installation, not a verified person.

- Created independently of Supabase authentication so local players can be measured.
- Persists until storage is cleared.
- Must not be derived from device fingerprinting or personal data.
- One person using multiple browsers or devices appears as multiple analytics users.
- Several people sharing one pass-and-play device appear as one analytics user.

### 4.2 supabase_user_id

The anonymous Supabase `auth.users.id` used by Play Together.

- Stored only on restricted raw events or identity-link records when required for server deduplication.
- Never displayed in normal dashboard views or CSV exports.
- May link an `analytics_user_id` to an authenticated multiplayer session, but must not replace `analytics_user_id` for local activity.

### 4.3 analytics_session_id

A random UUID representing a period of application activity.

- Created when the application opens without a session active in the preceding 30 minutes.
- Reused while activity continues and the inactivity gap is less than 30 minutes.
- Rotated after a 30-minute inactivity gap.
- Updated activity timestamps may be maintained locally without emitting an event for every interaction.

### 4.4 game_session_id

A random UUID representing one attempt to play one game.

- Created when the player enters game setup from the play-mode screen, or when a multiplayer room begins setup for the selected game.
- The session is not counted as a game start until `game_started` is emitted.
- Reused across setup, gameplay, temporary navigation, and resumes within 30 minutes.
- Rotated when Play Again or an equivalent restart action begins a new attempt.
- Ends as `completed`, `abandoned`, or `superseded`.

### 4.5 multiplayer_room_ref

A privacy-safe opaque room reference used to join multiplayer facts without exposing the public room code.

- Derived server-side from the internal room UUID using a keyed one-way transform, or represented by a separate analytics UUID.
- Must not be the room code.
- Raw operational room UUID access must remain restricted.

### 4.6 event_id

A UUID generated once per logical event before delivery. Retries reuse the same ID. The database enforces uniqueness by environment and event ID.

### 4.7 app_version

A build or release identifier injected during deployment. It must distinguish production releases and Vercel preview builds without exposing a secret.

### 4.8 environment

One of:

- `development`
- `preview`
- `production`

Unknown values are rejected rather than silently categorized as production.

## 5. Common event envelope

Every event contains:

| Property | Type | Required | Notes |
|---|---|---:|---|
| `event_id` | UUID | Yes | Unique logical event identifier |
| `event_name` | string enum | Yes | Defined in this plan |
| `schema_version` | integer | Yes | Starts at `1` |
| `occurred_at` | timestamp | Yes | Client time for browser events; server time for authoritative RPC facts |
| `received_at` | timestamp | Server | Database receipt time |
| `source` | enum | Yes | `browser` or `database` |
| `environment` | enum | Yes | Development, preview, or production |
| `app_version` | string | Yes | Release/build identifier |
| `analytics_user_id` | UUID | Browser events | Browser installation identity |
| `supabase_user_id` | UUID | Restricted | Only when needed for multiplayer authority |
| `analytics_session_id` | UUID | Browser events | Application activity session |
| `game_session_id` | UUID | Game events | One game attempt |
| `multiplayer_room_ref` | UUID/string | Multiplayer events | Privacy-safe internal reference |
| `game_id` | enum | Game events | Canonical multiplayer registry ID |
| `play_mode` | enum | Game events | `pass_and_play` or `play_together` |
| `properties` | validated object | Event-specific | Reject unknown or forbidden fields |

The ingestion layer must reject property names matching or representing `display_name`, `room_code`, `prompt`, `question`, `answer_text`, `custom_card`, `statement`, `truth`, `bluff`, access tokens, email, phone number, or unrestricted user-entered text.

## 6. Canonical dimensions

### 6.1 Game IDs

`truth-or-dare`, `spicy-starters`, `never-have-i-ever`, `late-night-talks`, `dinner-table`, `icebreaker`, `everyday-conversation`, `reconnect`, `red-flag-green-flag`, `charades`, `strangers`, `finger-down`, `take-a-sip`, `sip-or-spill`, `you-laugh`, `do-or-drink`, `two-truths-bluff`, `most-likely-to`, `choose-your-side`, `who-said-that`, `we-just-met`.

### 6.2 Play modes

- `pass_and_play`
- `play_together`

### 6.3 Application screens

Use the `Screen` identifiers from `src/navigation.ts`. Route path is optional diagnostic metadata; `screen_id` is the reporting dimension.

### 6.4 Browse categories

`all`, `icebreakers`, `deep-talk`, `drinking`, `couples`, `party-games`.

### 6.5 Device class

Derived from viewport/user agent using a documented deterministic rule:

- `mobile`
- `tablet`
- `desktop`
- `unknown`

Do not store the complete user-agent string in aggregate analytics. Restricted error events may store a normalized browser name and major version.

## 7. Event taxonomy

Each event definition below is normative. “Database” means a committed Postgres-trigger or security-definer fact; “Browser” means the typed `track()` API. When both sources emit the same semantic success event, the database fact or durable fact table is authoritative for product metrics and the browser copy is diagnostic only. Browser attempt/failure events remain authoritative when the database cannot observe the rejected or interrupted attempt. If an event definition does not list optional properties, it has no optional event-specific properties in schema version 1; common-envelope fields still follow Section 5.

### 7.1 Application and navigation events

#### app_opened

- **Trigger:** Once per document load after analytics identity is available.
- **Source:** Browser.
- **Required properties:** `initial_screen_id`, `entry_path`, `is_pwa`, `device_class`.
- **Optional properties:** approved UTM fields and referrer domain only.
- **Deduplication:** One event ID per document load; guard against React Strict Mode.
- **Privacy:** No full referrer URL or query values other than approved campaign fields.
- **Implementation point:** `src/main.tsx` before or alongside application render.
- **Applies to:** Entire application.

#### screen_viewed

- **Trigger:** Canonical `Screen` changes and the initial screen is committed.
- **Source:** Browser.
- **Required properties:** `screen_id`.
- **Optional properties:** `previous_screen_id`, `game_id` when applicable.
- **Deduplication:** Do not emit repeated consecutive views of the same screen and parameters.
- **Privacy:** Public route metadata only.
- **Implementation point:** `AppContent` screen state in `src/App.tsx`.

#### navigation_back_selected

- **Trigger:** A Decked navigation back/close control is selected during setup or gameplay.
- **Source:** Browser.
- **Required properties:** `screen_id`, `destination_screen_id`.
- **Optional properties:** `game_id`, `game_session_id`, `lifecycle_stage`.
- **Deduplication:** One per user action.
- **Privacy:** No gameplay content.
- **Implementation point:** Shared `GameNav` callback or the owning `onClose` handler.

### 7.2 Discovery events

#### browse_category_selected

- **Trigger:** Browse category changes.
- **Source:** Browser.
- **Required properties:** `category_id`.
- **Optional properties:** `previous_category_id`, `visible_game_count`.
- **Deduplication:** Ignore selection of the already-active category.
- **Implementation point:** `BrowsePage` category button handler.

#### quick_play_viewed

- **Trigger:** Quick Play screen becomes active.
- **Source:** Browser.
- **Required properties:** `recommendation_set_id`, `recommended_game_ids`.
- **Deduplication:** Once per displayed recommendation set.
- **Privacy:** Game IDs only.
- **Implementation point:** `QuickPlay` after initial queue creation.

#### quick_play_shuffled

- **Trigger:** Shuffle completes and a new set becomes visible.
- **Source:** Browser.
- **Required properties:** `recommendation_set_id`, `recommended_game_ids`, `shuffle_number`.
- **Deduplication:** One per completed shuffle, not button-down/render.
- **Implementation point:** `QuickPlay.handleShuffle` after queue update.

#### game_selected

- **Trigger:** A game card or Quick Play recommendation is selected.
- **Source:** Browser.
- **Required properties:** `game_id`, `selection_surface`.
- **Optional properties:** `browse_category_id`, `recommendation_set_id`, `recommendation_position`.
- **Deduplication:** One per click/tap.
- **Implementation point:** `App.chooseGame`, with source context supplied by caller.

#### play_mode_selected

- **Trigger:** Pass and Play or Play Together is selected.
- **Source:** Browser.
- **Required properties:** `game_id`, `play_mode`.
- **Deduplication:** One per selection action.
- **Implementation point:** `GamePlayMode` buttons.

### 7.3 Game setup events

#### game_setup_started

- **Trigger:** A new `game_session_id` is created and the first game setup screen is shown.
- **Source:** Browser.
- **Required properties:** `game_id`, `play_mode`, `initial_step`.
- **Optional properties:** `resumed` must be false for this event.
- **Deduplication:** Unique by `game_session_id`.
- **Implementation point:** Shared lifecycle adapter entered from `App` or Play Together lobby start.

#### game_setup_resumed

- **Trigger:** Persisted setup/game state is restored within the 30-minute continuation window.
- **Source:** Browser.
- **Required properties:** `game_id`, `play_mode`, `restored_step`.
- **Deduplication:** At most once per document load and game session.
- **Privacy:** Step name only.

#### game_option_selected

- **Trigger:** A stable mode, category, theme, relationship, depth, journey, intensity, round length, or lives option is committed.
- **Source:** Browser.
- **Required properties:** `game_id`, `option_type`, `option_ids`.
- **Optional properties:** `selected_count`.
- **Deduplication:** One per committed selection; toggles may be captured only when the user proceeds to the next setup step.
- **Privacy:** Stable option IDs only.
- **Implementation point:** `SelectGameMode` and each game's setup-next handler.

#### deck_configured

- **Trigger:** Deck construction finishes immediately before gameplay.
- **Source:** Browser.
- **Required properties:** `game_id`, `requested_card_count`, `actual_card_count`, `built_in_card_count`, `custom_card_count`.
- **Optional properties:** category/mode IDs.
- **Deduplication:** One per deck build version within a game session.
- **Privacy:** Counts only; never card or prompt text.

#### player_setup_completed

- **Trigger:** Player setup is committed.
- **Source:** Browser.
- **Required properties:** `game_id`, `player_count`, `play_mode`.
- **Optional properties:** None.
- **Privacy:** Count only; never names or colors.

### 7.4 Pass-and-play lifecycle events

#### game_started

- **Trigger:** First playable card, challenge, answer round, writing round, or voting round becomes visible.
- **Source:** Browser for pass-and-play; database or coordinated server fact for multiplayer.
- **Required properties:** `game_id`, `play_mode`, `starting_step`, `configured_card_count`, `player_count`.
- **Deduplication:** Exactly once per `game_session_id` using deterministic key `game_started:{game_session_id}`.
- **Privacy:** Counts and step IDs only.

#### card_presented

- **Trigger:** A new built-in or custom card position becomes visible.
- **Source:** Browser.
- **Required properties:** `game_id`, `card_number`, `configured_card_count`, `content_source` (`built_in` or `custom`).
- **Optional properties:** stable category ID; stable prompt ID only in a future approved plan.
- **Deduplication:** Unique by `game_session_id` and card/round number.
- **Privacy:** Never prompt content.

#### card_revealed

- **Trigger:** A hidden card is revealed where reveal is a meaningful interaction.
- **Source:** Browser.
- **Required properties:** `game_id`, `card_number`.
- **Deduplication:** Unique by game session and card number.

#### card_advanced

- **Trigger:** Current card/round is completed and the next position is committed.
- **Source:** Browser.
- **Required properties:** `game_id`, `from_card_number`, `to_card_number`, `advance_reason`.
- **Allowed reasons:** `next`, `skip`, `answered`, `round_complete`.
- **Deduplication:** Unique by game session and from-card number.

#### game_completed

- **Trigger:** Game-specific terminal condition is committed.
- **Source:** Browser for pass-and-play; authoritative database event for Play Together.
- **Required properties:** `game_id`, `play_mode`, `completion_reason`, `cards_presented`, `cards_skipped`, `duration_seconds`.
- **Optional properties:** `rounds_completed`, `player_count`.
- **Deduplication:** Exactly once per game session using `game_completed:{game_session_id}`.
- **Privacy:** Aggregate counts only.

#### game_replay_selected

- **Trigger:** Play Again/restart is selected from a terminal state.
- **Source:** Browser.
- **Required properties:** `completed_game_session_id`, `game_id`, `play_mode`.
- **Deduplication:** One per selection action.
- **Effect:** Create a new `game_session_id` before the next setup state.

#### game_session_abandoned

- **Trigger:** The player explicitly confirms exit from an active local game. A future server/session process may additionally finalize non-terminal sessions after the approved inactivity window.
- **Source:** Browser for the currently implemented explicit-exit fact; database/background process for any future inactivity-derived final fact.
- **Required properties:** `game_id`, `play_mode`, `last_lifecycle_stage`, `last_step`, `cards_presented`.
- **Optional properties:** None in schema version 1.
- **Deduplication:** The local lifecycle adapter marks the session terminal after the first exit event. Any future background finalizer must upsert by `game_session_id` rather than add a second abandonment.
- **Privacy:** No content.

### 7.5 Multiplayer room events

#### room_create_attempted

- **Trigger:** Create Room is submitted after local validation.
- **Source:** Browser.
- **Required properties:** `game_id`.
- **Deduplication:** One per submit attempt ID.
- **Privacy:** Never display name.
- **Implementation point:** `PlayTogether.Entry` create action wrapper.

#### room_created

- **Trigger:** `decked_create_room` successfully commits room and host player.
- **Source:** Database trigger is authoritative. The browser currently emits a privacy-safe success mirror after resolving `multiplayer_room_ref`; reporting must not add that mirror to the authoritative room count.
- **Required properties:** `game_id`, `multiplayer_room_ref`.
- **Optional properties:** None.
- **Deduplication:** Database key `room-created:{multiplayer_room_ref}`. Browser mirror uses its immutable `event_id`; cross-source reconciliation prefers `analytics_room_facts`.
- **Implementation point:** `decked_capture_room_analytics` room trigger; browser enrichment in `roomApi.trackRoomSuccess`.

#### room_create_failed

- **Trigger:** Create RPC returns an error.
- **Source:** Browser for transport/RPC failure classification.
- **Required properties:** `game_id`, `error_code`, `failure_stage`.
- **Privacy:** Sanitized code/category only; no raw message containing submitted values.

#### room_join_attempted

- **Trigger:** Join Room is submitted after six-character local validation.
- **Source:** Browser.
- **Required properties:** None beyond common envelope.
- **Privacy:** Never room code or display name.

#### room_joined

- **Trigger:** `decked_join_room` successfully inserts or reconnects a player.
- **Source:** Database player trigger is authoritative. The browser currently emits a privacy-safe success mirror; authoritative conversion uses durable room facts.
- **Required properties:** `multiplayer_room_ref`, `game_id`, `room_player_count`, `is_rejoin`, `is_first_guest`.
- **Optional properties:** None.
- **Deduplication:** One database fact per committed membership transition using a deterministic room/player transition key; reconnect is classified separately. Browser mirrors are not added to authoritative join totals.

#### room_join_failed

- **Trigger:** Join RPC fails.
- **Source:** Browser.
- **Required properties:** `failure_reason`.
- **Allowed reasons:** `not_found_or_expired`, `already_started`, `room_full`, `invalid_input`, `auth`, `network`, `unknown`.
- **Privacy:** Do not record the entered code or name.

#### multiplayer_setup_started

- **Trigger:** Room status commits from `lobby` to `playing` through `decked_start_multi_game`.
- **Source:** Database room trigger.
- **Required properties:** `multiplayer_room_ref`, `game_id`, `room_player_count`.
- **Important:** This is not `game_started`; the active flow still has game-specific setup remaining.

#### multiplayer_game_started

- **Trigger:** The room first commits the multiplayer start transition. For shared-component games this currently begins before all game-specific setup is complete; detailed first-card analysis must therefore use card progression separately.
- **Source:** Database room trigger.
- **Required properties:** `multiplayer_room_ref`, `game_session_id`, `game_id`, `player_count`.
- **Deduplication:** One per multiplayer game session.
- **Important:** In schema version 1 this event is coupled to `lobby → playing`. It is an authoritative room/game start, but not necessarily a literal first-card timestamp for every shared-component game.

#### player_left_room

- **Trigger:** `decked_leave_room` successfully deletes membership.
- **Source:** Database.
- **Required properties:** `multiplayer_room_ref`, `game_id`, `room_status_at_exit`, `remaining_player_count`.
- **Privacy:** No player identity in reporting dimensions.

#### room_ended

- **Trigger:** `decked_end_room` is authorized, before the room row is deleted.
- **Source:** Database.
- **Required properties:** `multiplayer_room_ref`, `game_id`, `lifecycle_stage`, `player_count`, `room_age_seconds`.
- **Deduplication:** Recorded transactionally before deletion.

#### rematch_requested

- **Trigger:** A new user is appended to `rematch_requests`.
- **Source:** Database.
- **Required properties:** `multiplayer_room_ref`, `game_id`, `request_count`.
- **Deduplication:** Existing duplicate requests do not emit another fact.

#### rematch_started

- **Trigger:** Host transitions a terminal shared session into a new setup/game session and clears rematch requests.
- **Source:** Database through an explicit lifecycle action.
- **Required properties:** previous and new `game_session_id`, request count, player count.
- **Effect:** Starts a new game session, not a continuation of the completed one.

#### host_handoff_completed

- **Trigger:** `decked_claim_host` successfully updates `host_user_id`.
- **Source:** Database.
- **Required properties:** `multiplayer_room_ref`, `game_id`, `room_status`, `handoff_reason`.
- **Deduplication:** One fact per successful host transition.
- **Privacy:** Do not expose old/new user IDs in dashboards.

#### host_disconnected

- **Trigger:** Presence plus heartbeat rules determine the host exceeded the approved offline threshold.
- **Source:** Browser signal may be recorded, but the durable fact should be created when the handoff process determines eligibility.
- **Required properties:** `multiplayer_room_ref`, `game_id`, `room_status`, `offline_threshold_seconds`.
- **Deduplication:** One fact per host outage episode.

#### multiplayer_game_completed

- **Trigger:** The restricted shared-session state commits a recognized terminal step or reaches its configured card bound.
- **Source:** Database room trigger using `decked_multiplayer_session_is_terminal`.
- **Required properties:** `multiplayer_room_ref`, `game_session_id`, `game_id`, counts and duration.
- **Deduplication:** Exactly once per game session.
- **Important:** The browser helper is presentation logic only; the database recomputes terminal status from committed shared-session state.

### 7.6 Reliability events

#### realtime_status_changed

- **Trigger:** Supabase database-change or Presence subscription enters a reportable failure/recovery status.
- **Source:** Browser.
- **Required properties:** `channel_type`, `status`, `game_id` if known.
- **Optional properties:** `multiplayer_room_ref`, retry count.
- **Deduplication:** Collapse repeated identical status within 30 seconds.
- **Privacy:** No channel name containing raw room ID.

#### rpc_failed

- **Trigger:** A named application RPC fails.
- **Source:** Browser.
- **Required properties:** `rpc_name`, `error_code`, `failure_class`.
- **Optional properties:** `game_id`, `lifecycle_stage`.
- **Privacy:** Sanitized error classification; no submitted arguments or raw error details.

#### frontend_error

- **Trigger:** React error boundary, global error handler, or unhandled rejection captures an unexpected application failure.
- **Source:** Browser.
- **Required properties:** `error_fingerprint`, `error_class`, `screen_id`.
- **Optional properties:** normalized browser, major version, game ID, lifecycle stage, sanitized stack fingerprint.
- **Deduplication:** Rate limit identical fingerprints per analytics session.
- **Privacy:** Remove URLs, query values, room references, player content, and tokens from messages and stacks.

## 8. Game lifecycle matrix

The matrix describes measurement signals, not every visual step. `First playable condition` is the definition used for `game_started`.

| Canonical game ID | Initial setup step | First playable condition | Advance signal | Terminal condition | Replay location | Special privacy rule |
|---|---|---|---|---|---|---|
| `truth-or-dare` | `ageGate` | `game` displays first Truth/Dare choice/card | Prompt choice then next-card handler | Configured card count exhausted | Game restart/play-again handler | Do not record truth/dare prompt text |
| `spicy-starters` | `ageGate` | `game` displays first card | Card reveal/next | Deck exhausted | Restart handler | Intensity ID allowed; prompt text forbidden |
| `never-have-i-ever` | `modeSelect` in multiplayer; `playerSetup` locally | First `game` card | `iveDoneIt`/points/next transitions | `done` | Done-screen restart | Store response counts only, never per-player answer |
| `late-night-talks` | `deckSize` in multiplayer; `playerSetup` locally | First `game` card | Flip/next-card handler | Deck exhausted | Restart handler | Mode ID allowed; prompt text forbidden |
| `dinner-table` | `deckSize` in multiplayer; `playerSetup` locally | First `game` card | Flip/next-card handler | Deck exhausted | Restart handler | Mode ID allowed; prompt text forbidden |
| `icebreaker` | `playMode` | First `game` card | Round-robin or spotlight next | Deck exhausted | Restart handler | Category ID allowed; prompt text forbidden |
| `everyday-conversation` | `theme` | First `game` card | Flip/next-card handler | Deck exhausted | Restart handler | Theme ID allowed; custom text forbidden |
| `reconnect` | `relationship` | First `game` card | Flip/next-card handler | Deck exhausted | Restart handler | Relationship/depth allowed; prompt text forbidden |
| `red-flag-green-flag` | `deckSize` in multiplayer; `playerSetup` locally | First `game` scenario | Vote completion/next scenario | Deck exhausted | Restart handler | Aggregate vote counts only; scenario text forbidden |
| `charades` | `teamBuilder` in multiplayer; `playerSetup` locally | `game` begins first timed acting round | `didTheyGetIt` then points/next | `done` | Done-screen restart | Never record secret deck or prompt; team/player names forbidden |
| `strangers` | `relationship` | First `game` card | Next-card handler | Deck exhausted | Restart handler | Relationship/journey allowed; prompt/custom text forbidden |
| `finger-down` | `categories` | First `game` card | Next/skip | Deck exhausted | Restart handler | Finger count and categories allowed; prompt text forbidden |
| `take-a-sip` | `categories` | First `game` card | Next/skip | Deck exhausted | Restart handler | Categories/counts only; prompt text forbidden |
| `sip-or-spill` | `categories` | First `game` card | Next/skip | Deck exhausted | Restart handler | Never record answers or custom text |
| `you-laugh` | `roundLength` in multiplayer; `playerSetup` locally | `gameplay` shows first challenge | Laughter/lives/round progression | `winner` | Winner-screen restart | Aggregate life/laugh counts only; no player identity |
| `do-or-drink` | `categories` | First `game` card | Next/skip | Deck exhausted | Restart handler | Never record completion of specific dare or card text |
| `two-truths-bluff` | `write` in multiplayer; `playerSetup` locally | First writing/guess round is active | Write, handoff, guess, reveal | `done` | Done-screen restart | Statements, bluff selection, and individual guesses are forbidden |
| `most-likely-to` | `categories` in multiplayer; `playerSetup` locally | First `game`/vote round is active | Vote/reveal/next | `done` | Done-screen restart | Aggregate voting participation only; no voter-target graph |
| `choose-your-side` | `categories` in multiplayer; `playerSetup` locally | First `vote` round is active | Vote/reveal/next | `done` | Done-screen restart | Aggregate A/B counts allowed; no individual choices |
| `who-said-that` | `deckSize` in multiplayer; `playerSetup` locally | First `answer` round is active | Answer/guess/reveal/next | `done` | Done-screen restart | Answers, authors, and individual guesses are forbidden |
| `we-just-met` | `categories` in multiplayer; `playerSetup` locally | `game` displays first card | `advance(skip)` or `advance(next)` | `done` | `restart` | Category/counts allowed; prompt/custom text forbidden |

## 9. Metric definitions

Unless stated otherwise, dashboard metrics use `production` data. All persisted daily cohorts and aggregates use inclusive UTC dates. Database facts use server timestamps; ordered browser funnels use validated `occurred_at` with `received_at` as a tie-breaker. Internal QA may select `development` or `preview` explicitly, but environments are never combined.

### 9.1 Active players

- **Daily active players:** Distinct `analytics_user_id` with at least one qualifying event on a calendar day.
- **Weekly active players:** Distinct `analytics_user_id` with a qualifying event in the trailing seven-day window, including the selected day.
- **Monthly active players:** Distinct `analytics_user_id` with a qualifying event in the trailing 30-day window.
- **Qualifying events:** `app_opened`, `game_selected`, `game_started`, or a multiplayer room success event linked to an analytics user.
- Passive service-worker and background refresh activity does not qualify.

These count browser installations, not verified people. Pass-and-play player counts must not be added to active-player counts.

### 9.2 New and returning players

- **New player:** An `analytics_user_id` whose first qualifying production event occurred in the selected period.
- **Returning player:** An active `analytics_user_id` with a qualifying production event before the selected period.
- Clearing storage or switching devices creates a new analytics user.

### 9.3 Game views

Count `screen_viewed` events for the game play-mode screen, grouped by canonical `game_id`. Repeated consecutive views deduplicated by the client are not reintroduced.

### 9.4 Game selections

Count valid `game_selected` events. One user may select the same game several times; both event count and unique analytics users should be available.

### 9.5 Game starts

Count distinct `analytics_game_sessions.game_session_id` values whose `started_at` is non-null, attributed to the UTC date of `setup_started_at`. Pass-and-play sessions are derived from `game_started`; multiplayer sessions are created by the authoritative room transition. Setup-only sessions are excluded.

### 9.6 First-card rate

Because `game_started` is defined by the first playable card/round, first-card rate is:

```text
distinct game sessions with game_started
÷ distinct game sessions with game_setup_started
```

This metric is labeled **Setup-to-first-card conversion** in the dashboard to avoid ambiguity.

### 9.7 Completion rate

```text
distinct started game sessions with game_completed
÷ distinct game sessions with game_started
```

The implemented aggregate uses sessions whose `setup_started_at` falls in the selected UTC range and `status = 'completed'`, divided by started sessions from the same setup cohort. Sessions still active are therefore present in the denominator and make recent-period values provisional; the dashboard must expose freshness and partial-data warnings.

### 9.8 Median session duration

For completed sessions, the headline metric is:

```text
game_completed.occurred_at - game_started.occurred_at
```

For abandoned sessions, a separate diagnostic duration may be calculated as:

```text
last_activity_at - game_started.occurred_at
```

The implemented Overview median includes completed sessions only and uses `completed_at - started_at`, grouped by the UTC date of `setup_started_at`. Never mix abandoned duration into that headline median.

### 9.9 Cards played per session

Count distinct `card_presented` positions after `game_started`. For structured round games, a completed round counts as one card-equivalent and must be labeled as a round in detailed views.

### 9.10 Replay rate

```text
game_replay_selected events linked to a completed game session
÷ completed game sessions
```

The intended attribution window is 10 minutes, but the current aggregate counts linked replay events without enforcing that window. The replay creates a new game session. Both sessions retain the same analytics user and analytics session when applicable.

### 9.11 Multiplayer room creation success

```text
distinct successful room_created facts
÷ distinct room_create_attempted events
```

Attempts lacking a linkable result are failures or unresolved; report unresolved separately rather than assuming failure.

### 9.12 Multiplayer join success

```text
authoritative successful join transitions
÷ browser room_join_attempted events
```

Rejoins should be reported separately and excluded from first-time join conversion.

### 9.13 Lobby-to-start conversion

```text
rooms whose first_game_started_at is non-null
÷ rooms whose successful_join_count is greater than zero
```

Also report setup-start conversion separately using `multiplayer_setup_started`.

### 9.14 Time to first guest

For rooms with a guest:

```text
first room_joined where is_first_guest = true - room_created
```

Report median and 75th percentile. Rooms without a guest are excluded from duration but included in no-guest abandonment count.

### 9.15 Time to first card

```text
multiplayer_game_started - room_created
```

Also expose setup duration:

```text
multiplayer_game_started - multiplayer_setup_started
```

### 9.16 Multiplayer completion rate

```text
distinct play_together game sessions with status = 'completed'
÷ distinct play_together game sessions with started_at non-null
```

Use durable `analytics_game_sessions`, not the operational room row, because operational rooms may be deleted.

### 9.17 Rematch request rate

```text
completed multiplayer game sessions with at least one rematch_requested
÷ completed multiplayer game sessions
```

### 9.18 Rematch-start rate

```text
completed multiplayer game sessions followed by rematch_started
÷ completed multiplayer game sessions
```

Also report conversion among sessions with at least one request.

### 9.19 Host-disconnect rate

```text
started multiplayer game sessions with host_disconnected
÷ started multiplayer game sessions
```

### 9.20 Host-handoff success rate

```text
host-disconnect episodes followed by host_handoff_completed within 90 seconds
÷ host-disconnect episodes eligible for handoff
```

Episodes with no connected successor are ineligible and reported separately.

### 9.21 Error-free session rate

```text
analytics sessions without frontend_error, rpc_failed, or reportable Realtime failure
÷ analytics sessions with a qualifying activity event
```

Expected validation failures such as an incorrect room code remain product failures for the join funnel but do not count as application errors unless caused by the application.

## 10. Funnel definitions

### 10.1 Discovery funnel

1. `screen_viewed` for home or browse
2. `game_selected`
3. `play_mode_selected`
4. `game_setup_started`
5. `game_started`
6. `game_completed`

Window: same `analytics_session_id`, with a maximum 24-hour completion window for resumed local sessions.

### 10.2 Multiplayer host funnel

1. `play_mode_selected` with `play_together`
2. `room_create_attempted`
3. `room_created`
4. First `room_joined` guest
5. `multiplayer_setup_started`
6. `multiplayer_game_started`
7. `multiplayer_game_completed`

Window: same `multiplayer_room_ref`; a rematch begins a new game-session subfunnel.

### 10.3 Multiplayer guest funnel

1. Join UI viewed
2. `room_join_attempted`
3. `room_joined`
4. `multiplayer_game_started`
5. `multiplayer_game_completed`

The join UI view should be represented by `screen_viewed` plus a safe `entry_mode = invite | manual`, never the invite code.

## 11. Deduplication and ordering

- Database uniqueness key: `(environment, event_id)`.
- Authoritative lifecycle facts additionally use deterministic transition keys such as `room:{room_id}:created` and `game:{game_session_id}:completed`.
- Browser retries reuse the original event ID.
- Strict Mode protection must live outside component render effects or use a stable per-document guard.
- Events arriving late remain valid when their `occurred_at` is within the retention window and schema version is supported.
- Funnel ordering uses `occurred_at` with `received_at` as a tie-breaker.
- Events more than 24 hours in the future or implausibly older than the client session should be quarantined or marked invalid.

## 12. Privacy classification

### Allowed analytics data

- Stable game, category, mode, theme, relationship, journey, and lifecycle-step IDs.
- Counts: players, cards, categories, votes in aggregate, skips, rounds, lives, durations, retries.
- App version, environment, coarse device class, normalized browser, coarse country if separately approved.
- Privacy-safe room reference.

### Restricted operational data

- Anonymous Supabase user UUID.
- Internal room UUID.
- Sanitized error stack/fingerprint.
- Staff access and export logs.

Restricted fields are unavailable to normal viewers and excluded from exports.

### Forbidden analytics data

- Display names.
- Room codes and invite URLs.
- Prompt, card, scenario, truth, dare, or question text.
- Custom cards.
- Two Truths and a Bluff statements or which statement was the bluff.
- Who Said That answers or authors.
- Individual votes, targets, guesses, or response histories.
- Access tokens, email addresses, phone numbers, full IP addresses, full referrer URLs, or device fingerprints.

## 13. Known repository constraints and blockers

1. `we-just-met` is present in the TypeScript catalog, multiplayer UI, analytics validators, and dashboard filters but absent from the latest `decked_create_room` allowlist.
2. `startMultiGame(room.id, 1, 1)` uses placeholder card counts before game-specific setup. `multiplayer_game_started` therefore means the committed room start, not necessarily first-card visibility for every game.
3. `game_state.session` can contain sensitive gameplay content and must never be copied wholesale into analytics.
4. `decked_end_room` deletes operational history, including players and Charades secrets. Database triggers preserve only approved durable facts through the opaque room reference.
5. Room expiry blocks new joins, and deletion can classify expiry, but no scheduled cleanup mechanism is defined in this repository.
6. There is no stable prompt-ID registry. Prompt-level analytics remains excluded from MVP.
7. The repository has Vitest unit/reconciliation tests and SQL fixture tests, but no browser-driven end-to-end suite or visible CI workflow.
8. Local game state persists until reset or browser storage is cleared. The analytics client maintains separate 30-minute activity timestamps, while explicit exit is the only implemented local abandonment signal.
9. `navigation_back_selected`, `card_revealed`, `rpc_failed`, and `frontend_error` are typed and accepted by ingestion but are not comprehensively emitted by the current UI.
10. Legacy `MultiGame`/`RemoteGame` UI and generic reveal/answer/advance RPCs coexist with the active shared-original-game path. Only the active path contributes to the current measurement contract.
11. Browser `room_created` and `room_joined` mirrors coexist with authoritative database events. Aggregates must use durable room facts or otherwise filter by source to avoid double counting.

## 14. Validation requirements

Before the measurement contract is considered implemented:

- Every event must have a typed schema and forbidden-property tests.
- Each of the 21 games must have a verified first-playable and terminal transition.
- React Strict Mode must not duplicate events.
- Browser retries must not duplicate database rows.
- Room deletion must preserve prior analytics facts.
- Development, preview, and production events must be separable.
- Controlled local and multiplayer journeys must reconcile from raw events to metrics within 1%.
- Anonymous players must not be able to read raw analytics or assign staff roles.
- Display names, room codes, prompt text, and player-authored content must be absent from captured payloads and error logs.

## 15. Remaining decisions

The following decisions remain open and must be approved before technical design is final:

1. Whether coarse country collection is allowed; default remains disabled and it may only be supplied by a trusted server source.
2. Whether the UI will remain UTC-only or add a display-timezone selector. Stored cohorts and daily aggregates remain UTC regardless.
3. Whether setup sessions that never reach the first playable state need a separately named `setup_abandoned` metric.
4. Whether local inactivity should become authoritative abandonment, and which server or scheduled process would finalize it without double counting explicit exits.
5. Whether a host-only room is abandoned after 30 minutes, only at expiry, or only when deleted.
6. Whether the operational room should be updated to `finished` whenever the authoritative shared-session completion fact is committed.
7. Whether the intended 10-minute replay window should be enforced in SQL or removed from the definition.
8. Raw-event retention is approved at 13 months, but aggregate, first-seen, rate-limit, and audit-log retention still require explicit limits and an owner.
9. Staff access is currently explicitly provisioned by Supabase user ID. Product must decide whether this remains the sole policy or whether domain-based provisioning is ever allowed.
10. Whether privacy/analytics consent controls are required in each initial launch market.
11. The minimum sample threshold below which deltas, rankings, and directional language are suppressed.
12. Whether WAU and MAU labels should explicitly say “trailing 7 days” and “trailing 30 days.”
13. Which staff role may export each aggregate report and whether room-level investigations will ever be permitted.
14. The production aggregate-refresh schedule and operational owner.

## 16. Readiness assessment

The implemented event names, privacy rules, identities, and core metric formulas match the current repository after the corrections in version 1.1. Launch approval remains blocked on the decisions in Section 15, correction of the `we-just-met` multiplayer allowlist mismatch, disposable-Supabase execution of SQL fixtures, browser journey reconciliation, and confirmation that dashboard aggregates never combine browser success mirrors with authoritative database facts.

## 17. Version history

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 9 October 2026 | Initial discovery measurement plan. |
| 1.1 | 9 October 2026 | Reconciled the plan with the implemented typed client, explicit-exit abandonment, database-trigger multiplayer authority, UTC aggregates, durable session formulas, browser success mirrors, current tests, and launch blockers. No runtime schema or tracking behavior changed. |
