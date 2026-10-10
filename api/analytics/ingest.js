const MAX_BODY_BYTES = 64 * 1024
const COUNTRY = /^[A-Z]{2}$/
const CONTINENT = /^(AF|AN|AS|EU|NA|OC|SA)$/

function send(response, status, payload) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(payload))
}

function normalizeEvents(body) {
  const events = Array.isArray(body) ? body : body?.events
  if (!Array.isArray(events) || events.length < 1 || events.length > 25) return null
  if (Buffer.byteLength(JSON.stringify(events), 'utf8') > MAX_BODY_BYTES) return null
  return events
}

export function acceptedEventIds(result) {
  const ids = [...(result?.accepted_event_ids || []), ...(result?.duplicate_event_ids || [])]
  return new Set(ids.filter(value => typeof value === 'string'))
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return send(response, 405, { error: 'method_not_allowed' })
  }

  const events = normalizeEvents(request.body)
  const authorization = request.headers.authorization
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!events) return send(response, 400, { error: 'invalid_analytics_batch' })
  if (!authorization?.startsWith('Bearer ')) return send(response, 401, { error: 'player_session_required' })
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error('[analytics-ingest] server_configuration_missing')
    return send(response, 503, { error: 'analytics_temporarily_unavailable' })
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
      return send(response, ingestResponse.status === 401 || ingestResponse.status === 403 ? 401 : 503, { error: 'analytics_ingest_failed' })
    }

    const country = String(request.headers['x-vercel-ip-country'] || '').toUpperCase()
    const continent = String(request.headers['x-vercel-ip-continent'] || '').toUpperCase()
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
        const geographyError = await geographyResponse.json().catch(() => ({}))
        console.error('[analytics-ingest] geography_attachment_failed', {
          status: geographyResponse.status,
          code: typeof geographyError?.code === 'string' ? geographyError.code : 'unknown',
          message: typeof geographyError?.message === 'string' ? geographyError.message.slice(0, 200) : 'unknown',
        })
        // Gameplay analytics is already durably accepted. Country enrichment is
        // best-effort and must never turn that success into a client retry storm.
        return send(response, 200, { accepted: true, attributed: false, accepted_events: storedEventIds.size, rejected_events: ingestResult?.rejected?.length ?? 0, geography_warning: 'attachment_failed', result: ingestResult })
      }
    }

    console.info('[analytics-ingest] accepted', { events: storedEventIds.size, rejected: ingestResult?.rejected?.length ?? 0, attributed: COUNTRY.test(country) && storedEventIds.size > 0, country: COUNTRY.test(country) ? country : 'unknown' })
    return send(response, 200, { accepted: true, attributed: COUNTRY.test(country) && storedEventIds.size > 0, accepted_events: storedEventIds.size, rejected_events: ingestResult?.rejected?.length ?? 0, result: ingestResult })
  } catch (error) {
    console.error('[analytics-ingest] unexpected_failure', error instanceof Error ? error.name : 'unknown')
    return send(response, 503, { error: 'analytics_temporarily_unavailable' })
  }
}
