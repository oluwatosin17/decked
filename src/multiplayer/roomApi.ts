import { supabase } from './supabase'
import type { MultiplayerAnswer, MultiplayerGameId, MultiplayerPlayer, MultiplayerRoom, PromptType } from './types'

type RoomBundle = { room: MultiplayerRoom; players: MultiplayerPlayer[] }

export async function createRoom(displayName: string, gameId: MultiplayerGameId): Promise<RoomBundle> {
  const { data, error } = await supabase.rpc('decked_create_room', { p_display_name: displayName.trim(), p_game_id: gameId })
  if (error) throw error
  return data as RoomBundle
}

export async function startMultiGame(roomId: string, totalCards: number, deckCount: number, settings: Record<string, string | number | boolean> = {}) {
  const { error } = await supabase.rpc('decked_start_multi_game', { p_room_id: roomId, p_total_cards: totalCards, p_deck_count: deckCount, p_settings: settings })
  if (error) throw error
}

export async function revealMultiCard(roomId: string) {
  const { error } = await supabase.rpc('decked_reveal_multi_card', { p_room_id: roomId })
  if (error) throw error
}

export async function submitMultiAnswer(roomId: string, answer: MultiplayerAnswer) {
  const { error } = await supabase.rpc('decked_submit_multi_answer', { p_room_id: roomId, p_answer: answer })
  if (error) throw error
}

export async function advanceMultiGame(roomId: string) {
  const { error } = await supabase.rpc('decked_advance_multi_game', { p_room_id: roomId })
  if (error) throw error
}

export async function setSessionValue(roomId: string, key: string, value: unknown) {
  const { error } = await supabase.rpc('decked_set_session_value', { p_room_id: roomId, p_key: key, p_value: value })
  if (error) throw error
}

export async function setCharadesDeck(roomId: string, deck: string[]) {
  const { error } = await supabase.rpc('decked_set_charades_deck', { p_room_id: roomId, p_deck: deck })
  if (error) throw error
}

export async function getCharadesPrompt(roomId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('decked_get_charades_prompt', { p_room_id: roomId })
  if (error) throw error
  return typeof data?.prompt === 'string' ? data.prompt : null
}

export async function touchRoom(roomId: string) {
  const { error } = await supabase.rpc('decked_touch_room', { p_room_id: roomId })
  if (error) throw error
}

export async function requestRematch(roomId: string) {
  const { error } = await supabase.rpc('decked_request_rematch', { p_room_id: roomId })
  if (error) throw error
}

export async function clearRematchRequests(roomId: string) {
  const { error } = await supabase.rpc('decked_clear_rematch_requests', { p_room_id: roomId })
  if (error) throw error
}

export async function claimHost(roomId: string) {
  const { error } = await supabase.rpc('decked_claim_host', { p_room_id: roomId })
  if (error) throw error
}

export async function joinRoom(code: string, displayName: string): Promise<RoomBundle> {
  const { data, error } = await supabase.rpc('decked_join_room', {
    p_code: code.trim().toUpperCase(), p_display_name: displayName.trim(),
  })
  if (error) throw error
  return data as RoomBundle
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
  if (error) throw error
}


export async function choosePrompt(roomId: string, type: PromptType) {
  const { error } = await supabase.rpc('decked_choose_prompt', { p_room_id: roomId, p_prompt_type: type })
  if (error) throw error
}

export async function advanceTurn(roomId: string) {
  const { error } = await supabase.rpc('decked_advance_turn', { p_room_id: roomId })
  if (error) throw error
}

export async function leaveRoom(roomId: string) {
  const { error } = await supabase.rpc('decked_leave_room', { p_room_id: roomId })
  if (error) throw error
}

export async function endRoom(roomId: string) {
  const { error } = await supabase.rpc('decked_end_room', { p_room_id: roomId })
  if (error) throw error
}
