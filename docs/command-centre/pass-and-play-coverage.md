# Discovery and Pass-and-Play Analytics Coverage

**Status:** Implemented, disabled by default  
**Measurement contract:** `docs/command-centre/measurement-plan-v1.md` Version 1.1

## Discovery coverage

| Journey point | Event | Implementation |
|---|---|---|
| Document opens | `app_opened` | `AppContent`; module-level guard prevents React Strict Mode duplicates. |
| Canonical screen commits | `screen_viewed` | `AppContent`; consecutive duplicate screens are suppressed. |
| Browse filter changes | `browse_category_selected` | Browse category click handler; selecting the active filter does nothing. |
| Quick Play recommendations appear | `quick_play_viewed` | Initial stable recommendation-set UUID. |
| Quick Play shuffle completes | `quick_play_shuffled` | New set UUID, canonical game IDs, and monotonic shuffle number. |
| Game is selected | `game_selected` | Central `chooseGame`, with home/browse/Quick Play surface and Quick Play set/position where available. |
| Play mode is selected | `play_mode_selected` | Pass-and-play and Play Together click handlers. |
| Top-level mode is selected | `game_option_selected` | Shared `SelectGameMode`. |

## Pass-and-play lifecycle design

All 21 local games use `useGameStep` and `usePersistentGameState`. Those hooks notify `PassAndPlayTracker`, which reads only counts and stable option IDs through the explicit registry in `src/analytics/passAndPlayRegistry.ts`. The tracker never reads prompt-bearing deck entries, player names, answers, statements, or custom-card text.

`game_setup_started`/`game_setup_resumed`, player setup, configuration, game start, card advance, terminal completion, replay transitions, and reliable in-app abandonment use this shared path. Multiplayer sessions are excluded when `SessionStateContext` is active.

Legend: **Full** means the event is emitted from an authoritative local transition. **Built-in only** means card positions are emitted when the configured custom-card count is zero; ambiguous mixed-deck positions are omitted because the app does not persist privacy-safe provenance. **N/A** means the game is round/player-authored rather than a built-in card deck.

| Canonical game ID | Setup/config/start | First `card_presented` | Advance | Completion | Replay | Reliable abandonment | Exception |
|---|---|---|---|---|---|---|---|
| `truth-or-dare` | Full | Full | Full | Full | Full | Full | Completion inferred when the card counter reaches its configured limit. |
| `spicy-starters` | Full | Full | Full | Full | Full | Full | Spice level is a stable option ID. |
| `never-have-i-ever` | Full | Full | Full | Full | Full | Full | Terminal `done` step is authoritative. |
| `late-night-talks` | Full | Full | Full | Full | Full | Full | App-level mode selection is recorded separately. |
| `dinner-table` | Full | Full | Full | Full | Full | Full | App-level mode selection is recorded separately. |
| `icebreaker` | Full | Full | Full | Full | Full | Full | Play mode is a stable option ID. |
| `everyday-conversation` | Full | Built-in only | Full | Full | Full | Full | Mixed custom/built-in positions are omitted because safe per-card provenance is unavailable. |
| `reconnect` | Full | Built-in only | Full | Full | Full | Full | Relationship and depth IDs are recorded; ambiguous mixed positions are omitted. |
| `red-flag-green-flag` | Full | Built-in only | Full | Full | Full | Full | Ambiguous mixed positions are omitted. |
| `charades` | Full | Built-in only | Full | Full | Full | Full | Rounds are authoritative; ambiguous custom prompt provenance is omitted. |
| `strangers` | Full | Built-in only | Full | Full | Full | Full | Relationship and journey IDs are recorded; ambiguous mixed positions are omitted. |
| `finger-down` | Full | Built-in only | Full | Full | Full | Full | Ambiguous mixed positions are omitted. |
| `take-a-sip` | Full | Built-in only | Full | Full | Full | Full | Ambiguous mixed positions are omitted. |
| `sip-or-spill` | Full | Built-in only | Full | Full | Full | Full | Ambiguous mixed positions are omitted. |
| `you-laugh` | Full | Full | Full | Full | Full | Full | Challenge index is the card counter; winner step is terminal. |
| `do-or-drink` | Full | Built-in only | Full | Full | Full | Full | Ambiguous mixed positions are omitted. |
| `two-truths-bluff` | Full | N/A | Round advance | Full | Full | Full | Player-authored statements are never inspected or emitted. |
| `most-likely-to` | Full | Full | Full | Full | Full | Full | Start waits for the first private vote screen where the prompt is displayed. |
| `choose-your-side` | Full | Full | Full | Full | Full | Full | Start waits for the first private vote screen where the dilemma is displayed. |
| `who-said-that` | Full | Built-in only | Round advance | Full | Full | Full | Player answers are never inspected; ambiguous custom prompt provenance is omitted. |
| `we-just-met` | Full | Built-in only | Full | Full | Full | Full | Ambiguous mixed positions are omitted. |

## Known boundaries

- Browser/tab closure is not reported as abandonment because delivery is unreliable. Confirmed in-app exits after gameplay begins are reported.
- For games that can mix built-in and custom cards, `card_presented` is emitted only when the custom-card count is zero. The adapter deliberately does not inspect card text to reconstruct provenance.
- Final-card `card_advanced` is emitted when a counter advances to its terminal limit. Games that transition directly to a terminal step without incrementing the counter rely on `game_completed` as the authoritative terminal fact.
- Replay is inferred from an in-session terminal-to-setup transition. The completed game-session UUID is attached before the analytics client rotates to the new session.
- No event contains prompt text, custom-card text, display names, room codes, answers, statements, scores keyed by player, or raw persisted game state.
