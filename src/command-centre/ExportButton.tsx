import { useState } from 'react'
import { exportCommandCentreCsv } from './api'
import type { DashboardFilters } from './model'
import { downloadExport } from './exportDownload'

export function ExportButton({report,filters,source,browser,appVersion,visibleGameIds,trendDays}:{report:'overview'|'games'|'funnels'|'multiplayer'|'reliability';filters:DashboardFilters;source?:string;browser?:string;appVersion?:string;visibleGameIds?:string[];trendDays?:7|30}){
  const [state,setState]=useState<'idle'|'busy'|'error'>('idle')
  const run=async()=>{setState('busy');try{const result=await exportCommandCentreCsv(report,filters,{source,browser,appVersion,visibleGameIds,trendDays});downloadExport(result.filename,result.csv);setState('idle')}catch{setState('error')}}
  return <div className="cc-export"><button className="cc-button cc-button-secondary" disabled={state==='busy'} onClick={()=>void run()}>{state==='busy'?'Generating…':`Export ${report} CSV`}</button>{state==='error'?<span role="alert">Export failed or was not authorized.</span>:null}</div>
}
