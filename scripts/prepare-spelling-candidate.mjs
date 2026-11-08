import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const candidateDirectory = new URL('docs/qa/spelling-bee-candidate/', root)
const words = JSON.parse(readFileSync(new URL('spelling_words_reviewed_draft.json', candidateDirectory), 'utf8'))
const queue = readFileSync(new URL('decked_spelling_bee_qa_review_queue.csv', candidateDirectory), 'utf8')
const flaggedRows = new Set(queue.split(/\r?\n/).slice(1).map(line => Number(line.split(',')[0])).filter(row => Number.isInteger(row) && row > 0))
const bundledSource = readFileSync(new URL('src/content/spellingBee.ts', root), 'utf8')
const bundled = new Set([...bundledSource.matchAll(/\{ word: '([^']+)', definition:/g)].map(match => match[1].toLowerCase()))
if (words.length !== 1000 || flaggedRows.size !== 35 || bundled.size !== 36) throw new Error('Candidate baseline changed; review the source and queue before regenerating.')

function deterministicId(word) {
  const hex = createHash('sha1').update(`decked:spelling-bee:${word.toLowerCase()}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

const seen = new Set()
const items = []
const preview = { source_count: words.length, held_for_human_review: 0, bundled_overlap_excluded: 0, draft_import_count: 0, levels: { 1: 0, 2: 0, 3: 0 }, duplicate_words: [] }
for (const [index, entry] of words.entries()) {
  if (!entry || typeof entry.word !== 'string' || !/^[a-z-]{3,32}$/.test(entry.word) || ![1, 2, 3].includes(entry.level) || typeof entry.definition !== 'string' || typeof entry.sentence !== 'string') throw new Error(`Invalid candidate row ${index + 1}`)
  const key = entry.word.toLowerCase()
  if (seen.has(key)) { preview.duplicate_words.push(entry.word); continue }
  seen.add(key)
  if (flaggedRows.has(index + 1)) { preview.held_for_human_review++; continue }
  if (bundled.has(key)) { preview.bundled_overlap_excluded++; continue }
  items.push({
    id: deterministicId(entry.word),
    item_kind: 'prompt',
    body: entry.word,
    metadata: { definition: entry.definition, sentence: entry.sentence, level: entry.level, variants: entry.variants ?? [], review_status: 'needs_review' },
    category_ids: [`level-${entry.level}`],
    lifecycle_status: 'active',
  })
  preview.levels[entry.level]++
}
preview.draft_import_count = items.length
if (preview.duplicate_words.length || preview.draft_import_count !== 934) throw new Error('Candidate counts changed; review the pack before importing.')
const document = { format: 'decked-content-v1', exported_at: '2026-11-08T00:00:00.000Z', game_id: 'spelling-bee', category_id: null, items }
writeFileSync(new URL('command-centre-draft-import.json', candidateDirectory), `${JSON.stringify(document, null, 2)}\n`)
writeFileSync(new URL('import-preview.json', candidateDirectory), `${JSON.stringify(preview, null, 2)}\n`)
console.log(`Prepared ${items.length} draft rows; held ${preview.held_for_human_review} flagged rows and excluded ${preview.bundled_overlap_excluded} bundled words.`)
console.log(fileURLToPath(new URL('command-centre-draft-import.json', candidateDirectory)))
