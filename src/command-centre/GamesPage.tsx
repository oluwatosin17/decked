import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GAME_NAMES, GAME_REGISTRY, isGameId, type GameId } from '../gameRegistry'
import { getGameDetail, getGamesDashboard } from './api'
import { completeGameRows, filterSortGames, gamesFilterCount, gamesViewState, isGameSortKey, type GameDetailResponse, type GameSortKey, type GamesAnalyticsResponse } from './gamesModel'
import { formatMetric, parseDashboardFilters, serializeDashboardFilters, type DashboardFilters } from './model'
import { DataTable, LoadingState, PageHeader, StatePanel } from './Primitives'
import { ExportButton } from './ExportButton'

function defaultFilters(): DashboardFilters {
  const to = new Date(); const from = new Date(to); from.setUTCDate(from.getUTCDate() - 29)
  return { environment: 'production', from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10), gameId: '', playMode: '', deviceClass: 'all', comparison: 'previous_period' }
}

function gameFromPath(): GameId | null {
  const candidate = window.location.pathname.split('/')[3] ?? ''
  return isGameId(candidate) ? candidate : null
}

export default function GamesPage() {
  const params = new URLSearchParams(window.location.search)
  const [filters,setFilters] = useState(() => parseDashboardFilters(window.location.search,defaultFilters()))
  const [trendDays,setTrendDays] = useState<7|30>(() => params.get('trend') === '30' ? 30 : 7)
  const [search,setSearch] = useState(() => params.get('q') ?? '')
  const [sortKey,setSortKey] = useState<GameSortKey>(() => { const value=params.get('sort'); return isGameSortKey(value) ? value : 'pass_and_play_starts' })
  const [direction,setDirection] = useState<'asc'|'desc'>(() => params.get('direction') === 'asc' ? 'asc' : 'desc')
  const [filtersOpen,setFiltersOpen] = useState(false)
  const [selected,setSelected] = useState<GameId|null>(gameFromPath)
  const [data,setData] = useState<GamesAnalyticsResponse|null>(null)
  const [state,setState] = useState<'loading'|'ready'|'error'>('loading')
  const requestId = useRef(0)

  const load = useCallback(async () => { const id=++requestId.current; setState('loading'); try { const result=await getGamesDashboard(filters,trendDays); if(id===requestId.current){setData(result);setState('ready')} } catch { if(id===requestId.current)setState('error') } },[filters,trendDays])
  useEffect(() => { void load() },[load])
  useEffect(() => { const onPop=()=>setSelected(gameFromPath()); window.addEventListener('popstate',onPop); return()=>window.removeEventListener('popstate',onPop) },[])
  useEffect(() => {
    const query = new URLSearchParams(serializeDashboardFilters(filters)); if(search)query.set('q',search); query.set('sort',sortKey); query.set('direction',direction); query.set('trend',String(trendDays))
    window.history.replaceState({},'',`${window.location.pathname}?${query}`)
  },[filters,search,sortKey,direction,trendDays])

  const rows = useMemo(() => filterSortGames(completeGameRows(data?.rows ?? []),search,sortKey,direction,id=>GAME_NAMES[id]),[data,search,sortKey,direction])
  const openGame=(id:GameId)=>{window.history.pushState({},'',`/command-centre/games/${id}${window.location.search}`);setSelected(id);window.scrollTo({top:0})}
  const back=()=>{window.history.pushState({},'',`/command-centre/games${window.location.search}`);setSelected(null);window.scrollTo({top:0})}
  if(selected)return <GameDetail gameId={selected} filters={filters} trendDays={trendDays} onBack={back}/>
  const viewState=gamesViewState(state,data?.rows??null)
  return <>
    <PageHeader eyebrow="GAME PERFORMANCE" title="Games" description="Compare discovery, starts, depth, completion, and repeat play across the canonical game catalogue."/>
    <div className="cc-games-controls">
      <div className="cc-filter-summary"><span>Current view</span><strong>{filterSummary(filters,trendDays)}</strong></div>
      <label className="cc-games-search">Find game<input type="search" value={search} placeholder="Name or ID" onChange={event=>setSearch(event.target.value)}/></label>
      <button className="cc-button cc-button-secondary cc-filter-trigger" type="button" onClick={()=>setFiltersOpen(true)}>Filters{gamesFilterCount(filters.environment,filters.playMode,trendDays)>0?<span aria-label={`${gamesFilterCount(filters.environment,filters.playMode,trendDays)} optional filters active`}>{gamesFilterCount(filters.environment,filters.playMode,trendDays)}</span>:null}</button>
      <ExportButton report="games" filters={filters} visibleGameIds={rows.map(row=>row.game_id)} trendDays={trendDays}/>
    </div>
    <GamesFilterDrawer open={filtersOpen} filters={filters} trendDays={trendDays} onClose={()=>setFiltersOpen(false)} onApply={(nextFilters,nextTrend)=>{setFilters(nextFilters);setTrendDays(nextTrend);setFiltersOpen(false)}}/>
    <div className="cc-toolbar"><span>{rows.length} of {GAME_REGISTRY.length} games</span></div>
    {state==='ready'?<p className="cc-freshness" role="status">{data?.refreshed_at?`Data refreshed ${new Date(data.refreshed_at).toLocaleString()}`:'Data freshness unavailable for the complete selected range.'}</p>:null}
    {data?.partial_warnings.map(warning=><div className="cc-warning" role="note" key={warning}>{warning}</div>)}
    {viewState==='loading'?<LoadingState/>:viewState==='error'?<StatePanel title="Games report unavailable" action={<button className="cc-button" onClick={()=>void load()}>Try again</button>}><p>The aggregate query failed. Your filters are preserved.</p></StatePanel>:<>{viewState==='empty'?<ZeroDataNotice>All 21 games are shown below with zero activity for this period.</ZeroDataNotice>:null}{rows.length===0?<StatePanel title="No games match"><p>Clear the game search to see all canonical games for this period.</p></StatePanel>:<GamesTable rows={rows} sortKey={sortKey} direction={direction} onSort={key=>{if(key===sortKey)setDirection(value=>value==='asc'?'desc':'asc');else{setSortKey(key);setDirection('desc')}}} onOpen={openGame} trendDays={trendDays}/>}</>} 
  </>
}

function ZeroDataNotice({children}:{children:string}){return <div className="cc-zero-notice" role="status"><strong>No matching activity</strong><span>{children}</span></div>}

function filterSummary(filters:DashboardFilters,trendDays:7|30) {
  const environment=filters.environment[0].toUpperCase()+filters.environment.slice(1)
  const mode=filters.playMode==='pass_and_play'?'Pass and play':filters.playMode==='play_together'?'Play Together':'All modes'
  const date=(value:string)=>new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})
  return `${environment} · ${date(filters.from)}–${date(filters.to)} · ${mode} · ${trendDays}d trend`
}

function GamesFilterDrawer({open,filters,trendDays,onClose,onApply}:{open:boolean;filters:DashboardFilters;trendDays:7|30;onClose:()=>void;onApply:(filters:DashboardFilters,trend:7|30)=>void}) {
  const dialogRef=useRef<HTMLDialogElement>(null)
  const [draft,setDraft]=useState(filters)
  const [draftTrend,setDraftTrend]=useState<7|30>(trendDays)
  useEffect(()=>{const dialog=dialogRef.current;if(!dialog)return;if(open&&!dialog.open){setDraft(filters);setDraftTrend(trendDays);dialog.showModal()}else if(!open&&dialog.open)dialog.close()},[open,filters,trendDays])
  return <dialog ref={dialogRef} className="cc-filter-dialog" aria-labelledby="games-filter-title" onCancel={event=>{event.preventDefault();onClose()}} onClose={onClose}>
    <form className="cc-filter-drawer" onSubmit={event=>{event.preventDefault();onApply(draft,draftTrend)}}>
      <header><div><span>GAME VIEW</span><h2 id="games-filter-title">Filters</h2><p>Adjust the reporting period and game dimensions.</p></div><button type="button" className="cc-dialog-close" aria-label="Close filters" onClick={onClose}>×</button></header>
      <div className="cc-drawer-fields">
        <label>Environment<select value={draft.environment} onChange={event=>setDraft({...draft,environment:event.target.value as DashboardFilters['environment']})}><option value="production">Production</option><option value="preview">Preview</option><option value="development">Development</option></select></label>
        <div className="cc-date-fields"><label>From<input required type="date" value={draft.from} max={draft.to} onChange={event=>setDraft({...draft,from:event.target.value})}/></label><label>To<input required type="date" value={draft.to} min={draft.from} onChange={event=>setDraft({...draft,to:event.target.value})}/></label></div>
        <label>Compare<select value="previous_period" disabled><option>Previous period</option></select></label>
        <label>Play mode<select value={draft.playMode} onChange={event=>setDraft({...draft,playMode:event.target.value as DashboardFilters['playMode']})}><option value="">All modes</option><option value="pass_and_play">Pass and play</option><option value="play_together">Play Together</option></select></label>
        <label>Trend<select value={draftTrend} onChange={event=>setDraftTrend(Number(event.target.value) as 7|30)}><option value="7">7 days</option><option value="30">30 days</option></select></label>
      </div>
      <footer><button type="button" className="cc-text-button" onClick={()=>{setDraft(defaultFilters());setDraftTrend(7)}}>Reset</button><div><button type="button" className="cc-button cc-button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="cc-button">Apply filters</button></div></footer>
    </form>
  </dialog>
}

const COLUMNS:Array<[GameSortKey,string]>=[['name','Game'],['game_views','Views'],['selections','Selections'],['pass_and_play_starts','Local starts'],['multiplayer_starts','Multiplayer starts'],['unique_players','Unique players'],['first_card_rate','First card'],['completion_rate','Completion'],['median_cards_played','Median cards'],['median_duration_seconds','Median duration'],['replay_rate','Replay / rematch'],['trend_percent','Trend']]
function GamesTable({rows,sortKey,direction,onSort,onOpen,trendDays}:{rows:GamesAnalyticsResponse['rows'];sortKey:GameSortKey;direction:'asc'|'desc';onSort:(key:GameSortKey)=>void;onOpen:(id:GameId)=>void;trendDays:7|30}) {
  return <section className="cc-panel"><DataTable label="Game performance comparison"><thead><tr>{COLUMNS.map(([key,label])=><th key={key} aria-sort={sortKey===key?(direction==='asc'?'ascending':'descending'):'none'}><button className="cc-sort" onClick={()=>onSort(key)}>{key==='trend_percent'?`${trendDays}d trend`:label}</button></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.game_id}><td><button className="cc-game-link" onClick={()=>onOpen(row.game_id)}>{GAME_NAMES[row.game_id]}</button></td><td>{row.game_views}</td><td>{row.selections}</td><td>{row.pass_and_play_starts}</td><td>{row.multiplayer_starts}</td><td>{row.unique_players}</td><td>{formatMetric(row.first_card_rate,'percent')}</td><td>{formatMetric(row.completion_rate,'percent')}</td><td>{formatMetric(row.median_cards_played)}</td><td>{formatMetric(row.median_duration_seconds,'duration')}</td><td>{formatMetric(row.replay_rate,'percent')}</td><td>{row.trend_percent===null?'No baseline':`${row.trend_percent>0?'+':''}${row.trend_percent}%`}</td></tr>)}</tbody></DataTable></section>
}

function GameDetail({gameId,filters,trendDays,onBack}:{gameId:GameId;filters:DashboardFilters;trendDays:7|30;onBack:()=>void}) {
  const [data,setData]=useState<GameDetailResponse|null>(null);const [state,setState]=useState<'loading'|'ready'|'error'>('loading');const requestId=useRef(0)
  const load=useCallback(async()=>{const id=++requestId.current;setState('loading');try{const result=await getGameDetail(filters,gameId,trendDays);if(id===requestId.current){setData(result);setState('ready')}}catch{if(id===requestId.current)setState('error')}},[filters,gameId,trendDays])
  useEffect(()=>{void load()},[load])
  return <><button className="cc-back" onClick={onBack}>← All games</button><PageHeader eyebrow="GAME DETAIL" title={GAME_NAMES[gameId]} description={`Performance and observed behavior from ${filters.from} to ${filters.to}.`}/>{state==='ready'?<p className="cc-freshness" role="status">{data?.refreshed_at?`Data refreshed ${new Date(data.refreshed_at).toLocaleString()}`:'Data freshness unavailable for the complete selected range.'}</p>:null}{state==='loading'?<LoadingState/>:state==='error'?<StatePanel title="Game detail unavailable" action={<button className="cc-button" onClick={()=>void load()}>Try again</button>}><p>The detail query failed. Your filters are preserved.</p></StatePanel>:data?<GameDetailContent data={data}/>:null}</>
}

function GameDetailContent({data}:{data:GameDetailResponse}) {
  const hasData=data.trend.some(row=>row.starts||row.completions)
  if(!hasData)return <StatePanel title="No data for this game"><p>The game exists in the canonical registry but has no sessions in this period.</p></StatePanel>
  return <>{data.partial_warnings.map(warning=><div className="cc-warning" role="note" key={warning}>{warning}</div>)}<div className="cc-detail-grid">
    <DetailTable title="Daily trend" columns={['Date','Starts','Completions']} rows={data.trend.map(row=>[row.metric_date,row.starts,row.completions])}/>
    <DetailTable title="Mode split" columns={['Mode','Starts','Completions','Median cards']} rows={data.mode_split.map(row=>[row.play_mode,row.starts,row.completions,row.median_cards_played??'—'])}/>
    <DetailTable title="Device split" columns={['Device','Observed sessions']} rows={data.device_split.map(row=>[row.device_class,row.sessions])}/>
    <DetailTable title="Funnel" columns={['Step','Sessions']} rows={data.funnel.map(row=>[row.step_name,row.count])}/>
    <DetailTable title="Deck / category observations" columns={['Dimension','ID','Observations']} rows={data.dimensions.map(row=>[row.dimension_type,row.dimension_id,row.observations])}/>
    <DetailTable title="Session depth" columns={['Cards presented','Sessions']} rows={data.session_depth.map(row=>[row.depth_bucket,row.sessions])}/>
    <DetailTable title="Relevant errors" columns={['Type','Class','Occurrences']} rows={data.errors.map(row=>[row.error_type,row.error_class,row.occurrences])}/>
    <DetailTable title="Replay behavior" columns={['Action','Count']} rows={[["Local replays",data.replay_behavior.replays],["Multiplayer rematches",data.replay_behavior.rematches]]}/>
  </div></>
}

function DetailTable({title,columns,rows}:{title:string;columns:string[];rows:Array<Array<string|number>>}) { return <section className="cc-panel cc-detail-panel"><div className="cc-panel-heading"><h2>{title}</h2></div>{rows.length?<DataTable label={title}><thead><tr>{columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={`${row[0]}-${index}`}>{row.map((cell,cellIndex)=><td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></DataTable>:<p className="cc-inline-empty">No observed data.</p>}</section> }
