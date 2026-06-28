import { useState } from 'react'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import TruthOrDareGame from './TruthOrDareGame'
import SpicyStartersGame from './SpicyStartersGame'

type Screen = 'home' | 'browse' | 'truth-or-dare' | 'spicy-starters'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'truth-or-dare') {
    return <TruthOrDareGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'spicy-starters') {
    return <SpicyStartersGame onClose={() => setScreen('browse')} />
  }

  if (screen === 'browse') {
    return (
      <BrowsePage
        onHome={() => setScreen('home')}
        onPlayTruthOrDare={() => setScreen('truth-or-dare')}
        onPlaySpicyStarters={() => setScreen('spicy-starters')}
      />
    )
  }

  return (
    <HomePage
      onPlayTruthOrDare={() => setScreen('truth-or-dare')}
      onPlaySpicyStarters={() => setScreen('spicy-starters')}
      onBrowse={() => setScreen('browse')}
    />
  )
}
