import { describe, expect, it } from 'vitest'
import { DiscoveryJourneyTracker } from './journey'
import { PassAndPlayTracker } from './passAndPlay'
import { PASS_AND_PLAY_GAMES } from './passAndPlayRegistry'
import type { AnalyticsEventName, AnalyticsEventProperties } from './types'

type Track = <Name extends AnalyticsEventName>(name: Name, properties: AnalyticsEventProperties[Name]) => string | null

class ReadStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  set(game: string, key: string, value: unknown) { this.values.set(`decked:game-session:v1:${game}:${key}`, JSON.stringify(value)) }
}

function recordingTrack() {
  const events: Array<{ name: AnalyticsEventName; properties: Record<string, unknown> }> = []
  const emit = ((name: AnalyticsEventName, properties: Record<string, unknown>) => {
    events.push({ name, properties })
    return `event-${events.length}`
  }) as Track
  return { events, emit }
}

describe('discovery instrumentation', () => {
  it('records the main discovery journey once per committed action', () => {
    const { events, emit } = recordingTrack()
    const journey = new DiscoveryJourneyTracker(emit)

    journey.appOpened('home', '/', false)
    journey.screenViewed('home')
    journey.screenViewed('browse')
    journey.quickPlayViewed('10000000-0000-4000-8000-000000000001', ['charades', 'truth-or-dare', 'icebreaker'])
    journey.quickPlayShuffled('10000000-0000-4000-8000-000000000002', ['we-just-met', 'reconnect', 'strangers'], 1)

    expect(events.map(event => event.name)).toEqual([
      'app_opened', 'screen_viewed', 'screen_viewed', 'quick_play_viewed', 'quick_play_shuffled',
    ])
  })

  it('prevents duplicate mount effects under React Strict Mode', () => {
    const { events, emit } = recordingTrack()
    const journey = new DiscoveryJourneyTracker(emit)

    for (let mount = 0; mount < 2; mount += 1) {
      journey.appOpened('home', '/', false)
      journey.screenViewed('home')
      journey.quickPlayViewed('10000000-0000-4000-8000-000000000001', ['charades'])
      journey.quickPlayShuffled('10000000-0000-4000-8000-000000000002', ['icebreaker'], 1)
    }

    expect(events.map(event => event.name)).toEqual(['app_opened', 'screen_viewed', 'quick_play_viewed', 'quick_play_shuffled'])
  })
})

describe('pass-and-play instrumentation', () => {
  it('covers every canonical game exactly once', () => {
    const canonicalIds = Object.values(PASS_AND_PLAY_GAMES).map(game => game.gameId)
    expect(canonicalIds).toHaveLength(21)
    expect(new Set(canonicalIds)).toHaveLength(21)
  })

  it('records setup through completion without reading prompt content', () => {
    const { events, emit } = recordingTrack()
    const storage = new ReadStorage()
    let now = 1_000
    storage.set('late-night-talks', 'players', [{ name: 'must-not-leak' }, { name: 'also-private' }])
    storage.set('late-night-talks', 'totalCards', 2)
    storage.set('late-night-talks', 'questions', ['private prompt one', 'private prompt two'])
    storage.set('late-night-talks', 'cardIndex', 0)
    storage.set('late-night-talks', 'skipCount', 0)
    const journey = new PassAndPlayTracker(emit, storage, () => now)

    journey.observeStep('late-night-talks', 'playerSetup', 'playerSetup')
    journey.observeStep('late-night-talks', 'deckSize', 'playerSetup')
    journey.observeStep('late-night-talks', 'getReady', 'playerSetup')
    journey.observeStep('late-night-talks', 'game', 'playerSetup')
    journey.observeStep('late-night-talks', 'game', 'playerSetup')
    now += 5_000
    storage.set('late-night-talks', 'cardIndex', 1)
    journey.observeValue('late-night-talks', 'cardIndex', 1)
    storage.set('late-night-talks', 'cardIndex', 2)
    journey.observeValue('late-night-talks', 'cardIndex', 2)

    expect(events.map(event => event.name)).toEqual([
      'game_setup_started', 'player_setup_completed', 'deck_configured', 'game_started',
      'card_presented', 'card_advanced', 'card_presented', 'card_advanced', 'game_completed',
    ])
    expect(JSON.stringify(events)).not.toContain('must-not-leak')
    expect(JSON.stringify(events)).not.toContain('private prompt')
  })

  it('does not duplicate lifecycle events when effects repeat', () => {
    const { events, emit } = recordingTrack()
    const storage = new ReadStorage()
    storage.set('most-likely-to', 'players', [{ name: 'private' }, { name: 'private' }])
    storage.set('most-likely-to', 'deckSize', 1)
    storage.set('most-likely-to', 'deck', ['private prompt'])
    storage.set('most-likely-to', 'cardIndex', 0)
    const journey = new PassAndPlayTracker(emit, storage)

    journey.observeStep('most-likely-to', 'playerSetup', 'playerSetup')
    journey.observeStep('most-likely-to', 'playerSetup', 'playerSetup')
    journey.observeStep('most-likely-to', 'vote', 'playerSetup')
    journey.observeStep('most-likely-to', 'vote', 'playerSetup')
    journey.observeValue('most-likely-to', 'cardIndex', 0)
    journey.observeValue('most-likely-to', 'cardIndex', 0)

    expect(events.filter(event => event.name === 'game_setup_started')).toHaveLength(1)
    expect(events.filter(event => event.name === 'game_started')).toHaveLength(1)
    expect(events.find(event => event.name === 'card_presented')?.properties).toMatchObject({ play_mode: 'pass_and_play' })
    expect(events.filter(event => event.name === 'card_presented')).toHaveLength(1)
  })

  it('records built-in card positions without inspecting content and omits ambiguous mixed provenance', () => {
    const builtIn = recordingTrack()
    const builtInStorage = new ReadStorage()
    builtInStorage.set('everyday-conversations', 'players', [{ name: 'private' }])
    builtInStorage.set('everyday-conversations', 'totalCards', 1)
    builtInStorage.set('everyday-conversations', 'questions', ['private prompt'])
    builtInStorage.set('everyday-conversations', 'cardIndex', 0)
    builtInStorage.set('everyday-conversations', 'customCards', [])
    const builtInJourney = new PassAndPlayTracker(builtIn.emit, builtInStorage)
    builtInJourney.observeStep('everyday-conversations', 'theme', 'theme')
    builtInJourney.observeStep('everyday-conversations', 'game', 'theme')

    expect(builtIn.events.find(event => event.name === 'card_presented')?.properties).toMatchObject({
      game_id: 'everyday-conversation',
      card_number: 1,
      content_source: 'built_in',
    })
    expect(JSON.stringify(builtIn.events)).not.toContain('private prompt')

    const mixed = recordingTrack()
    const mixedStorage = new ReadStorage()
    mixedStorage.set('everyday-conversations', 'players', [{ name: 'private' }])
    mixedStorage.set('everyday-conversations', 'totalCards', 2)
    mixedStorage.set('everyday-conversations', 'questions', ['private built-in prompt', 'private custom prompt'])
    mixedStorage.set('everyday-conversations', 'cardIndex', 0)
    mixedStorage.set('everyday-conversations', 'customCards', ['private custom prompt'])
    const mixedJourney = new PassAndPlayTracker(mixed.emit, mixedStorage)
    mixedJourney.observeStep('everyday-conversations', 'theme', 'theme')
    mixedJourney.observeStep('everyday-conversations', 'game', 'theme')

    expect(mixed.events.some(event => event.name === 'card_presented')).toBe(false)
    expect(JSON.stringify(mixed.events)).not.toContain('private prompt')
  })
})
