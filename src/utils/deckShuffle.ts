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
 * Build one repeat-free game session. Custom cards are mixed into the same
 * pool and deduplicated against built-in content. When the requested size is
 * larger than the unique source, the session ends instead of recycling cards.
 */
export function createSessionDeck<T>(
  builtInCards: readonly T[],
  options: { customCards?: readonly T[]; deckSize?: number } = {},
): T[] {
  const source = uniqueCards([...(options.customCards ?? []), ...builtInCards])
  const shuffled = shuffle(source)
  const requested = options.deckSize
  if (!requested || requested <= 0) return shuffled
  return shuffled.slice(0, Math.min(Math.floor(requested), shuffled.length))
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
