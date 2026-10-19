import type { EnglishLevel, HouseId, MathGrade, Player, WandCore } from '../data/types'
import { freshCurfew } from './curfew'
import { freshDifficulty } from './difficulty'
import { lockRunes } from './password'

export const SAMPLE_RUNES = ['owl', 'wand', 'broom', 'bolt'] as const

export function normalizeNickname(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function nicknameKey(name: string): string {
  return normalizeNickname(name).toLowerCase()
}

export function setGrades(player: Player, grades: Partial<Player['grades']>): Player {
  const difficulty = { ...player.difficulty }
  if (grades.english && grades.english !== player.grades.english) difficulty.english = freshDifficulty()
  if (grades.math && grades.math !== player.grades.math) difficulty.math = freshDifficulty()
  return { ...player, grades: { ...player.grades, ...grades }, difficulty }
}

export async function createPlayer(input: {
  nickname: string
  avatar: string
  english: EnglishLevel
  math: MathGrade
  runes: readonly string[]
  now: number
}): Promise<Player> {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  return {
    schemaVersion: 1,
    playerId: `wiz_${id}`,
    nickname: normalizeNickname(input.nickname),
    avatar: input.avatar,
    house: null,
    wand: { core: 'phoenix', skin: 'skin_oak' },
    wandChosen: false,
    cardSeen: false,
    storySeen: false,
    grades: { english: input.english, math: input.math },
    level: 1,
    housePoints: 0,
    galleons: 0,
    stats: { english: { answered: 0, correct: 0 }, math: { answered: 0, correct: 0 } },
    bestStreak: 0,
    currentStreak: 0,
    pensieve: [],
    inventory: ['skin_oak'],
    unlockedAchievements: [],
    customSettings: {},
    status: 'pending',
    password: await lockRunes(input.runes),
    failedLogins: 0,
    curfew: freshCurfew(input.now),
    difficulty: { english: freshDifficulty(), math: freshDifficulty() },
  }
}

export function blankActive(partial: {
  playerId: string
  nickname: string
  avatar: string
  house: HouseId
  core: WandCore
  english: EnglishLevel
  math: MathGrade
  housePoints: number
  galleons: number
  answered: number
  correct: number
  bestStreak: number
  password: Player['password']
  now: number
  status?: Player['status']
}): Player {
  const half = Math.floor(partial.answered / 2)
  const halfC = Math.floor(partial.correct / 2)
  return {
    schemaVersion: 1,
    playerId: partial.playerId,
    nickname: partial.nickname,
    avatar: partial.avatar,
    house: partial.house,
    wand: { core: partial.core, skin: 'skin_oak' },
    wandChosen: partial.status !== 'pending',
    cardSeen: partial.status !== 'pending',
    storySeen: partial.status !== 'pending',
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
    password: partial.password,
    failedLogins: 0,
    curfew: freshCurfew(partial.now),
    difficulty: { english: freshDifficulty(), math: freshDifficulty() },
  }
}
