const MAX_BODY_BYTES = 64 * 1024
const COUNTRY = /^[A-Z]{2}$/
const CONTINENT = /^(AF|AN|AS|EU|NA|OC|SA)$/

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      ...extraHeaders,
    },
  })
}

function normalizeEvents(body) {
  const events = Array.isArray(body) ? body : body?.events
  if (!Array.isArray(events) || events.length < 1 || events.length > 25) return null
  if (new TextEncoder().encode(JSON.stringify(events)).byteLength > MAX_BODY_BYTES) return null
  return events
}

function acceptedEventIds(result) {
  const ids = [...(result?.accepted_event_ids || []), ...(result?.duplicate_event_ids || [])]
  return new Set(ids.filter(value => typeof value === 'string'))
}

export async function handleAnalyticsIngest(request, env) {
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' }, { allow: 'POST' })
  }

  const body = await request.json().catch(() => null)
  const events = normalizeEvents(body)
  const authorization = request.headers.get('authorization')
  const supabaseUrl = env.VITE_SUPABASE_URL
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!events) return json(400, { error: 'invalid_analytics_batch' })
  if (!authorization?.startsWith('Bearer ')) return json(401, { error: 'player_session_required' })
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error('[analytics-ingest] server_configuration_missing')
    return json(503, { error: 'analytics_temporarily_unavailable' })
  }

  try {
    const ingestResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/decked_ingest_analytics_events`, {
      method: 'POST',
      headers: { apikey: publishableKey, authorization, 'content-type': 'application/json' },
      body: JSON.stringify({ p_events: events }),
    })
    const ingestResult = await ingestResponse.json().catch(() => null)
    if (!ingestResponse.ok) {
      console.error('[analytics-ingest] supabase_ingest_failed', ingestResponse.status)
      return json(ingestResponse.status === 401 || ingestResponse.status === 403 ? 401 : 503, { error: 'analytics_ingest_failed' })
    }

    const country = String(request.cf?.country || request.headers.get('cf-ipcountry') || '').toUpperCase()
    const continent = String(request.cf?.continent || '').toUpperCase()
    const storedEventIds = acceptedEventIds(ingestResult)
    if (COUNTRY.test(country) && storedEventIds.size) {
      const entries = events.filter(event => storedEventIds.has(event.event_id)).map(event => ({
        environment: event.environment,
        event_id: event.event_id,
        country_code: country,
        ...(CONTINENT.test(continent) ? { continent_code: continent } : {}),
      }))
      const geographyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/decked_attach_analytics_geography`, {
        method: 'POST',
        headers: { apikey: serviceRoleKey, authorization: `Bearer ${serviceRoleKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ p_entries: entries }),
      })
      if (!geographyResponse.ok) {
        console.error('[analytics-ingest] geography_attachment_failed', geographyResponse.status)
        return json(200, { accepted: true, attributed: false, accepted_events: storedEventIds.size, rejected_events: ingestResult?.rejected?.length ?? 0, geography_warning: 'attachment_failed', result: ingestResult })
      }
    }

    return json(200, { accepted: true, attributed: COUNTRY.test(country) && storedEventIds.size > 0, accepted_events: storedEventIds.size, rejected_events: ingestResult?.rejected?.length ?? 0, result: ingestResult })
  } catch (error) {
    console.error('[analytics-ingest] unexpected_failure', error instanceof Error ? error.name : 'unknown')
    return json(503, { error: 'analytics_temporarily_unavailable' })
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/analytics/ingest') return handleAnalyticsIngest(request, env)
    return json(404, { error: 'not_found' })
  },
}
