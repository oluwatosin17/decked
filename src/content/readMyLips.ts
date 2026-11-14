import library from './readMyLipsLibrary.json'

export interface ReadMyLipsEntry {
  content_id: string
  text: string
  category: string
  content_format: string
  difficulty: string
  language: string
  status: string
}
export const READ_MY_LIPS_LIBRARY: readonly ReadMyLipsEntry[] = library
const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const READ_MY_LIPS_CATEGORIES = Array.from(new Set(library.map(item => item.category))).map(label => ({ id: slug(label), label }))
export const READ_MY_LIPS_DECKS: Record<string, string[]> = Object.fromEntries(READ_MY_LIPS_CATEGORIES.map(category => [category.id, library.filter(item => slug(item.category) === category.id).map(item => item.text)]))
let runtimeLibrary: readonly ReadMyLipsEntry[] = library
export const READ_MY_LIPS_PHRASES = Object.values(READ_MY_LIPS_DECKS).flat()
export const READ_MY_LIPS_PROMPT_TYPES = [
  { id: 'one-word', label: 'One Word', formats: ['Single word'] },
  { id: 'two-words', label: 'Two Words', formats: ['Two words'] },
  { id: 'short-phrase', label: 'Short Phrase', formats: ['Short expression'] },
  { id: 'full-sentence', label: 'Full Sentence', formats: ['Full phrase'] },
] as const
export type ReadMyLipsPromptType = typeof READ_MY_LIPS_PROMPT_TYPES[number]['id']
export type ReadMyLipsPromptSelection = ReadMyLipsPromptType | 'mixed'
export const ALL_READ_MY_LIPS_PROMPT_TYPES: readonly ReadMyLipsPromptType[] = READ_MY_LIPS_PROMPT_TYPES.map(item => item.id)
export const READ_MY_LIPS_MULTIPLAYER_DECK_LIMIT = 50

export function resolveLipsPromptTypes(selections: readonly ReadMyLipsPromptSelection[]): readonly ReadMyLipsPromptType[] {
  if (selections.includes('mixed')) return ALL_READ_MY_LIPS_PROMPT_TYPES
  const valid = selections.filter((item): item is ReadMyLipsPromptType => READ_MY_LIPS_PROMPT_TYPES.some(type => type.id === item))
  return [...new Set(valid)]
}

function entriesFor(categories: readonly string[], selections: readonly ReadMyLipsPromptSelection[]) {
  const selected = new Set(resolveLipsPromptTypes(selections))
  const formats = READ_MY_LIPS_PROMPT_TYPES.filter(item => selected.has(item.id)).flatMap(item => item.formats as readonly string[])
  return runtimeLibrary.filter(item => categories.includes(slug(item.category)) && formats.includes(item.content_format))
}

export function applyManagedReadMyLipsContent(items: readonly { id: string; body: string; metadata: Record<string, unknown>; categories: string[] }[]) {
  const validFormats = new Set(READ_MY_LIPS_PROMPT_TYPES.flatMap(item => item.formats as readonly string[]))
  const managedByCategory = new Map<string, ReadMyLipsEntry[]>()
  for (const item of items) {
    const contentFormat = String(item.metadata.content_format ?? '')
    if (!item.body.trim() || !validFormats.has(contentFormat)) continue
    for (const category of item.categories) {
      if (!READ_MY_LIPS_CATEGORIES.some(candidate => candidate.id === category)) continue
      const entries = managedByCategory.get(category) ?? []
      entries.push({ content_id: String(item.metadata.content_id ?? item.id), text: item.body.trim(), category, content_format: contentFormat, difficulty: String(item.metadata.difficulty ?? 'Medium'), language: String(item.metadata.language ?? 'English'), status: 'Published' })
      managedByCategory.set(category, entries)
    }
  }
  runtimeLibrary = READ_MY_LIPS_CATEGORIES.flatMap(category => {
    const managed = managedByCategory.get(category.id)
    const entries = managed?.length ? managed : library.filter(item => slug(item.category) === category.id)
    READ_MY_LIPS_DECKS[category.id].splice(0, READ_MY_LIPS_DECKS[category.id].length, ...entries.map(item => item.text))
    return entries
  })
}

export function resetManagedReadMyLipsContent() {
  runtimeLibrary = library
  for (const category of READ_MY_LIPS_CATEGORIES) {
    const entries = library.filter(item => slug(item.category) === category.id)
    READ_MY_LIPS_DECKS[category.id].splice(0, READ_MY_LIPS_DECKS[category.id].length, ...entries.map(item => item.text))
  }
}

export function lipsPromptCount(categories: readonly string[], selections: readonly ReadMyLipsPromptSelection[]) {
  return entriesFor(categories, selections).length
}

export function shuffledLipsPhrases(random = Math.random, categories: readonly string[] = READ_MY_LIPS_CATEGORIES.map(item => item.id), selections: readonly ReadMyLipsPromptSelection[] = ['mixed']) {
  const result = entriesFor(categories, selections).map(item => item.text)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function shuffledMultiplayerLipsPhrases(random = Math.random, selections: readonly ReadMyLipsPromptSelection[] = ['mixed']) {
  return shuffledLipsPhrases(random, undefined, selections).slice(0, READ_MY_LIPS_MULTIPLAYER_DECK_LIMIT)
}
