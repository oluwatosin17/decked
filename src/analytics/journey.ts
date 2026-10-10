import type { Screen } from '../navigation'
import type { AnalyticsEventName, AnalyticsEventProperties } from './types'

type Track = <Name extends AnalyticsEventName>(name: Name, properties: AnalyticsEventProperties[Name]) => string | null

export class DiscoveryJourneyTracker {
  private opened = false
  private lastScreen: Screen | null = null
  private quickPlaySets = new Set<string>()
  private shuffledSets = new Set<string>()

  constructor(private readonly emit: Track) {}

  appOpened(screen: Screen, entryPath: string, isPwa: boolean, attribution:Partial<AnalyticsEventProperties['app_opened']>={}) {
    if (this.opened) return
    this.opened = true
    this.emit('app_opened', { initial_screen_id: screen, entry_path: entryPath, is_pwa: isPwa, ...attribution })
  }

  screenViewed(screen: Screen, gameId?: AnalyticsEventProperties['screen_viewed']['game_id']) {
    if (this.lastScreen === screen) return
    const previous = this.lastScreen
    this.lastScreen = screen
    this.emit('screen_viewed', { screen_id: screen, ...(previous ? { previous_screen_id: previous } : {}), ...(gameId ? { game_id: gameId } : {}) })
  }

  quickPlayViewed(setId: string, gameIds: AnalyticsEventProperties['quick_play_viewed']['recommended_game_ids']) {
    if (this.quickPlaySets.has(setId)) return
    this.quickPlaySets.add(setId)
    this.emit('quick_play_viewed', { recommendation_set_id: setId, recommended_game_ids: gameIds })
  }

  quickPlayShuffled(setId: string, gameIds: AnalyticsEventProperties['quick_play_shuffled']['recommended_game_ids'], shuffleNumber: number) {
    if (this.shuffledSets.has(setId)) return
    this.shuffledSets.add(setId)
    this.emit('quick_play_shuffled', { recommendation_set_id: setId, recommended_game_ids: gameIds, shuffle_number: shuffleNumber })
  }
}
