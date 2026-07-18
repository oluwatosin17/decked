/**
 * Shared randomization utility for all Decked games.
 *
 * Provides double randomization:
 * 1. Session shuffle — Fisher-Yates shuffle at the start of each game
 * 2. Recently-played exclusion — tracks used cards in localStorage so
 *    the next session avoids repeats until 70% of the pool is exhausted
 */

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function storageKey(gameId: string): string {
  return `decked-recent-${gameId}`
}

function readRecentIndices(gameId: string): number[] {
  try {
    const raw = localStorage.getItem(storageKey(gameId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((n): n is number => typeof n === 'number')
  } catch { /* ignore corrupt data */ }
  return []
}

function writeRecentIndices(gameId: string, indices: number[]): void {
  try {
    localStorage.setItem(storageKey(gameId), JSON.stringify(indices))
  } catch { /* localStorage full or unavailable */ }
}

/**
 * Get a shuffled deck with recently-played exclusion.
 * @param allCards - full pool of cards/questions
 * @param gameId - unique game identifier for localStorage key (e.g. 'truth-or-dare', 'icebreaker')
 * @param deckSize - how many cards the player wants (omit or 0 for all available)
 * @returns shuffled deck of requested size
 *
 * How it works:
 * 1. Read recently-used indices from localStorage (key: `decked-recent-${gameId}`)
 * 2. If recently-used covers >= 70% of total pool, reset the tracking
 * 3. Filter out recently-used cards from the pool
 * 4. Shuffle the remaining cards
 * 5. If we need more cards than available (after filtering), add back shuffled recently-used cards
 * 6. Return the first `deckSize` cards (or all if deckSize > available)
 * 7. Save used card indices to localStorage
 */
export function getShuffledDeck<T>(allCards: T[], gameId: string, deckSize?: number): T[] {
  const total = allCards.length
  if (total === 0) return []

  let recentIndices = readRecentIndices(gameId)

  // Reset if 70% or more of the pool has been used
  if (recentIndices.length >= Math.floor(total * 0.7)) {
    recentIndices = []
  }

  const recentSet = new Set(recentIndices)
  const fresh: T[] = []
  const freshIndices: number[] = []
  const recent: T[] = []

  for (let i = 0; i < total; i++) {
    if (recentSet.has(i)) {
      recent.push(allCards[i])
    } else {
      fresh.push(allCards[i])
      freshIndices.push(i)
    }
  }

  let deck = shuffle(fresh)
  const needed = deckSize && deckSize > 0 ? deckSize : total

  // If we need more cards than fresh ones available, supplement with recent
  if (deck.length < needed && recent.length > 0) {
    deck = [...deck, ...shuffle(recent)]
  }

  const result = deck.slice(0, needed)

  // Determine which indices from allCards ended up in the result, and save them
  const usedIndices = new Set<number>()
  const resultSet = new Map<T, number>()

  // Build a reverse lookup: card -> first unused index in allCards
  for (let i = 0; i < total; i++) {
    // Use the first matching index not yet claimed
    if (!resultSet.has(allCards[i])) {
      resultSet.set(allCards[i], i)
    }
  }

  for (const card of result) {
    // Find this card's index in allCards
    for (let i = 0; i < total; i++) {
      if (allCards[i] === card && !usedIndices.has(i)) {
        usedIndices.add(i)
        break
      }
    }
  }

  // Merge with existing recent indices (the ones that were not reset)
  const newRecent = [...recentIndices, ...usedIndices].filter((v, i, a) => a.indexOf(v) === i)
  writeRecentIndices(gameId, newRecent)

  return result
}

/**
 * Record played cards to localStorage after a game session.
 * @param allCards - the full pool
 * @param playedCards - the cards that were actually played
 * @param gameId - game identifier
 */
export function recordPlayedCards<T>(allCards: T[], playedCards: T[], gameId: string): void {
  const total = allCards.length
  if (total === 0) return

  let recentIndices = readRecentIndices(gameId)

  // Reset if already at 70%
  if (recentIndices.length >= Math.floor(total * 0.7)) {
    recentIndices = []
  }

  const usedSet = new Set(recentIndices)

  for (const card of playedCards) {
    for (let i = 0; i < total; i++) {
      if (allCards[i] === card && !usedSet.has(i)) {
        usedSet.add(i)
        break
      }
    }
  }

  writeRecentIndices(gameId, [...usedSet])
}
