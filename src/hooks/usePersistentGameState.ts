import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useSharedSessionState } from '../multiplayer/SessionStateContext'

const PREFIX = 'decked:game-session:v1'

function storageKey(gameId: string, key: string) {
  return `${PREFIX}:${gameId}:${key}`
}

function resolveInitial<T>(initial: T | (() => T)): T {
  return typeof initial === 'function' ? (initial as () => T)() : initial
}

export function usePersistentGameState<T>(gameId: string, key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [sharedValue, setSharedValue, hasSharedSession] = useSharedSessionState<T>(gameId, key)
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(storageKey(gameId, key))
      if (stored !== null) return JSON.parse(stored) as T
    } catch { /* Fall back to the supplied initial value. */ }
    return resolveInitial(initial)
  })

  useEffect(() => {
    try { window.localStorage.setItem(storageKey(gameId, key), JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
  }, [gameId, key, value])

  return hasSharedSession && setSharedValue ? [sharedValue ?? resolveInitial(initial), setSharedValue] : [value, setValue]
}

export function useGameStep<T extends string>(gameId: string, initial: T, allowed: readonly T[]): [T, Dispatch<SetStateAction<T>>] {
  const [sharedStep, setSharedStep, hasSharedSession] = useSharedSessionState<T>(gameId, 'step')
  const [step, setStoredStep] = useState<T>(() => {
    const fromUrl = new URL(window.location.href).searchParams.get('step') as T | null
    if (fromUrl && allowed.includes(fromUrl)) return fromUrl
    try {
      const stored = window.localStorage.getItem(storageKey(gameId, 'step')) as T | null
      if (stored && allowed.includes(stored)) return stored
    } catch { /* Use the initial step. */ }
    return initial
  })

  useEffect(() => {
    try { window.localStorage.setItem(storageKey(gameId, 'step'), step) } catch { /* Storage may be unavailable. */ }
  }, [gameId, step])

  const setStep = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const resolved = typeof next === 'function' ? (next as (previous: T) => T)(step) : next
    if (resolved === step) return
    const url = new URL(window.location.href)
    url.searchParams.set('step', resolved)
    window.history.pushState({ ...window.history.state, step: resolved }, '', `${url.pathname}${url.search}${url.hash}`)
    setStoredStep(resolved)
  }, [step])

  useEffect(() => {
    const syncFromHistory = () => {
      const candidate = new URL(window.location.href).searchParams.get('step') as T | null
      if (candidate && allowed.includes(candidate)) setStoredStep(candidate)
    }
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [allowed, setStoredStep])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('step') === step) return
    url.searchParams.set('step', step)
    window.history.replaceState({ ...window.history.state, step }, '', `${url.pathname}${url.search}${url.hash}`)
  }, [step])

  return hasSharedSession && setSharedStep ? [sharedStep && allowed.includes(sharedStep) ? sharedStep : initial, setSharedStep] : [step, setStep]
}
