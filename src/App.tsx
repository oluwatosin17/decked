import { useState } from 'react'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import TruthOrDareGame from './TruthOrDareGame'
import SpicyStartersGame from './SpicyStartersGame'
import SelectGameMode, { LNT_MODES, DTC_MODES } from './SelectGameMode'
import LateNightTalksGame from './LateNightTalksGame'
import DinnerTableGame from './DinnerTableGame'

type Screen =
  | 'home' | 'browse'
  | 'lnt-select' | 'late-night-talks'
  | 'dtc-select' | 'dinner-table'
  | 'truth-or-dare' | 'spicy-starters'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  /* ── Select Game Mode: LNT ── */
  if (screen === 'lnt-select') {
    return (
      <SelectGameMode
        modes={LNT_MODES}
        onBack={() => setScreen('browse')}
        onSelect={() => setScreen('late-night-talks')}
      />
    )
  }

  if (screen === 'late-night-talks') {
    return <LateNightTalksGame onClose={() => setScreen('browse')} />
  }

  /* ── Select Game Mode: DTC ── */
  if (screen === 'dtc-select') {
    return (
      <SelectGameMode
        modes={DTC_MODES}
        onBack={() => setScreen('browse')}
        onSelect={() => setScreen('dinner-table')}
      />
    )
  }

  if (screen === 'dinner-table') {
    return <DinnerTableGame onClose={() => setScreen('browse')} />
  }

  /* ── Other games ── */
  if (screen === 'truth-or-dare') {
    return <TruthOrDareGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'spicy-starters') {
    return <SpicyStartersGame onClose={() => setScreen('browse')} />
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
