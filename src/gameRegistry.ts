export const GAME_REGISTRY = [
  { id: 'truth-or-dare', name: 'Truth or Dare' },
  { id: 'spicy-starters', name: 'Spicy Opener' },
  { id: 'never-have-i-ever', name: 'Never Have I Ever' },
  { id: 'late-night-talks', name: 'Late Night Talks' },
  { id: 'dinner-table', name: 'Dinner Table' },
  { id: 'icebreaker', name: 'Icebreaker' },
  { id: 'everyday-conversation', name: 'Real Talk, Every Day' },
  { id: 'reconnect', name: 'Back to Us' },
  { id: 'red-flag-green-flag', name: 'Dateable or Dealbreaker' },
  { id: 'charades', name: 'Charades' },
  { id: 'strangers', name: 'Beyond Small Talk' },
  { id: 'finger-down', name: 'Drop a Finger' },
  { id: 'take-a-sip', name: 'Take a Sip' },
  { id: 'sip-or-spill', name: 'Answer or Drink' },
  { id: 'you-laugh', name: 'Keep a Straight Face' },
  { id: 'do-or-drink', name: 'Dare or Pour' },
  { id: 'two-truths-bluff', name: 'Two Truths and a Bluff' },
  { id: 'most-likely-to', name: 'Who’s Most Likely To?' },
  { id: 'choose-your-side', name: 'Choose Your Side' },
  { id: 'who-said-that', name: 'Who Said That?' },
  { id: 'we-just-met', name: 'We Just Met' },
] as const

export type GameId = typeof GAME_REGISTRY[number]['id']
export const GAME_IDS = GAME_REGISTRY.map(game => game.id)
export const GAME_NAMES = Object.fromEntries(GAME_REGISTRY.map(game => [game.id, game.name])) as Record<GameId, string>

export function isGameId(value: string): value is GameId {
  return GAME_IDS.some(id => id === value)
}
