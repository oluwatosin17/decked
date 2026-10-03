import { createServer } from 'vite'

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
})
try {
  const { AUDITED_DECKS } = await server.ssrLoadModule('/src/content/deckRegistry.ts')
  const normalize = value => value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim()
  const rows = AUDITED_DECKS.map(({ game, category, prompts }) => {
    const normalized = prompts.map(normalize)
    const unique = new Set(normalized)
    return {
      game,
      category,
      count: prompts.length,
      unique: unique.size,
      blanks: normalized.filter(value => !value).length,
      status: prompts.length >= 300 && unique.size === prompts.length && !normalized.includes('') ? 'PASS' : 'FAIL',
    }
  })
  console.table(rows)
  const failed = rows.filter(row => row.status === 'FAIL')
  console.log(`\n${rows.length} decks checked; ${rows.length - failed.length} passed; ${failed.length} failed.`)
  if (failed.length) process.exitCode = 1
} finally {
  await server.close()
}
