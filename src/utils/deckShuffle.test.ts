import { describe, expect, it, vi } from 'vitest'
import { createSessionDeck } from './deckShuffle'

describe('createSessionDeck', () => {
  it('always places custom cards before built-in cards', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    expect(createSessionDeck(['Built in A', 'Built in B'], {
      customCards: ['My first card', 'My second card'],
      deckSize: 4,
    }).slice(0, 2)).toEqual(['My first card', 'My second card'])
    vi.restoreAllMocks()
  })

  it('uses built-in cards only to fill the remaining requested slots', () => {
    const deck = createSessionDeck(['Built in A', 'Built in B', 'Built in C'], {
      customCards: ['My card'],
      deckSize: 2,
    })
    expect(deck).toHaveLength(2)
    expect(deck[0]).toBe('My card')
    expect(deck[1]).toMatch(/^Built in/)
  })

  it('deduplicates built-in content against custom content', () => {
    const deck = createSessionDeck(['Same card', 'Another card'], {
      customCards: [' same   card '],
    })
    expect(deck.filter(card => card.trim().replace(/\s+/g, ' ').toLowerCase() === 'same card')).toHaveLength(1)
  })
})
