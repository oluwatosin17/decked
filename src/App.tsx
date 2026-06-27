import { useState } from 'react'
import HomePage from './pages/HomePage'
import TruthOrDareGame from './TruthOrDareGame'

type Screen = 'home' | 'truth-or-dare'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'truth-or-dare') {
    return <TruthOrDareGame onClose={() => setScreen('home')} />
  }

  return <HomePage onPlayTruthOrDare={() => setScreen('truth-or-dare')} />
}
