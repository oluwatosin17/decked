import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const MINIMUM = 300
const OUTPUT_DIRECTORY = resolve('docs/command-centre')
const JSON_PATH = resolve(OUTPUT_DIRECTORY, 'content-audit-v1.json')
const MARKDOWN_PATH = resolve(OUTPUT_DIRECTORY, 'content-audit-v1.md')

const normalize = value => String(value ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[’‘]/g, "'")
  .replace(/[^a-z0-9']+/g, ' ')
  .trim()

const checksum = values => createHash('sha256').update(values.join('\n')).digest('hex')
const percentile = (values, position) => {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor((sorted.length - 1) * position)]
}

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
})

try {
  const [{ CONTENT_AUDIT_GAMES }, { GAME_REGISTRY }] = await Promise.all([
    server.ssrLoadModule('/src/content/deckRegistry.ts'),
    server.ssrLoadModule('/src/gameRegistry.ts'),
  ])

  const registeredIds = GAME_REGISTRY.map(game => game.id)
  const auditedIds = CONTENT_AUDIT_GAMES.map(game => game.gameId)
  const missingGames = registeredIds.filter(id => !auditedIds.includes(id))
  const unexpectedGames = auditedIds.filter(id => !registeredIds.includes(id))
  const duplicateGameIds = auditedIds.filter((id, index) => auditedIds.indexOf(id) !== index)
  if (missingGames.length || unexpectedGames.length || duplicateGameIds.length) {
    throw new Error(`Canonical coverage mismatch: missing=${missingGames.join(',') || 'none'} unexpected=${unexpectedGames.join(',') || 'none'} duplicates=${duplicateGameIds.join(',') || 'none'}`)
  }

  const games = CONTENT_AUDIT_GAMES.map(game => {
    const normalizedAcrossGame = game.decks.flatMap(deck => deck.prompts.map(normalize).filter(Boolean))
    const categoryRows = game.decks.map(deck => {
      const raw = deck.prompts.map(String)
      const normalized = raw.map(normalize)
      const normalizedUnique = new Set(normalized.filter(Boolean))
      const exactUnique = new Set(raw.filter(value => value.length > 0))
      const lengths = raw.map(value => value.trim().length)
      const readiness = raw.length >= MINIMUM ? 'meets-300' : 'below-300'
      return {
        categoryId: deck.category,
        modeId: deck.category,
        rawRecords: raw.length,
        renderedCardCount: raw.length,
        uniqueItems: normalizedUnique.size,
        categoryMemberships: raw.length,
        enabledItems: raw.length,
        disabledItems: 0,
        legacyItems: 0,
        exactDuplicates: raw.length - exactUnique.size,
        normalizedDuplicates: raw.length - normalizedUnique.size,
        missingStableIds: raw.length,
        duplicateStableIds: 0,
        customItems: 0,
        length: {
          minimum: lengths.length ? Math.min(...lengths) : 0,
          median: percentile(lengths, 0.5),
          p95: percentile(lengths, 0.95),
          maximum: lengths.length ? Math.max(...lengths) : 0,
        },
        checksum: checksum(raw),
        readiness,
      }
    })
    const totalMemberships = categoryRows.reduce((sum, category) => sum + category.categoryMemberships, 0)
    return {
      gameId: game.gameId,
      gameName: game.game,
      contentModel: game.contentModel,
      note: game.note ?? null,
      rawRecords: totalMemberships,
      renderedCardCount: totalMemberships,
      uniqueItems: new Set(normalizedAcrossGame).size,
      categoryMemberships: totalMemberships,
      enabledItems: totalMemberships,
      disabledItems: 0,
      legacyItems: 0,
      exactDuplicates: categoryRows.reduce((sum, category) => sum + category.exactDuplicates, 0),
      normalizedDuplicates: categoryRows.reduce((sum, category) => sum + category.normalizedDuplicates, 0),
      missingStableIds: totalMemberships,
      duplicateStableIds: 0,
      customItems: 0,
      readiness: game.contentModel === 'player-authored'
        ? 'not-applicable'
        : categoryRows.every(category => category.readiness === 'meets-300')
          ? 'meets-300'
          : 'below-300',
      checksum: checksum(game.decks.flatMap(deck => deck.prompts.map(String))),
      categories: categoryRows,
    }
  })

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    minimumPerSelectableCategory: MINIMUM,
    canonicalGameCount: GAME_REGISTRY.length,
    auditedGameCount: games.length,
    definitions: {
      rawRecords: 'Array entries in the bundled runtime content sources.',
      renderedCardCount: 'Cards available to the runtime selector before session-size truncation. Composite cards count as one.',
      uniqueItems: 'Distinct normalized card payloads within the stated game or category.',
      categoryMemberships: 'One item-to-category relationship. The same item in two categories counts twice here.',
      customItems: 'Player-authored runtime cards; reported separately and never included in bundled migration totals.',
      missingStableIds: 'Bundled entries without authored persistent IDs. Phase 3 assigns deterministic migration IDs without editing the source arrays.',
    },
    totals: {
      rawRecords: games.reduce((sum, game) => sum + game.rawRecords, 0),
      uniqueItemsAcrossGames: new Set(CONTENT_AUDIT_GAMES.flatMap(game => game.decks.flatMap(deck => deck.prompts.map(normalize).filter(Boolean)))).size,
      categoryMemberships: games.reduce((sum, game) => sum + game.categoryMemberships, 0),
      customItems: games.reduce((sum, game) => sum + game.customItems, 0),
      gamesMeeting300: games.filter(game => game.readiness === 'meets-300').length,
      gamesBelow300: games.filter(game => game.readiness === 'below-300').length,
      gamesNotApplicable: games.filter(game => game.readiness === 'not-applicable').length,
    },
    games,
  }

  const tableRows = games.flatMap(game => game.categories.length
    ? game.categories.map(category => `| ${game.gameId} | ${category.categoryId} | ${category.rawRecords} | ${category.uniqueItems} | ${category.categoryMemberships} | ${category.normalizedDuplicates} | ${category.length.minimum}/${category.length.median}/${category.length.p95}/${category.length.maximum} | ${category.readiness} | \`${category.checksum.slice(0, 12)}\` |`)
    : [`| ${game.gameId} | — | 0 | 0 | 0 | 0 | 0/0/0/0 | not-applicable | \`${game.checksum.slice(0, 12)}\` |`])

  const markdown = `# Decked content audit v1

Generated deterministically by \`pnpm audit:content\` at ${report.generatedAt}.

## Result

- Canonical games: **${report.canonicalGameCount}**
- Audited games: **${report.auditedGameCount}**
- Raw bundled records / category memberships: **${report.totals.rawRecords.toLocaleString()}**
- Normalized-unique payloads across all games: **${report.totals.uniqueItemsAcrossGames.toLocaleString()}**
- Games whose every selectable bundled category meets 300 cards: **${report.totals.gamesMeeting300}**
- Games below the 300-card target: **${report.totals.gamesBelow300}**
- Not applicable: **${report.totals.gamesNotApplicable}** (Two Truths and a Bluff is player-authored)

The audit does not generate or pad content. Random mixers are excluded because they are selectors over authored categories, not independently authored categories. Player custom cards remain separate and are not migration input.

## Count definitions

- **Raw records** are source-array entries.
- **Rendered card count** is the number available to runtime selection before a session limit is applied.
- **Unique items** are normalized payloads; this is not the same as category membership.
- **Category memberships** count item-to-category relationships and therefore can exceed unique items.
- Existing bundled cards do not have authored persistent IDs. The migration must derive stable IDs without changing or deleting the source content.

## Per-category inventory

| Game ID | Category / mode | Raw | Unique | Memberships | Normalized duplicates | Length min/median/p95/max | 300 readiness | SHA-256 |
|---|---|---:|---:|---:|---:|---:|---|---|
${tableRows.join('\n')}

## Per-game reconciliation

| Game | Raw | Unique | Memberships | Enabled | Disabled / legacy | Missing authored IDs | Readiness |
|---|---:|---:|---:|---:|---:|---:|---|
${games.map(game => `| ${game.gameName} (\`${game.gameId}\`) | ${game.rawRecords} | ${game.uniqueItems} | ${game.categoryMemberships} | ${game.enabledItems} | ${game.disabledItems + game.legacyItems} | ${game.missingStableIds} | ${game.readiness} |`).join('\n')}

## Decisions and migration constraints

1. Categories below 300 are reported as gaps; no synthetic cards were added.
2. Two Truths and a Bluff is correctly classified as not applicable because its statements are player-authored and must not be stored as managed bundled content.
3. Every bundled source entry lacks an authored persistent ID. The migration must use deterministic IDs derived from game, category, normalized payload, and occurrence, with a mapping artifact for reversibility.
4. Existing arrays stay in the repository as the fallback and rollback source until a separately approved removal.
5. Composite Choose Your Side records are counted as one card with two options. The migration must preserve that structure rather than treating the two options as two prompts.

Machine-readable evidence: [content-audit-v1.json](./content-audit-v1.json).
`

  await mkdir(OUTPUT_DIRECTORY, { recursive: true })
  await Promise.all([
    writeFile(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`),
    writeFile(MARKDOWN_PATH, markdown),
  ])

  console.log(`Audited ${games.length} canonical games and ${report.totals.categoryMemberships} category memberships.`)
  console.log(`Wrote ${MARKDOWN_PATH}`)
  console.log(`Wrote ${JSON_PATH}`)
} finally {
  await server.close()
}
