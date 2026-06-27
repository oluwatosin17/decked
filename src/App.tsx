import { useState } from 'react'
import HomePage from './pages/HomePage'
import TruthOrDareGame from './TruthOrDareGame'
import SpicyStartersGame from './SpicyStartersGame'

type Screen = 'home' | 'truth-or-dare' | 'spicy-starters'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'truth-or-dare') {
    return <TruthOrDareGame onClose={() => setScreen('home')} />
  }

  if (screen === 'spicy-starters') {
    return <SpicyStartersGame onClose={() => setScreen('home')} />
  }

  return (
    <HomePage
      onPlayTruthOrDare={() => setScreen('truth-or-dare')}
      onPlaySpicyStarters={() => setScreen('spicy-starters')}
    />
  )
}
