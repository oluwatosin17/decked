# Decked Content Management technical design v1

Status: approved implementation baseline derived from the 21-game audit.

## Current behaviour and intended change

Decked currently imports bundled TypeScript arrays directly into game components. Some games mix categories at runtime, some use one deck, composite games carry more than one visible field, and Two Truths and a Bluff is entirely player-authored. There is no staff content authoring path and bundled cards have no persistent authored IDs.

The change adds an additive Supabase content plane and a protected Command Centre Content section. Existing arrays remain the immutable fallback and rollback source. Published managed content may replace a bundled category only after a complete, validated fetch; draft, empty, failed, or malformed responses never replace bundled content.

## Model

- `content_categories`: canonical game/category metadata and readiness target.
- `content_items`: one logical card, stable deterministic UUID for imported content, body, structured metadata, state, and current revision.
- `content_item_categories`: many-to-many membership with explicit ordering and enabled state.
- `content_item_versions`: append-only before/after snapshots for mutation history.
- `content_releases`: publish batches, checksums, actor, and release status.
- `content_release_items`: immutable release membership.
- `command_centre_audit_log`: existing append-only audit stream for mutations, publishing, rollback, and imports.

Imported IDs are deterministic from game ID plus normalized payload. Category membership IDs are deterministic from game, category, item, and source occurrence. This makes the seed idempotent and reversible without adding IDs to existing source arrays.

## Roles and permissions

The existing staff roles are extended from `viewer | admin` to `viewer | editor | admin`.

| Capability | Viewer | Editor | Admin |
|---|---:|---:|---:|
| Browse/search/count/preview | yes | yes | yes |
| Create/edit/duplicate/archive/restore | no | yes | yes |
| Publish validated release | no | yes | yes |
| Manage categories, roles, destructive maintenance | no | no | yes |

Anonymous and anonymous-auth gameplay users receive no table access. Staff access is enforced inside security-definer RPCs with an empty `search_path`, not just in the React route. Runtime clients receive only published, enabled, non-archived fields through a separate bounded RPC.

## States and concurrency

Items use `draft`, `published`, or `archived`. Editing a published item creates a new draft revision while the last published snapshot remains live until publish. Mutations require the expected revision number; stale writes fail with a conflict. Delete is not exposed in the normal UI. Archive is reversible. Publishing validates required fields, category membership, game-specific payload shape, duplicate normalized content, and minimum category count warnings in one transaction.

## Runtime rollout and fallback

1. The client requests a published manifest for a game and its selected categories.
2. It validates schema, count, checksum, and supported item kind.
3. A complete managed category may be used; missing or invalid categories use the unchanged bundled source.
4. Player-authored custom cards are appended by existing game logic and are never persisted to the CMS.
5. The selected source and release ID are attached to existing analytics dimensions where available.

The rollout flag is `VITE_CONTENT_SOURCE` with values `bundled` (default) or `managed-preferred`. This is the only new environment variable. A database kill switch in the published manifest can disable managed delivery without redeploying. Rollback is immediate: set the client flag to `bundled`, or deactivate the current release; no bundled content is deleted.

## Migration and release sequence

1. Apply the additive schema/RLS/RPC migration.
2. Apply the generated, idempotent all-game seed migration in non-production.
3. Run reconciliation against `content-audit-v1.json`; membership, unique-item, per-category counts, and checksums must match exactly.
4. Enable the Content UI for staff while runtime remains `bundled`.
5. Validate create/edit/archive/restore/preview/publish and audit history.
6. Enable `managed-preferred` in preview, then production by explicit human approval.

## Failure and rollback

- Database or RPC failure: gameplay uses bundled content.
- Partial/empty managed category: reject response and use bundled category.
- Publish validation failure: transaction rolls back; live release is unchanged.
- Stale editor: optimistic concurrency rejects the write.
- Bad release: deactivate it or republish the preceding immutable release.
- Full schema rollback: stop managed delivery first, preserve an export, then drop only the additive content functions/tables in reverse dependency order.

## Audit decisions

- The 300 target applies per selectable bundled category. Random mixers are not categories.
- Most Likely To, Choose Your Side, and We Just Met are below 300 per category and remain migration-eligible; they are visible readiness warnings, not silently padded.
- Two Truths and a Bluff is not applicable and its user-entered statements are excluded.
- Choose Your Side is a structured two-option card and must preserve both options in metadata.
- No current bundled card has a persistent authored ID; deterministic migration IDs are the compatibility contract.
