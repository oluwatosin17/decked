import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { initGalaxy } from './galaxy'
import { SoundProvider } from './audio/SoundProvider'

// Register service worker immediately for PWA installability
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SoundProvider>
      <App />
    </SoundProvider>
  </StrictMode>,
)

// Galaxy runs completely outside React — immune to StrictMode double-invoke
initGalaxy()
