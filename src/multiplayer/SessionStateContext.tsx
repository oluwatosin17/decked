import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react'

export interface SharedSessionState {
  gameId: string
  values: Record<string, unknown>
  setValue: <T>(key: string, next: SetStateAction<T>) => void
  currentUserId: string
  hostUserId: string
  privatePrompt?: string | null
  requestedRematch?: boolean
  rematchRequestCount?: number
  players?: Array<{ userId: string; name: string; color: string }>
}

const SessionStateContext = createContext<SharedSessionState | null>(null)

export function SharedSessionProvider({ value, children }: { value: SharedSessionState; children: ReactNode }) {
  return <SessionStateContext.Provider value={value}>{children}</SessionStateContext.Provider>
}

export function useSharedSessionState<T>(gameId: string, key: string): [T | undefined, Dispatch<SetStateAction<T>> | undefined, boolean] {
  const session = useContext(SessionStateContext)
  if (!session || session.gameId !== gameId) return [undefined, undefined, false]
  return [session.values[key] as T | undefined, (next) => session.setValue<T>(key, next), true]
}

export function useMultiplayerSession() {
  return useContext(SessionStateContext)
}
