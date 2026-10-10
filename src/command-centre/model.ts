export const COMMAND_CENTRE_SECTIONS = ['overview', 'acquisition', 'games', 'funnels', 'multiplayer', 'geography', 'reliability', 'content', 'settings'] as const
export type CommandCentreSection = typeof COMMAND_CENTRE_SECTIONS[number]

export interface OverviewData {
  kpis: { active_players: number; game_sessions: number; completed_sessions: number; completion_rate: number; multiplayer_sessions: number }
  games: Array<{ game_id: string; sessions: number; completed: number; completion_rate: number }>
  refreshed_at?: string | null
}

export interface GameMetricsResponse { rows: Array<{ game_id: string; setups: number; starts: number; completions: number; cards_presented: number; setup_to_first_card_rate: number; completion_rate: number; median_completed_duration_seconds: number | null }>; refreshed_at: string | null }
export interface FunnelMetricsResponse { rows: Array<{ funnel_name: string; step_name: string; step_order: number; count: number }>; refreshed_at: string | null }
export interface MultiplayerMetricsResponse { rooms_created: number; successful_joins: number; games_started: number; games_completed: number; host_disconnects: number; host_handoffs: number; rematch_requests: number; rematch_starts: number; refreshed_at: string | null }
export interface ReliabilityMetricsResponse { rpc_failures: number; frontend_errors: number; realtime_failures: number; app_opens: number; refreshed_at: string | null }

export interface DashboardFilters { environment: 'development' | 'preview' | 'production'; from: string; to: string; gameId: string; playMode?: '' | 'pass_and_play' | 'play_together'; deviceClass?: 'all' | 'mobile' | 'tablet' | 'desktop' | 'unknown'; comparison?: 'previous_period' }

export interface OverviewMetricSet {
  daily_active: number; weekly_active: number; monthly_active: number; new_players: number; returning_players: number
  game_starts: number; completions: number; cards_played: number; replays: number
  median_session_duration_seconds: number | null; rooms_created: number; rooms_started: number; eligible_rooms: number
  rematch_starts: number; sessions: number; error_sessions: number
}
export interface OverviewDashboardResponse {
  current: OverviewMetricSet; previous: OverviewMetricSet
  trend: Array<{ metric_date: string; starts: number; completions: number }>
  top_games: Array<{ game_id: string; starts: number; completions: number; completion_rate: number }>
  refreshed_at: string | null; partial_warnings: string[]
}
export type TrendGranularity = 'day'|'week'|'month'|'year'
export interface OverviewTrendsResponse {
  granularity: TrendGranularity
  series: Array<{bucket_start:string;bucket_end:string;active_players:number;game_starts:number;completions:number;cards_played:number}>
  duration_histogram: Array<{bucket:string;sessions:number}>
  refreshed_at:string|null
  partial_warnings:string[]
}
export interface RetentionResponse {
  summary:{d1_rate:number|null;d7_rate:number|null;d30_rate:number|null}
  daily:Array<{cohort_date:string;cohort_size:number;d1_retained:number|null;d7_retained:number|null;d30_retained:number|null;d1_rate:number|null;d7_rate:number|null;d30_rate:number|null}>
  weekly:Array<{cohort_start:string;cohort_size:number;retained:number;retention_rate:number}>
  monthly:Array<{cohort_start:string;cohort_size:number;retained:number;retention_rate:number}>
  refreshed_at:string|null
}
export interface GeographyResponse {
  summary:{countries_reached:number;located_players:number;total_players:number;international_players:number}
  countries:Array<{country_code:string;active_players:number;new_players:number;returning_players:number;sessions:number;game_starts:number;completions:number;completion_rate:number;rooms_created:number}>
  daily:Array<{metric_date:string;country_code:string;active_players:number}>
  refreshed_at:string|null
}
export interface DeviceBreakdownResponse {
  devices:Array<{device_class:'mobile'|'tablet'|'desktop'|'unknown';active_players:number;sessions:number;game_starts:number;completions:number}>
  access_modes:Array<{access_mode:'browser'|'pwa'|'unknown';active_players:number;sessions:number;game_starts:number;completions:number}>
  refreshed_at:string|null
  partial_warnings:string[]
}
export interface AcquisitionResponse {
  summary:{visitors:number;sessions:number;ai_visitors:number;game_selections:number;game_starts:number;completions:number}
  sources:Array<{source:string;visitors:number;new_visitors:number;returning_visitors:number;sessions:number;game_selections:number;game_starts:number;first_cards:number;completions:number;selection_rate:number;start_rate:number;completion_rate:number;median_seconds_to_start:number|null;top_landing_page:string|null;top_game_id:string|null}>
  landing_pages:Array<{landing_page:string;visitors:number;sessions:number;game_selections:number;game_starts:number;completions:number}>
  games:Array<{source:string;game_id:string;selections:number;game_starts:number;completions:number}>
  daily:Array<{metric_date:string;source:string;visitors:number;sessions:number;game_starts:number;completions:number}>
  refreshed_at:string|null
  partial_warnings:string[]
}

const DEVICE_CLASSES = ['mobile','tablet','desktop','unknown'] as const
const ACCESS_MODES = ['browser','pwa','unknown'] as const

export function completeDeviceBreakdown(value:DeviceBreakdownResponse|null):DeviceBreakdownResponse|null {
  if(!value)return null
  const devices=DEVICE_CLASSES.map(device_class=>value.devices.find(row=>row.device_class===device_class)??{device_class,active_players:0,sessions:0,game_starts:0,completions:0})
  const access_modes=ACCESS_MODES.map(access_mode=>value.access_modes.find(row=>row.access_mode===access_mode)??{access_mode,active_players:0,sessions:0,game_starts:0,completions:0})
  return {...value,devices,access_modes}
}

export type DashboardRequestState = 'loading' | 'ready' | 'error'

export function overviewDashboardViewState(request: DashboardRequestState, data: OverviewDashboardResponse | null) {
  if (request === 'loading') return 'loading' as const
  if (request === 'error') return 'error' as const
  if (!data) return 'empty' as const
  const current = data.current
  return current.daily_active > 0 || current.game_starts > 0 || current.completions > 0 || current.cards_played > 0
    || current.rooms_created > 0 || current.rooms_started > 0 || current.sessions > 0
    ? 'data' as const : 'empty' as const
}

export function comparisonDescription(value: number | null, previous: number | null, sample: number) {
  if (sample < 20) return 'Small sample; comparison withheld'
  if (value === null || previous === null) return 'Comparison unavailable'
  const delta = comparisonDelta(value, previous)
  if (delta === null) return 'No prior-period baseline'
  return `${Math.abs(delta).toFixed(1)}% ${delta >= 0 ? 'higher' : 'lower'} than previous period`
}

export function serializeDashboardFilters(filters: DashboardFilters) {
  const params = new URLSearchParams({ from: filters.from, to: filters.to, env: filters.environment, compare: filters.comparison ?? 'previous_period' })
  if (filters.gameId) params.set('game', filters.gameId)
  if (filters.playMode) params.set('mode', filters.playMode)
  if (filters.deviceClass && filters.deviceClass !== 'all') params.set('device', filters.deviceClass)
  return params.toString()
}

export function parseDashboardFilters(search: string, fallback: DashboardFilters): DashboardFilters {
  const params = new URLSearchParams(search)
  const environment = params.get('env')
  const playMode = params.get('mode')
  const device = params.get('device')
  return {
    ...fallback,
    from: /^\d{4}-\d{2}-\d{2}$/.test(params.get('from') ?? '') ? params.get('from')! : fallback.from,
    to: /^\d{4}-\d{2}-\d{2}$/.test(params.get('to') ?? '') ? params.get('to')! : fallback.to,
    environment: environment === 'development' || environment === 'preview' || environment === 'production' ? environment : fallback.environment,
    gameId: params.get('game') ?? '',
    playMode: playMode === 'pass_and_play' || playMode === 'play_together' ? playMode : '',
    deviceClass: device === 'mobile' || device === 'tablet' || device === 'desktop' || device === 'unknown' ? device : 'all', comparison: 'previous_period',
  }
}

export function formatMetric(value: number | null, kind: 'number' | 'percent' | 'duration' | 'decimal' = 'number') {
  if (value === null || !Number.isFinite(value)) return '—'
  if (kind === 'percent') return `${value.toFixed(1)}%`
  if (kind === 'duration') { const minutes = Math.floor(value / 60); const seconds = Math.round(value % 60); return minutes ? `${minutes}m ${seconds}s` : `${seconds}s` }
  if (kind === 'decimal') return value.toFixed(1)
  return Math.round(value).toLocaleString()
}

export function percentage(numerator: number, denominator: number) { return denominator > 0 ? 100 * numerator / denominator : 0 }
export function comparisonDelta(current: number, previous: number) { return previous > 0 ? 100 * (current - previous) / previous : current > 0 ? null : 0 }

export function filterDateLabel(from:string,to:string){const date=(value:string)=>new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});return `${date(from)}–${date(to)}`}

export function formatTrendBucketLabel(value:string,granularity:TrendGranularity,index:number){
  const date=new Date(`${value}T00:00:00Z`)
  if(granularity==='day')return date.toLocaleDateString(undefined,{weekday:'short',day:'numeric',timeZone:'UTC'})
  if(granularity==='week')return `Week ${index+1} · ${date.toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'})}`
  if(granularity==='month')return date.toLocaleDateString(undefined,{month:'short',year:'numeric',timeZone:'UTC'})
  return date.toLocaleDateString(undefined,{year:'numeric',timeZone:'UTC'})
}

export function trendLabelIndexes(length:number,granularity:TrendGranularity){
  if(length<=0)return []
  const visibleLimit=granularity==='month'||granularity==='year'?12:granularity==='week'?13:10
  const stride=length<=visibleLimit?1:Math.ceil((length-1)/(visibleLimit-1))
  return Array.from({length},(_,index)=>index).filter(index=>index%stride===0||index===length-1)
}

export function sectionFromPath(pathname: string): CommandCentreSection {
  const candidate = pathname.replace(/\/+$/, '').split('/')[2]
  return COMMAND_CENTRE_SECTIONS.includes(candidate as CommandCentreSection) ? candidate as CommandCentreSection : 'overview'
}

export function isCommandCentrePath(pathname: string) {
  return pathname === '/command-centre' || pathname.startsWith('/command-centre/')
}

export function commandCentrePath(section: CommandCentreSection) {
  return section === 'overview' ? '/command-centre' : `/command-centre/${section}`
}

export function normalizeOverview(value: unknown): OverviewData {
  const input = value && typeof value === 'object' ? value as Partial<OverviewData> : {}
  const kpis = input.kpis ?? { active_players: 0, game_sessions: 0, completed_sessions: 0, completion_rate: 0, multiplayer_sessions: 0 }
  return { kpis, games: Array.isArray(input.games) ? input.games : [], refreshed_at: input.refreshed_at }
}

export function overviewViewState(request: 'loading' | 'ready' | 'error', data: OverviewData | null) {
  if (request === 'loading') return 'loading' as const
  if (request === 'error') return 'error' as const
  return data && data.kpis.game_sessions > 0 ? 'data' as const : 'empty' as const
}
