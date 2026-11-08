import { useCallback, useEffect, useState } from 'react'
import {
  detectInstallPlatform,
  INSTALL_PROMPT_DISMISS_KEY,
  isInstalledDisplayMode,
  isInstallPromptDismissed,
  type InstallPlatform,
} from './installPromptModel'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null
const installPromptListeners = new Set<(event: BeforeInstallPromptEvent | null) => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    deferredInstallPrompt = event as BeforeInstallPromptEvent
    installPromptListeners.forEach(listener => listener(deferredInstallPrompt))
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    installPromptListeners.forEach(listener => listener(null))
  })
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V3m0 0L8 7m4-4 4 4M7 10H5.8A1.8 1.8 0 0 0 4 11.8v7.4A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.8-1.8v-7.4a1.8 1.8 0 0 0-1.8-1.8H17" />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="install-prompt-close" type="button" onClick={onClick} aria-label="Dismiss install prompt">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
    </button>
  )
}

export default function InstallPrompt() {
  const [platform] = useState<InstallPlatform>(() => detectInstallPlatform(
    navigator.userAgent,
    navigator.maxTouchPoints,
  ))
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(deferredInstallPrompt)
  const [visible, setVisible] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    const listener = (event: BeforeInstallPromptEvent | null) => setNativePrompt(event)
    installPromptListeners.add(listener)
    return () => { installPromptListeners.delete(listener) }
  }, [])

  useEffect(() => {
    const standalone = isInstalledDisplayMode(
      window.matchMedia('(display-mode: standalone)').matches,
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    )
    let dismissed = false
    try { dismissed = isInstallPromptDismissed(window.localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY)) } catch { /* Storage can be unavailable. */ }

    if (!platform || standalone || dismissed) return
    if (platform === 'android' && !nativePrompt) return

    const timer = window.setTimeout(() => setVisible(true), 1200)
    return () => window.clearTimeout(timer)
  }, [nativePrompt, platform])

  useEffect(() => {
    const handleInstalled = () => setVisible(false)
    window.addEventListener('appinstalled', handleInstalled)
    return () => window.removeEventListener('appinstalled', handleInstalled)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    setShowIosGuide(false)
    try { window.localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(Date.now())) } catch { /* Storage can be unavailable. */ }
  }, [])

  const install = useCallback(async () => {
    if (platform === 'ios') {
      setShowIosGuide(true)
      return
    }
    if (!nativePrompt) return

    await nativePrompt.prompt()
    const choice = await nativePrompt.userChoice
    deferredInstallPrompt = null
    setNativePrompt(null)
    setVisible(false)
    if (choice.outcome === 'dismissed') {
      try { window.localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(Date.now())) } catch { /* Storage can be unavailable. */ }
    }
  }, [nativePrompt, platform])

  if (!visible) return null

  if (showIosGuide) {
    return (
      <aside className="install-guide" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
        <div className="install-guide-heading">
          <h2 id="install-guide-title">Install Decked</h2>
          <CloseButton onClick={dismiss} />
        </div>
        <div className="install-guide-steps">
          <div className="install-guide-step">
            <span className="install-guide-icon"><ShareIcon /></span>
            <span>Tap Share</span>
          </div>
          <span className="install-guide-arrow" aria-hidden="true">→</span>
          <div className="install-guide-step">
            <span className="install-guide-icon"><AddIcon /></span>
            <span>Add to Home Screen</span>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="install-banner" aria-label="Install Decked">
      <img src="/pwa-192x192.png" alt="" className="install-banner-icon" />
      <div className="install-banner-copy">
        <strong>Get Decked</strong>
        <span>Add to your home screen.</span>
      </div>
      <button className="install-banner-action" type="button" onClick={() => { void install() }}>Install</button>
      <CloseButton onClick={dismiss} />
    </aside>
  )
}
