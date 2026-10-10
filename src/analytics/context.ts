import type { AnalyticsEventProperties } from './types'

type Attribution = Pick<AnalyticsEventProperties['app_opened'],'utm_source'|'utm_medium'|'utm_campaign'|'utm_content'|'utm_term'|'referrer_domain'>
const safeValue=(value:string|null)=>value?.trim().toLowerCase().replace(/[^a-z0-9._:+/-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,128)||undefined

/** Privacy-safe attribution: campaign labels and hostname only, never full referrer URLs. */
export function acquisitionContext(search:string,referrer:string,currentHostname:string):Attribution{
  const params=new URLSearchParams(search);let referrerDomain:string|undefined
  try{const hostname=new URL(referrer).hostname.toLowerCase();if(hostname&&hostname!==currentHostname.toLowerCase())referrerDomain=hostname}catch{/* Direct or malformed referrer. */}
  return {
    utm_source:safeValue(params.get('utm_source')),utm_medium:safeValue(params.get('utm_medium')),
    utm_campaign:safeValue(params.get('utm_campaign')),utm_content:safeValue(params.get('utm_content')),
    utm_term:safeValue(params.get('utm_term')),referrer_domain:referrerDomain,
  }
}
