# Decked Content Management System — Master Implementation Brief

## How to use this document

Give this entire file to Codex while it is working in the Decked repository. This is a single end-to-end assignment: begin with the audit, continue through database design, migration, Command Centre implementation, gameplay integration, and verification, and report back only when every safe in-scope task has been completed or a genuine human approval gate is reached.

Do not interpret this brief as permission to delete, overwrite, rename, or stop using Decked's existing bundled content files. The project is a migration and dual-path rollout. Existing content remains in the repository as the tested gameplay fallback until a separate future decision explicitly authorizes its removal.

---

## Role and repository context

You are working in the existing Decked repository. Decked is a React 19 and TypeScript application built with Vite and deployed on Vercel. It uses Supabase authentication, Postgres, RPC functions, and Realtime for separate-device multiplayer. It also supports pass-and-play on one device, exposes 21 canonical game IDs, and currently keeps much of its official card and prompt content in application source files.

Before changing anything:

1. Read all repository instructions.
2. Inspect the working tree and preserve unrelated user changes.
3. Inspect package scripts, game registries, content modules, game implementations, multiplayer state, analytics, Supabase migrations, RLS policies, RPC functions, Vercel configuration, and existing Command Centre code.
4. Never invent game IDs, category IDs, content files, database objects, environment variables, or APIs without verifying them in the repository.
5. Use the application's current visual language and implementation conventions.

## Objective

Build a protected Content section inside the Decked Command Centre that lets authorized staff manage official game content without requiring an application deployment.

The finished system must support all canonical games that contain manageable official content, not just a single pilot game. It must:

- inventory and count the current source content;
- copy that content into Supabase without deleting the originals;
- reconcile source and database content exactly;
- support drafts, immutable revisions, validation, review, publishing, archiving, and rollback;
- keep published content stable for active sessions;
- preserve bundled content as an automatic fallback;
- work for pass-and-play and multiplayer;
- preserve privacy, authorization, analytics stability, and gameplay availability.

## Non-negotiable content-preservation rules

1. Do not delete existing content files.
2. Do not replace bundled arrays with empty placeholders.
3. Do not remove existing exports used by games.
4. Do not rewrite player-created custom cards into the official content system.
5. Do not mutate published revisions in place.
6. Do not switch content releases during an active game session.
7. Do not allow a content API or Supabase failure to prevent a playable game from starting when bundled content is available.
8. Do not automatically generate filler prompts to reach a numerical target.
9. Do not publish imported content automatically. Import into a validated draft first.
10. Do not migrate prompt text into analytics events. Analytics may receive stable content item, revision, collection, and release IDs only.

---

# Phase 1 — Audit every content source

Do not implement the database or UI before completing this audit.

## 1.1 Canonical game inventory

Confirm the actual canonical registry and produce one row per game containing:

- canonical game ID;
- display name;
- content source files;
- content type: prompt, question, challenge, statement, word, scenario, role, or other;
- content data structure;
- deck IDs;
- category IDs;
- mode IDs;
- content-rating or intensity fields;
- ordering behavior;
- shuffle behavior;
- whether the game accepts player-created content;
- pass-and-play content-loading location;
- multiplayer content-loading and synchronization location;
- persisted-state locations;
- analytics identifiers currently available;
- special shared-state requirements;
- migration complexity and risks.

Use the repository's canonical IDs. The expected total is currently 21 games, but report and resolve any difference rather than forcing the expected number.

## 1.2 Count cards and prompts accurately

Create a deterministic audit script. Do not count by manually reading files.

For every game, deck, category, and mode, report:

- number of raw source records;
- number of unique stable content items;
- number of category memberships;
- number of enabled official items;
- number of disabled or legacy items;
- number of exact duplicate texts;
- number of normalized duplicate texts;
- number of missing or duplicated identifiers;
- number of player-created examples or defaults, reported separately;
- minimum, maximum, median, and average prompt length where meaningful;
- checksum of the normalized source collection.

Definitions:

- **Unique content item count** counts a card or prompt once by stable identity, even if it belongs to multiple categories.
- **Category membership count** counts an item once in every category in which it appears.
- **Rendered card count** counts actual playable source entries after repository-defined expansion or combination logic. Do not use this as a substitute for unique-item count.
- **Player-created content** must never be included in the official-content total.
- If one object produces several playable cards, report both source-object count and rendered-card count.

## 1.3 The 300-item readiness target

Evaluate a target of at least 300 playable official items per category, deck, or equivalent selectable content group where that concept applies.

Do not assume every game has categories and do not force category semantics onto games that use modes, stages, word lists, roles, or generated combinations.

For each applicable group, classify it as:

- `meets_target`: 300 or more playable official items;
- `below_target`: fewer than 300;
- `not_applicable`: the game does not use a comparable selectable content group;
- `requires_product_decision`: the content structure makes the correct denominator ambiguous.

The 300-item threshold is an editorial readiness target, not authorization to create content. Report every shortfall explicitly. Do not generate, duplicate, or pad prompts.

## 1.4 Audit deliverables

Save versioned repository documentation containing:

- the complete game/content matrix;
- per-game and per-category count tables;
- duplicate and identifier findings;
- groups below the 300-item target;
- specialized structures requiring adapters;
- source checksums;
- risks and unresolved product decisions;
- the exact migration order.

Also save a machine-readable JSON audit artifact generated by the audit script so later reconciliation does not depend on copied Markdown numbers.

### Phase 1 completion gate

Do not continue until:

- every canonical game has been inspected;
- every official content source has been identified;
- counts are generated by code;
- unique items and category memberships are distinguished;
- custom player content is separated;
- the 300-item readiness report exists;
- all ambiguous content structures are documented.

If stable IDs do not exist, design deterministic IDs based on canonical game ID, canonical source location, and a normalized stable key. Do not use prompt text alone as a permanent identity because wording can change.

---

# Phase 2 — Design the content contract

Write a versioned technical specification before creating production tables.

Define:

- stable content item identity;
- immutable content revisions;
- collections representing verified decks, categories, modes, stages, or equivalent groups;
- collection membership and ordering;
- draft release snapshots;
- review state;
- published and superseded releases;
- archived items;
- locale and content-rating representation;
- game-specific metadata;
- editor, reviewer, publisher, and administrator permissions;
- validation errors and warnings;
- publication locking and idempotency;
- active-session release pinning;
- multiplayer release consistency;
- browser caching;
- bundled fallback selection;
- audit logging;
- analytics identifiers;
- retention and deletion behavior.

Required workflow:

`Draft → In review → Published → Superseded or Archived`

Published revisions and releases are immutable. Editing published content creates a new revision and draft release.

### Human approval gate

Stop only if an unresolved decision would materially change data identity, staff authorization, publication rights, or whether a below-target collection may be published. Otherwise use the safest documented default and continue.

---

# Phase 3 — Implement the Supabase foundation

Create new timestamped migrations. Do not modify already-deployed migration history to hide corrections; add corrective migrations when necessary.

Implement the minimum normalized schema for:

- content items;
- content revisions;
- collections;
- collection membership;
- content releases;
- immutable release snapshots;
- staff content permissions if existing Command Centre roles are insufficient;
- content audit events;
- import and reconciliation runs.

Requirements:

- UUID primary identities where appropriate;
- canonical game IDs constrained to the verified registry;
- timestamps and actor IDs;
- constrained statuses;
- JSONB only for intentional game-specific metadata;
- unique and idempotency constraints;
- indexes supported by actual library, publication, gameplay, and reconciliation queries;
- comments for sensitive or operational fields;
- fixed `search_path` for security-definer functions;
- no service-role key in browser code.

Enable RLS on every new table.

Authorization requirements:

- anonymous gameplay accounts cannot read drafts, revisions, internal notes, staff roles, import runs, or audit logs;
- gameplay may retrieve only a validated published snapshot through a narrow path;
- editors may create drafts and revisions but cannot publish;
- publishers or admins may publish and roll back only after validation;
- browser users cannot assign themselves a staff role;
- direct table access must not bypass workflow rules.

Implement narrowly scoped RPC or trusted server operations for:

- content library reads;
- draft creation;
- revision creation;
- release validation;
- review submission and decision;
- transactional publication;
- rollback;
- archive and restore;
- published-release retrieval;
- reconciliation reporting;
- audited CSV import/export where approved.

Publication must be transactional, idempotent, and protected from concurrent publishers.

---

# Phase 4 — Import all canonical official content

Build game-specific import adapters behind an explicit registry. Use shared adapters for genuinely identical shapes, but do not flatten specialized game structures merely to reuse code.

For every audited game:

1. Read the existing bundled source.
2. Normalize it into the approved content contract.
3. Preserve stable item IDs.
4. Preserve deck, category, mode, stage, rating, and ordering metadata.
5. Preserve the original bundled files unchanged.
6. Upsert idempotently into draft content.
7. Create a draft release snapshot.
8. Validate the draft.
9. Do not publish automatically.

The import must be safe to rerun without creating duplicate content items, revisions, memberships, releases, or audit records.

## Reconciliation requirements

After importing each game, compare source and database values for:

- raw source count;
- unique content item count;
- enabled item count;
- every category/deck/mode membership count;
- rendered playable count where relevant;
- duplicate counts;
- normalized checksums;
- missing and unexpected IDs;
- missing and unexpected memberships.

The reconciliation result for every game must be exactly explained.

Required outcomes:

- unexplained count difference: `0`;
- unexplained missing IDs: `0`;
- unexplained extra IDs: `0`;
- checksum mismatch: `0`;
- automatically fabricated prompts: `0`.

If a source contains intentional duplicates, preserve them only when the game requires them and document the stable identities and reason.

Produce a final reconciliation table with one row per game and expandable per-group results.

### Phase 4 completion gate

Do not proceed to runtime content delivery if any game has an unexplained mismatch.

---

# Phase 5 — Build the Command Centre Content section

Add `Content` to Command Centre navigation:

`Analytics · Content · Games · Funnels · Multiplayer · Reliability · Settings`

Use the current Command Centre design language, including the compact filter summary and accessible responsive filter drawer.

Implement:

## Content overview

- total official content items;
- published items;
- draft changes;
- categories/groups meeting the 300-item target;
- categories/groups below target;
- games migrated;
- games reconciled;
- latest published release;
- validation failures.

Show real zero values instead of hiding KPI cards.

## Content library

- game filter;
- collection/category/mode filter;
- status filter;
- search;
- pagination;
- stable ID;
- prompt preview;
- current revision;
- published release;
- last modified date;
- safe staff attribution;
- validation state.

## Content editor

- prompt or content fields appropriate to the game adapter;
- collection memberships;
- ordering or weight;
- content rating;
- internal change note;
- validation feedback;
- duplicate warning;
- save draft;
- preview;
- submit for review.

## Release management

- source-versus-database counts;
- current-versus-draft comparison;
- added, edited, disabled, restored, and removed membership counts;
- validation errors and warnings;
- group counts and 300-item readiness status;
- reviewer decision;
- publisher confirmation;
- release history;
- one-action rollback with confirmation.

Never expose prompt drafts or unrestricted audit data to gameplay users.

---

# Phase 6 — Integrate all games safely

Integrate remote published content one game at a time through the verified adapter registry, but complete every canonical game in this assignment unless a documented specialized structure creates a genuine approval gate.

For every game:

1. Retrieve only its current published release through the approved public path.
2. Validate the response with typed runtime validation.
3. Cache it using a versioned release key.
4. Pin the release ID when a game session starts.
5. Keep that release for the entire session.
6. Ensure every participant in a multiplayer room uses the same release ID.
7. Continue with cached content during temporary failure.
8. Fall back to existing bundled content if remote content is absent, invalid, timed out, or unavailable.
9. Never block primary gameplay while analytics or content refresh runs.
10. Record the stable release/content IDs in approved analytics fields without prompt text.

Do not remove or stop testing bundled content after remote delivery is working.

Specialized shared-state games must preserve their existing authoritative state and response shapes. Content integration must not weaken gameplay authorization or Realtime behavior.

---

# Phase 7 — Testing and verification

Add automated tests supported by the repository.

## Audit and importer tests

- all canonical games discovered;
- deterministic counts;
- unique count versus membership count;
- exact and normalized duplicates;
- missing IDs;
- deterministic IDs;
- repeat import;
- specialized adapters;
- source/database reconciliation;
- checksum mismatch;
- below-300 classification;
- no automatic content generation.

## Database and security tests

- anonymous draft denial;
- published-content access;
- editor publish denial;
- publisher validation enforcement;
- self-role escalation denial;
- immutable revisions;
- immutable published releases;
- duplicate publication request;
- concurrent publication;
- partial failure rollback;
- audit entry creation;
- unauthorized rollback denial;
- service-role credential absence from browser bundles.

## Command Centre tests

- loading, zero, populated, validation, conflict, unauthorized, and error states;
- filters and URL persistence;
- pagination and search;
- editing and revision history;
- validation results;
- review submission;
- publisher confirmation;
- release comparison;
- rollback;
- accessible labels, focus states, dialogs, tables, and keyboard flow.

## Gameplay tests

- published release retrieval;
- valid cache;
- stale cache refresh;
- first-load Supabase failure;
- malformed remote release;
- bundled fallback;
- release pinning;
- publication during an active session;
- new session receiving the new release;
- multiplayer participants using the same release;
- host handoff retaining release identity;
- rollback affecting only subsequent sessions;
- all existing game tests and production build.

## Required controlled journey

Execute and document:

`audit → import all games → reconcile → create draft revision → validate → review → publish → start local game → start multiplayer game → publish replacement → verify active sessions remain pinned → start new sessions → verify new release → simulate Supabase failure → verify cache/fallback → roll back → verify subsequent sessions use restored content`

---

# Performance and resilience requirements

- Content fetching must not block gameplay beyond a short documented timeout when fallback exists.
- Cache and fallback decisions must be observable through privacy-safe diagnostics.
- Common published-content reads must avoid scanning revision history.
- Content library queries must be paginated.
- Publishing must prevent overlapping operations.
- Large imports must be bounded and retryable.
- Import and publication requests must be idempotent.
- Define targets for published-content retrieval, cache hit rate, publication time, library query latency, and content-induced gameplay error rate.
- Measure before adding speculative indexes.

---

# Documentation deliverables

Create or update:

1. Content repository audit.
2. Machine-readable content count artifact.
3. Per-game/category 300-item readiness report.
4. Content governance specification.
5. Technical design.
6. Database and RLS documentation.
7. Import adapter registry and coverage matrix.
8. Source/database reconciliation report.
9. Command Centre content-editor guide.
10. Publishing and rollback runbook.
11. Caching and bundled-fallback runbook.
12. Security review.
13. Final verification and launch report.

---

# Verification commands

Discover and use the repository's actual commands. At minimum, where supported, run:

- content audit and count generation;
- importer dry run;
- reconciliation;
- SQL migration and database tests in a disposable non-production environment;
- focused unit and integration tests;
- complete test suite;
- TypeScript type checking;
- lint;
- production build;
- browser-bundle secret audit;
- accessibility checks;
- representative browser journeys.

Do not run synthetic import, publication, destructive reconciliation, or load tests against production.

If Docker or a disposable Supabase environment is unavailable, complete all safe local work, preserve exact deployment/test commands, mark database-backed verification as blocked, and do not claim launch readiness.

---

# Rollback requirements

Document independent rollback procedures for:

- database schema;
- staff access;
- imports;
- draft and published releases;
- gameplay remote-content feature enablement;
- cached content;
- analytics fields;
- Command Centre routes.

Application rollback must immediately restore bundled-only content behavior without deleting imported database content or audit history.

---

# Definition of done

Do not report this project as complete unless:

- all canonical games and content sources are audited;
- per-game and per-group counts exist;
- the 300-item readiness report exists;
- all official bundled content is preserved;
- all migrated games reconcile with zero unexplained differences;
- no content was fabricated to meet the target;
- RLS and staff authorization are tested;
- draft/review/publish/rollback works;
- published releases are immutable;
- all integrated games pin releases per session;
- multiplayer uses one release per room/session;
- cache and bundled fallback work;
- the complete Command Centre Content section works;
- tests, type checking, lint, and production build pass;
- security review has no unresolved critical or high finding;
- deployment and rollback steps are documented;
- database-backed gates are either evidenced or explicitly marked blocked;
- remaining product decisions and measurement limitations are listed.

## Final response format

Report:

1. Outcome and launch status.
2. Current behavior and implemented behavior.
3. Audit totals by game and group, with a link to the full report.
4. Groups meeting and missing the 300-item target.
5. Reconciliation results for every game.
6. Database, authorization, publishing, caching, and fallback results.
7. Changed files and migrations.
8. Test and build evidence.
9. Security and privacy findings.
10. Assumptions and product decisions made.
11. Remaining work or blockers.
12. Rollback procedure.

Do not summarize a partial implementation as finished. Do not delete the original content after migration.
