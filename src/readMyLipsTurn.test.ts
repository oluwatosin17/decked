import { describe, expect, it } from 'vitest'
import localGame from './ReadMyLipsGame.tsx?raw'
import multiplayerMigration from '../supabase/migrations/20261101140000_read_my_lips_fresh_team_phrase.sql?raw'
import { hasFreshLipsPhrase, nextLipsTurnCard } from './readMyLipsTurn'

describe('Read My Lips turn handoff', () => {
  it('moves beyond an exposed but unscored phrase before the next team starts', () => {
    const deck = ['first', 'shown but unscored', 'fresh for next team']
    const currentCard = 1
    expect(deck[nextLipsTurnCard(currentCard)]).toBe('fresh for next team')
    expect(localGame).toContain('const nextCard = nextLipsTurnCard(card)')
    expect(localGame).toContain('setCard(nextCard)')
    expect(hasFreshLipsPhrase(deck.length, nextLipsTurnCard(currentCard))).toBe(true)
    expect(hasFreshLipsPhrase(deck.length, nextLipsTurnCard(2))).toBe(false)
    expect(localGame).not.toContain('deck[card % deck.length]')
  })

  it('applies the same handoff to the authoritative multiplayer room state', () => {
    expect(multiplayerMigration).toMatch(/p_action='next'[\s\S]*?'lips_turn',t\+1,'lips_card',c\+1,'cardIndex',c\+1/)
    expect(multiplayerMigration).toContain("if not can_review then raise exception 'Only the opposing team may confirm this score.'")
    expect(multiplayerMigration).toContain("if c+1>=deck_length then")
    expect(multiplayerMigration).toContain("'lips_exhausted',true")
    expect(multiplayerMigration).not.toContain('%jsonb_array_length(deck)')
  })
})
