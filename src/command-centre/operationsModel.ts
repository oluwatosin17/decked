export interface MultiplayerOperationsResponse {
  metrics:{rooms_created:number;successful_joins:number;rooms_started:number;lobby_to_start_rate:number;median_seconds_to_first_guest:number|null;median_seconds_to_start:number|null;games_started:number;games_completed:number;completion_rate:number;host_disconnects:number;host_handoffs:number;host_handoff_success_rate:number;realtime_failures:number;rematch_requests:number;rematches_started:number}
  join_failures:Array<{reason:string;occurrences:number}>;room_sizes:Array<{room_size:number;rooms:number}>;trend:Array<{metric_date:string;rooms_created:number;rooms_started:number;games_completed:number}>;refreshed_at:string|null;partial_warnings:string[];timeline_redacted:boolean
}
export interface ReliabilityOperationsResponse {
  metrics:{frontend_errors:number;rpc_failures:number;realtime_failures:number;affected_sessions:number;total_sessions:number|null;error_free_sessions:number|null;error_free_session_rate:number|null}
  groups:Array<{error_type:string;fingerprint:string;error_class:string;occurrences:number;affected_sessions:number;first_seen:string;last_seen:string}>
  trend:Array<{metric_date:string;frontend_errors:number;rpc_failures:number;realtime_failures:number}>
  breakdowns:{game:Breakdown[];browser:Breakdown[];device:Breakdown[];app_version:Breakdown[]};refreshed_at:string|null;partial_warnings:string[]
}
export interface Breakdown{value:string;occurrences:number}
export interface ReliabilityDimensionFilters{browser:string;appVersion:string}
export function operationsViewState(state:'loading'|'ready'|'error',activity:number|null){if(state!=='ready')return state;return activity&&activity>0?'data':'empty'}
export function safeGroupLabel(value:string){return /^[A-Za-z0-9._:+/-]{1,160}$/.test(value)?value:'redacted'}
export function parseReliabilityDimensionFilters(search:string):ReliabilityDimensionFilters{const params=new URLSearchParams(search);return{browser:(params.get('browser')??'').slice(0,80),appVersion:(params.get('version')??'').slice(0,100)}}
export function applyReliabilityDimensionFilters(params:URLSearchParams,filters:ReliabilityDimensionFilters){if(filters.browser)params.set('browser',filters.browser);else params.delete('browser');if(filters.appVersion)params.set('version',filters.appVersion);else params.delete('version');return params}
