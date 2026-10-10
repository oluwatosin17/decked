import { useCallback, useEffect, useRef, useState } from 'react'
import { getDeviceBreakdown, getOverviewDashboard, getOverviewTrends, getRetentionCohorts } from './api'
import { comparisonDescription, filterDateLabel, formatMetric, formatTrendBucketLabel, overviewDashboardViewState, parseDashboardFilters, percentage, serializeDashboardFilters, trendLabelIndexes, type DashboardFilters, type DeviceBreakdownResponse, type OverviewDashboardResponse, type OverviewTrendsResponse, type RetentionResponse, type TrendGranularity } from './model'
import { DataTable, LoadingState, PageHeader, StatePanel } from './Primitives'
import { GAME_REGISTRY } from '../gameRegistry'
import { ExportButton } from './ExportButton'
import { FilterBar,FilterDrawer } from './FilterDrawer'

function fallbackFilters(): DashboardFilters {
  const to = new Date(); const from = new Date(to); from.setUTCDate(from.getUTCDate() - 29)
  return { environment: 'production', from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), gameId: '', playMode: '', deviceClass: 'all', comparison: 'previous_period' }
}

export default function OverviewPage() {
  const [filters, setFilters] = useState(() => parseDashboardFilters(window.location.search, fallbackFilters()))
  const [data, setData] = useState<OverviewDashboardResponse | null>(null)
  const [trends,setTrends]=useState<OverviewTrendsResponse|null>(null)
  const [retention,setRetention]=useState<RetentionResponse|null>(null)
  const [devices,setDevices]=useState<DeviceBreakdownResponse|null>(null)
  const [granularity,setGranularity]=useState<TrendGranularity>('day')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filtersOpen,setFiltersOpen]=useState(false);const [draft,setDraft]=useState(filters)
  const requestId = useRef(0)
  const load = useCallback(async () => {
    const id = ++requestId.current; setState('loading')
    try { const [result,trendResult,retentionResult,deviceResult] = await Promise.all([getOverviewDashboard(filters),getOverviewTrends(filters,granularity).catch(()=>null),getRetentionCohorts(filters).catch(()=>null),getDeviceBreakdown(filters).catch(()=>null)]); if (id === requestId.current) { setData(result); setTrends(trendResult); setRetention(retentionResult); setDevices(deviceResult); setState('ready') } }
    catch { if (id === requestId.current) setState('error') }
  }, [filters,granularity])
  useEffect(() => { window.history.replaceState({}, '', `${window.location.pathname}?${serializeDashboardFilters(filters)}`); void load() }, [filters, load])

  const viewState = overviewDashboardViewState(state, data)
  return <>
    <PageHeader eyebrow="PRODUCT HEALTH" title="Overview" description="The 60-second view of acquisition, play, completion, multiplayer, and reliability." />
    <FilterBar summary={`${filters.environment} · ${filterDateLabel(filters.from,filters.to)} · ${filters.gameId||'All games'} · ${filters.playMode||'All modes'}`} count={Number(Boolean(filters.gameId))+Number(Boolean(filters.playMode))+Number(filters.environment!=='production')} onOpen={()=>{setDraft(filters);setFiltersOpen(true)}}><ExportButton report="overview" filters={filters}/></FilterBar>
    <FilterDrawer open={filtersOpen} title="Overview filters" description="Adjust the product-health reporting dimensions." onClose={()=>setFiltersOpen(false)} onApply={()=>{setFilters(draft);setFiltersOpen(false)}} onReset={()=>setDraft(fallbackFilters())}><OverviewFilters filters={draft} onChange={setDraft}/></FilterDrawer>
    {state === 'ready' ? <p className="cc-freshness" role="status">{data?.refreshed_at ? `Data refreshed ${new Date(data.refreshed_at).toLocaleString()}` : 'Data freshness unavailable for the complete selected range.'}</p> : null}
    {viewState === 'loading' ? <LoadingState /> : viewState === 'error' ? <StatePanel title="Overview unavailable" action={<button className="cc-button" onClick={() => void load()}>Try again</button>}><p>The aggregate query failed. Your filters are preserved.</p></StatePanel> : data ? <>{viewState==='empty'?<div className="cc-zero-notice" role="status"><strong>No matching activity</strong><span>Metrics and charts remain visible below with zero values.</span></div>:null}<OverviewContent data={data} trends={trends} retention={retention} devices={devices} granularity={granularity} onGranularity={setGranularity} filtered={Boolean(filters.gameId || filters.playMode)} /></> : null}
  </>
}

function OverviewFilters({ filters, onChange }: { filters: DashboardFilters; onChange: (filters: DashboardFilters) => void }) {
  return <div className="cc-drawer-filter-grid" aria-label="Overview filters">
    <label>Environment<select value={filters.environment} onChange={event => onChange({ ...filters, environment: event.target.value as DashboardFilters['environment'] })}><option value="production">Production</option><option value="preview">Preview</option><option value="development">Development</option></select></label>
    <label>From<input type="date" value={filters.from} max={filters.to} onChange={event => onChange({ ...filters, from: event.target.value })} /></label>
    <label>To<input type="date" value={filters.to} min={filters.from} onChange={event => onChange({ ...filters, to: event.target.value })} /></label>
    <label>Compare<select value="previous_period" disabled><option>Previous period</option></select></label>
    <label>Game<select value={filters.gameId} onChange={event => onChange({ ...filters, gameId: event.target.value })}><option value="">All games</option>{GAME_REGISTRY.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
    <label>Play mode<select value={filters.playMode} onChange={event => onChange({ ...filters, playMode: event.target.value as DashboardFilters['playMode'] })}><option value="">All modes</option><option value="pass_and_play">Pass and play</option><option value="play_together">Play Together</option></select></label>
    <label>Device <span className="cc-filter-note" id="overview-device-note">not available</span><select value="all" disabled aria-describedby="overview-device-note"><option>All devices</option></select></label>
  </div>
}

function OverviewContent({ data,trends,retention,devices,granularity,onGranularity,filtered }: { data: OverviewDashboardResponse;trends:OverviewTrendsResponse|null;retention:RetentionResponse|null;devices:DeviceBreakdownResponse|null;granularity:TrendGranularity;onGranularity:(value:TrendGranularity)=>void;filtered: boolean }) {
  const current = data.current; const previous = data.previous
  const activePlayers = current.new_players + current.returning_players; const previousActivePlayers = previous.new_players + previous.returning_players
  const completion = percentage(current.completions, current.game_starts); const previousCompletion = percentage(previous.completions, previous.game_starts)
  const startConversion = percentage(current.rooms_started, current.eligible_rooms); const previousStartConversion = percentage(previous.rooms_started, previous.eligible_rooms)
  const roomStartRate = percentage(current.rooms_started, current.rooms_created); const previousRoomStartRate = percentage(previous.rooms_started, previous.rooms_created)
  const replayRate = percentage(current.replays + (current.rematch_starts ?? 0), current.completions); const previousReplayRate = percentage(previous.replays + (previous.rematch_starts ?? 0), previous.completions)
  const errorFree = percentage(current.sessions - current.error_sessions, current.sessions); const previousErrorFree = percentage(previous.sessions - previous.error_sessions, previous.sessions)
  const metrics: Array<[string, number | null, number | null, 'number' | 'percent' | 'duration' | 'decimal', string, number]> = [
    ['Active players in period', activePlayers, previousActivePlayers, 'number', 'Distinct new and returning analytics identities active during the selected period.', activePlayers + previousActivePlayers],
    ['Daily active players', current.daily_active, previous.daily_active, 'number', 'Distinct installations active on the final selected day.', current.daily_active + previous.daily_active],
    ['Weekly active players', current.weekly_active, previous.weekly_active, 'number', 'Distinct installations in the trailing seven days.', current.weekly_active + previous.weekly_active],
    ['Monthly active players', current.monthly_active, previous.monthly_active, 'number', 'Distinct installations in the trailing 30 days.', current.monthly_active + previous.monthly_active],
    ['New players', current.new_players, previous.new_players, 'number', 'First qualifying event occurred in the period.', current.new_players + previous.new_players],
    ['Returning players', current.returning_players, previous.returning_players, 'number', 'Active now with qualifying activity before the period.', current.returning_players + previous.returning_players],
    ['Returning-player share', percentage(current.returning_players,activePlayers), percentage(previous.returning_players,previousActivePlayers), 'percent', 'Returning players divided by all active players in the selected period.', activePlayers + previousActivePlayers],
    ['Game starts', current.game_starts, previous.game_starts, 'number', 'Distinct sessions reaching the first playable state.', current.game_starts + previous.game_starts],
    ['Completions', current.completions, previous.completions, 'number', 'Started sessions reaching an approved terminal state.', current.completions + previous.completions],
    ['Completion rate', completion, previousCompletion, 'percent', 'Completed started sessions divided by game starts.', current.game_starts + previous.game_starts],
    ['Cards played', current.cards_played, previous.cards_played, 'number', 'Presented card positions or round-equivalents.', current.cards_played + previous.cards_played],
    ['Cards per start', current.game_starts?current.cards_played/current.game_starts:0, previous.game_starts?previous.cards_played/previous.game_starts:0, 'decimal', 'Presented cards divided by game starts; a compact measure of session depth.', current.game_starts + previous.game_starts],
    ['Sessions per active player', activePlayers?current.sessions/activePlayers:0, previousActivePlayers?previous.sessions/previousActivePlayers:0, 'decimal', 'Analytics sessions divided by active player identities in the period.', activePlayers + previousActivePlayers],
    ['Median duration', current.median_session_duration_seconds, previous.median_session_duration_seconds, 'duration', 'Median duration of completed sessions.', current.completions + previous.completions],
    ['Rooms created', current.rooms_created, previous.rooms_created, 'number', 'Successfully created Play Together rooms.', current.rooms_created + previous.rooms_created],
    ['Rooms started', current.rooms_started, previous.rooms_started, 'number', 'Rooms reaching the first multiplayer game start.', current.rooms_started + previous.rooms_started],
    ['Rooms not started', Math.max(0,current.rooms_created-current.rooms_started), Math.max(0,previous.rooms_created-previous.rooms_started), 'number', 'Created rooms that did not reach a multiplayer game start.', current.rooms_created + previous.rooms_created],
    ['Room start rate', roomStartRate, previousRoomStartRate, 'percent', 'Rooms started divided by all successfully created rooms.', current.rooms_created + previous.rooms_created],
    ['Multiplayer start conversion', startConversion, previousStartConversion, 'percent', 'Started rooms divided by rooms with at least one guest.', current.eligible_rooms + previous.eligible_rooms],
    ['Replay / rematch rate', replayRate, previousReplayRate, 'percent', 'Replay selections and rematches divided by completions.', current.completions + previous.completions],
    ['Error-free session rate', errorFree, previousErrorFree, 'percent', 'Analytics sessions without RPC, frontend, or Realtime failures.', current.sessions + previous.sessions],
    ['Affected sessions', current.error_sessions, previous.error_sessions, 'number', 'Analytics sessions containing at least one frontend, RPC, or Realtime failure.', current.sessions + previous.sessions],
  ]
  return <>
    {data.partial_warnings.length || filtered ? <div className="cc-warning" role="note"><strong>Partial segmentation</strong><span>{data.partial_warnings[0] ?? 'Player and reliability metrics remain unsegmented when game filters are active.'}</span></div> : null}
    <section className="cc-kpi-grid cc-overview-kpis" aria-label="Product health metrics">{metrics.map(([label,value,prior,kind,definition,sample]) => <MetricCard key={label} label={label} value={value} previous={prior} kind={kind} definition={definition} sample={sample} />)}</section>
    <TrendControls value={granularity} onChange={onGranularity}/>
    {trends?<><TimeSeriesChart title="Active players over time" description={`Distinct active players grouped by ${granularity}.`} rows={trends.series} granularity={granularity} keys={[['active_players','Active players']]}/><TimeSeriesChart title="Gameplay trend" description={`Starts and completions grouped by ${granularity}.`} rows={trends.series} granularity={granularity} keys={[['game_starts','Game starts'],['completions','Completions']]}/></>:<><div className="cc-warning" role="note"><strong>Expanded trends unavailable</strong><span>Deploy the Overview trends migration to enable active-player and adjustable time-group charts.</span></div><TrendChart rows={data.trend}/></>}
    <section className="cc-overview-chart-grid" aria-label="Overview breakdown charts">
      <GaugeChart label="Completion rate" value={completion}/>
      <DonutChart newPlayers={current.new_players} returningPlayers={current.returning_players}/>
      <Histogram rows={trends?.duration_histogram??[]}/>
      <StageChart title="Player mix" description="New and returning active players in the selected period." rows={[{label:'New players',value:current.new_players},{label:'Returning players',value:current.returning_players}]} />
      <StageChart title="Gameplay outcomes" description="How started games progressed to completion and repeat play." rows={[{label:'Game starts',value:current.game_starts},{label:'Completions',value:current.completions},{label:'Replays / rematches',value:current.replays+current.rematch_starts}]} />
      <StageChart title="Multiplayer room flow" description="Created rooms, rooms with a guest, and rooms that started." rows={[{label:'Rooms created',value:current.rooms_created},{label:'First guest joined',value:current.eligible_rooms},{label:'Rooms started',value:current.rooms_started}]} />
      <StageChart title="Players by device" description="Privacy-safe active-player counts from the device used to open Decked." rows={(devices?.devices??[]).map(row=>({label:deviceLabel(row.device_class),value:row.active_players}))} emptyLabel="Deploy the device breakdown migration to see mobile, tablet, and desktop players." />
      <StageChart title="Browser or installed app" description="Sessions opened in a browser compared with the installed Decked PWA." rows={(devices?.access_modes??[]).map(row=>({label:row.access_mode==='pwa'?'Installed PWA':row.access_mode==='browser'?'Web browser':'Unknown',value:row.sessions}))} emptyLabel="No platform observations in this period." />
      <TopGamesChart rows={data.top_games} />
    </section>
    {devices?<DeviceTable data={devices}/>:null}
    {retention?<RetentionPanel data={retention}/>:null}
    <section className="cc-panel"><div className="cc-panel-heading"><div><h2>Top games</h2><p>Ranked by starts for the selected period.</p></div></div><DataTable label="Top games ranking"><thead><tr><th>Rank</th><th>Game</th><th>Starts</th><th>Completions</th><th>Completion</th></tr></thead><tbody>{data.top_games.map((row,index) => <tr key={row.game_id}><td>{index+1}</td><td>{row.game_id.replace(/-/g,' ')}</td><td>{row.starts}</td><td>{row.completions}</td><td>{row.completion_rate}%</td></tr>)}</tbody></DataTable></section>
  </>
}

function RetentionPanel({data}:{data:RetentionResponse}){const recent=[...data.daily].slice(-10).reverse();return <section className="cc-panel cc-retention"><div className="cc-panel-heading"><h2>Retention cohorts</h2><p>D1, D7 and D30 return rates mature only after enough calendar time has elapsed.</p></div><div className="cc-retention-summary"><article><span>D1 retention</span><strong>{formatMetric(data.summary.d1_rate,'percent')}</strong></article><article><span>D7 retention</span><strong>{formatMetric(data.summary.d7_rate,'percent')}</strong></article><article><span>D30 retention</span><strong>{formatMetric(data.summary.d30_rate,'percent')}</strong></article></div><DataTable label="Recent daily retention cohorts"><thead><tr><th>Cohort</th><th>New players</th><th>D1</th><th>D7</th><th>D30</th></tr></thead><tbody>{recent.map(row=><tr key={row.cohort_date}><td>{row.cohort_date}</td><td>{row.cohort_size}</td><td>{formatMetric(row.d1_rate,'percent')}</td><td>{formatMetric(row.d7_rate,'percent')}</td><td>{formatMetric(row.d30_rate,'percent')}</td></tr>)}</tbody></DataTable></section>}

function TrendControls({value,onChange}:{value:TrendGranularity;onChange:(value:TrendGranularity)=>void}){
  return <div className="cc-trend-controls"><div><strong>Trend interval</strong><span>Change how dates are grouped.</span></div><div role="group" aria-label="Trend interval">{(['day','week','month','year'] as const).map(option=><button key={option} className={value===option?'active':''} aria-pressed={value===option} onClick={()=>onChange(option)}>{option==='day'?'Daily':option==='week'?'Weekly':option==='month'?'Monthly':'Yearly'}</button>)}</div></div>
}

function TimeSeriesChart({title,description,rows,keys,granularity}:{title:string;description:string;rows:OverviewTrendsResponse['series'];keys:Array<['active_players'|'game_starts'|'completions',string]>;granularity:TrendGranularity}){
  const width=900,height=270,padding=36,max=Math.max(1,...rows.flatMap(row=>keys.map(([key])=>Number(row[key]))));const denominator=Math.max(1,rows.length-1)
  const x=(index:number)=>padding+(index/denominator)*(width-padding*2)
  const y=(value:number)=>height-padding-(value/max)*(height-padding*2)
  const points=(key:'active_players'|'game_starts'|'completions')=>rows.map((row,index)=>`${padding+(index/denominator)*(width-padding*2)},${height-padding-(Number(row[key])/max)*(height-padding*2)}`).join(' ')
  const labelIndexes=trendLabelIndexes(rows.length,granularity)
  return <section className="cc-panel cc-timeseries"><div className="cc-panel-heading"><div><h2>{title}</h2><p>{description}</p></div><div className="cc-legend">{keys.map(([,label])=><span key={label}>{label}</span>)}</div></div>{rows.length?<><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${rows.length} time periods; maximum value ${max}.`}>{[0,.25,.5,.75,1].map(tick=><g key={tick}><line x1={padding} x2={width-padding} y1={padding+tick*(height-padding*2)} y2={padding+tick*(height-padding*2)}/><text className="cc-y-label" x={padding-8} y={padding+tick*(height-padding*2)+4} textAnchor="end">{Math.round(max*(1-tick))}</text></g>)}{keys.map(([key],seriesIndex)=><g key={key}><polyline className={`series-${seriesIndex}`} points={points(key)}/>{rows.map((row,index)=><circle key={`${key}-${row.bucket_start}`} className={`series-${seriesIndex}`} cx={x(index)} cy={y(Number(row[key]))} r="4" tabIndex={0}><title>{`${formatTrendBucketLabel(row.bucket_start,granularity,index)}: ${Number(row[key]).toLocaleString()} ${keys[seriesIndex][1].toLowerCase()}`}</title></circle>)}</g>)}{labelIndexes.map(index=><text key={rows[index].bucket_start} className="cc-x-label" x={x(index)} y={height-7} textAnchor={index===0?'start':index===rows.length-1?'end':'middle'}>{formatTrendBucketLabel(rows[index].bucket_start,granularity,index)}</text>)}</svg></>:<div className="cc-chart-empty">No trend data for this period.</div>}</section>
}

function GaugeChart({label,value}:{label:string;value:number}){const safe=Math.max(0,Math.min(100,value));return <section className="cc-panel cc-compact-chart"><div className="cc-panel-heading"><h2>{label}</h2><p>Completed games divided by starts.</p></div><div className="cc-gauge" style={{background:`conic-gradient(#ef4c48 ${safe*3.6}deg,#292b30 0deg)`}} role="img" aria-label={`${label}: ${safe.toFixed(1)} percent`}><div><strong>{safe.toFixed(1)}%</strong><span>completed</span></div></div></section>}

function DonutChart({newPlayers,returningPlayers}:{newPlayers:number;returningPlayers:number}){const total=newPlayers+returningPlayers;const share=percentage(newPlayers,total);return <section className="cc-panel cc-compact-chart"><div className="cc-panel-heading"><h2>Player composition</h2><p>New versus returning active players.</p></div><div className="cc-donut-layout"><div className="cc-donut" style={{background:`conic-gradient(#ef4c48 ${share*3.6}deg,#f4b860 0deg)`}} role="img" aria-label={`${newPlayers} new and ${returningPlayers} returning players`}><div><strong>{total.toLocaleString()}</strong><span>players</span></div></div><ul><li><i/>New <strong>{newPlayers.toLocaleString()}</strong></li><li><i/>Returning <strong>{returningPlayers.toLocaleString()}</strong></li></ul></div></section>}

function Histogram({rows}:{rows:OverviewTrendsResponse['duration_histogram']}){const order=['Under 5m','5–15m','15–30m','30–60m','60m+'];const complete=order.map(bucket=>rows.find(row=>row.bucket===bucket)??{bucket,sessions:0});const max=Math.max(1,...complete.map(row=>row.sessions));return <section className="cc-panel cc-histogram"><div className="cc-panel-heading"><h2>Session duration distribution</h2><p>Completed sessions grouped by duration.</p></div><div className="cc-histogram-bars">{complete.map(row=><div key={row.bucket}><strong>{row.sessions.toLocaleString()}</strong><span style={{height:`${row.sessions?Math.max(4,100*row.sessions/max):0}%`}}/><small>{row.bucket}</small></div>)}</div></section>}

function MetricCard({ label,value,previous,kind,definition,sample }: { label:string; value:number|null; previous:number|null; kind:'number'|'percent'|'duration'|'decimal'; definition:string; sample:number }) {
  const deltaText = comparisonDescription(value,previous,sample)
  const decreased = value !== null && previous !== null && previous > 0 && value < previous
  return <article className="cc-kpi cc-metric"><div className="cc-metric-label"><span>{label}</span><button type="button" aria-label={`Definition: ${definition}`} title={definition}>?</button></div><strong>{formatMetric(value,kind)}</strong><small className={sample < 20 ? 'muted' : decreased ? 'down' : 'up'}>{deltaText}</small></article>
}

function StageChart({title,description,rows,emptyLabel='No observations in this period.'}:{title:string;description:string;rows:Array<{label:string;value:number}>;emptyLabel?:string}){
  const max=Math.max(1,...rows.map(row=>row.value))
  return <section className="cc-panel cc-stage-chart"><div className="cc-panel-heading"><h2>{title}</h2><p>{description}</p></div><div className="cc-stage-chart-body">{rows.length?rows.map(row=><div key={row.label} className="cc-stage-row"><div><span>{row.label}</span><strong>{row.value.toLocaleString()}</strong></div><div className="cc-stage-track" aria-hidden="true"><span style={{width:`${row.value?Math.max(3,100*row.value/max):0}%`}}/></div></div>):<div className="cc-inline-empty">{emptyLabel}</div>}</div></section>
}

function deviceLabel(value:string){return value==='mobile'?'Mobile':value==='tablet'?'Tablet':value==='desktop'?'Desktop':'Unknown'}

function DeviceTable({data}:{data:DeviceBreakdownResponse}){return <section className="cc-panel"><div className="cc-panel-heading"><div><h2>Device activity</h2><p>Exact aggregate counts. One player can appear in more than one device row when they use multiple installations.</p></div></div><DataTable label="Device activity breakdown"><thead><tr><th>Device</th><th>Active players</th><th>Sessions</th><th>Game starts</th><th>Completions</th></tr></thead><tbody>{data.devices.map(row=><tr key={row.device_class}><td>{deviceLabel(row.device_class)}</td><td>{row.active_players}</td><td>{row.sessions}</td><td>{row.game_starts}</td><td>{row.completions}</td></tr>)}</tbody></DataTable>{data.partial_warnings.map(warning=><p className="cc-freshness" key={warning}>{warning}</p>)}</section>}

function TopGamesChart({rows}:{rows:OverviewDashboardResponse['top_games']}){
  const visible=rows.slice(0,5);const max=Math.max(1,...visible.map(row=>row.starts))
  return <section className="cc-panel cc-stage-chart"><div className="cc-panel-heading"><h2>Top games by starts</h2><p>The five most-started games for the selected period.</p></div><div className="cc-stage-chart-body">{visible.length?visible.map(row=><div key={row.game_id} className="cc-stage-row"><div><span>{row.game_id.replace(/-/g,' ')}</span><strong>{row.starts.toLocaleString()}</strong></div><div className="cc-stage-track" aria-hidden="true"><span style={{width:`${Math.max(3,100*row.starts/max)}%`}}/></div></div>):<div className="cc-inline-empty">No game starts in this period.</div>}</div></section>
}

function TrendChart({ rows }: { rows: OverviewDashboardResponse['trend'] }) {
  const width=800,height=240,padding=28,max=Math.max(1,...rows.flatMap(row=>[row.starts,row.completions])); const denominator=Math.max(1,rows.length-1)
  const points=(key:'starts'|'completions')=>rows.map((row,index)=>`${padding+(index/denominator)*(width-padding*2)},${height-padding-(row[key]/max)*(height-padding*2)}`).join(' ')
  return <section className="cc-panel cc-trend"><div className="cc-panel-heading"><div><h2>Starts and completions</h2><p>Daily UTC trend for the selected filters.</p></div><div className="cc-legend"><span>Starts</span><span>Completions</span></div></div>{rows.length ? <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="trend-title trend-desc"><title id="trend-title">Daily game starts and completions</title><desc id="trend-desc">{rows.length} daily points. Peak value {max}.</desc><polyline className="starts" points={points('starts')} /><polyline className="completions" points={points('completions')} /></svg> : <div className="cc-chart-empty">No trend data for this period.</div>}</section>
}
