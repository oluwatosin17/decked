import { describe, expect, it, vi } from 'vitest'
import { AnalyticsClient, type AnalyticsStorage } from './client'

class MemoryStorage implements AnalyticsStorage {
  private readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

describe('analytics interaction performance', () => {
  it('keeps tracking local and outside the network call stack', () => {
    const send = vi.fn(async () => {})
    const client = new AnalyticsClient({
      enabled: true,
      environment: 'development',
      appVersion: 'performance-test',
      storage: new MemoryStorage(),
      transport: { send },
      uuid: () => crypto.randomUUID(),
      schedule: () => 0,
      diagnostic: () => {},
    })
    const durations: number[] = []

    for (let index = 0; index < 1_000; index += 1) {
      const started = performance.now()
      client.track('screen_viewed', { screen_id: index % 2 ? 'home' : 'browse' })
      durations.push(performance.now() - started)
    }

    durations.sort((a, b) => a - b)
    const p95 = durations[Math.floor(durations.length * 0.95)]
    const maximum = durations[durations.length - 1] ?? 0
    console.info(`[analytics-profile] track_count=1000 p95_ms=${p95.toFixed(3)} max_ms=${maximum.toFixed(3)} network_calls=${send.mock.calls.length}`)

    expect(send).not.toHaveBeenCalled()
    expect(p95).toBeLessThan(10)
  })
})
