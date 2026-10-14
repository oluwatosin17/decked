import { EXPANDED_KNOW_ME_PROMPTS } from './doYouKnowMeLibrary'

export type KnowMeMode = 'read-me' | 'match-me'
export type KnowMeRelationship = 'couple' | 'friends' | 'family' | 'new-connections' | 'mixed-group'
export type KnowMeCategory = 'personality' | 'everyday' | 'food' | 'opinions' | 'entertainment' | 'future' | 'nigerian-life' | 'wild-cards'

export interface KnowMePrompt {
  id: string
  category: KnowMeCategory
  relationships: KnowMeRelationship[]
  question: string
  options: [string, string, string, string]
}

export const KNOW_ME_CATEGORIES: Array<{ id: KnowMeCategory; label: string; icon: string }> = [
  { id: 'personality', label: 'Personality', icon: '✦' },
  { id: 'everyday', label: 'Everyday Life', icon: '☀' },
  { id: 'food', label: 'Food & Lifestyle', icon: '◉' },
  { id: 'opinions', label: 'Opinions', icon: '?' },
  { id: 'entertainment', label: 'Entertainment', icon: '▶' },
  { id: 'future', label: 'Future Plans', icon: '➜' },
  { id: 'nigerian-life', label: 'Nigerian Life', icon: '◆' },
  { id: 'wild-cards', label: 'Wild Cards', icon: '★' },
]

export const KNOW_ME_PROMPTS = EXPANDED_KNOW_ME_PROMPTS

export function promptsFor(relationship: KnowMeRelationship, categories: KnowMeCategory[]) {
  const selected = new Set(categories)
  return KNOW_ME_PROMPTS.filter(prompt => selected.has(prompt.category) && prompt.relationships.includes(relationship))
}

export function shuffledPrompts<T>(items: readonly T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = new Uint32Array(1)
    crypto.getRandomValues(random)
    const other = random[0] % (index + 1)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}
