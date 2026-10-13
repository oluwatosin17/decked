import { describe, expect, it } from 'vitest'
import { IMPOSTER_CATEGORIES, IMPOSTER_DECKS, IMPOSTER_WORD_PAIRS } from './imposter'

describe('Imposter catalog', () => {
  it('ships at least 300 unique pairs per selectable category', () => {
    for (const category of IMPOSTER_CATEGORIES) {
      const deck = IMPOSTER_DECKS[category.id]
      expect(deck.length).toBeGreaterThanOrEqual(300)
      expect(new Set(deck.map(pair => `${pair.regular.toLowerCase()}\0${pair.imposter.toLowerCase()}`)).size).toBe(deck.length)
      expect(deck.every(pair => pair.regular.toLowerCase() !== pair.imposter.toLowerCase())).toBe(true)
    }
  })

  it('keeps the combined runtime catalog aligned with category decks', () => {
    expect(IMPOSTER_WORD_PAIRS).toHaveLength(IMPOSTER_CATEGORIES.reduce((total, category) => total + IMPOSTER_DECKS[category.id].length, 0))
  })
})
