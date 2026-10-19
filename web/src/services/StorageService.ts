import type { HouseId, Player } from '../data/types'
import { hashRunes } from '../game/password'
import { blankActive, SAMPLE_RUNES } from '../game/player'

// §3.3: one interface. This build keeps profiles on the device.
// A server implementation can replace this class without touching the classrooms.
export type HeadmasterLock = { salt: string; hash: string }

export interface StorageService {
  listPlayers(): Promise<Player[]>
  getPlayer(id: string): Promise<Player | undefined>
  savePlayer(p: Player): Promise<void>
  deletePlayer(id: string): Promise<void>
  houseCounts(): Promise<Record<HouseId, number>>
  getHeadmaster(): Promise<HeadmasterLock | null>
  saveHeadmaster(lock: HeadmasterLock): Promise<void>
}

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
}

export const storage: StorageService = new LocalStorageService()

export const SESSION_KEY = 'hogwarts_session_v1'
