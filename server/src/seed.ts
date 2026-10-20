import { hashRunes } from './password.ts'
import { freshCurfew, freshDifficulty } from './profile.ts'
import type { EnglishLevel, HouseId, MathGrade, Player, WandCore } from './types.ts'

const SAMPLE = ['owl', 'wand', 'broom', 'bolt'] as const
const SALT = 'seed-salt-v1'

function seeded(partial: {
  playerId: string
  nickname: string
  avatar: string
  house: HouseId | null
  core: WandCore
  english: EnglishLevel
  math: MathGrade
  housePoints: number
  galleons: number
  answered: number
  correct: number
  bestStreak: number
  status?: Player['status']
  now: number
}): Player {
  const half = Math.floor(partial.answered / 2)
  const halfC = Math.floor(partial.correct / 2)
  const pending = partial.status === 'pending'
  return {
    schemaVersion: 1,
    playerId: partial.playerId,
    nickname: partial.nickname,
    avatar: partial.avatar,
    house: pending ? null : partial.house,
    wand: { core: partial.core, skin: 'skin_oak' },
    wandChosen: !pending,
    cardSeen: !pending,
    storySeen: !pending,
    grades: { english: partial.english, math: partial.math },
    level: 1,
    housePoints: partial.housePoints,
    galleons: partial.galleons,
    stats: {
      english: { answered: half, correct: halfC },
      math: { answered: partial.answered - half, correct: partial.correct - halfC },
    },
    bestStreak: partial.bestStreak,
    currentStreak: 0,
    pensieve: [],
    inventory: ['skin_oak'],
    unlockedAchievements: [],
    customSettings: {},
    status: partial.status ?? 'active',
    password: { salt: SALT, hash: hashRunes(SAMPLE, SALT) },
    failedLogins: 0,
    curfew: freshCurfew(partial.now),
    difficulty: { english: freshDifficulty(), math: freshDifficulty() },
  }
}

/** The same sample wizards the on-device prototype starts with. Runes: owl, wand, broom, bolt. */
export function samplePlayers(now: number): Player[] {
  const mk = (
    playerId: string, nickname: string, avatar: string, house: HouseId, core: WandCore,
    english: EnglishLevel, math: MathGrade,
    housePoints: number, galleons: number, answered: number, correct: number, bestStreak: number,
    status?: Player['status'],
  ) => seeded({ playerId, nickname, avatar, house, core, english, math, housePoints, galleons, answered, correct, bestStreak, status, now })
  return [
    mk('wiz_001', 'Little Hermione', '🦉', 'ravenclaw', 'phoenix', 'movers', 4, 350, 120, 210, 172, 14),
    mk('wiz_002', 'Rocket Ron', '🐸', 'gryffindor', 'dragon', 'starters', 2, 280, 60, 140, 103, 9),
    mk('wiz_003', 'Luna Bean', '🐇', 'ravenclaw', 'unicorn', 'flyers', 5, 410, 200, 260, 221, 17),
    mk('wiz_004', 'Sneaky Sam', '🦊', 'slytherin', 'dragon', 'movers', 3, 300, 90, 180, 139, 11),
    mk('wiz_005', 'Puff Mei', '🐼', 'hufflepuff', 'phoenix', 'starters', 1, 190, 40, 90, 74, 6),
    mk('wiz_006', 'Dragon Kai', '🐉', 'gryffindor', 'unicorn', 'flyers', 6, 330, 150, 120, 94, 8),
    mk('wiz_007', 'Tiny Toad', '🐢', 'hufflepuff', 'phoenix', 'starters', 1, 0, 0, 0, 0, 0, 'pending'),
  ]
}
