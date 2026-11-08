# Draft PR #15 review map

The PR compares the checkout's integration branch with its original commit
`9069f68`. It includes previously uncommitted Decked work as well as the
Spelling Bee candidate integration. Treat these as separate review decisions.
Approval of one area does not imply approval of the whole PR or a release.

| Review area | Primary files | Decision to record |
| --- | --- | --- |
| Spelling Bee game and content | `src/SpellingBeeGame.tsx`, `src/SpellingBeeMultiplayerGame.tsx`, `src/content/spellingBee.ts`, `src/content/spellingSelection.ts`, `src/content/spellingManaged.ts`, `src/content/spellingAudio.ts`, `src/components/SpellingWordCard.tsx`, `src/components/SpellingLevelSelect.tsx`, `public/assets/spelling-pronunciations/`, `supabase/migrations/20261101120000_spelling_bee.sql`, `20261101130000_spelling_bee_fairness.sql`, `20261108100000_spelling_bee_managed_content.sql` | Gameplay rules, balanced selection, answer privacy, timeout, complete-release fallback, and audio readiness. |
| Command Centre content operations | `src/command-centre/ContentPage.tsx`, `src/command-centre/contentJson.ts`, `src/command-centre/contentMetadata.ts`, `src/content/managedRuntime.ts`, the content-management migrations and tests | Draft import, structured editing, role permissions, version conflicts, publication gate, rollback, and displayed counts versus playable counts. |
| Read My Lips | `src/ReadMyLipsGame.tsx`, `src/ReadMyLipsMultiplayerGame.tsx`, `src/content/readMyLips.ts`, `src/readMyLips*.ts`, Read My Lips migrations, guides and QA reports | Review and sign off independently on phrase freshness, scoring, media cleanup, and multiplayer behavior. |
| Shared product wiring | `src/App.tsx`, game/navigation registries, browse pages, analytics, shared multiplayer files and earlier migrations | Confirm other games, Command Centre sections, and analytics have no regressions. |
| Editorial content | `spelling_words_reviewed_draft.json`, `decked_spelling_bee_qa_review_queue.csv`, `command-centre-draft-import.json` | Review the 35 held flags and all 934 import drafts, including Nigerian English pronunciation and regional spellings. Keep drafts unpublished until approved audio is available. |

## Evidence and remaining gates

- Automated: 184 Vitest tests passed in 41 files; typecheck, lint, build and
  bundle secret audit passed. The new client regression rejects any partial
  managed release and resets to the bundled library.
- Database: all applicable migrations through 8 November 2026 applied to a
  disposable local Supabase Postgres container. Three rollback SQL tests passed,
  including four authenticated identities and incomplete versus complete
  managed release selection. The old Play Patterns text-rewrite migration was
  skipped because it does not match the fresh container's function text.
- Open: four independent browser clients, cross-device/network checks,
  Command Centre staff workflows and reconciliation, editorial sign-off,
  pronunciation review, and release environment migration verification.

Spelling Bee currently has no buzzer or steal action. Confirm that gameplay
choice separately before release approval.
