import { describe, expect, it } from 'vitest'
import { GAME_IDS } from './gameRegistry'
import { HOW_TO_PLAY_GUIDES, appGameIdForGuide, howToPlayScreen } from './howToPlayData'

describe('how-to-play guides', () => {
  it('covers every registered game exactly once', () => {
    expect(HOW_TO_PLAY_GUIDES.map(guide => guide.gameId)).toEqual(GAME_IDS)
    expect(new Set(HOW_TO_PLAY_GUIDES.map(guide => guide.path)).size).toBe(GAME_IDS.length)
  })

  it('provides complete, indexable instructions', () => {
    for (const guide of HOW_TO_PLAY_GUIDES) {
      expect(guide.path).toBe(`/guides/how-to-play-${guide.gameId}`)
      expect(howToPlayScreen(guide.gameId)).toBe(`guide-how-to-play-${guide.gameId}`)
      expect(guide.summary.length).toBeGreaterThan(30)
      expect(guide.setup.length).toBeGreaterThanOrEqual(2)
      expect(guide.steps.length).toBeGreaterThanOrEqual(3)
      expect(guide.ending.length).toBeGreaterThan(20)
      expect(guide.tips.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('maps legacy app route ids back to the correct game', () => {
    expect(appGameIdForGuide('reconnect')).toBe('lets-reconnect')
    expect(appGameIdForGuide('everyday-conversation')).toBe('everyday-conversations')
    expect(appGameIdForGuide('strangers')).toBe('wnrs')
    expect(appGameIdForGuide('finger-down')).toBe('put-a-finger-down')
    expect(appGameIdForGuide('imposter')).toBe('imposter')
  })
})
