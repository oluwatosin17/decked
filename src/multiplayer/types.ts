import type { GameId } from '../gameRegistry'

export type RoomStatus = 'lobby' | 'playing' | 'finished'
export type PromptType = 'truth' | 'dare'
export type MultiplayerGameId = GameId
export type MultiplayerAnswer = 'have' | 'never' | 'red' | 'depends' | 'green'

export interface MultiplayerGameState {
  used?: number[]
  revealed?: boolean
  answers?: Record<string, MultiplayerAnswer>
  settings?: Record<string, string | number | boolean>
  session?: Record<string, unknown>
}

export interface MultiplayerRoom {
  id: string
  code: string
  game_id: MultiplayerGameId
  host_user_id: string
  status: RoomStatus
  current_player_index: number
  card_index: number
  total_cards: number
  truth_deck_size: number
  dare_deck_size: number
  prompt_type: PromptType | null
  prompt_index: number | null
  deck_size: number
  deck_count: number
  game_state: MultiplayerGameState
  rematch_requests: string[]
  version: number
  created_at: string
  expires_at: string
}

export interface MultiplayerPlayer {
  id: string
  room_id: string
  user_id: string
  display_name: string
  color: string
  position: number
  score: number
  last_seen_at: string
  created_at: string
}
