import { track } from './index'
import { PASS_AND_PLAY_GAMES } from './passAndPlayRegistry'
import type { AnalyticsEventName, AnalyticsEventProperties } from './types'

type Track = <Name extends AnalyticsEventName>(name: Name, properties: AnalyticsEventProperties[Name]) => string | null
type BrowserStorage = Pick<globalThis.Storage, 'getItem'>
interface Lifecycle { lastStep?: string; started: boolean; completed: boolean; startedAt: number; lastCard?: number }
const PREFIX = 'decked:game-session:v1'
const ANALYTICS_GAME_SESSION_KEY = 'decked:analytics:game-session:v1'

function read(storage: BrowserStorage | undefined, localGameId: string, key?: string): unknown {
  if (!storage || !key) return undefined
  try { return JSON.parse(storage.getItem(`${PREFIX}:${localGameId}:${key}`) ?? 'null') } catch { return undefined }
}

function count(value: unknown) { return Array.isArray(value) ? value.length : 0 }
function integer(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0 }
function optionIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string')
  if (typeof value === 'string' || typeof value === 'number') return [String(value)]
  return []
}

export class PassAndPlayTracker {
  private lifecycle = new Map<string, Lifecycle>()
  constructor(private readonly emit: Track, private readonly storage?: BrowserStorage, private readonly now = Date.now) {}

  observeStep(localGameId: string, step: string, initialStep: string) {
    const definition = PASS_AND_PLAY_GAMES[localGameId]
    if (!definition) return
    let state = this.lifecycle.get(localGameId)
    if (!state) {
      state = { started: false, completed: false, startedAt: this.now() }
      this.lifecycle.set(localGameId, state)
      if (step === initialStep) this.emit('game_setup_started', { game_id: definition.gameId, play_mode: 'pass_and_play', initial_step: step })
      else this.emit('game_setup_resumed', { game_id: definition.gameId, play_mode: 'pass_and_play', restored_step: step })
    }
    if (state.lastStep === step) return

    if (state.completed && !definition.completionSteps.includes(step)) {
      const completedId = this.activeGameSessionId()
      if (completedId) this.emit('game_replay_selected', { completed_game_session_id: completedId, game_id: definition.gameId, play_mode: 'pass_and_play' })
      state.started = false
      state.completed = false
      state.startedAt = this.now()
      state.lastCard = undefined
    }

    const priorStep = state.lastStep
    if (priorStep === 'playerSetup' && step !== priorStep) {
      this.emit('player_setup_completed', { game_id: definition.gameId, play_mode: 'pass_and_play', player_count: Math.max(1, count(read(this.storage, localGameId, definition.playerKey))) })
    }
    const option = priorStep ? definition.optionSteps?.[priorStep] : undefined
    if (option) {
      const ids = optionIds(read(this.storage, localGameId, option.stateKey))
      if (ids.length) this.emit('game_option_selected', { game_id: definition.gameId, option_type: option.optionType, option_ids: ids, selected_count: ids.length })
    }

    state.lastStep = step
    if (definition.playableSteps.includes(step)) this.startIfNeeded(localGameId, step, state)
    if (definition.completionSteps.includes(step)) this.complete(localGameId, state)
  }

  observeValue(localGameId: string, key: string, value: unknown) {
    const definition = PASS_AND_PLAY_GAMES[localGameId]
    const state = this.lifecycle.get(localGameId)
    if (!definition || !state?.started || key !== definition.cardKey || typeof value !== 'number') return
    const card = integer(value)
    if (state.lastCard === undefined) { state.lastCard = card; return }
    if (card <= state.lastCard) { state.lastCard = card; return }
    const total = this.totalCards(localGameId)
    this.emit('card_advanced', { game_id: definition.gameId, play_mode: 'pass_and_play', from_card_number: state.lastCard + 1, to_card_number: card + 1, advance_reason: 'next' })
    state.lastCard = card
    if (total > 0 && card >= total) this.complete(localGameId, state)
    else this.presentCard(localGameId, card, total)
  }

  abandon(localGameId: string, lastStep = 'unknown') {
    const definition = PASS_AND_PLAY_GAMES[localGameId]
    const state = this.lifecycle.get(localGameId)
    if (!definition || !state?.started || state.completed) return
    this.emit('game_session_abandoned', {
      game_id: definition.gameId, play_mode: 'pass_and_play', last_lifecycle_stage: 'gameplay',
      last_step: lastStep === 'unknown' ? state.lastStep ?? 'unknown' : lastStep,
      cards_presented: (state.lastCard ?? 0) + 1,
    })
    state.completed = true
  }

  private startIfNeeded(localGameId: string, step: string, state: Lifecycle) {
    if (state.started) return
    const definition = PASS_AND_PLAY_GAMES[localGameId]
    const total = this.totalCards(localGameId)
    const customCount = count(read(this.storage, localGameId, definition.customCardsKey))
    const actual = definition.deckKey ? count(read(this.storage, localGameId, definition.deckKey)) : total
    this.emit('deck_configured', { game_id: definition.gameId, requested_card_count: total || actual, actual_card_count: actual || total, built_in_card_count: Math.max(0, (actual || total) - customCount), custom_card_count: customCount })
    this.emit('game_started', { game_id: definition.gameId, play_mode: 'pass_and_play', starting_step: step, configured_card_count: actual || total, player_count: Math.max(1, count(read(this.storage, localGameId, definition.playerKey))) })
    state.started = true
    state.startedAt = this.now()
    const card = integer(read(this.storage, localGameId, definition.cardKey))
    state.lastCard = card
    this.presentCard(localGameId, card, total || actual)
  }

  private presentCard(localGameId: string, card: number, total: number) {
    const definition = PASS_AND_PLAY_GAMES[localGameId]
    const customCount = count(read(this.storage, localGameId, definition.customCardsKey))
    // Mixed decks do not persist a parallel provenance list. A zero custom-card
    // count proves the visible position is built in; otherwise omit the event
    // instead of inspecting prompt text or inventing a content source.
    if ((!definition.cardSourceReliable && customCount > 0) || total <= 0 || card >= total) return
    this.emit('card_presented', { game_id: definition.gameId, play_mode: 'pass_and_play', card_number: card + 1, configured_card_count: total, content_source: 'built_in' })
  }

  private complete(localGameId: string, state: Lifecycle) {
    if (state.completed) return
    const definition = PASS_AND_PLAY_GAMES[localGameId]
    const total = this.totalCards(localGameId)
    const skipped = integer(read(this.storage, localGameId, definition.skippedKey))
    this.emit('game_completed', {
      game_id: definition.gameId, play_mode: 'pass_and_play', completion_reason: definition.completionReason,
      cards_presented: total || (state.lastCard ?? 0) + 1, cards_skipped: skipped,
      duration_seconds: Math.max(0, Math.floor((this.now() - state.startedAt) / 1000)),
      player_count: Math.max(1, count(read(this.storage, localGameId, definition.playerKey))),
    })
    state.completed = true
  }

  private totalCards(localGameId: string) {
    const definition = PASS_AND_PLAY_GAMES[localGameId]
    return integer(read(this.storage, localGameId, definition.totalKey)) || count(read(this.storage, localGameId, definition.deckKey))
  }

  private activeGameSessionId(): string | null {
    try {
      const value = JSON.parse(this.storage?.getItem(ANALYTICS_GAME_SESSION_KEY) ?? 'null') as { id?: unknown } | null
      return typeof value?.id === 'string' ? value.id : null
    } catch { return null }
  }
}

const browserStorage = typeof window === 'undefined' ? undefined : window.localStorage
export const passAndPlayTracker = new PassAndPlayTracker(track, browserStorage)
