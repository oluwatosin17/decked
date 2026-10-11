import { describe, expect, it } from 'vitest'
import { GAME_SEARCH_DESCRIPTORS, GUIDES } from './guideData'
import { GAME_NAMES, type GameId } from './gameRegistry'

const guideIdToRegistryId: Record<string, GameId> = {
  'truth-or-dare': 'truth-or-dare',
  'spicy-starters': 'spicy-starters',
  'never-have-i-ever': 'never-have-i-ever',
  'late-night-talks': 'late-night-talks',
  'dinner-table': 'dinner-table',
  icebreaker: 'icebreaker',
  'everyday-conversations': 'everyday-conversation',
  'lets-reconnect': 'reconnect',
  'red-flag-green-flag': 'red-flag-green-flag',
  charades: 'charades',
  wnrs: 'strangers',
  'put-a-finger-down': 'finger-down',
  'take-a-sip': 'take-a-sip',
  'sip-or-spill': 'sip-or-spill',
  'you-laugh': 'you-laugh',
  'do-or-drink': 'do-or-drink',
  'two-truths-bluff': 'two-truths-bluff',
  'most-likely-to': 'most-likely-to',
  'choose-your-side': 'choose-your-side',
  'who-said-that': 'who-said-that',
  'we-just-met': 'we-just-met',
  whot: 'whot',
}

describe('guide game names', () => {
  it('uses the canonical customer-facing title for every recommendation', () => {
    for (const guide of GUIDES) {
      for (const recommendation of guide.recommendations ?? []) {
        const registryId = guideIdToRegistryId[recommendation.gameId]
        expect(registryId, `${guide.slug} has an unknown game id: ${recommendation.gameId}`).toBeTruthy()
        expect(recommendation.name, `${guide.slug}/${recommendation.gameId}`).toBe(GAME_NAMES[registryId])
      }
    }
  })

  it('keeps search descriptors separate from canonical product names', () => {
    expect(GAME_SEARCH_DESCRIPTORS['/games/you-laugh-youre-out']).toContain('try-not-to-laugh')
    expect(GAME_SEARCH_DESCRIPTORS['/games/red-flag-green-flag']).toContain('red-flag-or-green-flag')
    expect(Object.values(GAME_SEARCH_DESCRIPTORS)).not.toContain("We're Not Really Strangers")
  })
})
