import { GAME_REGISTRY, type GameId } from '../gameRegistry'

export interface GameAnalyticsRow {
  game_id: GameId
  game_views: number
  selections: number
  pass_and_play_starts: number
  multiplayer_starts: number
  unique_players: number
  first_card_rate: number
  completion_rate: number
  median_cards_played: number | null
  median_duration_seconds: number | null
  replay_rate: number
  trend_percent: number | null
}

export interface GamesAnalyticsResponse { rows: GameAnalyticsRow[]; refreshed_at: string | null; partial_warnings: string[] }
export interface GameDetailResponse {
  game_id: GameId
  trend: Array<{ metric_date: string; starts: number; completions: number }>
  mode_split: Array<{ play_mode: string; starts: number; completions: number; median_cards_played: number | null }>
  device_split: Array<{ device_class: string; sessions: number }>
  funnel: Array<{ step_name: string; step_order: number; count: number }>
  dimensions: Array<{ dimension_type: string; dimension_id: string; observations: number }>
  session_depth: Array<{ depth_bucket: string; sessions: number }>
  errors: Array<{ error_type: string; error_class: string; occurrences: number }>
  replay_behavior: { replays: number; rematches: number }
  refreshed_at: string | null
  partial_warnings: string[]
}

export type GameSortKey = keyof Pick<GameAnalyticsRow, 'game_views' | 'selections' | 'pass_and_play_starts' | 'multiplayer_starts' | 'unique_players' | 'first_card_rate' | 'completion_rate' | 'median_cards_played' | 'median_duration_seconds' | 'replay_rate' | 'trend_percent'> | 'name'
export const GAME_SORT_KEYS: readonly GameSortKey[] = ['name','game_views','selections','pass_and_play_starts','multiplayer_starts','unique_players','first_card_rate','completion_rate','median_cards_played','median_duration_seconds','replay_rate','trend_percent']
export function isGameSortKey(value: string | null): value is GameSortKey { return value !== null && GAME_SORT_KEYS.includes(value as GameSortKey) }

export function filterSortGames(rows: GameAnalyticsRow[], search: string, sortKey: GameSortKey, direction: 'asc' | 'desc', nameFor: (id: GameId) => string) {
  const query = search.trim().toLocaleLowerCase()
  return rows.filter(row => !query || nameFor(row.game_id).toLocaleLowerCase().includes(query) || row.game_id.includes(query)).sort((a, b) => {
    const left = sortKey === 'name' ? nameFor(a.game_id) : a[sortKey] ?? -1
    const right = sortKey === 'name' ? nameFor(b.game_id) : b[sortKey] ?? -1
    const compared = typeof left === 'string' ? left.localeCompare(String(right)) : Number(left) - Number(right)
    return direction === 'asc' ? compared : -compared
  })
}

function csvCell(value: string | number | null) {
  let text = value === null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function gamesCsv(rows: GameAnalyticsRow[], nameFor: (id: GameId) => string) {
  const headers = ['Game','Game ID','Views','Selections','Pass-and-play starts','Multiplayer starts','Unique players','First-card rate (%)','Completion rate (%)','Median cards','Median duration (seconds)','Replay/rematch rate (%)','Trend (%)']
  const body = rows.map(row => [nameFor(row.game_id),row.game_id,row.game_views,row.selections,row.pass_and_play_starts,row.multiplayer_starts,row.unique_players,row.first_card_rate,row.completion_rate,row.median_cards_played,row.median_duration_seconds,row.replay_rate,row.trend_percent].map(csvCell).join(','))
  return [headers.map(csvCell).join(','),...body].join('\n')
}

export function gamesViewState(state: 'loading' | 'ready' | 'error', rows: GameAnalyticsRow[] | null) {
  if (state !== 'ready') return state
  return rows?.some(row => row.game_views + row.selections + row.pass_and_play_starts + row.multiplayer_starts > 0) ? 'data' : 'empty'
}

export function gamesFilterCount(environment: string, playMode: string | undefined, trendDays: 7 | 30) {
  return Number(environment !== 'production') + Number(Boolean(playMode)) + Number(trendDays !== 7)
}

export function completeGameRows(rows:GameAnalyticsRow[]){const byId=new Map(rows.map(row=>[row.game_id,row]));return GAME_REGISTRY.map(({id})=>byId.get(id)??{game_id:id,game_views:0,selections:0,pass_and_play_starts:0,multiplayer_starts:0,unique_players:0,first_card_rate:0,completion_rate:0,median_cards_played:null,median_duration_seconds:null,replay_rate:0,trend_percent:null})}
