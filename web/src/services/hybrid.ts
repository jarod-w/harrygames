import type { HouseId, Player } from '../data/types'
import type { HeadmasterLock, LoginResult, RegisterInput, StorageService } from './contract'
import { LocalStorageService } from './localStorage'
import { RemoteStorageService } from './remoteStorage'

/**
 * Use the castle server when it answers. Otherwise keep the on-device prototype,
 * so a laptop without the server can still be played.
 */
export class HybridStorage implements StorageService {
  private mode: Promise<'remote' | 'local'>
  private local: LocalStorageService
  private remote: RemoteStorageService

  constructor(local = new LocalStorageService(), remote = new RemoteStorageService()) {
    this.local = local
    this.remote = remote
    this.mode = this.probe()
  }

  private async probe(): Promise<'remote' | 'local'> {
    if (import.meta.env.VITE_STORAGE === 'local') return 'local'
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 1500)
      const res = await fetch('/api/health', { signal: ctrl.signal })
      clearTimeout(timer)
      return res.ok ? 'remote' : 'local'
    } catch {
      return 'local'
    }
  }

  private async use(): Promise<StorageService> {
    return (await this.mode) === 'remote' ? this.remote : this.local
  }

  listPlayers() { return this.use().then((s) => s.listPlayers()) }
  getPlayer(id: string) { return this.use().then((s) => s.getPlayer(id)) }
  savePlayer(p: Player) { return this.use().then((s) => s.savePlayer(p)) }
  deletePlayer(id: string) { return this.use().then((s) => s.deletePlayer(id)) }
  houseCounts(): Promise<Record<HouseId, number>> { return this.use().then((s) => s.houseCounts()) }
  getHeadmaster(): Promise<HeadmasterLock | null> { return this.use().then((s) => s.getHeadmaster()) }
  saveHeadmaster(lock: HeadmasterLock) { return this.use().then((s) => s.saveHeadmaster(lock)) }
  register(input: RegisterInput) { return this.use().then((s) => s.register(input)) }
  login(playerId: string, runes: readonly string[], now: number): Promise<LoginResult> {
    return this.use().then((s) => s.login(playerId, runes, now))
  }
  headmasterSet() { return this.use().then((s) => s.headmasterSet()) }
  setupHeadmaster(runes: readonly string[]) { return this.use().then((s) => s.setupHeadmaster(runes)) }
  unlockHeadmaster(runes: readonly string[], now: number) { return this.use().then((s) => s.unlockHeadmaster(runes, now)) }
  approvePlayer(id: string) { return this.use().then((s) => s.approvePlayer(id)) }
  resetRunes(id: string, runes: readonly string[]) { return this.use().then((s) => s.resetRunes(id, runes)) }
  endSession() { return this.use().then((s) => s.endSession()) }
}

export const storage: StorageService = new HybridStorage()
