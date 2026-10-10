import type { MultiplayerGameId } from '../multiplayer/types'
import { GAME_IDS } from '../gameRegistry'
import type {
  AnalyticsDeviceClass,
  AnalyticsEnvironment,
  AnalyticsEventName,
  AnalyticsProperties,
  AnalyticsPropertyValue,
} from './types'

const GAME_ID_SET = new Set<MultiplayerGameId>(GAME_IDS)

const EVENT_FIELDS = {
  app_opened: ['initial_screen_id', 'entry_path', 'is_pwa', 'device_class', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer_domain', 'timezone', 'timezone_offset_minutes'],
  content_delivery_completed: ['game_id','content_source','release_id','item_count','fetch_duration_ms'],
  content_delivery_failed: ['game_id','content_source','fallback_reason','fetch_duration_ms'],
  performance_measured: ['metric_name','duration_ms','rating'],
  screen_viewed: ['screen_id', 'previous_screen_id', 'game_id'],
  navigation_back_selected: ['screen_id', 'destination_screen_id', 'game_id', 'lifecycle_stage'],
  browse_category_selected: ['category_id', 'previous_category_id', 'visible_game_count'],
  quick_play_viewed: ['recommendation_set_id', 'recommended_game_ids'],
  quick_play_shuffled: ['recommendation_set_id', 'recommended_game_ids', 'shuffle_number'],
  game_selected: ['game_id', 'selection_surface', 'browse_category_id', 'recommendation_set_id', 'recommendation_position'],
  play_mode_selected: ['game_id', 'play_mode'],
  game_setup_started: ['game_id', 'play_mode', 'initial_step', 'resumed'],
  game_setup_resumed: ['game_id', 'play_mode', 'restored_step'],
  game_option_selected: ['game_id', 'option_type', 'option_ids', 'selected_count'],
  deck_configured: ['game_id', 'requested_card_count', 'actual_card_count', 'built_in_card_count', 'custom_card_count', 'category_ids', 'mode_ids'],
  player_setup_completed: ['game_id', 'player_count', 'play_mode'],
  game_started: ['game_id', 'play_mode', 'starting_step', 'configured_card_count', 'player_count'],
  card_presented: ['game_id', 'play_mode', 'card_number', 'configured_card_count', 'content_source', 'category_id'],
  card_revealed: ['game_id', 'card_number'],
  card_advanced: ['game_id', 'play_mode', 'from_card_number', 'to_card_number', 'advance_reason'],
  game_completed: ['game_id', 'play_mode', 'completion_reason', 'cards_presented', 'cards_skipped', 'duration_seconds', 'rounds_completed', 'player_count'],
  game_replay_selected: ['completed_game_session_id', 'game_id', 'play_mode'],
  game_session_abandoned: ['game_id', 'play_mode', 'last_lifecycle_stage', 'last_step', 'cards_presented'],
  room_create_attempted: ['game_id'], room_created: ['game_id', 'multiplayer_room_ref'],
  room_create_failed: ['game_id', 'error_code', 'failure_stage'], room_join_attempted: [],
  room_joined: ['multiplayer_room_ref', 'game_id', 'room_player_count', 'is_rejoin', 'is_first_guest'],
  room_join_failed: ['failure_reason'], multiplayer_setup_started: ['multiplayer_room_ref', 'game_id', 'room_player_count'],
  multiplayer_game_started: ['multiplayer_room_ref', 'game_session_id', 'game_id', 'player_count'],
  player_left_room: ['multiplayer_room_ref', 'game_id', 'room_status_at_exit', 'remaining_player_count'],
  room_ended: ['multiplayer_room_ref', 'game_id', 'lifecycle_stage', 'player_count', 'room_age_seconds'],
  rematch_requested: ['multiplayer_room_ref', 'game_id', 'request_count'],
  rematch_started: ['multiplayer_room_ref', 'game_id', 'previous_game_session_id', 'new_game_session_id', 'request_count', 'player_count'],
  host_handoff_completed: ['multiplayer_room_ref', 'game_id', 'room_status', 'handoff_reason'],
  host_disconnected: ['multiplayer_room_ref', 'game_id', 'room_status', 'offline_threshold_seconds'],
  multiplayer_game_completed: ['multiplayer_room_ref', 'game_session_id', 'game_id', 'cards_presented', 'cards_skipped', 'rounds_completed', 'duration_seconds', 'player_count'],
  realtime_status_changed: ['channel_type', 'status', 'game_id', 'multiplayer_room_ref', 'retry_count'],
  rpc_failed: ['rpc_name', 'error_code', 'failure_class', 'game_id', 'lifecycle_stage'],
  frontend_error: ['error_fingerprint', 'error_class', 'screen_id', 'browser_name', 'browser_major_version', 'game_id', 'lifecycle_stage', 'stack_fingerprint'],
} as const satisfies Record<AnalyticsEventName, readonly string[]>

const REQUIRED_FIELDS: Partial<Record<AnalyticsEventName, readonly string[]>> = {
  app_opened: ['initial_screen_id', 'entry_path', 'is_pwa', 'device_class'], screen_viewed: ['screen_id'],
  content_delivery_completed: ['game_id','content_source','release_id','item_count','fetch_duration_ms'],
  content_delivery_failed: ['game_id','content_source','fallback_reason','fetch_duration_ms'],
  performance_measured: ['metric_name','duration_ms','rating'],
  navigation_back_selected: ['screen_id', 'destination_screen_id'], browse_category_selected: ['category_id'],
  quick_play_viewed: ['recommendation_set_id', 'recommended_game_ids'], quick_play_shuffled: ['recommendation_set_id', 'recommended_game_ids', 'shuffle_number'],
  game_selected: ['game_id', 'selection_surface'], play_mode_selected: ['game_id', 'play_mode'],
  game_setup_started: ['game_id', 'play_mode', 'initial_step'], game_setup_resumed: ['game_id', 'play_mode', 'restored_step'],
  game_option_selected: ['game_id', 'option_type', 'option_ids'], deck_configured: ['game_id', 'requested_card_count', 'actual_card_count', 'built_in_card_count', 'custom_card_count'],
  player_setup_completed: ['game_id', 'player_count', 'play_mode'], game_started: ['game_id', 'play_mode', 'starting_step', 'configured_card_count', 'player_count'],
  card_presented: ['game_id', 'play_mode', 'card_number', 'configured_card_count', 'content_source'], card_revealed: ['game_id', 'card_number'],
  card_advanced: ['game_id', 'play_mode', 'from_card_number', 'to_card_number', 'advance_reason'], game_completed: ['game_id', 'play_mode', 'completion_reason', 'cards_presented', 'cards_skipped', 'duration_seconds'],
  game_replay_selected: ['completed_game_session_id', 'game_id', 'play_mode'], game_session_abandoned: ['game_id', 'play_mode', 'last_lifecycle_stage', 'last_step', 'cards_presented'],
  room_create_attempted: ['game_id'], room_created: ['game_id', 'multiplayer_room_ref'], room_create_failed: ['game_id', 'error_code', 'failure_stage'],
  room_joined: ['multiplayer_room_ref', 'game_id', 'room_player_count', 'is_rejoin', 'is_first_guest'], room_join_failed: ['failure_reason'],
  multiplayer_setup_started: ['multiplayer_room_ref', 'game_id', 'room_player_count'], multiplayer_game_started: ['multiplayer_room_ref', 'game_session_id', 'game_id', 'player_count'],
  player_left_room: ['multiplayer_room_ref', 'game_id', 'room_status_at_exit', 'remaining_player_count'], room_ended: ['multiplayer_room_ref', 'game_id', 'lifecycle_stage', 'player_count', 'room_age_seconds'],
  rematch_requested: ['multiplayer_room_ref', 'game_id', 'request_count'], rematch_started: ['multiplayer_room_ref', 'game_id', 'previous_game_session_id', 'new_game_session_id', 'request_count', 'player_count'],
  host_handoff_completed: ['multiplayer_room_ref', 'game_id', 'room_status', 'handoff_reason'], host_disconnected: ['multiplayer_room_ref', 'game_id', 'room_status', 'offline_threshold_seconds'],
  multiplayer_game_completed: ['multiplayer_room_ref', 'game_session_id', 'game_id', 'cards_presented', 'cards_skipped', 'rounds_completed', 'duration_seconds', 'player_count'],
  realtime_status_changed: ['channel_type', 'status'], rpc_failed: ['rpc_name', 'error_code', 'failure_class'], frontend_error: ['error_fingerprint', 'error_class', 'screen_id'],
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const UUID_FIELDS = new Set(['game_session_id', 'completed_game_session_id', 'previous_game_session_id', 'new_game_session_id', 'multiplayer_room_ref','release_id','content_item_id'])
const NON_NEGATIVE_NUMBER_FIELDS = new Set([
  'visible_game_count', 'shuffle_number', 'recommendation_position', 'selected_count',
  'requested_card_count', 'actual_card_count', 'built_in_card_count', 'custom_card_count',
  'player_count', 'configured_card_count', 'card_number', 'from_card_number', 'to_card_number',
  'cards_presented', 'cards_skipped', 'duration_seconds', 'rounds_completed', 'room_player_count',
  'remaining_player_count', 'room_age_seconds', 'request_count', 'offline_threshold_seconds', 'retry_count',
  'item_count','fetch_duration_ms','duration_ms',
])
const BOOLEAN_FIELDS = new Set(['is_pwa', 'resumed', 'is_rejoin', 'is_first_guest'])
const ARRAY_FIELDS = new Set(['recommended_game_ids', 'option_ids', 'category_ids', 'mode_ids'])
const FORBIDDEN_KEY = /^(display_?name|room_?code|prompt(_?text)?|question(_?text)?|answer(_?text)?|custom_?card(_?text)?|statement(_?text)?|truth(_?text)?|bluff(_?text)?|email|phone|.*token.*|password|secret|credential)$/i
const PUBLIC_ROOM_CODE = /^[A-Z2-9]{6}$/
const STABLE_VALUE = /^[A-Za-z0-9][A-Za-z0-9._:/+-]{0,255}$/

export function isAnalyticsEnvironment(value: string): value is AnalyticsEnvironment {
  return value === 'development' || value === 'preview' || value === 'production'
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export function isGameId(value: unknown): value is MultiplayerGameId {
  return typeof value === 'string' && GAME_ID_SET.has(value as MultiplayerGameId)
}

export function deviceClassForWidth(width: number | undefined): AnalyticsDeviceClass {
  if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) return 'unknown'
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function validValue(key: string, value: AnalyticsPropertyValue): boolean {
  if (ARRAY_FIELDS.has(key)) {
    return Array.isArray(value) && value.length <= 50
      && value.every(item => typeof item === 'string' && item.length > 0 && item.length <= 128)
      && value.every(item => !PUBLIC_ROOM_CODE.test(String(item)) && STABLE_VALUE.test(String(item)))
      && (key !== 'recommended_game_ids' || value.every(isGameId))
  }
  if (Array.isArray(value)) return false
  if (UUID_FIELDS.has(key)) return isUuid(value)
  if (key === 'game_id') return isGameId(value)
  if (key === 'play_mode') return value === 'pass_and_play' || value === 'play_together'
  if (key === 'device_class') return ['mobile', 'tablet', 'desktop', 'unknown'].includes(String(value))
  if (key === 'content_source') return value === 'built_in' || value === 'custom' || value === 'managed' || value === 'bundled'
  if (BOOLEAN_FIELDS.has(key)) return typeof value === 'boolean'
  if (NON_NEGATIVE_NUMBER_FIELDS.has(key)) return typeof value === 'number' && Number.isFinite(value) && value >= 0
  if (typeof value !== 'string' || PUBLIC_ROOM_CODE.test(value)) return false
  if (key === 'entry_path') return /^\/[A-Za-z0-9/_-]*$/.test(value)
  if (key === 'referrer_domain') return /^(?:[a-z0-9](?:[a-z0-9-]{0,62})\.)+[a-z]{2,63}$/i.test(value)
  return STABLE_VALUE.test(value)
}

export function validateEventProperties(name: AnalyticsEventName, input: unknown): string | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'properties_not_object'
  const properties = input as AnalyticsProperties
  const allowed = new Set<string>(EVENT_FIELDS[name])
  if (!allowed) return 'unknown_event'
  const entries = Object.entries(properties).filter(([, value]) => value !== undefined)
  if (entries.length > 32) return 'too_many_properties'
  for (const [key, value] of entries) {
    if (FORBIDDEN_KEY.test(key)) return 'forbidden_property'
    if (!allowed.has(key)) return 'unknown_property'
    if (!validValue(key, value as AnalyticsPropertyValue)) return 'invalid_property_value'
  }
  for (const required of REQUIRED_FIELDS[name] ?? []) {
    if (properties[required] === undefined) return 'missing_required_property'
  }
  return null
}

export function sanitizeProperties(input: AnalyticsProperties) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Record<string, string | number | boolean | (string | number | boolean)[]>
}
