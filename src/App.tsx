import { useState, useRef } from 'react'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
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

type Screen =
  | 'home' | 'browse'
  | 'lnt-select' | 'late-night-talks'
  | 'dtc-select' | 'dinner-table'
  | 'you-laugh'
  | 'never-have-i-ever'
  | 'charades'
  | 'truth-or-dare' | 'spicy-starters'
  | 'lets-reconnect' | 'everyday-conversations' | 'wnrs' | 'put-a-finger-down'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const lntModeRef = useRef('couples')
  const dtcModeRef = useRef('date-night')

  /* ── Select Game Mode: LNT ── */
  if (screen === 'lnt-select') {
    return (
      <SelectGameMode
        modes={LNT_MODES}
        onBack={() => setScreen('browse')}
        onSelect={(mode) => { lntModeRef.current = mode; setScreen('late-night-talks') }}
      />
    )
  }

  if (screen === 'late-night-talks') {
    return <LateNightTalksGame mode={lntModeRef.current} onClose={() => setScreen('browse')} />
  }

  /* ── Select Game Mode: DTC ── */
  if (screen === 'dtc-select') {
    return (
      <SelectGameMode
        modes={DTC_MODES}
        onBack={() => setScreen('browse')}
        onSelect={(mode) => { dtcModeRef.current = mode; setScreen('dinner-table') }}
      />
    )
  }

  if (screen === 'dinner-table') {
    return <DinnerTableGame mode={dtcModeRef.current} onClose={() => setScreen('browse')} />
  }

  /* ── You Laugh You're Out ── */
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

  /* ── Let's Reconnect ── */
  if (screen === 'lets-reconnect') {
    return <LetsReconnectGame onClose={() => setScreen('browse')} />
  }

  /* ── Everyday Conversations ── */
  if (screen === 'everyday-conversations') {
    return <EverydayConversationsGame onClose={() => setScreen('browse')} />
  }

  /* ── WNRS ── */
  if (screen === 'wnrs') {
    return <WNRSGame onClose={() => setScreen('browse')} />
  }

  /* ── Put a Finger Down ── */
  if (screen === 'put-a-finger-down') {
    return <PutAFingerDownGame onClose={() => setScreen('browse')} />
  }

  /* ── Browse ── */
  if (screen === 'browse') {
    return (
      <BrowsePage
        onHome={() => setScreen('home')}
        onPlayTruthOrDare={() => setScreen('truth-or-dare')}
        onPlaySpicyStarters={() => setScreen('spicy-starters')}
        onPlayLateNightTalks={() => setScreen('lnt-select')}
        onPlayDinnerTable={() => setScreen('dtc-select')}
        onPlayYouLaugh={() => setScreen('you-laugh')}
        onPlayNeverHaveIEver={() => setScreen('never-have-i-ever')}
        onPlayCharades={() => setScreen('charades')}
        onPlayReconnect={() => setScreen('lets-reconnect')}
        onPlayEveryday={() => setScreen('everyday-conversations')}
        onPlayWNRS={() => setScreen('wnrs')}
        onPlayFingerDown={() => setScreen('put-a-finger-down')}
      />
    )
  }

  /* ── Home ── */
  return (
    <HomePage
      onPlayTruthOrDare={() => setScreen('truth-or-dare')}
      onPlaySpicyStarters={() => setScreen('spicy-starters')}
      onPlayLateNightTalks={() => setScreen('lnt-select')}
      onBrowse={() => setScreen('browse')}
    />
  )
}
