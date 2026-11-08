import { spellingAudioId } from './spellingAudio'
import { getSpellingWords, setManagedSpellingWords, SPELLING_WORDS, type SpellingLevel, type SpellingWord } from './spellingBee'
import { normalizeSpelling } from './spellingSelection'

export interface ManagedSpellingItem {
  id?: string
  kind?: string
  item_kind?: string
  body: string
  metadata: Record<string, unknown>
  categories?: string[]
  category_ids?: string[]
}

const WORD = /^[a-z-]{3,32}$/i
const allowedStatuses = new Set(['needs_review', 'approved'])

export function spellingContentErrors(item: ManagedSpellingItem): string[] {
  const errors: string[] = []
  const word = item.body.trim()
  const metadata = item.metadata
  const definition = metadata.definition
  const sentence = metadata.sentence
  const level = metadata.level
  const variants = metadata.variants ?? []
  const categories = item.categories ?? item.category_ids ?? []
  if ((item.kind ?? item.item_kind) !== 'prompt') errors.push('Spelling Bee entries must use prompt type.')
  if (!WORD.test(word)) errors.push('Word must be 3–32 letters or hyphens.')
  if (typeof definition !== 'string' || definition.trim().length < 8 || definition.trim().length > 200) errors.push('Definition must be 8–200 characters.')
  if (typeof sentence !== 'string' || sentence.trim().length < 8 || sentence.trim().length > 200) errors.push('Sentence must be 8–200 characters.')
  if (level !== 1 && level !== 2 && level !== 3) errors.push('Level must be Easy, Medium, or Hard.')
  if (categories.length !== 1 || categories[0] !== `level-${level}`) errors.push('Category must match the selected level.')
  if (!Array.isArray(variants) || variants.some(value => typeof value !== 'string' || !WORD.test(value) || normalizeSpelling(value) === normalizeSpelling(word)) || new Set(Array.isArray(variants) ? variants.map(value => typeof value === 'string' ? normalizeSpelling(value) : '') : []).size !== (Array.isArray(variants) ? variants.length : 0)) errors.push('Accepted variants must be distinct valid spellings.')
  if (!allowedStatuses.has(String(metadata.review_status ?? ''))) errors.push('Editorial review status is required.')
  if (typeof definition === 'string' && WORD.test(word) && new RegExp(`\\b${word}\\b`, 'i').test(definition)) errors.push('Definition reveals the answer.')
  if (typeof sentence === 'string' && WORD.test(word) && !new RegExp(`\\b${word}\\b`, 'i').test(sentence)) errors.push('Sentence must contain the answer so it can be masked during play.')
  return errors
}

export function spellingWordFromManaged(item: ManagedSpellingItem): SpellingWord | null {
  if (spellingContentErrors(item).length || item.metadata.review_status !== 'approved') return null
  return {
    word: item.body.trim().toLowerCase(),
    definition: String(item.metadata.definition).trim(),
    sentence: String(item.metadata.sentence).trim(),
    level: item.metadata.level as SpellingLevel,
    variants: item.metadata.variants as readonly string[] | undefined,
  }
}

/** Only released, approved words with a known pronunciation file can enter the audio-led game. */
export function applyManagedSpellingContent(items: readonly ManagedSpellingItem[]): boolean {
  const seen = new Set<string>()
  const next: SpellingWord[] = []
  let replaced = false
  for (const level of [1, 2, 3] as const) {
    const group = items.filter(item => (item.categories ?? item.category_ids ?? []).includes(`level-${level}`))
    const valid = group.map(spellingWordFromManaged)
    const audioBacked = valid.filter((word): word is SpellingWord => !!word && !!spellingAudioId(word.word))
    const unique = audioBacked.every(word => {
      const key = normalizeSpelling(word.word)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (group.length > 0 && valid.every(Boolean) && unique && audioBacked.length >= 2) {
      next.push(...audioBacked)
      replaced = true
    } else next.push(...SPELLING_WORDS.filter(word => word.level === level))
  }
  if (replaced) setManagedSpellingWords(next)
  return replaced
}

export function spellingContentPreview(items: readonly ManagedSpellingItem[], existing: readonly { id: string; body: string }[]) {
  const existingByWord = new Map(existing.map(item => [normalizeSpelling(item.body), item.id]))
  const bundled = new Set(SPELLING_WORDS.map(item => normalizeSpelling(item.word)))
  const seen = new Set<string>()
  const levels = { 1: 0, 2: 0, 3: 0 }
  const errors: string[] = []
  let existingCount = 0
  let bundledCount = 0
  let needsReview = 0
  for (const [index, item] of items.entries()) {
    const word = normalizeSpelling(item.body)
    const issues = spellingContentErrors(item)
    if (seen.has(word)) issues.push('Duplicate word in upload.')
    seen.add(word)
    if (existingByWord.has(word) && existingByWord.get(word) !== item.id) { existingCount++; issues.push('Word already exists in Command Centre under another ID.') }
    if (bundled.has(word)) bundledCount++
    if (item.metadata.review_status !== 'approved') needsReview++
    if (item.metadata.level === 1 || item.metadata.level === 2 || item.metadata.level === 3) levels[item.metadata.level]++
    errors.push(...issues.map(issue => `Row ${index + 1} (${item.body}): ${issue}`))
  }
  return { count: items.length, levels, bundledCount, existingCount, needsReview, errors }
}

export function currentSpellingWords() { return getSpellingWords() }
