import { ensureAnonymousUser, supabase } from '../multiplayer/supabase'
import type { AnalyticsTransport } from './client'

export const supabaseAnalyticsTransport: AnalyticsTransport = {
  async send(events) {
    await ensureAnonymousUser()
    const { error } = await supabase.rpc('decked_ingest_analytics_events', { p_events: events })
    if (error) throw error
  },
}

export const serverAnalyticsTransport: AnalyticsTransport = {
  async send(events) {
    await ensureAnonymousUser()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Analytics player session is unavailable.')
    const response = await fetch('/api/analytics/ingest', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    })
    if (!response.ok) throw new Error(`Analytics ingestion failed (${response.status}).`)
  },
}
