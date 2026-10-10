import { useCallback, useEffect, useState } from 'react'
import { getGeographyDashboard } from './api'
import { filterDateLabel, formatMetric, parseDashboardFilters, serializeDashboardFilters, type DashboardFilters, type GeographyResponse } from './model'
import { DataTable, KpiCard, LoadingState, PageHeader, StatePanel } from './Primitives'
import { FilterBar, FilterDrawer } from './FilterDrawer'

function defaults():DashboardFilters{const to=new Date();const from=new Date(to);from.setUTCDate(from.getUTCDate()-29);return{environment:'production',from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10),gameId:'',comparison:'previous_period'}}
function countryName(code:string){if(code==='OTHER')return'Other countries';try{return new Intl.DisplayNames(undefined,{type:'region'}).of(code)??code}catch{return code}}

export default function GeographyPage(){
  const[filters,setFilters]=useState(()=>parseDashboardFilters(window.location.search,defaults()))
  const[draft,setDraft]=useState(filters);const[open,setOpen]=useState(false)
  const[data,setData]=useState<GeographyResponse|null>(null);const[state,setState]=useState<'loading'|'ready'|'error'>('loading')
  const load=useCallback(async()=>{setState('loading');try{setData(await getGeographyDashboard(filters));setState('ready')}catch{setState('error')}},[filters])
  useEffect(()=>{window.history.replaceState({},'',`${window.location.pathname}?${serializeDashboardFilters(filters)}`);void load()},[filters,load])
  const located=data?.summary.located_players??0,total=data?.summary.total_players??0,coverage=total?100*located/total:0
  const top=(data?.countries??[]).slice(0,10),max=Math.max(1,...top.map(row=>row.active_players))
  const reachedNames=(data?.countries??[]).map(row=>countryName(row.country_code))
  return <>
    <PageHeader eyebrow="GLOBAL REACH" title="Geography" description="Country-level product usage inferred by Vercel from network location. No IP addresses or precise locations are retained."/>
    <FilterBar summary={`${filters.environment} · ${filterDateLabel(filters.from,filters.to)}`} count={Number(filters.environment!=='production')} onOpen={()=>{setDraft(filters);setOpen(true)}}/>
    <FilterDrawer open={open} title="Geography filters" description="Country reporting uses UTC dates." onClose={()=>setOpen(false)} onApply={()=>{setFilters(draft);setOpen(false)}} onReset={()=>setDraft(defaults())}>
      <div className="cc-drawer-filter-grid"><label>Environment<select value={draft.environment} onChange={event=>setDraft({...draft,environment:event.target.value as DashboardFilters['environment']})}><option value="production">Production</option><option value="preview">Preview</option><option value="development">Development</option></select></label><label>From<input type="date" value={draft.from} max={draft.to} onChange={event=>setDraft({...draft,from:event.target.value})}/></label><label>To<input type="date" value={draft.to} min={draft.from} onChange={event=>setDraft({...draft,to:event.target.value})}/></label></div>
    </FilterDrawer>
    {state==='loading'?<LoadingState/>:state==='error'?<StatePanel title="Geography unavailable" action={<button className="cc-button" onClick={()=>void load()}>Try again</button>}><p>The staff-only country query failed. Your filters are preserved.</p></StatePanel>:data?<>
      <p className="cc-freshness">{data.refreshed_at?`Country data refreshed ${new Date(data.refreshed_at).toLocaleString()}`:'No country-attributed events have arrived yet.'}</p>
      <div className="cc-kpi-grid"><KpiCard label="Countries reached" value={formatMetric(data.summary.countries_reached)} detail={reachedNames.length?reachedNames.slice(0,3).join(', '):'No attributed countries yet'}/><KpiCard label="Located players" value={formatMetric(located)} detail={`${coverage.toFixed(1)}% country coverage`}/><KpiCard label="International players" value={formatMetric(data.summary.international_players)} detail="Players outside Nigeria"/><KpiCard label="Unknown country" value={formatMetric(Math.max(0,total-located))} detail="Sessions without trusted attribution"/></div>
      <section className="cc-panel cc-geo-bars"><div className="cc-panel-heading"><h2>Top countries</h2><p>Active players by named country, including small launch samples.</p></div><div>{top.length?top.map(row=><article key={row.country_code}><span>{countryName(row.country_code)} ({row.country_code})</span><div><i style={{width:`${100*row.active_players/max}%`}}/></div><strong>{formatMetric(row.active_players)}</strong></article>):<p className="cc-inline-empty">No country data for this period.</p>}</div></section>
      <section className="cc-panel"><div className="cc-panel-heading"><h2>Country performance</h2><p>Conversion counts use attributed browser events only.</p></div><DataTable label="Country performance"><thead><tr><th>Country</th><th>Players</th><th>New</th><th>Returning</th><th>Sessions</th><th>Starts</th><th>Completions</th><th>Completion</th><th>Rooms</th></tr></thead><tbody>{data.countries.map(row=><tr key={row.country_code}><td>{countryName(row.country_code)} ({row.country_code})</td><td>{row.active_players}</td><td>{row.new_players}</td><td>{row.returning_players}</td><td>{row.sessions}</td><td>{row.game_starts}</td><td>{row.completions}</td><td>{formatMetric(row.completion_rate,'percent')}</td><td>{row.rooms_created}</td></tr>)}</tbody></DataTable></section>
      <p className="cc-privacy-note">Country is approximate and may be affected by VPNs, mobile networks, or proxies. No city, GPS coordinates, postal code, or IP address is stored.</p>
    </>:null}
  </>
}
