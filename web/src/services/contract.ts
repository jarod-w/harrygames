import type { HouseId, Player } from '../data/types'

export const SESSION_KEY = 'hogwarts_session_v1'

export type HeadmasterLock = { salt: string; hash: string; failedLogins?: number; lockedUntil?: number }

export type AuthReason = 'locked' | 'wrong' | 'missing' | 'pending'

export type LoginResult = {
  ok: boolean
  player?: Player
  reason?: AuthReason
}

export type RegisterInput = {
  nickname: string
  avatar: string
  english: Player['grades']['english']
  math: Player['grades']['math']
  runes: readonly string[]
  now: number
}

export class StorageError extends Error {
  readonly code: 'taken' | 'unauthorized' | 'offline' | 'bad'
  constructor(code: StorageError['code']) {
    super(code)
    this.name = 'StorageError'
    this.code = code
  }
}

/** §3.3. Classrooms talk to this, whether the castle is on the device or the server. */
export interface StorageService {
  listPlayers(): Promise<Player[]>
  getPlayer(id: string): Promise<Player | undefined>
  savePlayer(p: Player): Promise<void>
  deletePlayer(id: string): Promise<void>
  houseCounts(): Promise<Record<HouseId, number>>
  getHeadmaster(): Promise<HeadmasterLock | null>
  saveHeadmaster(lock: HeadmasterLock): Promise<void>
  register(input: RegisterInput): Promise<Player>
  login(playerId: string, runes: readonly string[], now: number): Promise<LoginResult>
  headmasterSet(): Promise<boolean>
  setupHeadmaster(runes: readonly string[]): Promise<void>
  unlockHeadmaster(runes: readonly string[], now: number): Promise<{ ok: boolean; reason?: 'locked' | 'wrong' }>
  approvePlayer(playerId: string): Promise<Player>
  resetRunes(playerId: string, runes: readonly string[]): Promise<Player>
  endSession(): Promise<void>
}
