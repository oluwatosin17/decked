import type { ContentItem } from './api'

export const CONTENT_JSON_FORMAT = 'decked-content-v1'
export const MAX_CONTENT_JSON_ITEMS = 5000
export const MAX_CONTENT_JSON_BYTES = 5 * 1024 * 1024
export const MAX_CONTENT_METADATA_BYTES = 16 * 1024

const ITEM_KINDS = new Set<ContentItem['item_kind']>(['prompt', 'challenge', 'scenario', 'choice'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ContentJsonItem {
  id?: string
  item_kind: ContentItem['item_kind']
  body: string
  metadata: Record<string, unknown>
  category_ids: string[]
  lifecycle_status: 'active' | 'archived'
}

export interface ContentJsonDocument {
  format: typeof CONTENT_JSON_FORMAT
  exported_at: string
  game_id: string
  category_id: string | null
  items: ContentJsonItem[]
}

export function buildContentJsonDocument(gameId: string, categoryId: string, items: ContentItem[], exportedAt = new Date()): ContentJsonDocument {
  return {
    format: CONTENT_JSON_FORMAT,
    exported_at: exportedAt.toISOString(),
    game_id: gameId,
    category_id: categoryId || null,
    items: items.map(item => ({
      id: item.id,
      item_kind: item.item_kind,
      body: item.body,
      metadata: item.metadata,
      category_ids: item.categories.filter(category => category.enabled).sort((a, b) => a.sort_order - b.sort_order).map(category => category.category_id),
      lifecycle_status: item.lifecycle_status,
    })),
  }
}

export function parseContentJson(raw: string, expectedGameId?: string): ContentJsonDocument {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('The selected file is not valid JSON.')
  }
  if (!isRecord(value)) throw new Error('The JSON root must be an object.')
  if (value.schema_version === 1 && Array.isArray(value.cards)) {
    value = {
      format: CONTENT_JSON_FORMAT,
      exported_at: value.exported_at,
      game_id: value.game_id,
      category_id: value.category_id,
      items: value.cards.map(card => isRecord(card) ? {
        id: card.id,
        item_kind: card.kind,
        body: card.body,
        metadata: card.metadata ?? {},
        category_ids: card.categories,
        lifecycle_status: 'active',
      } : card),
    }
  }
  if (!isRecord(value)) throw new Error('The JSON root must be an object.')
  if (value.format !== CONTENT_JSON_FORMAT) throw new Error(`Unsupported JSON format. Expected ${CONTENT_JSON_FORMAT}.`)
  const gameId = requiredText(value.game_id, 'game_id', 100)
  if (expectedGameId && gameId !== expectedGameId) throw new Error(`This file belongs to ${gameId}, not ${expectedGameId}.`)
  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > MAX_CONTENT_JSON_ITEMS) {
    throw new Error(`items must contain between 1 and ${MAX_CONTENT_JSON_ITEMS} cards.`)
  }

  const seenIds = new Set<string>()
  const items = value.items.map((candidate, index): ContentJsonItem => {
    if (!isRecord(candidate)) throw new Error(`Item ${index + 1} must be an object.`)
    const id = candidate.id === undefined || candidate.id === null || candidate.id === '' ? undefined : requiredText(candidate.id, `Item ${index + 1} id`, 36)
    if (id && !UUID_PATTERN.test(id)) throw new Error(`Item ${index + 1} has an invalid id.`)
    if (id && seenIds.has(id)) throw new Error(`Item ${index + 1} repeats id ${id}.`)
    if (id) seenIds.add(id)
    const itemKind = requiredText(candidate.item_kind, `Item ${index + 1} item_kind`, 20) as ContentItem['item_kind']
    if (!ITEM_KINDS.has(itemKind)) throw new Error(`Item ${index + 1} has an unsupported item_kind.`)
    const body = requiredText(candidate.body, `Item ${index + 1} body`, 1000)
    if (!isRecord(candidate.metadata)) throw new Error(`Item ${index + 1} metadata must be an object.`)
    if (new TextEncoder().encode(JSON.stringify(candidate.metadata)).byteLength > MAX_CONTENT_METADATA_BYTES) throw new Error(`Item ${index + 1} metadata is too large.`)
    if (!Array.isArray(candidate.category_ids) || candidate.category_ids.length < 1 || candidate.category_ids.length > 32) {
      throw new Error(`Item ${index + 1} must have between 1 and 32 category_ids.`)
    }
    const categoryIds = candidate.category_ids.map((category, categoryIndex) => requiredText(category, `Item ${index + 1} category ${categoryIndex + 1}`, 100))
    if (new Set(categoryIds).size !== categoryIds.length) throw new Error(`Item ${index + 1} repeats a category.`)
    const lifecycleStatus = candidate.lifecycle_status === undefined ? 'active' : candidate.lifecycle_status
    if (lifecycleStatus !== 'active' && lifecycleStatus !== 'archived') throw new Error(`Item ${index + 1} has an invalid lifecycle_status.`)
    return { id, item_kind: itemKind, body, metadata: candidate.metadata, category_ids: categoryIds, lifecycle_status: lifecycleStatus }
  })

  const categoryId = value.category_id === null || value.category_id === undefined || value.category_id === '' ? null : requiredText(value.category_id, 'category_id', 100)
  return {
    format: CONTENT_JSON_FORMAT,
    exported_at: typeof value.exported_at === 'string' ? value.exported_at : new Date(0).toISOString(),
    game_id: gameId,
    category_id: categoryId,
    items,
  }
}

export function contentJsonFilename(gameId: string, categoryId: string, date = new Date()) {
  const scope = [safeSegment(gameId), categoryId ? safeSegment(categoryId) : 'all-content'].filter(Boolean).join('-')
  return `decked-${scope}-${date.toISOString().slice(0, 10)}.json`
}

export function downloadContentJson(filename: string, document: ContentJsonDocument) {
  const blob = new Blob([`${JSON.stringify(document, null, 2)}\n`], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > maxLength) throw new Error(`${label} must be between 1 and ${maxLength} characters.`)
  return value.trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function safeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'content'
}
