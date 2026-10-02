import { createContext, useContext } from 'react'
import type { ClassroomId, Player } from '../data/types'

export type Route =
  | { name: 'splash' }
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'pending' }
  | { name: 'sorting' }
  | { name: 'wand' }
  | { name: 'card' }
  | { name: 'story' }
  | { name: 'hub' }
  | { name: 'classroom'; id: ClassroomId }
  | { name: 'result'; id: ClassroomId; correct: number; total: number; streak: number }
  | { name: 'boss' }
  | { name: 'houseCup' }
  | { name: 'pensieve' }
  | { name: 'shop' }
  | { name: 'curfew' }
  | { name: 'settings' }
  | { name: 'admin' }

export type AppState = {
  route: Route
  go: (r: Route) => void
  player: Player
  setPlayer: (p: Player) => void
  sessionStart: number
}

export const AppContext = createContext<AppState | null>(null)
export function useApp() {
  const c = useContext(AppContext)
  if (!c) throw new Error('useApp outside provider')
  return c
}

export const CURFEW_MS = 20 * 60 * 1000
export const REST_MS = 10 * 60 * 1000
