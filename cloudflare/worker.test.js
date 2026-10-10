import { describe, expect, it } from 'vitest'
import { handleAnalyticsIngest } from './worker'

describe('Cloudflare analytics worker', () => {
  it('rejects methods other than POST', async () => {
    const response = await handleAnalyticsIngest(new Request('https://example.com/api/analytics/ingest'), {})
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST')
  })

  it('rejects an empty event batch before reading configuration', async () => {
    const response = await handleAnalyticsIngest(new Request('https://example.com/api/analytics/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ events: [] }),
    }), {})
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'invalid_analytics_batch' })
  })

  it('requires a player session', async () => {
    const response = await handleAnalyticsIngest(new Request('https://example.com/api/analytics/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ events: [{ event_id: 'event-1' }] }),
    }), {})
    expect(response.status).toBe(401)
  })
})
