export interface ReconciliationEvent {
  eventId: string
  idempotencyKey: string
  eventName: string
  environment: 'development' | 'preview' | 'production'
  occurredAt: string
  analyticsSessionId?: string
  gameSessionId?: string
  roomRef?: string
  gameId?: string
  playMode?: 'pass_and_play' | 'play_together'
  properties?: Record<string, unknown>
}

export interface ReconciledGameSession {
  gameSessionId: string
  gameId: string
  playMode: 'pass_and_play' | 'play_together'
  startedAt: string | null
  completedAt: string | null
  cardsPresented: number
}

export interface ReconciliationResult {
  rawEvents: ReconciliationEvent[]
  sessions: ReconciledGameSession[]
  dailyAggregates: Array<{ metricDate: string; gameStarts: number; completions: number; cardsPresented: number }>
  roomFacts: { roomsCreated: number; successfulJoins: number; roomsEnded: number; hostDisconnects: number; hostHandoffs: number; rematchesStarted: number }
  dashboard: { gameStarts: number; completions: number; cardsPresented: number; failedJoins: number; replays: number; rematches: number }
}

const START_EVENTS = new Set(['game_started', 'multiplayer_game_started', 'rematch_started'])
const COMPLETE_EVENTS = new Set(['game_completed', 'multiplayer_game_completed'])
const FORBIDDEN_KEY = /(display.?name|room.?code|prompt|question|answer|custom.?card|statement|truth|bluff|email|phone|token|password|secret|credential)/i

export function reconcileAnalytics(events: readonly ReconciliationEvent[], environment: ReconciliationEvent['environment']): ReconciliationResult {
  const seenEventIds = new Set<string>()
  const seenIdempotencyKeys = new Set<string>()
  const rawEvents = events
    .filter(event => event.environment === environment)
    .filter(event => {
      if (seenEventIds.has(event.eventId) || seenIdempotencyKeys.has(event.idempotencyKey)) return false
      seenEventIds.add(event.eventId)
      seenIdempotencyKeys.add(event.idempotencyKey)
      return true
    })
    .sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt))

  const sessionEvents = new Map<string, ReconciliationEvent[]>()
  for (const event of rawEvents) {
    if (!event.gameSessionId) continue
    const group = sessionEvents.get(event.gameSessionId) ?? []
    group.push(event)
    sessionEvents.set(event.gameSessionId, group)
  }

  const sessions = [...sessionEvents.entries()].flatMap(([gameSessionId, group]) => {
    const identity = group.find(event => event.gameId && event.playMode)
    if (!identity?.gameId || !identity.playMode) return []
    return [{
      gameSessionId,
      gameId: identity.gameId,
      playMode: identity.playMode,
      startedAt: group.find(event => START_EVENTS.has(event.eventName))?.occurredAt ?? null,
      completedAt: group.find(event => COMPLETE_EVENTS.has(event.eventName))?.occurredAt ?? null,
      cardsPresented: group.filter(event => event.eventName === 'card_presented').length,
    }]
  })

  const daily = new Map<string,{gameStarts:number;completions:number;cardsPresented:number}>()
  for (const session of sessions) {
    if (!session.startedAt) continue
    const metricDate = session.startedAt.slice(0,10)
    const row = daily.get(metricDate) ?? { gameStarts:0,completions:0,cardsPresented:0 }
    row.gameStarts += 1
    row.completions += session.completedAt ? 1 : 0
    row.cardsPresented += session.cardsPresented
    daily.set(metricDate,row)
  }
  const dailyAggregates=[...daily.entries()].sort(([left],[right])=>left.localeCompare(right)).map(([metricDate,row])=>({metricDate,...row}))
  return {
    rawEvents,
    sessions,
    dailyAggregates,
    roomFacts: {
      roomsCreated: count(rawEvents, 'room_created'),
      successfulJoins: count(rawEvents, 'room_joined'),
      roomsEnded: count(rawEvents, 'room_ended'),
      hostDisconnects: count(rawEvents, 'host_disconnected'),
      hostHandoffs: count(rawEvents, 'host_handoff_completed'),
      rematchesStarted: count(rawEvents, 'rematch_started'),
    },
    dashboard: {
      gameStarts: dailyAggregates.reduce((total,row)=>total+row.gameStarts,0),
      completions: dailyAggregates.reduce((total,row)=>total+row.completions,0),
      cardsPresented: dailyAggregates.reduce((total,row)=>total+row.cardsPresented,0),
      failedJoins: count(rawEvents, 'room_join_failed'),
      replays: count(rawEvents, 'game_replay_selected'),
      rematches: count(rawEvents, 'rematch_started'),
    },
  }
}

export function findPrivacyViolations(events: readonly ReconciliationEvent[]) {
  const violations: string[] = []
  const inspect = (value: unknown, path: string, eventId: string) => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${path}[${index}]`, eventId))
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key
      if (FORBIDDEN_KEY.test(key)) violations.push(`${eventId}:${childPath}`)
      inspect(child, childPath, eventId)
    }
  }
  for (const event of events) inspect(event.properties, 'properties', event.eventId)
  return violations
}

export function discrepancyPercent(expected: number, actual: number) {
  if (expected === 0) return actual === 0 ? 0 : 100
  return Math.abs(expected - actual) / expected * 100
}

function count(events: readonly ReconciliationEvent[], eventName: string) {
  return events.filter(event => event.eventName === eventName).length
}
