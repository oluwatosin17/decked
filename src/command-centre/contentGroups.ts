import type { ContentCategoryCount } from './api'

export interface ContentGameGroup {
  gameId: string
  categories: ContentCategoryCount[]
  publishedCount: number
  draftCount: number
  archivedCount: number
  targetCount: number
}

export function groupContentCounts(rows: ContentCategoryCount[]): ContentGameGroup[] {
  const groups = new Map<string, ContentGameGroup>()
  for (const row of rows) {
    const group = groups.get(row.game_id) ?? {
      gameId: row.game_id,
      categories: [],
      publishedCount: 0,
      draftCount: 0,
      archivedCount: 0,
      targetCount: 0,
    }
    group.categories.push(row)
    group.publishedCount += Number(row.published_count)
    group.draftCount += Number(row.draft_count)
    group.archivedCount += Number(row.archived_count)
    group.targetCount += Number(row.target_count)
    groups.set(row.game_id, group)
  }
  return [...groups.values()]
    .map(group => ({ ...group, categories: [...group.categories].sort((a, b) => a.label.localeCompare(b.label)) }))
    .sort((a, b) => a.gameId.localeCompare(b.gameId))
}
