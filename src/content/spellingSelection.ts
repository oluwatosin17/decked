import type { SpellingLevel, SpellingWord } from './spellingBee'

export interface SpellingSelectionOptions {
  teamCount: number
  rounds: number
  levels: readonly SpellingLevel[]
  random?: () => number
  recentlyUsed?: ReadonlySet<string>
}

export function normalizeSpelling(text: string): string {
  return text.trim().normalize('NFC').toLocaleLowerCase('en')
}

export function acceptsSpelling(text: string, entry: Pick<SpellingWord, 'word' | 'variants'>): boolean {
  const normalized = normalizeSpelling(text)
  return [entry.word, ...(entry.variants ?? [])].some(value => normalizeSpelling(value) === normalized)
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    if (!Number.isInteger(swap) || swap < 0 || swap > index) throw new Error('Invalid random generator')
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

/** Team turns alternate within each complete round; each team gets the same level in that round. */
export function selectFairSpellingDeck(words: readonly SpellingWord[], options: SpellingSelectionOptions): SpellingWord[] {
  const { teamCount, rounds, levels, random = Math.random, recentlyUsed = new Set<string>() } = options
  if (!Number.isInteger(teamCount) || teamCount < 2 || !Number.isInteger(rounds) || rounds < 1) throw new Error('Invalid teams or rounds')
  if (!levels.length || levels.some(level => ![1, 2, 3].includes(level))) throw new Error('Choose valid levels')
  const selectedLevels = [...new Set(levels)]
  const seen = new Set<string>()
  const pools = new Map<SpellingLevel, SpellingWord[]>(selectedLevels.map(level => [level, []]))
  for (const entry of words) {
    if (!pools.has(entry.level)) continue
    const key = normalizeSpelling(entry.word)
    if (seen.has(key)) throw new Error(`Duplicate word in supplied pool: ${entry.word}`)
    seen.add(key)
    pools.get(entry.level)!.push(entry)
  }
  const usable = new Map<SpellingLevel, SpellingWord[]>()
  for (const level of selectedLevels) {
    const pool = pools.get(level)!
    const fresh = shuffle(pool.filter(entry => !recentlyUsed.has(normalizeSpelling(entry.word))), random)
    const old = shuffle(pool.filter(entry => recentlyUsed.has(normalizeSpelling(entry.word))), random)
    usable.set(level, [...fresh, ...old])
  }
  let cycle: SpellingLevel[] = []
  const turns: SpellingWord[] = []
  for (let round = 0; round < rounds; round++) {
    if (!cycle.length) cycle = shuffle(selectedLevels, random)
    let level: SpellingLevel | undefined
    while (cycle.length) {
      const candidate = cycle.shift()!
      if (usable.get(candidate)!.length >= teamCount) { level = candidate; break }
    }
    if (level === undefined) {
      const available = selectedLevels.filter(candidate => usable.get(candidate)!.length >= teamCount)
      if (!available.length) throw new Error('Insufficient words to allocate a complete fair round')
      cycle = shuffle(available, random)
      level = cycle.shift()!
    }
    turns.push(...usable.get(level)!.splice(0, teamCount))
  }
  return turns
}

export function maxFairSpellingRounds(words: readonly SpellingWord[], teamCount: number, levels: readonly SpellingLevel[]): number {
  if (!Number.isInteger(teamCount) || teamCount < 2 || !levels.length) return 0
  return [...new Set(levels)].reduce((sum, level) => sum + Math.floor(words.filter(word => word.level === level).length / teamCount), 0)
}
