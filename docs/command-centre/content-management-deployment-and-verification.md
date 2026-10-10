# Content Management deployment and verification

## Current behaviour and change

Production gameplay currently uses bundled TypeScript content. These changes add managed Supabase content, a protected `/command-centre/content` workspace, draft/version/publish history, and an opt-in managed runtime overlay. The bundled arrays remain present and are still the default.

## Security, privacy, migration, and compatibility review

- All six content tables have RLS enabled and no browser table policies.
- `anon` and `authenticated` have no direct table privileges.
- Staff reads and writes use bounded security-definer RPCs with `search_path=''` and server-side role checks.
- Anonymous gameplay can call only `decked_get_published_content`; it returns published card fields and immutable release metadata, never drafts, staff IDs, audit records, or player data.
- Viewer, editor, and admin roles are ordered explicitly. Only editor/admin can mutate or publish; only admin can assign roles.
- Player-authored answers, names, room codes, credentials, tokens, and analytics identities are outside the schema and rejected by the metadata allowlist.
- Optimistic revision checks reject stale updates. Archive is reversible. Releases snapshot both item versions and category membership.
- Existing source arrays are not deleted or rewritten, preserving rollback and offline fallback.

## Non-production deployment

Prerequisites: a linked non-production Supabase project, a database backup, and an active Command Centre admin.

1. Keep runtime delivery disabled: do not set `VITE_CONTENT_SOURCE`, or set it to `bundled`.
2. Run `pnpm audit:content` and confirm 21 canonical games, 35,207 memberships, and 34,826 per-game unique migration items in tests.
3. Review migrations in order:
   - `20261009300000_content_management_foundation.sql`
   - `20261009301000_seed_all_bundled_content.sql`
4. Apply them to the non-production project with the repository’s normal `supabase db push` workflow.
5. Run `supabase/tests/content_management.sql` against that project.
6. Reconcile SQL counts:

```sql
select count(*) as unique_items from public.content_items;
select count(*) as category_memberships from public.content_item_categories;
select count(*) as categories from public.content_categories;
select count(*) as initial_releases from public.content_releases where notes='Initial bundled-content migration';
select game_id, category_id, count(*)
from public.content_item_categories
group by game_id, category_id
order by game_id, category_id;
```

Expected: 34,826 items, 35,207 memberships, 135 categories, and 20 initial releases. Compare every per-category row with `content-audit-v1.json`.

7. Provision an editor by calling the existing admin-only role RPC with `p_role='editor'`.
8. Verify browse/search/filter/counts, create, duplicate, edit, category assignment, archive/restore, history, and publish in `/command-centre/content`.
9. Confirm a viewer cannot mutate, an editor cannot assign staff roles, an anonymous-auth player cannot open the Command Centre, and neither `anon` nor `authenticated` can select any content table.
10. In preview only, set `VITE_CONTENT_SOURCE=managed-preferred`, deploy, and smoke-test at least one local and one multiplayer session in every game. Two Truths and a Bluff remains player-authored and does not call managed content.

## Reconciliation and readiness

The deterministic audit found:

- 17 games whose every selectable bundled category meets 300 cards.
- 3 games with below-target categories: Most Likely To, Choose Your Side, and We Just Met.
- 1 not-applicable game: Two Truths and a Bluff.
- No category was padded or generated to hide a gap.

Production managed delivery remains a human approval gate until the SQL suite passes against a real Supabase database and preview gameplay is reconciled. The below-target categories may be published, but the Command Centre keeps the readiness warning visible.

## Failure handling and rollback

- To stop managed reads immediately, set `VITE_CONTENT_SOURCE=bundled` and redeploy. The application will use the unchanged arrays.
- A malformed, empty, unavailable, or failed managed response leaves the relevant bundled category active automatically.
- To roll back content without deploying, publish a new release based on a prior version. Release records are immutable snapshots.
- Before removing the additive schema, export the six content tables and audit records. Then disable managed reads, revoke the RPC grants, drop the content functions, drop release items/releases, memberships/versions/items/categories, and restore the two staff-role constraints to their earlier values if editor access is no longer required.
- Never delete the bundled source arrays as part of rollback or routine cleanup.

## Local verification status

- `pnpm audit:content`: passed; Markdown and JSON artifacts generated.
- `pnpm content:seed`: passed; deterministic seed regenerated.
- `pnpm test`: passed, 11 files / 56 tests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed with pre-existing warnings and no errors.
- `pnpm build`: passed; managed content is a conditional dynamic chunk and does not enlarge the initial application bundle.
- `pnpm security:bundle`: passed; no service-role credential in browser output.
- Local Supabase SQL lint/test: blocked because no database is listening at `127.0.0.1:54322`. Database authorization and RLS claims are therefore not represented as executed evidence yet.

This implementation must not be described as production-deployed until the non-production database steps and the preview smoke matrix have passed.
