import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { initGalaxy } from './galaxy'
import { SoundProvider } from './audio/SoundProvider'
import { flushAnalytics } from './analytics'
import { installAnalyticsDeliveryRecovery } from './analytics/delivery'

installAnalyticsDeliveryRecovery(() => { void flushAnalytics() }, window, document)

// Keep already-open tabs on the current release. A newly activated worker can
// control an old document, but that document still runs its previous JS until
// it reloads. Reload once when the controller changes so stale builds cannot
// keep showing outdated configuration screens.
let reloadingForServiceWorker = false

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForServiceWorker) return
    reloadingForServiceWorker = true
    window.location.reload()
  })
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW(true)
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return

    const checkForUpdate = () => void registration.update()

    checkForUpdate()
    window.setInterval(checkForUpdate, 5 * 60 * 1000)

    // Safari can restore a page from its back-forward cache without doing a
    // normal load. Recheck the worker whenever that page becomes active.
    window.addEventListener('pageshow', checkForUpdate)
    window.addEventListener('focus', checkForUpdate)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
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
