import { useEffect, useState } from 'react'
import { getAuditLog, type AuditResponse } from './api'
import { LoadingState, PageHeader, StatePanel } from './Primitives'
import { FilterBar,FilterDrawer } from './FilterDrawer'
import { filterDateLabel } from './model'

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

export default function AuditPage({ isAdmin }: { isAdmin: boolean }) {
  const today = new Date()
  const [from, setFrom] = useState(() => isoDate(new Date(today.getTime() - 29 * 86_400_000)))
  const [to, setTo] = useState(() => isoDate(today))
  const [action, setAction] = useState('')
  const [data, setData] = useState<AuditResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filtersOpen,setFiltersOpen]=useState(false);const [draftFrom,setDraftFrom]=useState(from);const [draftTo,setDraftTo]=useState(to);const [draftAction,setDraftAction]=useState(action)

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    setStatus('loading')
    void getAuditLog(from, to, action).then(result => { if (active) { setData(result); setStatus('ready') } })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [isAdmin, from, to, action])

  if (!isAdmin) return <><PageHeader eyebrow="SETTINGS" title="Audit log" description="Administrative accountability for Command Centre actions." /><StatePanel title="Admin access required"><p>Audit records are restricted to active administrators. No audit data was requested.</p></StatePanel></>

  return <>
    <PageHeader eyebrow="SETTINGS" title="Audit log" description="Privacy-safe records of exports and administrative changes. Raw export data and staff identifiers are not shown." />
    <FilterBar summary={`${filterDateLabel(from,to)} · ${action?action.replace(/_/g,' '):'All actions'}`} count={Number(Boolean(action))} onOpen={()=>{setDraftFrom(from);setDraftTo(to);setDraftAction(action);setFiltersOpen(true)}}/>
    <FilterDrawer open={filtersOpen} title="Audit filters" description="Narrow administrative activity by date and action." onClose={()=>setFiltersOpen(false)} onApply={()=>{setFrom(draftFrom);setTo(draftTo);setAction(draftAction);setFiltersOpen(false)}} onReset={()=>{const current=new Date();setDraftFrom(isoDate(new Date(current.getTime()-29*86_400_000)));setDraftTo(isoDate(current));setDraftAction('')}}><div className="cc-drawer-filter-grid"><label>From<input required type="date" value={draftFrom} max={draftTo} onChange={event=>setDraftFrom(event.target.value)}/></label><label>To<input required type="date" value={draftTo} min={draftFrom} onChange={event=>setDraftTo(event.target.value)}/></label><label>Action<select value={draftAction} onChange={event=>setDraftAction(event.target.value)}><option value="">All actions</option><option value="report_exported">Report exported</option><option value="staff_role_changed">Staff role changed</option><option value="analytics_identity_deleted">Analytics identity deleted</option><option value="settings_changed">Settings changed</option><option value="room_investigation_started">Room investigation</option></select></label></div></FilterDrawer>
    {status === 'loading' ? <LoadingState /> : status === 'error' ? <StatePanel title="Audit log unavailable"><p>The authorized audit query failed. Adjust the date range or try again.</p></StatePanel> : !data?.rows.length ? <StatePanel title="No audit activity"><p>No matching administrative actions occurred in this period.</p></StatePanel> : <section className="cc-panel"><div className="cc-panel-heading"><h2>Administrative activity</h2><p>Showing up to 500 most-recent matching entries.</p></div>{data.truncated ? <div className="cc-warning">Results limited <span>Narrow the date range or action filter to see additional entries.</span></div> : null}<div className="cc-table-wrap"><table className="cc-table"><thead><tr><th scope="col">Date</th><th scope="col">Actor</th><th scope="col">Role</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Summary</th></tr></thead><tbody>{data.rows.map((row, index) => <tr key={`${row.occurred_at}-${row.action}-${index}`}><td>{new Date(row.occurred_at).toLocaleString()}</td><td>{row.actor}</td><td>{row.actor_role}</td><td>{row.action.replace(/_/g, ' ')}</td><td>{row.target_type?.replace(/_/g, ' ') ?? '—'}</td><td>{row.metadata_summary || 'No sensitive metadata recorded'}</td></tr>)}</tbody></table></div></section>}
  </>
}
