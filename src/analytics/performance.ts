import { track } from './index'

let captured=false
const rating=(metric:'ttfb'|'dom_content_loaded'|'load_complete',value:number):'good'|'needs_improvement'|'poor'=>{
  const good=metric==='ttfb'?800:metric==='dom_content_loaded'?1800:2500
  const poor=metric==='ttfb'?1800:metric==='dom_content_loaded'?3500:4000
  return value<=good?'good':value<=poor?'needs_improvement':'poor'
}

export function captureNavigationPerformance(){
  if(captured||typeof window==='undefined'||typeof performance==='undefined')return
  captured=true
  const capture=()=>{
    const entry=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined
    if(!entry)return
    const values:Array<['ttfb'|'dom_content_loaded'|'load_complete',number]>=[['ttfb',entry.responseStart],['dom_content_loaded',entry.domContentLoadedEventEnd],['load_complete',entry.loadEventEnd]]
    for(const [metric,value] of values)if(Number.isFinite(value)&&value>=0)track('performance_measured',{metric_name:metric,duration_ms:Math.round(value),rating:rating(metric,value)})
  }
  if(document.readyState==='complete')window.setTimeout(capture,0);else window.addEventListener('load',capture,{once:true})
}
