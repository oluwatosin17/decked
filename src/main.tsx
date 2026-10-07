import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { initGalaxy } from './galaxy'
import { SoundProvider } from './audio/SoundProvider'

// Keep already-open tabs on the current release. A newly activated worker can
// control an old document, but that document still runs its previous JS until
// it reloads. Reload once when the controller changes so stale builds cannot
// keep showing outdated configuration screens.
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloading) {
      reloading = true
      window.location.reload()
    }
  })
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW(true)
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return
    void registration.update()
    window.setInterval(() => void registration.update(), 5 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SoundProvider>
      <App />
    </SoundProvider>
  </StrictMode>,
)

// Galaxy runs completely outside React — immune to StrictMode double-invoke
initGalaxy()
