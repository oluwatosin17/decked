import { describe, expect, it } from 'vitest'
import { performanceRating } from './performance'

describe('performance metric thresholds', () => {
  it('uses the standard user-experience thresholds for key page metrics', () => {
    expect(performanceRating('largest_contentful_paint', 2500)).toBe('good')
    expect(performanceRating('largest_contentful_paint', 2501)).toBe('needs_improvement')
    expect(performanceRating('interaction_to_next_paint', 501)).toBe('poor')
  })

  it('flags slow multiplayer synchronization without changing game state', () => {
    expect(performanceRating('multiplayer_sync', 500)).toBe('good')
    expect(performanceRating('multiplayer_sync', 900)).toBe('needs_improvement')
    expect(performanceRating('multiplayer_sync', 1501)).toBe('poor')
  })
})
