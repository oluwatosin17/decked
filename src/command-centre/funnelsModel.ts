export interface FunnelStep { step_order:number; step_name:string; entrants:number; conversion_from_previous:number; conversion_from_first:number; median_seconds_from_previous:number|null }
export interface FunnelReport { funnel_id:'discovery'|'multiplayer_host'|'multiplayer_guest'; name:string; steps:FunnelStep[] }
export interface FunnelsResponse {
  funnels:FunnelReport[]
  rules:{conversion_window_hours:number;ordering:string;repeat_handling:string;timezone:string;first_card_note:string}
  refreshed_at:string|null
  available_filters:{country:boolean;device_class:boolean;acquisition_source:boolean;app_version:boolean}
}

export interface TimedStep { name:string; occurredAt:string }
export interface FunnelDimensionFilters { source:string;appVersion:string }

export function parseFunnelDimensionFilters(search:string):FunnelDimensionFilters {
  const params=new URLSearchParams(search)
  return {source:(params.get('source')??'').slice(0,100),appVersion:(params.get('version')??'').slice(0,100)}
}

export function applyFunnelDimensionFilters(params:URLSearchParams,{source,appVersion}:FunnelDimensionFilters) {
  if(source)params.set('source',source);else params.delete('source')
  if(appVersion)params.set('version',appVersion);else params.delete('version')
  return params
}

export function orderFunnelSteps(expected:string[],events:TimedStep[],entryTime:string,windowHours=24) {
  const end=new Date(entryTime).getTime()+windowHours*3_600_000
  let cursor=new Date(entryTime).getTime()
  let blocked=false
  return expected.map(name=>{
    if(blocked)return null
    const candidate=events.filter(event=>event.name===name).map(event=>new Date(event.occurredAt).getTime()).filter(time=>Number.isFinite(time)&&time>=cursor&&time<=end).sort((a,b)=>a-b)[0]
    if(candidate===undefined){blocked=true;return null}
    cursor=candidate
    return new Date(candidate).toISOString()
  })
}

export function funnelsViewState(state:'loading'|'ready'|'error',data:FunnelsResponse|null){if(state!=='ready')return state;return data?.funnels.some(funnel=>funnel.steps[0]?.entrants>0)?'data':'empty'}

const EMPTY_FUNNELS:Array<{funnel_id:FunnelReport['funnel_id'];name:string;steps:string[]}>= [
  {funnel_id:'discovery',name:'Discovery to completion',steps:['Landing','Browse','Game selected','Play mode selected','Game started','First card','Completion']},
  {funnel_id:'multiplayer_host',name:'Play Together host',steps:['Play Together selected','Room created','First guest joined','Game started','First card','Completion']},
  {funnel_id:'multiplayer_guest',name:'Join a room',steps:['Join opened','Code submitted','Room joined','Game started','First card','Completion']},
]
export function completeFunnels(funnels:FunnelReport[]){const byId=new Map(funnels.map(funnel=>[funnel.funnel_id,funnel]));return EMPTY_FUNNELS.map(definition=>byId.get(definition.funnel_id)??{funnel_id:definition.funnel_id,name:definition.name,steps:definition.steps.map((step_name,index)=>({step_order:index+1,step_name,entrants:0,conversion_from_previous:0,conversion_from_first:0,median_seconds_from_previous:null}))})}
