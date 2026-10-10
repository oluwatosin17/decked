import { describe, expect, it, vi } from 'vitest'
import { AnalyticsClient, MAX_ANALYTICS_BATCH_BYTES, type AnalyticsStorage, type AnalyticsTransport } from './client'
import { validateEventProperties } from './schema'
import type { AnalyticsEnvelope } from './types'

class MemoryStorage implements AnalyticsStorage {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const ids = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
]

function sequenceUuid() {
  let index = 0
  return () => ids[index++] ?? `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`
}

function createHarness(overrides: Partial<ConstructorParameters<typeof AnalyticsClient>[0]> = {}) {
  const sent: AnalyticsEnvelope[][] = []
  const transport: AnalyticsTransport = overrides.transport ?? { send: async events => { sent.push([...events]) } }
  const scheduled: Array<{ callback: () => void; delay: number }> = []
  const storage = overrides.storage ?? new MemoryStorage()
  const client = new AnalyticsClient({
    enabled: true,
    environment: 'development',
    appVersion: 'test-version',
    storage,
    transport,
    now: () => Date.UTC(2026, 9, 9, 9),
    uuid: sequenceUuid(),
    viewportWidth: () => 1200,
    schedule: (callback, delay) => { scheduled.push({ callback, delay }); return scheduled.length },
    retryBaseMs: 100,
    random: () => 0.5,
    ...overrides,
  })
  return { client, sent, scheduled, storage }
}

describe('analytics schema validation', () => {
  it('accepts approved fields and rejects missing or unknown fields', () => {
    expect(validateEventProperties('screen_viewed', { screen_id: 'home' })).toBeNull()
    expect(validateEventProperties('screen_viewed', {})).toBe('missing_required_property')
    expect(validateEventProperties('screen_viewed', { screen_id: 'home', arbitrary: 'value' })).toBe('unknown_property')
    expect(validateEventProperties('game_selected', { game_id: 'not-a-game', selection_surface: 'browse' })).toBe('invalid_property_value')
    expect(validateEventProperties('deck_configured', {
      game_id: 'charades', requested_card_count: 20, actual_card_count: 20,
      built_in_card_count: 18, custom_card_count: 2,
    })).toBeNull()
  })

  it('rejects forbidden content keys at runtime', () => {
    expect(validateEventProperties('frontend_error', {
      error_fingerprint: 'safe-hash', error_class: 'render', screen_id: 'home', answer_text: 'private response',
    })).toBe('forbidden_property')
    expect(validateEventProperties('room_join_failed', { failure_reason: 'ABC234' })).toBe('invalid_property_value')
  })
})

describe('analytics identity and delivery', () => {
  it('persists the analytics user and activity session identities', async () => {
    const storage = new MemoryStorage()
    const first = createHarness({ storage, uuid: sequenceUuid() })
    first.client.track('screen_viewed', { screen_id: 'home' })
    await first.client.flush()

    const second = createHarness({ storage, uuid: () => ids[5] })
    second.client.track('screen_viewed', { screen_id: 'browse' })
    await second.client.flush()

    expect(first.sent[0][0].analytics_user_id).toBe(second.sent[0][0].analytics_user_id)
    expect(first.sent[0][0].analytics_session_id).toBe(second.sent[0][0].analytics_session_id)
  })

  it('does nothing when tracking is disabled', async () => {
    const storage = new MemoryStorage()
    const send = vi.fn(async () => {})
    const { client, scheduled } = createHarness({ enabled: false, storage, transport: { send } })

    expect(client.track('screen_viewed', { screen_id: 'home' })).toBeNull()
    await client.flush()

    expect(send).not.toHaveBeenCalled()
    expect(storage.values.size).toBe(0)
    expect(scheduled).toHaveLength(0)
  })

  it('rotates the activity session after 30 minutes of inactivity', async () => {
    const storage = new MemoryStorage()
    let now = Date.UTC(2026, 9, 9, 9)
    const first = createHarness({ storage, now: () => now, uuid: sequenceUuid() })
    first.client.track('screen_viewed', { screen_id: 'home' })
    await first.client.flush()

    now += 30 * 60 * 1000
    let nextId = 3
    const second = createHarness({ storage, now: () => now, uuid: () => ids[nextId++] })
    second.client.track('screen_viewed', { screen_id: 'browse' })
    await second.client.flush()

    expect(first.sent[0][0].analytics_user_id).toBe(second.sent[0][0].analytics_user_id)
    expect(first.sent[0][0].analytics_session_id).not.toBe(second.sent[0][0].analytics_session_id)
  })

  it('does not deliver a persisted queue from another environment', async () => {
    const storage = new MemoryStorage()
    storage.setItem('decked:analytics:queue:v1', JSON.stringify([{
      attempts: 1,
      event: {
        event_id: '90000000-0000-4000-8000-000000000009',
        event_name: 'screen_viewed',
        schema_version: 1,
        environment: 'development',
        occurred_at: new Date(Date.UTC(2026, 9, 9, 9)).toISOString(),
        analytics_user_id: '10000000-0000-4000-8000-000000000001',
        analytics_session_id: '10000000-0000-4000-8000-000000000002',
        app_version: 'old-development-build',
        properties: { screen_id: 'home' },
      },
    }]))
    const send = vi.fn(async () => {})
    const { client, scheduled } = createHarness({
      environment: 'production',
      storage,
      transport: { send },
    })

    await client.flush()

    expect(send).not.toHaveBeenCalled()
    expect(scheduled).toHaveLength(0)
  })

  it('retries with the original event ID and removes the event after success', async () => {
    const attempts: AnalyticsEnvelope[][] = []
    let shouldFail = true
    const { client, scheduled } = createHarness({
      transport: {
        send: async events => {
          attempts.push([...events])
          if (shouldFail) { shouldFail = false; throw new Error('offline') }
        },
      },
    })

    client.track('screen_viewed', { screen_id: 'home' })
    await client.flush()
    expect(scheduled.some(item => item.delay === 100)).toBe(true)
    await client.flush()
    await client.flush()

    expect(attempts).toHaveLength(2)
    expect(attempts[0][0].event_id).toBe(attempts[1][0].event_id)
  })

  it('deduplicates a repeated generated event ID', async () => {
    const repeatedId = '90000000-0000-4000-8000-000000000009'
    const { client, sent } = createHarness({ uuid: () => repeatedId })

    expect(client.track('screen_viewed', { screen_id: 'home' })).toBe(repeatedId)
    expect(client.track('screen_viewed', { screen_id: 'browse' })).toBeNull()
    await client.flush()

    expect(sent).toHaveLength(1)
    expect(sent[0]).toHaveLength(1)
  })

  it('coalesces a retry storm and adds bounded jitter', async () => {
    const send = vi.fn(async () => { throw new Error('temporary outage') })
    const { client, scheduled } = createHarness({ transport: { send }, random: () => 1, retryMaxMs: 500 })
    client.track('screen_viewed', { screen_id: 'home' })
    await Promise.all([client.flush(), client.flush(), client.flush()])
    expect(send).toHaveBeenCalledTimes(1)
    expect(scheduled.filter(item => item.delay > 0)).toEqual([{ callback: expect.any(Function), delay: 120 }])
  })

  it('keeps every transport batch below the ingestion payload ceiling', async () => {
    const { client, sent } = createHarness({ uuid: () => crypto.randomUUID() })
    const dimensionIds = Array.from({ length: 50 }, (_, index) => `dimension-${index}-${'x'.repeat(100)}`)
    for (let index = 0; index < 10; index += 1) {
      client.track('deck_configured', {
        game_id: 'charades', requested_card_count: 50, actual_card_count: 50,
        built_in_card_count: 50, custom_card_count: 0,
        category_ids: dimensionIds, mode_ids: dimensionIds,
      })
    }

    while (sent.flat().length < 10) await client.flush()

    expect(sent.length).toBeGreaterThan(1)
    for (const batch of sent) {
      expect(batch.length).toBeGreaterThan(0)
      expect(new TextEncoder().encode(JSON.stringify(batch)).byteLength).toBeLessThanOrEqual(MAX_ANALYTICS_BATCH_BYTES)
      expect(batch.length).toBeLessThanOrEqual(25)
    }
  })

  it('clamps an invalid configured batch size without stalling delivery', async () => {
    const { client, sent } = createHarness({ batchSize: 0 })
    client.track('screen_viewed', { screen_id: 'home' })
    await client.flush()
    expect(sent.flat()).toHaveLength(1)
  })

  it('never calls the transport in the gameplay interaction stack', () => {
    const send = vi.fn(async () => {})
    const { client } = createHarness({ transport: { send } })
    expect(client.track('screen_viewed', { screen_id: 'home' })).not.toBeNull()
    expect(send).not.toHaveBeenCalled()
  })

  it('adds only approved automatic context and creates a game session', async () => {
    const { client, sent } = createHarness()
    client.track('app_opened', { initial_screen_id: 'home', entry_path: '/', is_pwa: false })
    client.track('game_setup_started', { game_id: 'charades', play_mode: 'pass_and_play', initial_step: 'players' })
    await client.flush()

    expect(sent[0][0].properties.device_class).toBe('desktop')
    expect(sent[0][1].game_id).toBe('charades')
    expect(sent[0][1].play_mode).toBe('pass_and_play')
    expect(sent[0][1].game_session_id).toMatch(/^[0-9a-f-]{36}$/)
    expect(JSON.stringify(sent[0])).not.toMatch(/display_name|room_code|answer_text|prompt_text/)
  })
})
