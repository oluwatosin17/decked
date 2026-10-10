import { deviceClassForWidth, isAnalyticsEnvironment, isGameId, isUuid, sanitizeProperties, validateEventProperties } from './schema'
import type {
  AnalyticsEnvelope,
  AnalyticsEnvironment,
  AnalyticsEventName,
  AnalyticsEventProperties,
  AnalyticsProperties,
  AnalyticsPlayMode,
} from './types'

const USER_KEY = 'decked:analytics:user:v1'
const SESSION_KEY = 'decked:analytics:session:v1'
const GAME_SESSION_KEY = 'decked:analytics:game-session:v1'
const QUEUE_KEY = 'decked:analytics:queue:v1'
const SEEN_KEY = 'decked:analytics:seen:v1'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const MAX_QUEUE_SIZE = 100
const MAX_SEEN_IDS = 200
// Leave headroom below the database's 64 KiB JSONB limit for transport encoding.
export const MAX_ANALYTICS_BATCH_BYTES = 60 * 1024

export interface AnalyticsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface AnalyticsTransport {
  send(events: readonly AnalyticsEnvelope[]): Promise<void>
}

interface StoredSession { id: string; lastActivityAt: number }
interface StoredGameSession extends StoredSession { gameId: string; playMode: AnalyticsPlayMode; completed: boolean }
interface QueuedEvent { event: AnalyticsEnvelope; attempts: number }

export interface AnalyticsClientOptions {
  enabled: boolean
  environment: AnalyticsEnvironment
  appVersion: string
  transport: AnalyticsTransport
  storage?: AnalyticsStorage
  now?: () => number
  uuid?: () => string
  viewportWidth?: () => number | undefined
  schedule?: (callback: () => void, delayMs: number) => unknown
  diagnostic?: (message: string, detail?: unknown) => void
  retryBaseMs?: number
  retryMaxMs?: number
  random?: () => number
  batchSize?: number
}

function parseStored<T>(storage: AnalyticsStorage | undefined, key: string): T | null {
  if (!storage) return null
  try { return JSON.parse(storage.getItem(key) ?? 'null') as T | null } catch { return null }
}

function persist(storage: AnalyticsStorage | undefined, key: string, value: unknown) {
  if (!storage) return
  try { storage.setItem(key, JSON.stringify(value)) } catch { /* Analytics never blocks gameplay. */ }
}

export class AnalyticsClient {
  private readonly now: () => number
  private readonly uuid: () => string
  private readonly schedule: (callback: () => void, delayMs: number) => unknown
  private queue: QueuedEvent[]
  private seenIds: string[]
  private flushScheduled = false
  private sending = false

  constructor(private readonly options: AnalyticsClientOptions) {
    this.now = options.now ?? Date.now
    this.uuid = options.uuid ?? (() => crypto.randomUUID())
    this.schedule = options.schedule ?? ((callback, delay) => window.setTimeout(callback, delay))
    this.queue = options.enabled
      ? (parseStored<QueuedEvent[]>(options.storage, QUEUE_KEY) ?? [])
        .filter(item => item?.event?.environment === options.environment)
        .slice(-MAX_QUEUE_SIZE)
      : []
    this.seenIds = options.enabled ? (parseStored<string[]>(options.storage, SEEN_KEY) ?? []).slice(-MAX_SEEN_IDS) : []
    if (this.queue.length) this.requestFlush(0)
  }

  track<Name extends AnalyticsEventName>(name: Name, properties: AnalyticsEventProperties[Name]): string | null {
    if (!this.options.enabled) return null
    if (!isAnalyticsEnvironment(this.options.environment) || !this.options.appVersion.trim()) {
      this.report('invalid_configuration')
      return null
    }

    const now = this.now()
    const withAutomaticProperties: AnalyticsProperties = {
      ...(properties as AnalyticsProperties),
      ...(name === 'app_opened' ? { device_class: deviceClassForWidth(this.options.viewportWidth?.()) } : {}),
    }
    const validationError = validateEventProperties(name, withAutomaticProperties)
    if (validationError) {
      this.report(`rejected_${validationError}`, { eventName: name })
      return null
    }

    const eventId = this.uuid()
    if (!isUuid(eventId) || this.seenIds.includes(eventId) || this.queue.some(item => item.event.event_id === eventId)) {
      this.report('duplicate_or_invalid_event_id', { eventName: name })
      return null
    }

    const analyticsUserId = this.identityId()
    const analyticsSessionId = this.sessionId(now)
    if (!analyticsUserId || !analyticsSessionId) return null

    const raw = withAutomaticProperties as Record<string, unknown>
    const gameId = isGameId(raw.game_id) ? raw.game_id : undefined
    const playMode = raw.play_mode === 'pass_and_play' || raw.play_mode === 'play_together' ? raw.play_mode : undefined
    const gameSessionId = this.gameSessionId(name, raw, gameId, playMode, now)
    const roomRef = isUuid(raw.multiplayer_room_ref) ? raw.multiplayer_room_ref : undefined

    const event: AnalyticsEnvelope = {
      event_id: eventId,
      event_name: name,
      schema_version: 1,
      environment: this.options.environment,
      occurred_at: new Date(now).toISOString(),
      analytics_user_id: analyticsUserId,
      analytics_session_id: analyticsSessionId,
      ...(gameSessionId ? { game_session_id: gameSessionId } : {}),
      ...(roomRef ? { multiplayer_room_ref: roomRef } : {}),
      ...(gameId ? { game_id: gameId } : {}),
      ...(playMode ? { play_mode: playMode } : {}),
      app_version: this.options.appVersion.trim().slice(0, 100),
      properties: sanitizeProperties(withAutomaticProperties),
    }

    this.queue.push({ event, attempts: 0 })
    if (this.queue.length > MAX_QUEUE_SIZE) this.queue.splice(0, this.queue.length - MAX_QUEUE_SIZE)
    this.persistQueue()
    this.requestFlush(0)
    return eventId
  }

  async flush(): Promise<void> {
    this.flushScheduled = false
    if (!this.options.enabled || this.sending || !this.queue.length) return
    this.sending = true
    const batch = this.nextBatch()
    const eventIds = new Set(batch.map(item => item.event.event_id))
    try {
      await this.options.transport.send(batch.map(item => item.event))
      this.queue = this.queue.filter(item => !eventIds.has(item.event.event_id))
      this.seenIds.push(...eventIds)
      this.seenIds = this.seenIds.slice(-MAX_SEEN_IDS)
      persist(this.options.storage, SEEN_KEY, this.seenIds)
      this.persistQueue()
      if (this.queue.length) this.requestFlush(0)
    } catch (error) {
      for (const item of this.queue) if (eventIds.has(item.event.event_id)) item.attempts += 1
      this.persistQueue()
      const attempts = Math.max(...batch.map(item => item.attempts))
      const baseDelay = Math.min(
        (this.options.retryBaseMs ?? 1000) * (2 ** Math.min(attempts - 1, 6)),
        this.options.retryMaxMs ?? 60_000,
      )
      const jitter = 0.8 + (this.options.random ?? Math.random)() * 0.4
      const delay = Math.round(baseDelay * jitter)
      this.report('delivery_failed', error)
      this.requestFlush(delay)
    } finally {
      this.sending = false
    }
  }

  private identityId(): string | null {
    const existing = parseStored<string>(this.options.storage, USER_KEY)
    if (isUuid(existing)) return existing
    const created = this.uuid()
    if (!isUuid(created)) {
      this.report('invalid_identity_id')
      return null
    }
    persist(this.options.storage, USER_KEY, created)
    return created
  }

  private sessionId(now: number): string | null {
    const existing = parseStored<StoredSession>(this.options.storage, SESSION_KEY)
    const active = existing && isUuid(existing.id) && Number.isFinite(existing.lastActivityAt)
      && now - existing.lastActivityAt >= 0 && now - existing.lastActivityAt < SESSION_TIMEOUT_MS
    const id = active ? existing.id : this.uuid()
    if (!isUuid(id)) {
      this.report('invalid_session_id')
      return null
    }
    persist(this.options.storage, SESSION_KEY, { id, lastActivityAt: now })
    return id
  }

  private gameSessionId(
    name: AnalyticsEventName,
    properties: Record<string, unknown>,
    gameId: string | undefined,
    playMode: AnalyticsPlayMode | undefined,
    now: number,
  ): string | undefined {
    if (isUuid(properties.game_session_id)) return properties.game_session_id
    if (!gameId || !playMode) return undefined
    const existing = parseStored<StoredGameSession>(this.options.storage, GAME_SESSION_KEY)
    const canResume = existing && isUuid(existing.id) && existing.gameId === gameId && existing.playMode === playMode
      && now - existing.lastActivityAt >= 0 && now - existing.lastActivityAt < SESSION_TIMEOUT_MS
    const startsNew = name === 'game_setup_started' || name === 'game_replay_selected' || !canResume
    const id = startsNew ? this.uuid() : existing.id
    if (!isUuid(id)) return undefined
    const completed = name === 'game_completed' || name === 'game_session_abandoned' || name === 'multiplayer_game_completed'
    persist(this.options.storage, GAME_SESSION_KEY, { id, gameId, playMode, lastActivityAt: now, completed })
    return id
  }

  private persistQueue() { persist(this.options.storage, QUEUE_KEY, this.queue) }

  private nextBatch(): QueuedEvent[] {
    const countLimit = Math.max(1, Math.min(this.options.batchSize ?? 25, 25))
    const batch: QueuedEvent[] = []
    for (const item of this.queue.slice(0, countLimit)) {
      const candidate = [...batch, item]
      const bytes = new TextEncoder().encode(JSON.stringify(candidate.map(entry => entry.event))).byteLength
      if (batch.length && bytes > MAX_ANALYTICS_BATCH_BYTES) break
      batch.push(item)
    }
    return batch
  }

  private requestFlush(delay: number) {
    if (this.flushScheduled) return
    this.flushScheduled = true
    this.schedule(() => { void this.flush() }, delay)
  }

  private report(message: string, detail?: unknown) {
    if (this.options.environment === 'development') this.options.diagnostic?.(`[analytics] ${message}`, detail)
  }
}
