import type { HouseId, Player } from '../data/types'
import { blankActive, createPlayer, nicknameKey, SAMPLE_RUNES } from '../game/player'
import { checkRunes, hashRunes, LOCK_MS, lockRunes, matchesLock, MAX_TRIES, withRunes } from '../game/password'
import { StorageError, type HeadmasterLock, type RegisterInput, type StorageService } from './contract'

const KEY = 'hogwarts_players_v1'
const HEAD_KEY = 'hogwarts_headmaster_v1'

async function seedPlayers(now: number): Promise<Player[]> {
  const password = { salt: 'seed-salt-v1', hash: await hashRunes(SAMPLE_RUNES, 'seed-salt-v1') }
  const mk = (
    playerId: string, nickname: string, avatar: string, house: HouseId, core: Player['wand']['core'],
    english: Player['grades']['english'], math: Player['grades']['math'],
    housePoints: number, galleons: number, answered: number, correct: number, bestStreak: number,
    status?: Player['status'],
  ) => blankActive({ playerId, nickname, avatar, house, core, english, math, housePoints, galleons, answered, correct, bestStreak, password, now, status })
  return [
    mk('wiz_001', 'Little Hermione', '🦉', 'ravenclaw', 'phoenix', 'movers', 4, 350, 120, 210, 172, 14),
    mk('wiz_002', 'Rocket Ron', '🐸', 'gryffindor', 'dragon', 'starters', 2, 280, 60, 140, 103, 9),
    mk('wiz_003', 'Luna Bean', '🐇', 'ravenclaw', 'unicorn', 'flyers', 5, 410, 200, 260, 221, 17),
    mk('wiz_004', 'Sneaky Sam', '🦊', 'slytherin', 'dragon', 'movers', 3, 300, 90, 180, 139, 11),
    mk('wiz_005', 'Puff Mei', '🐼', 'hufflepuff', 'phoenix', 'starters', 1, 190, 40, 90, 74, 6),
    mk('wiz_006', 'Dragon Kai', '🐉', 'gryffindor', 'unicorn', 'flyers', 6, 330, 150, 120, 94, 8),
    { ...mk('wiz_007', 'Tiny Toad', '🐢', 'hufflepuff', 'phoenix', 'starters', 1, 0, 0, 0, 0, 0, 'pending'), house: null },
  ]
}

export class LocalStorageService implements StorageService {
  private cache: Player[] | null = null
  private chain: Promise<void> = Promise.resolve()

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.chain.then(job, job)
    this.chain = run.then(() => undefined, () => undefined)
    return run
  }

  private async load(): Promise<Player[]> {
    if (this.cache) return this.cache
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Player[]
        if (Array.isArray(parsed) && parsed.every((p) => p?.schemaVersion === 1 && p.password?.hash)) {
          this.cache = parsed
          return parsed
        }
      }
    } catch { /* reseed */ }
    this.cache = await seedPlayers(Date.now())
    localStorage.setItem(KEY, JSON.stringify(this.cache))
    return this.cache
  }

  private persist(players: Player[]) {
    this.cache = players
    localStorage.setItem(KEY, JSON.stringify(players))
  }

  listPlayers() { return this.enqueue(() => this.load()) }
  async getPlayer(id: string) { return (await this.listPlayers()).find((p) => p.playerId === id) }
  savePlayer(player: Player) {
    return this.enqueue(async () => {
      const players = await this.load()
      this.persist([...players.filter((p) => p.playerId !== player.playerId), player])
    })
  }
  deletePlayer(id: string) {
    return this.enqueue(async () => {
      const players = await this.load()
      this.persist(players.filter((p) => p.playerId !== id))
    })
  }
  async houseCounts() {
    const counts = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 }
    for (const player of await this.listPlayers()) if (player.status === 'active' && player.house) counts[player.house]++
    return counts
  }
  async getHeadmaster(): Promise<HeadmasterLock | null> {
    try {
      const raw = localStorage.getItem(HEAD_KEY)
      return raw ? JSON.parse(raw) as HeadmasterLock : null
    } catch { return null }
  }
  async saveHeadmaster(lock: HeadmasterLock) {
    localStorage.setItem(HEAD_KEY, JSON.stringify(lock))
  }
  async register(input: RegisterInput) {
    const existing = await this.listPlayers()
    if (existing.some((p) => nicknameKey(p.nickname) === nicknameKey(input.nickname))) throw new StorageError('taken')
    const created = await createPlayer(input)
    await this.savePlayer(created)
    return created
  }
  async login(playerId: string, runes: readonly string[], now: number) {
    const player = await this.getPlayer(playerId)
    if (!player) return { ok: false, reason: 'missing' as const }
    if (player.status !== 'active') return { ok: false, reason: 'pending' as const, player }
    const result = await checkRunes(player, runes, now)
    await this.savePlayer(result.player)
    return result.ok ? { ok: true, player: result.player } : { ok: false, reason: result.reason, player: result.player }
  }
  async headmasterSet() { return (await this.getHeadmaster()) != null }
  async setupHeadmaster(runes: readonly string[]) {
    if (await this.headmasterSet()) throw new StorageError('bad')
    await this.saveHeadmaster(await lockRunes(runes))
  }
  async unlockHeadmaster(runes: readonly string[], now: number) {
    const lock = await this.getHeadmaster()
    if (!lock) return { ok: false, reason: 'wrong' as const }
    if (lock.lockedUntil && now < lock.lockedUntil) return { ok: false, reason: 'locked' as const }
    const current = lock.lockedUntil && now >= lock.lockedUntil ? { ...lock, failedLogins: 0, lockedUntil: undefined } : lock
    if (await matchesLock(current, runes)) {
      await this.saveHeadmaster({ ...current, failedLogins: 0, lockedUntil: undefined })
      return { ok: true }
    }
    const failed = (current.failedLogins ?? 0) + 1
    const locked = failed >= MAX_TRIES
    await this.saveHeadmaster({
      ...current,
      failedLogins: locked ? 0 : failed,
      lockedUntil: locked ? now + LOCK_MS : undefined,
    })
    return { ok: false, reason: locked ? 'locked' as const : 'wrong' as const }
  }
  async approvePlayer(playerId: string) {
    const player = await this.getPlayer(playerId)
    if (!player) throw new StorageError('bad')
    const next: Player = { ...player, status: 'active' }
    await this.savePlayer(next)
    return next
  }
  async resetRunes(playerId: string, runes: readonly string[]) {
    const player = await this.getPlayer(playerId)
    if (!player) throw new StorageError('bad')
    const next = await withRunes(player, runes)
    await this.savePlayer(next)
    return next
  }
  async endSession() { /* the device has no server session */ }
}
