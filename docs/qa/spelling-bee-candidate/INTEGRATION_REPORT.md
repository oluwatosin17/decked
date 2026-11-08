# Spelling Bee candidate integration — 8 November 2026

## Source and decision

The attached candidate was applied to the current checkout's Spelling Bee implementation. This checkout is on `feature/bad-advice-discovery` and already contained uncommitted Spelling Bee game and Command Centre work. The remote had no Spelling Bee branch when checked. The attached notes describe a proposal and were checked against the actual code, database migration, and content schema before implementation.

The 1,000 supplied records remain **editorial drafts**. The pack reports 35 human review flags and explicitly does not claim dictionary attestation, audio review, or player playtesting. The prepared Command Centre import contains 934 new unflagged rows, all marked `needs_review`; it holds 35 flagged rows and excludes 31 unflagged words already in the 36-word bundled game. `node scripts/prepare-spelling-candidate.mjs` regenerates the import and summary with stable IDs.

## Implemented boundaries

| Boundary | Implementation | Verification |
| --- | --- | --- |
| Game entry | Existing `/games/spelling-bee` and Play Together routes retained. Pass-and-play uses a fair selector: one level per complete team round, no repeat within a game, and recent local words deprioritised. | Vitest covers round fairness, uniqueness, selected levels, exhaustion, and exact answer variants. |
| Command Centre import | Uses existing `decked-content-v1` draft importer and item versions; no new content table. Upload preview shows level counts, bundled overlap, CMS ID conflicts, and validation issues. Invalid rows block import. | Generated 934-row document parses through the application JSON parser and preview tests. |
| Structured editor | Spelling Bee fields map `word` to body and `definition`, `sentence`, `level`, `variants`, `review_status` to metadata. Existing role restrictions and expected version save remain in place. | TypeScript and full project tests; production staff workflow not exercised. |
| Publish gate | New migration creates level categories and rejects malformed, unapproved, or audio-less Spelling Bee content before `published_version` changes. UI also performs a read-only preflight. | Full migration chain applied to disposable local Supabase Postgres; rollback test confirmed draft rejection, approved audio-backed acceptance and audio-less rejection. |
| Pass-and-play release | Existing managed-content feature flag (`VITE_CONTENT_SOURCE=managed-preferred`) loads only published content. Spelling Bee uses approved words with known pronunciation audio and falls back to bundled words for missing or invalid levels. | Unit tests cover valid level replacement and fallback. |
| Multiplayer | New server wrapper selects words from the published release when enough approved, audio-backed words exist; otherwise it uses the existing private catalog. It gives all teams the same level in a round. The word and clues remain in the server-owned secret deck. Before result, only the active speller receives audio and clues from the private RPC. | Local rollback test used four authenticated identities and confirmed equal-level rounds, uniqueness and clue privacy. Independent browser sessions and networks remain open. |

The game currently has pronunciation assets for only 36 bundled words. The 934 draft rows therefore cannot be published as playable content until they have been reviewed and provided with audio. The published-content migration is intentionally restrictive. Existing 36-word gameplay remains the fallback. There is no buzzer or steal action in the current Spelling Bee interfaces; the integration follows the actual speller-submission and timeout rules.

## Reproduce

1. Run `node scripts/prepare-spelling-candidate.mjs` from `app/` to regenerate `command-centre-draft-import.json` and `import-preview.json`.
2. Run `npm test -- --reporter=dot` (184 tests in 41 files passed), `npm run typecheck`, `npm run lint` (existing warnings, exit 0), `npm run build`, `npm run security:bundle`, and `git diff --check`.
3. In a disposable Supabase-compatible Postgres database, apply migrations in order and run `supabase/tests/spelling_bee_managed_content.sql` and `supabase/tests/spelling_bee_multiplayer_fairness.sql`. Both tests roll back their records. The local container needed an Auth `is_anonymous` column and minimal Storage service tables because the bare Postgres image does not include all Supabase service schema. The old Play Patterns correction migration did not match the fresh image's generated function text and was skipped; all later migrations, including both Spelling Bee migrations, applied.
4. In an isolated environment with the required migrations applied and an editor account, open Command Centre → Content → Spelling Bee and upload `command-centre-draft-import.json`. Verify the preview before importing. Import is draft-only. Repeat the same upload and verify unchanged rows to confirm idempotence. Do not publish until editorial and audio review is complete.
5. After approved audio-backed content is published, set `VITE_CONTENT_SOURCE=managed-preferred`, play pass-and-play across selected levels, and inspect release and fallback analytics. Run four independent multiplayer clients through create, join, score, timeout, reconnect, privacy and final result; reconcile room state and Command Centre counts.

## Remaining release checks

- Exercise Command Centre save, duplicate upload, revision conflict, release rollback, and all role permissions in a complete app environment. The local SQL tests cover publish rejection and four-identity privacy but do not exercise the browser workflow.
- Individually review all 1,000 words, especially the 35 flagged rows; check dictionary evidence, regional variants, clues and pronunciation. Generate and verify audio for any word intended for play.
- Verify the active speller alone receives pre-result clues in a four-client run. An opaque audio ID is not a cryptographic secret against inspecting public audio assets; this rule protects the application response and interface.
- Resolve the repository branch structure before a clean PR: the Spelling Bee feature has no remote development branch, and the checkout has extensive pre-existing uncommitted changes.
