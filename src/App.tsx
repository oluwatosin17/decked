import { useState, useEffect, useCallback } from 'react'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import QuickPlay from './QuickPlay'
import TruthOrDareGame from './TruthOrDareGame'
import SpicyStartersGame from './SpicyStartersGame'
import SelectGameMode, { LNT_MODES, DTC_MODES } from './SelectGameMode'
import LateNightTalksGame from './LateNightTalksGame'
import DinnerTableGame from './DinnerTableGame'
import LaughYouAreOutGame from './LaughYouAreOutGame'
import NeverHaveIEverGame from './NeverHaveIEverGame'
import CharadesGame from './CharadesGame'
import LetsReconnectGame from './LetsReconnectGame'
import EverydayConversationsGame from './EverydayConversationsGame'
import WNRSGame from './WNRSGame'
import PutAFingerDownGame from './PutAFingerDownGame'
import TakeASipGame from './TakeASipGame'
import SipOrSpillGame from './SipOrSpillGame'
import DoOrDrinkGame from './DoOrDrinkGame'
import IcebreakerGame from './IcebreakerGame'
import RedFlagGreenFlagGame from './RedFlagGreenFlagGame'
import TwoTruthsBluffGame from './TwoTruthsBluffGame'
import MostLikelyToGame from './MostLikelyToGame'
import ChooseYourSideGame from './ChooseYourSideGame'
import WhoSaidThatGame from './WhoSaidThatGame'
import { screenFromLocation, urlForScreen, type Screen } from './navigation'
import { usePersistentGameState } from './hooks/usePersistentGameState'
import PlayTogether from './multiplayer/PlayTogether'
import GamePlayMode from './GamePlayMode'
import type { MultiplayerGameId } from './multiplayer/types'

const GAME_DESTINATIONS: Record<string, { localScreen: Screen; multiplayerId: MultiplayerGameId }> = {
  'truth-or-dare': { localScreen: 'truth-or-dare', multiplayerId: 'truth-or-dare' },
  'spicy-starters': { localScreen: 'spicy-starters', multiplayerId: 'spicy-starters' },
  'late-night-talks': { localScreen: 'lnt-select', multiplayerId: 'late-night-talks' },
  'dinner-table': { localScreen: 'dtc-select', multiplayerId: 'dinner-table' },
  'you-laugh': { localScreen: 'you-laugh', multiplayerId: 'you-laugh' },
  'never-have-i-ever': { localScreen: 'never-have-i-ever', multiplayerId: 'never-have-i-ever' },
  charades: { localScreen: 'charades', multiplayerId: 'charades' },
  'lets-reconnect': { localScreen: 'lets-reconnect', multiplayerId: 'reconnect' },
  'everyday-conversations': { localScreen: 'everyday-conversations', multiplayerId: 'everyday-conversation' },
  wnrs: { localScreen: 'wnrs', multiplayerId: 'strangers' },
  'put-a-finger-down': { localScreen: 'put-a-finger-down', multiplayerId: 'finger-down' },
  'take-a-sip': { localScreen: 'take-a-sip', multiplayerId: 'take-a-sip' },
  'sip-or-spill': { localScreen: 'sip-or-spill', multiplayerId: 'sip-or-spill' },
  'do-or-drink': { localScreen: 'do-or-drink', multiplayerId: 'do-or-drink' },
  icebreaker: { localScreen: 'icebreaker', multiplayerId: 'icebreaker' },
  'red-flag-green-flag': { localScreen: 'red-flag-green-flag', multiplayerId: 'red-flag-green-flag' },
  'two-truths-bluff': { localScreen: 'two-truths-bluff', multiplayerId: 'two-truths-bluff' },
  'most-likely-to': { localScreen: 'most-likely-to', multiplayerId: 'most-likely-to' },
  'choose-your-side': { localScreen: 'choose-your-side', multiplayerId: 'choose-your-side' },
  'who-said-that': { localScreen: 'who-said-that', multiplayerId: 'who-said-that' },
}

const selectedGameFromLocation = () => {
  const candidate = new URL(window.location.href).searchParams.get('game')
  return Object.values(GAME_DESTINATIONS).find(item => item.multiplayerId === candidate)?.multiplayerId ?? null
}

export default function App() {
  const [screen, setScreenState] = useState<Screen>(screenFromLocation)
  const [selectedGameId, setSelectedGameId] = useState<MultiplayerGameId | null>(selectedGameFromLocation)
  const [lntMode, setLntMode] = usePersistentGameState('app', 'late-night-mode', 'couples')
  const [dtcMode, setDtcMode] = usePersistentGameState('app', 'dinner-table-mode', 'date-night')

  const setScreen = useCallback((next: Screen, replace = false) => {
    const url = urlForScreen(next)
    window.history[replace ? 'replaceState' : 'pushState']({ screen: next }, '', url)
    setScreenState(next)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    const handlePopState = () => { setScreenState(screenFromLocation()); setSelectedGameId(selectedGameFromLocation()) }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const chooseGame = useCallback((gameId: string) => {
    const destination = GAME_DESTINATIONS[gameId]
    if (!destination) { setScreen('browse'); return }
    setSelectedGameId(destination.multiplayerId)
    window.history.pushState({ screen: 'play-mode', gameId: destination.multiplayerId }, '', `${urlForScreen('play-mode')}?game=${destination.multiplayerId}`)
    setScreenState('play-mode')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [setScreen])

  const openPlayTogether = useCallback((gameId: MultiplayerGameId) => {
    setSelectedGameId(gameId)
    window.history.pushState({ screen: 'play-together', gameId }, '', `${urlForScreen('play-together')}?game=${gameId}`)
    setScreenState('play-together')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  /* ── Quick Play ── */
  if (screen === 'quick-play') {
    return <QuickPlay onBack={() => setScreen('home')} onPlay={chooseGame} />
  }

  if (screen === 'play-mode') {
    if (!selectedGameId) return <BrowsePageRedirect onRedirect={() => setScreen('browse', true)} />
    const destination = Object.values(GAME_DESTINATIONS).find(item => item.multiplayerId === selectedGameId)!
    return <GamePlayMode gameId={selectedGameId} onBack={() => setScreen('browse')} onPassAndPlay={() => setScreen(destination.localScreen)} onPlayTogether={() => openPlayTogether(selectedGameId)} />
  }

  if (screen === 'play-together') {
    return <PlayTogether initialGameId={selectedGameId} onClose={() => setScreen('home')} />
  }

  /* ── Select Game Mode: LNT ── */
  if (screen === 'lnt-select') {
    return (
      <SelectGameMode
        modes={LNT_MODES}
        onBack={() => setScreen('browse')}
        onSelect={(mode) => { setLntMode(mode); setScreen('late-night-talks') }}
      />
    )
  }

  if (screen === 'late-night-talks') {
    return <LateNightTalksGame mode={lntMode} onClose={() => setScreen('browse')} />
  }

  /* ── Select Game Mode: DTC ── */
  if (screen === 'dtc-select') {
    return (
      <SelectGameMode
        modes={DTC_MODES}
        onBack={() => setScreen('browse')}
        onSelect={(mode) => { setDtcMode(mode); setScreen('dinner-table') }}
      />
    )
  }

  if (screen === 'dinner-table') {
    return <DinnerTableGame mode={dtcMode} onClose={() => setScreen('browse')} />
  }

  /* ── Keep a Straight Face ── */
  if (screen === 'you-laugh') {
    return <LaughYouAreOutGame onClose={() => setScreen('browse')} />
  }

  /* ── Never Have I Ever ── */
  if (screen === 'never-have-i-ever') {
    return <NeverHaveIEverGame onClose={() => setScreen('browse')} />
  }

  /* ── Charades ── */
  if (screen === 'charades') {
    return <CharadesGame onClose={() => setScreen('browse')} />
  }

  /* ── Other games ── */
  if (screen === 'truth-or-dare') {
    return <TruthOrDareGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'spicy-starters') {
    return <SpicyStartersGame onClose={() => setScreen('browse')} />
  }

  /* ── Back to Us ── */
  if (screen === 'lets-reconnect') {
    return <LetsReconnectGame onClose={() => setScreen('browse')} />
  }

  /* ── Real Talk, Every Day ── */
  if (screen === 'everyday-conversations') {
    return <EverydayConversationsGame onClose={() => setScreen('browse')} />
  }

  /* ── WNRS ── */
  if (screen === 'wnrs') {
    return <WNRSGame onClose={() => setScreen('browse')} />
  }

  /* ── Drop a Finger ── */
  if (screen === 'put-a-finger-down') {
    return <PutAFingerDownGame onClose={() => setScreen('browse')} />
  }

  /* ── Take a Sip ── */
  if (screen === 'take-a-sip') {
    return <TakeASipGame onClose={() => setScreen('browse')} />
  }

  /* ── Answer or Drink ── */
  if (screen === 'sip-or-spill') {
    return <SipOrSpillGame onClose={() => setScreen('browse')} />
  }

  /* ── Dare or Pour ── */
  if (screen === 'do-or-drink') {
    return <DoOrDrinkGame onClose={() => setScreen('browse')} />
  }

  /* ── Icebreaker ── */
  if (screen === 'icebreaker') {
    return <IcebreakerGame onClose={() => setScreen('browse')} />
  }

  /* ── Dateable or Dealbreaker ── */
  if (screen === 'red-flag-green-flag') {
    return <RedFlagGreenFlagGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'two-truths-bluff') {
    return <TwoTruthsBluffGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'most-likely-to') {
    return <MostLikelyToGame onClose={() => setScreen('browse')} />
  }
  if (screen === 'choose-your-side') {
    return <ChooseYourSideGame onClose={() => setScreen('browse')} />
  }
  if (screen === 'who-said-that') {
    return <WhoSaidThatGame onClose={() => setScreen('browse')} />
  }

  /* ── Browse ── */
  if (screen === 'browse') {
    return (
      <BrowsePage
        onHome={() => setScreen('home')}
        onQuickPlay={() => setScreen('quick-play')}
        onPlayTruthOrDare={() => chooseGame('truth-or-dare')}
        onPlaySpicyStarters={() => chooseGame('spicy-starters')}
        onPlayLateNightTalks={() => chooseGame('late-night-talks')}
        onPlayDinnerTable={() => chooseGame('dinner-table')}
        onPlayYouLaugh={() => chooseGame('you-laugh')}
        onPlayNeverHaveIEver={() => chooseGame('never-have-i-ever')}
        onPlayCharades={() => chooseGame('charades')}
        onPlayReconnect={() => chooseGame('lets-reconnect')}
        onPlayEveryday={() => chooseGame('everyday-conversations')}
        onPlayWNRS={() => chooseGame('wnrs')}
        onPlayFingerDown={() => chooseGame('put-a-finger-down')}
        onPlayTakeASip={() => chooseGame('take-a-sip')}
        onPlaySipOrSpill={() => chooseGame('sip-or-spill')}
        onPlayDoOrDrink={() => chooseGame('do-or-drink')}
        onPlayIcebreaker={() => chooseGame('icebreaker')}
        onPlayRedFlagGreenFlag={() => chooseGame('red-flag-green-flag')}
        onPlayTwoTruthsBluff={() => chooseGame('two-truths-bluff')}
        onPlayMostLikelyTo={() => chooseGame('most-likely-to')}
        onPlayChooseYourSide={() => chooseGame('choose-your-side')}
        onPlayWhoSaidThat={() => chooseGame('who-said-that')}
      />
    )
  }

  /* ── Home ── */
  return (
    <HomePage
      onQuickPlay={() => setScreen('quick-play')}
      onPlayTruthOrDare={() => chooseGame('truth-or-dare')}
      onPlaySpicyStarters={() => chooseGame('spicy-starters')}
      onPlayLateNightTalks={() => chooseGame('late-night-talks')}
      onPlayCharades={() => chooseGame('charades')}
      onPlayNeverHaveIEver={() => chooseGame('never-have-i-ever')}
      onPlayYouLaugh={() => chooseGame('you-laugh')}
      onPlayTwoTruthsBluff={() => chooseGame('two-truths-bluff')}
      onPlayMostLikelyTo={() => chooseGame('most-likely-to')}
      onPlayChooseYourSide={() => chooseGame('choose-your-side')}
      onPlayWhoSaidThat={() => chooseGame('who-said-that')}
      onBrowse={() => setScreen('browse')}
      onPlayTogether={() => setScreen('play-together')}
    />
  )
}

function BrowsePageRedirect({ onRedirect }: { onRedirect: () => void }) {
  useEffect(onRedirect, [onRedirect])
  return null
}
