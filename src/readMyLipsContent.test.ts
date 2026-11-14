import { afterEach, describe, expect, it } from 'vitest'
import {
  ALL_READ_MY_LIPS_PROMPT_TYPES,
  applyManagedReadMyLipsContent,
  lipsPromptCount,
  READ_MY_LIPS_CATEGORIES,
  READ_MY_LIPS_LIBRARY,
  resolveLipsPromptTypes,
  resetManagedReadMyLipsContent,
  shuffledLipsPhrases,
  shuffledMultiplayerLipsPhrases,
} from './content/readMyLips'

const allCategories = READ_MY_LIPS_CATEGORIES.map(category => category.id)
afterEach(resetManagedReadMyLipsContent)

describe('Read My Lips prompt types', () => {
  it('starts with no implicit selection and treats Mixed as one exclusive all-types choice', () => {
    expect(resolveLipsPromptTypes([])).toEqual([])
    expect(resolveLipsPromptTypes(['mixed'])).toEqual(ALL_READ_MY_LIPS_PROMPT_TYPES)
    expect(lipsPromptCount(allCategories, [])).toBe(0)
  })

  it('exposes the complete library through the user-facing prompt types', () => {
    expect(lipsPromptCount(allCategories, ALL_READ_MY_LIPS_PROMPT_TYPES)).toBe(288)
    expect(lipsPromptCount(allCategories, ['one-word'])).toBe(36)
    expect(lipsPromptCount(allCategories, ['two-words'])).toBe(61)
    expect(lipsPromptCount(allCategories, ['short-phrase'])).toBe(150)
    expect(lipsPromptCount(allCategories, ['full-sentence'])).toBe(41)
  })

  it('combines topic categories and prompt type filters', () => {
    expect(lipsPromptCount(['funny-ridiculous'], ['one-word'])).toBe(5)
    expect(lipsPromptCount(['naija-vibes'], ['full-sentence'])).toBe(4)
  })

  it('combines multiple selected prompt types into one deck', () => {
    expect(lipsPromptCount(allCategories, ['one-word', 'two-words'])).toBe(97)
  })

  it('builds a deck containing only the selected prompt type', () => {
    const deck = shuffledLipsPhrases(() => 0.5, allCategories, ['full-sentence'])
    const fullSentences = new Set(READ_MY_LIPS_LIBRARY.filter(entry => entry.content_format === 'Full phrase').map(entry => entry.text))

    expect(deck).toHaveLength(41)
    expect(deck.every(prompt => fullSentences.has(prompt))).toBe(true)
  })

  it('caps a multiplayer room deck at the shared room capacity', () => {
    const deck = shuffledMultiplayerLipsPhrases(() => 0.5, ['mixed'])

    expect(deck).toHaveLength(50)
    expect(new Set(deck).size).toBe(50)
  })

  it('uses Command Centre releases for both prompt text and prompt-type filtering', () => {
    applyManagedReadMyLipsContent([
      { id: 'managed-one', body: 'Managed Banana', categories: ['funny-ridiculous'], metadata: { content_format: 'Two words', difficulty: 'Easy' } },
      { id: 'managed-two', body: 'Managed sentence from Command Centre', categories: ['funny-ridiculous'], metadata: { content_format: 'Full phrase', difficulty: 'Hard' } },
    ])

    expect(shuffledLipsPhrases(() => 0.5, ['funny-ridiculous'], ['two-words'])).toEqual(['Managed Banana'])
    expect(shuffledLipsPhrases(() => 0.5, ['funny-ridiculous'], ['full-sentence'])).toEqual(['Managed sentence from Command Centre'])
  })
})
