import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { soundEngine } from './soundEngine'
import type { SoundElement, SoundEvent } from './soundEvents'

const STORAGE_KEY = 'decked:sound:v1'

interface SoundContextValue {
  muted: boolean
  play: (event: SoundEvent) => void
  toggleMuted: () => void
}

const SoundContext = createContext<SoundContextValue | null>(null)

function initialMuted() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === 'muted'
}

function inferSound(target: SoundElement): SoundEvent {
  if (target.dataset.sound && target.dataset.sound !== 'none') return target.dataset.sound
  const label = `${target.textContent ?? ''} ${target.getAttribute('aria-label') ?? ''}`.toLowerCase()
  if (label.includes('shuffle')) return 'deck.shuffle'
  if (label.includes('next card') || label.includes('another card')) return 'card.next'
  if (label.includes('start') || label.includes('play now') || label.includes("i'm 18")) return 'game.start'
  return 'ui.tap'
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(initialMuted)

  const play = useCallback((event: SoundEvent) => {
    if (!muted) soundEngine.play(event)
  }, [muted])

  const toggleMuted = useCallback(() => {
    setMuted(current => {
      const next = !current
      window.localStorage.setItem(STORAGE_KEY, next ? 'muted' : 'on')
      if (!next) soundEngine.play('turn.change')
      return next
    })
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<SoundElement>('button, [data-sound]')
      if (!target || target.getAttribute('aria-disabled') === 'true' || target.hasAttribute('disabled')) return
      if (!muted && target.dataset.sound !== 'none') soundEngine.play(inferSound(target))
    }
    document.addEventListener('pointerdown', handlePointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [muted])

  const value = useMemo(() => ({ muted, play, toggleMuted }), [muted, play, toggleMuted])

  return (
    <SoundContext.Provider value={value}>
      {children}
      <button
        type="button"
        className="sound-toggle"
        onClick={toggleMuted}
        data-sound="none"
        aria-label={muted ? 'Turn sound on' : 'Mute sound'}
        aria-pressed={muted}
        title={muted ? 'Sound off' : 'Sound on'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (!context) throw new Error('useSound must be used inside SoundProvider')
  return context
}
