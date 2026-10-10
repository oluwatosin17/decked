import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../multiplayer/supabase'
import { completeDeviceBreakdown, normalizeOverview, type AcquisitionResponse, type DashboardFilters, type DeviceBreakdownResponse, type FunnelMetricsResponse, type GameMetricsResponse, type GeographyResponse, type MultiplayerMetricsResponse, type OverviewDashboardResponse, type OverviewTrendsResponse, type PlayPatternsResponse, type ReliabilityMetricsResponse, type RetentionResponse, type TrendGranularity } from './model'
import type { GameDetailResponse, GamesAnalyticsResponse } from './gamesModel'
import type { FunnelsResponse } from './funnelsModel'
import type { MultiplayerOperationsResponse, ReliabilityOperationsResponse } from './operationsModel'

export type StaffAccess = { authorized: true; role: 'admin' | 'editor' | 'viewer' } | { authorized: false; reason: string }

export async function restoreStaffSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signInStaff(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  return data.session
}

export async function signOutStaff() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestStaffPasswordReset(email: string) {
  const redirectTo = new URL('/command-centre', window.location.origin).toString()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
  if (error) throw error
}

export async function updateStaffPassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  return data.user
}

export function observeStaffSession(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session)).data.subscription
}

export async function getStaffAccess(): Promise<StaffAccess> {
  const { data, error } = await supabase.rpc('decked_get_command_centre_access')
  if (error) throw error
  if (data?.authorized === true && (data.role === 'admin' || data.role === 'editor' || data.role === 'viewer')) return data as StaffAccess
  return { authorized: false, reason: typeof data?.reason === 'string' ? data.reason : 'staff_access_required' }
}

export async function getOverview(filters: DashboardFilters) {
  const parameters = queryParameters(filters)
  const [metricsResult, gamesResult] = await Promise.all([
    supabase.rpc('decked_command_centre_metrics', { p_area: 'overview', ...parameters }),
    supabase.rpc('decked_command_centre_games', parameters),
  ])
  if (metricsResult.error) throw metricsResult.error
  if (gamesResult.error) throw gamesResult.error
  const metrics = metricsResult.data ?? {}
  const games = gamesResult.data as GameMetricsResponse | null
  return normalizeOverview({
    kpis: metrics,
    games: (games?.rows ?? []).map(row => ({ game_id: row.game_id, sessions: row.starts, completed: row.completions, completion_rate: row.completion_rate })),
    refreshed_at: metrics.refreshed_at ?? games?.refreshed_at ?? null,
  })
}

export async function getGameMetrics(filters: DashboardFilters) { return rpc<GameMetricsResponse>('decked_command_centre_games', queryParameters(filters)) }
export async function getFunnelMetrics(filters: DashboardFilters) { return rpc<FunnelMetricsResponse>('decked_command_centre_funnels', queryParameters(filters)) }
export async function getMultiplayerMetrics(filters: DashboardFilters) { return rpc<MultiplayerMetricsResponse>('decked_command_centre_metrics', { p_area: 'multiplayer', ...queryParameters(filters) }) }
export async function getReliabilityMetrics(filters: DashboardFilters) { return rpc<ReliabilityMetricsResponse>('decked_command_centre_metrics', { p_area: 'reliability', ...queryParameters(filters) }) }
export async function getOverviewDashboard(filters: DashboardFilters) { return rpc<OverviewDashboardResponse>('decked_command_centre_overview_v2', { ...queryParameters(filters), p_play_mode: filters.playMode || null }) }
export async function getOverviewTrends(filters:DashboardFilters,granularity:TrendGranularity){return rpc<OverviewTrendsResponse>('decked_command_centre_overview_trends',{...queryParameters(filters),p_play_mode:filters.playMode||null,p_granularity:granularity})}
export async function getRetentionCohorts(filters:DashboardFilters){return rpc<RetentionResponse>('decked_command_centre_retention',{p_environment:filters.environment,p_from:filters.from,p_to:filters.to})}
export async function getGeographyDashboard(filters:DashboardFilters){return rpc<GeographyResponse>('decked_command_centre_geography',{p_environment:filters.environment,p_from:filters.from,p_to:filters.to})}
export async function getDeviceBreakdown(filters:DashboardFilters){return completeDeviceBreakdown(await rpc<DeviceBreakdownResponse>('decked_command_centre_devices',{...queryParameters(filters),p_play_mode:filters.playMode||null}))}
export async function getAcquisitionDashboard(filters:DashboardFilters,source:string,landingPage:string,country:string){return rpc<AcquisitionResponse>('decked_command_centre_acquisition',{...queryParameters(filters),p_source:source||null,p_landing_page:landingPage||null,p_device_class:filters.deviceClass==='all'?null:filters.deviceClass,p_country:country||null})}
export async function getPlayPatternsDashboard(filters:DashboardFilters,country:string,timezone:string){return rpc<PlayPatternsResponse>('decked_command_centre_play_patterns',{...queryParameters(filters),p_play_mode:filters.playMode||null,p_device_class:filters.deviceClass==='all'?null:filters.deviceClass,p_country:country||null,p_timezone:timezone||null})}
export async function getGamesDashboard(filters: DashboardFilters, trendDays: 7 | 30) { return rpc<GamesAnalyticsResponse>('decked_command_centre_games_v2', { p_environment: filters.environment, p_from: filters.from, p_to: filters.to, p_play_mode: filters.playMode || null, p_trend_days: trendDays }) }
export async function getGameDetail(filters: DashboardFilters, gameId: string, trendDays: 7 | 30) { return rpc<GameDetailResponse>('decked_command_centre_game_detail', { p_environment: filters.environment, p_from: filters.from, p_to: filters.to, p_game_id: gameId, p_trend_days: trendDays }) }
export async function getFunnelsDashboard(filters: DashboardFilters, acquisitionSource: string, appVersion: string) { return rpc<FunnelsResponse>('decked_command_centre_funnels_v2', { ...queryParameters(filters), p_play_mode: filters.playMode || null, p_device_class: filters.deviceClass === 'all' ? null : filters.deviceClass, p_country: null, p_acquisition_source: acquisitionSource || null, p_app_version: appVersion || null }) }
export async function getMultiplayerDashboard(filters: DashboardFilters) { return rpc<MultiplayerOperationsResponse>('decked_command_centre_multiplayer_v2', queryParameters(filters)) }
export async function getReliabilityDashboard(filters: DashboardFilters, browser: string, appVersion: string) { return rpc<ReliabilityOperationsResponse>('decked_command_centre_reliability_v2', { ...queryParameters(filters), p_device_class: filters.deviceClass === 'all' ? null : filters.deviceClass, p_browser: browser || null, p_app_version: appVersion || null }) }
export interface ExportResult { filename:string;csv:string;row_count:number;generated_at:string;refreshed_at:string|null }
export async function exportCommandCentreCsv(report:'overview'|'games'|'funnels'|'multiplayer'|'reliability',filters:DashboardFilters,options:{source?:string;browser?:string;appVersion?:string;visibleGameIds?:string[];trendDays?:7|30}={}) {
  if(report==='games')return rpc<ExportResult>('decked_export_command_centre_games_csv',{p_environment:filters.environment,p_from:filters.from,p_to:filters.to,p_play_mode:filters.playMode||null,p_trend_days:options.trendDays??7,p_visible_game_ids:options.visibleGameIds??null,p_request_id:crypto.randomUUID()})
  return rpc<ExportResult>('decked_export_command_centre_csv',{p_report:report,p_environment:filters.environment,p_from:filters.from,p_to:filters.to,p_game_id:filters.gameId||null,p_play_mode:filters.playMode||null,p_device_class:filters.deviceClass==='all'?null:filters.deviceClass,p_acquisition_source:options.source||null,p_browser:options.browser||null,p_app_version:options.appVersion||null,p_visible_game_ids:options.visibleGameIds??null,p_request_id:crypto.randomUUID()})
}
export interface AuditResponse { rows:Array<{occurred_at:string;actor:string;actor_role:string;action:string;target_type:string|null;metadata_summary:string}>;truncated:boolean }
export async function getAuditLog(from:string,to:string,action:string){return rpc<AuditResponse>('decked_command_centre_audit_log',{p_from:from,p_to:to,p_action:action||null})}

export interface ContentCategoryCount { game_id:string;category_id:string;label:string;target_count:number;published_count:number;draft_count:number;archived_count:number }
export interface ContentItem { id:string;game_id:string;item_kind:'prompt'|'challenge'|'scenario'|'choice';lifecycle_status:'active'|'archived';current_version:number;published_version:number|null;source:'bundled_import'|'managed';updated_at:string;body:string;metadata:Record<string,unknown>;editorial_status:'draft'|'published'|'superseded';categories:Array<{category_id:string;enabled:boolean;sort_order:number}> }
export interface ContentCatalog { rows:ContentItem[];total:number;limit:number;offset:number }
export async function getContentCounts(){return rpc<{games:ContentCategoryCount[]}>('decked_command_centre_content_counts',{})}
export async function getContentCatalog(filters:{gameId?:string;categoryId?:string;status?:string;query?:string;limit?:number;offset?:number}){return rpc<ContentCatalog>('decked_command_centre_content_catalog',{p_game_id:filters.gameId||null,p_category_id:filters.categoryId||null,p_status:filters.status||null,p_query:filters.query||null,p_limit:filters.limit??100,p_offset:filters.offset??0})}
export async function getContentHistory(itemId:string){return rpc<{rows:Array<{version:number;status:string;created_at:string;change_note:string|null;body:string}>}>('decked_command_centre_content_history',{p_item_id:itemId})}
export async function saveContentItem(input:{itemId?:string;gameId:string;itemKind:ContentItem['item_kind'];body:string;metadata:Record<string,unknown>;categoryIds:string[];expectedVersion?:number;changeNote?:string}){return rpc<{id:string;version:number;status:'draft'}>('decked_command_centre_save_content_item',{p_item_id:input.itemId??null,p_game_id:input.gameId,p_item_kind:input.itemKind,p_body:input.body,p_metadata:input.metadata,p_category_ids:input.categoryIds,p_expected_version:input.expectedVersion??null,p_change_note:input.changeNote??null})}
export async function setContentArchived(itemId:string,archived:boolean,expectedVersion:number){return rpc<void>('decked_command_centre_set_content_archived',{p_item_id:itemId,p_archived:archived,p_expected_version:expectedVersion})}
export async function publishContent(gameId:string,notes?:string){return rpc<{release_id:string;game_id:string;item_count:number;membership_count:number;checksum:string}>('decked_command_centre_publish_content',{p_game_id:gameId,p_notes:notes??null})}

function queryParameters(filters: DashboardFilters) {
  return { p_environment: filters.environment, p_from: filters.from, p_to: filters.to, p_game_id: filters.gameId || null }
}

async function rpc<T>(name: string, parameters: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, parameters)
  if (error) throw error
  return data as T
}
