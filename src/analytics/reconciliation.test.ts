import { describe, expect, it } from 'vitest'
import { discrepancyPercent, findPrivacyViolations, reconcileAnalytics, type ReconciliationEvent } from './reconciliation'

const at = (minute: number) => {
  const minuteWithinHour=Math.floor(minute%60)
  const seconds=Math.round((minute-Math.floor(minute))*60)
  return `2026-10-${minute<60?'09':'10'}T${minute<60?'23':'00'}:${String(minuteWithinHour).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.000Z`
}
const event = (eventId: string, eventName: string, minute: number, values: Partial<ReconciliationEvent> = {}): ReconciliationEvent => ({
  eventId, idempotencyKey: `journey:${eventId}`, eventName, environment: 'development', occurredAt: at(minute), properties: {}, ...values,
})

const fixtures: ReconciliationEvent[] = [
  // Browse -> local start -> completion -> replay. Charades crosses midnight.
  event('open-1', 'app_opened', 49, { analyticsSessionId: 'activity-a', properties: { initial_screen_id: 'home', entry_path: '/', is_pwa: false, device_class: 'desktop' } }),
  event('browse-1', 'screen_viewed', 50, { analyticsSessionId: 'activity-a', properties: { screen_id: 'browse' } }),
  event('select-1', 'game_selected', 51, { analyticsSessionId: 'activity-a', gameId: 'charades', properties: { selection_surface: 'browse' } }),
  event('local-mode-1', 'play_mode_selected', 51.25, { analyticsSessionId: 'activity-a', gameId: 'charades', playMode: 'pass_and_play' }),
  event('local-setup-1', 'game_setup_started', 51.5, { analyticsSessionId: 'activity-a', gameSessionId: 'game-charades-1', gameId: 'charades', playMode: 'pass_and_play' }),
  event('local-start-1', 'game_started', 52, { analyticsSessionId: 'activity-a', gameSessionId: 'game-charades-1', gameId: 'charades', playMode: 'pass_and_play' }),
  event('local-card-1', 'card_presented', 53, { analyticsSessionId: 'activity-a', gameSessionId: 'game-charades-1', gameId: 'charades', playMode: 'pass_and_play', properties: { card_number: 1, content_source: 'built_in' } }),
  event('local-complete-1', 'game_completed', 61, { analyticsSessionId: 'activity-a', gameSessionId: 'game-charades-1', gameId: 'charades', playMode: 'pass_and_play', properties: { cards_presented: 1 } }),
  event('replay-1', 'game_replay_selected', 62, { analyticsSessionId: 'activity-a', gameSessionId: 'game-charades-2', gameId: 'charades', playMode: 'pass_and_play', properties: { completed_game_session_id: 'game-charades-1' } }),
  event('local-start-2', 'game_started', 63, { analyticsSessionId: 'activity-a', gameSessionId: 'game-charades-2', gameId: 'charades', playMode: 'pass_and_play' }),

  // Abandon before first card. Icebreaker must not become a start or completion.
  event('abandon-open', 'app_opened', 7, { analyticsSessionId: 'activity-b', properties: { initial_screen_id: 'home', entry_path: '/', is_pwa: false, device_class: 'mobile' } }),
  event('abandon-select', 'game_selected', 8, { analyticsSessionId: 'activity-b', gameId: 'icebreaker', properties: { selection_surface: 'quick_play' } }),
  event('abandon-mode', 'play_mode_selected', 9, { analyticsSessionId: 'activity-b', gameId: 'icebreaker', playMode: 'pass_and_play' }),
  event('abandon-setup', 'game_setup_started', 10, { analyticsSessionId: 'activity-b', gameSessionId: 'game-icebreaker-1', gameId: 'icebreaker', playMode: 'pass_and_play' }),
  event('abandon-1', 'game_session_abandoned', 11, { analyticsSessionId: 'activity-b', gameSessionId: 'game-icebreaker-1', gameId: 'icebreaker', playMode: 'pass_and_play', properties: { lifecycle_stage: 'setup' } }),

  // Two Truths and a Bluff uses specialized write/handoff/guess shared state.
  event('room-create-attempt-1', 'room_create_attempted', 19, { analyticsSessionId: 'activity-c', gameId: 'two-truths-bluff', playMode: 'play_together' }),
  event('room-create-1', 'room_created', 20, { analyticsSessionId: 'activity-c', roomRef: 'room-safe-1', gameId: 'two-truths-bluff', playMode: 'play_together' }),
  event('room-join-1', 'room_joined', 21, { roomRef: 'room-safe-1', gameId: 'two-truths-bluff', playMode: 'play_together', properties: { is_first_guest: true } }),
  event('multi-setup-1', 'multiplayer_setup_started', 21.5, { roomRef: 'room-safe-1', gameId: 'two-truths-bluff', playMode: 'play_together', properties: { room_player_count: 2 } }),
  event('multi-start-1', 'multiplayer_game_started', 22, { roomRef: 'room-safe-1', gameSessionId: 'game-multi-1', gameId: 'two-truths-bluff', playMode: 'play_together', properties: { player_count: 2 } }),
  event('multi-card-1', 'card_presented', 23, { roomRef: 'room-safe-1', gameSessionId: 'game-multi-1', gameId: 'two-truths-bluff', playMode: 'play_together', properties: { card_number: 1, content_source: 'custom' } }),
  event('host-disconnect-1', 'host_disconnected', 24, { roomRef: 'room-safe-1', gameSessionId: 'game-multi-1', gameId: 'two-truths-bluff', playMode: 'play_together' }),
  event('host-handoff-1', 'host_handoff_completed', 25, { roomRef: 'room-safe-1', gameSessionId: 'game-multi-1', gameId: 'two-truths-bluff', playMode: 'play_together', properties: { room_status: 'playing', handoff_reason: 'host_timeout' } }),
  event('multi-complete-1', 'multiplayer_game_completed', 26, { roomRef: 'room-safe-1', gameSessionId: 'game-multi-1', gameId: 'two-truths-bluff', playMode: 'play_together' }),
  event('rematch-request-1', 'rematch_requested', 27, { roomRef: 'room-safe-1', gameSessionId: 'game-multi-1', gameId: 'two-truths-bluff', playMode: 'play_together' }),
  event('rematch-start-1', 'rematch_started', 28, { roomRef: 'room-safe-1', gameSessionId: 'game-multi-2', gameId: 'two-truths-bluff', playMode: 'play_together', properties: { previous_game_session_id: 'game-multi-1', request_count: 1 } }),
  event('room-end-1', 'room_ended', 29, { roomRef: 'room-safe-1', gameId: 'two-truths-bluff', playMode: 'play_together' }),

  // Failed join and an exact retry of the same idempotency key.
  event('join-attempt-1', 'room_join_attempted', 30, { analyticsSessionId: 'activity-d' }),
  event('join-fail-1', 'room_join_failed', 31, { analyticsSessionId: 'activity-d', properties: { failure_reason: 'not_found_or_expired' } }),
  { ...event('join-fail-retry', 'room_join_failed', 31, { analyticsSessionId: 'activity-d' }), idempotencyKey: 'journey:join-fail-1' },

  // Production noise must never enter this controlled development run.
  event('prod-start', 'game_started', 32, { environment: 'production', gameSessionId: 'game-prod-1', gameId: 'we-just-met', playMode: 'pass_and_play' }),
]

describe('end-to-end analytics reconciliation', () => {
  const result = reconcileAnalytics(fixtures, 'development')

  it('reconciles raw events, sessions, room facts, and dashboard totals exactly', () => {
    expect(result.sessions).toHaveLength(5)
    expect(result.sessions.find(session => session.gameSessionId === 'game-icebreaker-1')).toMatchObject({ startedAt: null, completedAt: null, cardsPresented: 0 })
    expect(result.sessions.find(session => session.gameSessionId === 'game-charades-1')).toMatchObject({ completedAt: at(61), cardsPresented: 1 })
    expect(result.sessions.find(session => session.gameSessionId === 'game-multi-1')).toMatchObject({ gameId: 'two-truths-bluff', completedAt: at(26), cardsPresented: 1 })
    expect(result.roomFacts).toEqual({ roomsCreated: 1, successfulJoins: 1, roomsEnded: 1, hostDisconnects: 1, hostHandoffs: 1, rematchesStarted: 1 })
    expect(result.sessions.find(session => session.gameSessionId === 'game-multi-2')?.startedAt).toBe(at(28))
    expect(result.dailyAggregates).toEqual([
      { metricDate:'2026-10-09',gameStarts:3,completions:2,cardsPresented:2 },
      { metricDate:'2026-10-10',gameStarts:1,completions:0,cardsPresented:0 },
    ])
    expect(result.dashboard).toEqual({ gameStarts: 4, completions: 2, cardsPresented: 2, failedJoins: 1, replays: 1, rematches: 1 })
  })

  it('matches the expected event sequence for every controlled journey',()=>{
    const sequence=(session:string)=>result.rawEvents.filter(item=>item.analyticsSessionId===session).map(item=>item.eventName)
    expect(sequence('activity-a')).toEqual(['app_opened','screen_viewed','game_selected','play_mode_selected','game_setup_started','game_started','card_presented','game_completed','game_replay_selected','game_started'])
    expect(sequence('activity-b')).toEqual(['app_opened','game_selected','play_mode_selected','game_setup_started','game_session_abandoned'])
    expect(sequence('activity-d')).toEqual(['room_join_attempted','room_join_failed'])
    expect(result.rawEvents.filter(item=>item.roomRef==='room-safe-1').map(item=>item.eventName)).toEqual(['room_created','room_joined','multiplayer_setup_started','multiplayer_game_started','card_presented','host_disconnected','host_handoff_completed','multiplayer_game_completed','rematch_requested','rematch_started','room_ended'])
  })

  it('keeps retries and environments isolated', () => {
    expect(result.rawEvents.filter(item => item.eventName === 'room_join_failed')).toHaveLength(1)
    expect(result.rawEvents.some(item => item.eventId === 'prod-start')).toBe(false)
    expect(new Set(result.rawEvents.map(item => item.eventId)).size).toBe(result.rawEvents.length)
  })

  it('preserves session boundaries across midnight and replay/rematch IDs', () => {
    expect(Date.parse(at(61))).toBeGreaterThan(Date.parse(at(53)))
    expect(result.sessions.find(session => session.gameSessionId === 'game-charades-2')?.completedAt).toBeNull()
    expect(result.sessions.find(session => session.gameSessionId === 'game-multi-2')?.gameSessionId).not.toBe('game-multi-1')
  })

  it('contains no forbidden player content and stays within the one-percent gate', () => {
    expect(findPrivacyViolations(result.rawEvents)).toEqual([])
    for (const [metric, expected] of Object.entries({ gameStarts: 4, completions: 2, cardsPresented: 2, failedJoins: 1, replays: 1, rematches: 1 })) {
      expect(discrepancyPercent(expected, result.dashboard[metric as keyof typeof result.dashboard]), metric).toBeLessThanOrEqual(1)
    }
  })

  it('detects forbidden nested properties', () => {
    const unsafe = event('unsafe', 'card_presented', 40, { properties: { payload: { prompt_text: 'must not be stored' } } })
    expect(findPrivacyViolations([unsafe])).toEqual(['unsafe:properties.payload.prompt_text'])
    expect(findPrivacyViolations([event('unsafe-2','frontend_error',41,{properties:{credentials:{accessToken:'secret'}}})])).toEqual(['unsafe-2:properties.credentials','unsafe-2:properties.credentials.accessToken'])
  })
})
