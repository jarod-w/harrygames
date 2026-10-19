import type { HouseId, Player } from '../data/types'

// §3.3: one interface, swap the implementation (localStorage now, server API + SQLite later).
export interface StorageService {
  listPlayers(): Promise<Player[]>
  getPlayer(id: string): Promise<Player | undefined>
  savePlayer(p: Player): Promise<void>
  houseCounts(): Promise<Record<HouseId, number>>
}

const SEED: Player[] = [
  mk('wiz_001', 'Little Hermione', '🦉', 'ravenclaw', 'phoenix', 'movers', 4, 350, 120, 210, 172, 14),
  mk('wiz_002', 'Rocket Ron', '🐸', 'gryffindor', 'dragon', 'starters', 2, 280, 60, 140, 103, 9),
  mk('wiz_003', 'Luna Bean', '🐇', 'ravenclaw', 'unicorn', 'flyers', 5, 410, 200, 260, 221, 17),
  mk('wiz_004', 'Sneaky Sam', '🦊', 'slytherin', 'dragon', 'movers', 3, 300, 90, 180, 139, 11),
  mk('wiz_005', 'Puff Mei', '🐼', 'hufflepuff', 'phoenix', 'starters', 1, 190, 40, 45, 41, 6),
  mk('wiz_006', 'Dragon Kai', '🐉', 'gryffindor', 'unicorn', 'flyers', 6, 330, 150, 120, 94, 8),
  { ...mk('wiz_007', 'Tiny Toad', '🐢', 'hufflepuff', 'phoenix', 'starters', 1, 0, 0, 0, 0, 0), status: 'pending' },
]

function mk(
  playerId: string, nickname: string, avatar: string, house: HouseId, core: Player['wand']['core'],
  english: Player['grades']['english'], math: Player['grades']['math'],
  housePoints: number, galleons: number, answered: number, correct: number, bestStreak: number,
): Player {
  const half = Math.floor(answered / 2), halfC = Math.floor(correct / 2)
  return {
    schemaVersion: 1, playerId, nickname, avatar, house,
    wand: { core, skin: 'skin_oak' },
    grades: { english, math }, level: 1, housePoints, galleons,
    stats: { english: { answered: half, correct: halfC }, math: { answered: answered - half, correct: correct - halfC } },
    bestStreak,
    mistakes: ['charms_movers_001', 'potions_g4_002', 'arithmancy_g4_003'],
    inventory: ['skin_oak'], unlockedAchievements: [], customSettings: {}, status: 'active',
  }
}

const KEY = 'proto_players_v1'

export class LocalStorageService implements StorageService {
  private read(): Player[] {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return SEED
  }
  private write(ps: Player[]) {
    try { localStorage.setItem(KEY, JSON.stringify(ps)) } catch { /* ignore */ }
  }
  async listPlayers() { return this.read() }
  async getPlayer(id: string) { return this.read().find((p) => p.playerId === id) }
  async savePlayer(p: Player) {
    const ps = this.read().filter((x) => x.playerId !== p.playerId)
    this.write([...ps, p])
  }
  async houseCounts() {
    const c = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 }
    for (const p of this.read()) if (p.status === 'active') c[p.house]++
    return c
  }
}

export const storage: StorageService = new LocalStorageService()
