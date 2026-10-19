import type { ClassroomId } from '../data/types'

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
  | { name: 'result'; id: ClassroomId; correct: number; total: number; streak: number; points: number; gold: number }
  | { name: 'boss' }
  | { name: 'review' }
  | { name: 'houseCup' }
  | { name: 'pensieve' }
  | { name: 'shop' }
  | { name: 'curfew' }
  | { name: 'settings' }
  | { name: 'admin' }
