import { describe, expect, it } from 'vitest'
import { groupContentCounts } from './contentGroups'

describe('groupContentCounts', () => {
  it('groups category totals by game without losing membership counts', () => {
    const groups = groupContentCounts([
      { game_id: 'game-b', category_id: 'hard', label: 'Hard', target_count: 300, published_count: 280, draft_count: 20, archived_count: 2 },
      { game_id: 'game-a', category_id: 'main', label: 'Main', target_count: 300, published_count: 300, draft_count: 1, archived_count: 0 },
      { game_id: 'game-b', category_id: 'easy', label: 'Easy', target_count: 300, published_count: 300, draft_count: 3, archived_count: 1 },
    ])

    expect(groups.map(group => group.gameId)).toEqual(['game-a', 'game-b'])
    expect(groups[1]).toMatchObject({ publishedCount: 580, draftCount: 23, archivedCount: 3, targetCount: 600 })
    expect(groups[1].categories.map(category => category.category_id)).toEqual(['easy', 'hard'])
  })
})
