import { describe, expect, it } from 'vitest'
import { BAD_ADVICE_CATEGORIES, BAD_ADVICE_SITUATIONS, situationsFor } from './badAdviceOnly'

describe('Bad Advice Only recovered content', () => {
  it('keeps all six original categories with 30 unique situations each', () => {
    expect(BAD_ADVICE_CATEGORIES).toHaveLength(6)
    expect(BAD_ADVICE_SITUATIONS).toHaveLength(180)
    expect(new Set(BAD_ADVICE_SITUATIONS.map(item => item.id)).size).toBe(180)
    expect(new Set(BAD_ADVICE_SITUATIONS.map(item => item.situation.trim().toLowerCase())).size).toBe(180)
    for (const category of BAD_ADVICE_CATEGORIES) {
      expect(BAD_ADVICE_SITUATIONS.filter(item => item.category === category.id), category.id).toHaveLength(30)
    }
  })

  it('returns only situations belonging to selected categories', () => {
    const selected = situationsFor(['dating', 'wild'])
    expect(selected).toHaveLength(60)
    expect(selected.every(item => item.category === 'dating' || item.category === 'wild')).toBe(true)
  })
})
