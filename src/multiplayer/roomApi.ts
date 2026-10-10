import { supabase } from './supabase'
import { track } from '../analytics'
import type { MultiplayerAnswer, MultiplayerGameId, MultiplayerPlayer, MultiplayerRoom, PromptType } from './types'

type RoomBundle = { room: MultiplayerRoom; players: MultiplayerPlayer[] }

export async function createRoom(displayName: string, gameId: MultiplayerGameId): Promise<RoomBundle> {
  track('room_create_attempted', { game_id: gameId })
  const { data, error } = await supabase.rpc('decked_create_room', { p_display_name: displayName.trim(), p_game_id: gameId })
  if (error) {
    track('room_create_failed', { game_id: gameId, error_code: safeAnalyticsErrorCode(error), failure_stage: 'rpc' })
    throw error
  }
  const bundle = data as RoomBundle
  void trackRoomSuccess('room_created', bundle, gameId)
  return bundle
}

export async function startMultiGame(roomId: string, totalCards: number, deckCount: number, settings: Record<string, string | number | boolean> = {}) {
  const { error } = await supabase.rpc('decked_start_multi_game', { p_room_id: roomId, p_total_cards: totalCards, p_deck_count: deckCount, p_settings: settings })
  throwTrackedRpcError(error, 'decked_start_multi_game')
}

export async function revealMultiCard(roomId: string) {
  const { error } = await supabase.rpc('decked_reveal_multi_card', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_reveal_multi_card')
}

export async function submitMultiAnswer(roomId: string, answer: MultiplayerAnswer) {
  const { error } = await supabase.rpc('decked_submit_multi_answer', { p_room_id: roomId, p_answer: answer })
  throwTrackedRpcError(error, 'decked_submit_multi_answer')
}

export async function advanceMultiGame(roomId: string) {
  const { error } = await supabase.rpc('decked_advance_multi_game', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_advance_multi_game')
}

export async function setSessionValue(roomId: string, key: string, value: unknown) {
  const { error } = await supabase.rpc('decked_set_session_value', { p_room_id: roomId, p_key: key, p_value: value })
  throwTrackedRpcError(error, 'decked_set_session_value')
}

export async function setCharadesDeck(roomId: string, deck: string[]) {
  const { error } = await supabase.rpc('decked_set_charades_deck', { p_room_id: roomId, p_deck: deck })
  throwTrackedRpcError(error, 'decked_set_charades_deck')
}

export async function getCharadesPrompt(roomId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('decked_get_charades_prompt', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_get_charades_prompt')
  return typeof data?.prompt === 'string' ? data.prompt : null
}

export async function touchRoom(roomId: string) {
  const { error } = await supabase.rpc('decked_touch_room', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_touch_room')
}

export async function requestRematch(roomId: string) {
  const { error } = await supabase.rpc('decked_request_rematch', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_request_rematch')
}

export async function clearRematchRequests(roomId: string) {
  const { error } = await supabase.rpc('decked_clear_rematch_requests', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_clear_rematch_requests')
}

export async function claimHost(roomId: string) {
  const { error } = await supabase.rpc('decked_claim_host', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_claim_host')
}

export async function joinRoom(code: string, displayName: string): Promise<RoomBundle> {
  track('room_join_attempted', {})
  const { data, error } = await supabase.rpc('decked_join_room', {
    p_code: code.trim().toUpperCase(), p_display_name: displayName.trim(),
  })
  if (error) {
    track('room_join_failed', { failure_reason: classifyJoinFailure(error) })
    throw error
  }
  const bundle = data as RoomBundle
  void trackRoomSuccess('room_joined', bundle, bundle.room.game_id)
  return bundle
}

export async function getRoomAnalyticsRef(roomId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('decked_get_room_analytics_ref', { p_room_id: roomId })
  if (error) return null
  return typeof data === 'string' ? data : null
}

async function trackRoomSuccess(kind: 'room_created' | 'room_joined', bundle: RoomBundle, gameId: MultiplayerGameId) {
  try {
    const roomRef = await getRoomAnalyticsRef(bundle.room.id)
    if (!roomRef) return
    if (kind === 'room_created') track('room_created', { game_id: gameId, multiplayer_room_ref: roomRef })
    else track('room_joined', { game_id: gameId, multiplayer_room_ref: roomRef, room_player_count: bundle.players.length, is_rejoin: false, is_first_guest: bundle.players.length === 2 })
  } catch {
    // Analytics enrichment must never affect successful gameplay.
  }
}

export function safeAnalyticsErrorCode(error: { code?: string }) {
  return /^[A-Za-z0-9_.-]{1,64}$/.test(error.code ?? '') ? error.code! : 'unknown'
}

export function throwTrackedRpcError(error: { code?: string } | null, rpcName: string): void {
  if (!error) return
  track('rpc_failed', {
    rpc_name: rpcName,
    error_code: safeAnalyticsErrorCode(error),
    failure_class: 'rpc_rejected',
  })
  throw error
}

export function classifyJoinFailure(error: { message?: string }) {
  const message = (error.message ?? '').toLowerCase()
  if (message.includes('expired') || message.includes('not found')) return 'not_found_or_expired'
  if (message.includes('already started')) return 'already_started'
  if (message.includes('full')) return 'room_full'
  if (message.includes('name')) return 'invalid_display_name'
  if (message.includes('session')) return 'authentication_required'
  return 'rpc_rejected'
}

export async function getRoom(roomId: string): Promise<RoomBundle> {
  const [{ data: room, error: roomError }, { data: players, error: playersError }] = await Promise.all([
    supabase.from('decked_rooms').select('*').eq('id', roomId).single(),
    supabase.from('decked_room_players').select('*').eq('room_id', roomId).order('position'),
  ])
  if (roomError) throw roomError
  if (playersError) throw playersError
  return { room: room as MultiplayerRoom, players: players as MultiplayerPlayer[] }
}

export async function startRoom(roomId: string, totalCards: number, truthCount: number, dareCount: number) {
  const { error } = await supabase.rpc('decked_start_room', {
    p_room_id: roomId,
    p_total_cards: totalCards,
    p_truth_count: truthCount,
    p_dare_count: dareCount,
  })
  throwTrackedRpcError(error, 'decked_start_room')
}


export async function choosePrompt(roomId: string, type: PromptType) {
  const { error } = await supabase.rpc('decked_choose_prompt', { p_room_id: roomId, p_prompt_type: type })
  throwTrackedRpcError(error, 'decked_choose_prompt')
}

export async function advanceTurn(roomId: string) {
  const { error } = await supabase.rpc('decked_advance_turn', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_advance_turn')
}

export async function leaveRoom(roomId: string) {
  const { error } = await supabase.rpc('decked_leave_room', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_leave_room')
}

export async function endRoom(roomId: string) {
  const { error } = await supabase.rpc('decked_end_room', { p_room_id: roomId })
  throwTrackedRpcError(error, 'decked_end_room')
}
