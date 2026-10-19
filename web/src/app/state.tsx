import { createContext, useContext } from 'react'
import type { Player } from '../data/types'
import type { Route } from './route'

export type { Route } from './route'

export type AppState = {
  route: Route
  go: (r: Route) => void
  player: Player | null
  setPlayer: (p: Player | null) => void
  patchPlayer: (fn: (p: Player) => Player) => Player | null
  /** True while a question or boss turn should finish before lights-out. */
  setHoldCurfew: (held: boolean) => void
  takeLightsOut: () => boolean
  now: number
}

export const AppContext = createContext<AppState | null>(null)
export function useApp() {
  const c = useContext(AppContext)
  if (!c) throw new Error('useApp outside provider')
  return c
}
