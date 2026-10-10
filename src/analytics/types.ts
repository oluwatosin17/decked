import type { MultiplayerGameId } from '../multiplayer/types'
import type { Screen } from '../navigation'

export type AnalyticsEnvironment = 'development' | 'preview' | 'production'
export type AnalyticsPlayMode = 'pass_and_play' | 'play_together'
export type AnalyticsDeviceClass = 'mobile' | 'tablet' | 'desktop' | 'unknown'
export type AnalyticsScalar = string | number | boolean
export type AnalyticsPropertyValue = AnalyticsScalar | readonly AnalyticsScalar[]
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue | undefined>

type GameContext = { game_id: MultiplayerGameId }
type PlayContext = GameContext & { play_mode: AnalyticsPlayMode }
type RoomContext = GameContext & { multiplayer_room_ref: string }

export interface AnalyticsEventProperties {
  app_opened: {
    initial_screen_id: Screen
    entry_path: string
    is_pwa: boolean
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
    referrer_domain?: string
    timezone?: string
    timezone_offset_minutes?: number
  }
  content_delivery_completed: GameContext & { content_source:'managed';release_id:string;item_count:number;fetch_duration_ms:number }
  content_delivery_failed: GameContext & { content_source:'bundled';fallback_reason:string;fetch_duration_ms:number }
  performance_measured: { metric_name:'ttfb'|'dom_content_loaded'|'load_complete';duration_ms:number;rating:'good'|'needs_improvement'|'poor' }
  screen_viewed: { screen_id: Screen; previous_screen_id?: Screen; game_id?: MultiplayerGameId }
  navigation_back_selected: {
    screen_id: Screen
    destination_screen_id: Screen
    game_id?: MultiplayerGameId
    lifecycle_stage?: string
  }
  browse_category_selected: { category_id: string; previous_category_id?: string; visible_game_count?: number }
  quick_play_viewed: { recommendation_set_id: string; recommended_game_ids: readonly MultiplayerGameId[] }
  quick_play_shuffled: {
    recommendation_set_id: string
    recommended_game_ids: readonly MultiplayerGameId[]
    shuffle_number: number
  }
  game_selected: GameContext & {
    selection_surface: string
    browse_category_id?: string
    recommendation_set_id?: string
    recommendation_position?: number
  }
  play_mode_selected: PlayContext
  game_setup_started: PlayContext & { initial_step: string; resumed?: false }
  game_setup_resumed: PlayContext & { restored_step: string }
  game_option_selected: GameContext & { option_type: string; option_ids: readonly string[]; selected_count?: number }
  deck_configured: GameContext & {
    requested_card_count: number
    actual_card_count: number
    built_in_card_count: number
    custom_card_count: number
    category_ids?: readonly string[]
    mode_ids?: readonly string[]
  }
  player_setup_completed: PlayContext & { player_count: number }
  game_started: PlayContext & { starting_step: string; configured_card_count: number; player_count: number }
  card_presented: PlayContext & {
    card_number: number
    configured_card_count: number
    content_source: 'built_in' | 'custom' | 'managed'
    category_id?: string
    content_item_id?: string
    release_id?: string
  }
  card_revealed: GameContext & { card_number: number }
  card_advanced: PlayContext & { from_card_number: number; to_card_number: number; advance_reason: string }
  game_completed: PlayContext & {
    completion_reason: string
    cards_presented: number
    cards_skipped: number
    duration_seconds: number
    rounds_completed?: number
    player_count?: number
  }
  game_replay_selected: PlayContext & { completed_game_session_id: string }
  game_session_abandoned: PlayContext & {
    last_lifecycle_stage: string
    last_step: string
    cards_presented: number
  }
  room_create_attempted: GameContext
  room_created: RoomContext
  room_create_failed: GameContext & { error_code: string; failure_stage: string }
  room_join_attempted: Record<string, never>
  room_joined: RoomContext & { room_player_count: number; is_rejoin: boolean; is_first_guest: boolean }
  room_join_failed: { failure_reason: string }
  multiplayer_setup_started: RoomContext & { room_player_count: number }
  multiplayer_game_started: RoomContext & { game_session_id: string; player_count: number }
  player_left_room: RoomContext & { room_status_at_exit: string; remaining_player_count: number }
  room_ended: RoomContext & { lifecycle_stage: string; player_count: number; room_age_seconds: number }
  rematch_requested: RoomContext & { request_count: number }
  rematch_started: RoomContext & {
    previous_game_session_id: string
    new_game_session_id: string
    request_count: number
    player_count: number
  }
  host_handoff_completed: RoomContext & { room_status: string; handoff_reason: string }
  host_disconnected: RoomContext & { room_status: string; offline_threshold_seconds: number }
  multiplayer_game_completed: RoomContext & {
    game_session_id: string
    cards_presented: number
    cards_skipped: number
    rounds_completed: number
    duration_seconds: number
    player_count: number
  }
  realtime_status_changed: {
    channel_type: string
    status: string
    game_id?: MultiplayerGameId
    multiplayer_room_ref?: string
    retry_count?: number
  }
  rpc_failed: {
    rpc_name: string
    error_code: string
    failure_class: string
    game_id?: MultiplayerGameId
    lifecycle_stage?: string
  }
  frontend_error: {
    error_fingerprint: string
    error_class: string
    screen_id: Screen
    browser_name?: string
    browser_major_version?: string
    game_id?: MultiplayerGameId
    lifecycle_stage?: string
    stack_fingerprint?: string
  }
}

export type AnalyticsEventName = keyof AnalyticsEventProperties

export interface AnalyticsEnvelope {
  event_id: string
  event_name: AnalyticsEventName
  schema_version: 1
  environment: AnalyticsEnvironment
  occurred_at: string
  analytics_user_id: string
  analytics_session_id: string
  game_session_id?: string
  multiplayer_room_ref?: string
  game_id?: MultiplayerGameId
  play_mode?: AnalyticsPlayMode
  app_version: string
  properties: Record<string, AnalyticsScalar | AnalyticsScalar[]>
}
