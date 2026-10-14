/** Session-deck helpers shared by every Decked game. */

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function cardKey(card: unknown): string {
  if (typeof card === 'string') {
    return card.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
  }
  if (card && typeof card === 'object') {
    const record = card as Record<string, unknown>
    const playableText = record.text ?? record.prompt ?? record.question ?? record.label
    if (typeof playableText === 'string') {
      return playableText.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
    }
  }
  return JSON.stringify(card)
}

/** Remove empty strings and duplicate playable items while preserving order. */
export function uniqueCards<T>(items: readonly T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    if (typeof item === 'string' && item.trim().length === 0) continue
    const key = cardKey(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

/**
 * Build one repeat-free game session. User-created cards always play first,
 * in the order they were entered. Remaining slots are filled from a shuffled
 * built-in pool, deduplicated against the custom content.
 */
export function createSessionDeck<T>(
  builtInCards: readonly T[],
  options: { customCards?: readonly T[]; deckSize?: number } = {},
): T[] {
  const custom = uniqueCards(options.customCards ?? [])
  const customKeys = new Set(custom.map(cardKey))
  const builtIn = shuffle(uniqueCards(builtInCards).filter(card => !customKeys.has(cardKey(card))))
  const ordered = [...custom, ...builtIn]
  const requested = options.deckSize
  if (!requested || requested <= 0) return ordered
  return ordered.slice(0, Math.min(Math.floor(requested), ordered.length))
}

/** Backward-compatible wrapper used by the existing game implementations. */
export function getShuffledDeck<T>(
  allCards: readonly T[],
  _gameId: string,
  deckSize?: number,
): T[] {
  return createSessionDeck(allCards, { deckSize })
}

/** Compatibility no-op: session state is intentionally not persisted. */
export function recordPlayedCards<T>(
  _allCards: readonly T[],
  _playedCards: readonly T[],
  _gameId: string,
): void {}
