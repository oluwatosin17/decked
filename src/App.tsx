import { useState } from 'react'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import TruthOrDareGame from './TruthOrDareGame'
import SpicyStartersGame from './SpicyStartersGame'
import SelectGameMode from './SelectGameMode'
import LateNightTalksGame from './LateNightTalksGame'

type Screen = 'home' | 'browse' | 'select-mode' | 'truth-or-dare' | 'spicy-starters' | 'late-night-talks'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [prevScreen, setPrevScreen] = useState<Screen>('home')

  const openSelectMode = (from: Screen) => {
    setPrevScreen(from)
    setScreen('select-mode')
  }

  if (screen === 'select-mode') {
    return (
      <SelectGameMode
        onBack={() => setScreen(prevScreen)}
        onSelect={() => setScreen('late-night-talks')}
      />
    )
  }

  if (screen === 'truth-or-dare') {
    return <TruthOrDareGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'spicy-starters') {
    return <SpicyStartersGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'late-night-talks') {
    return <LateNightTalksGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'browse') {
    return (
      <BrowsePage
        onHome={() => setScreen('home')}
        onPlayTruthOrDare={() => setScreen('truth-or-dare')}
        onPlaySpicyStarters={() => setScreen('spicy-starters')}
        onPlayLateNightTalks={() => openSelectMode('browse')}
      />
    )
  }

  return (
    <HomePage
      onPlayTruthOrDare={() => setScreen('truth-or-dare')}
      onPlaySpicyStarters={() => setScreen('spicy-starters')}
      onPlayLateNightTalks={() => openSelectMode('home')}
      onBrowse={() => setScreen('browse')}
    />
  )
}
