import type { Localized } from '../i18n'

export type HouseId = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'
export type EnglishLevel = 'starters' | 'movers' | 'flyers'
export type MathGrade = 1 | 2 | 3 | 4 | 5 | 6
export type WandCore = 'phoenix' | 'dragon' | 'unicorn'
export type ClassroomId = 'charms' | 'potions' | 'arithmancy'
export type Band = 0 | 1 | 2
export type LevelOffset = -1 | 0 | 1
export type Outcome = 'first' | 'hint' | 'wrong'

// Question format from design doc §6.3
export type Question = {
  id: string
  subject: 'english' | 'math' | 'logic'
  classroom: ClassroomId
  level?: EnglishLevel
  grade?: MathGrade
  band?: Band
  type: 'spelling' | 'choice' | 'input' | 'sequence' | 'sudoku'
  prompt: Localized
  image?: string
  audio?: string
  answer: string
  hint?: string | Localized
  explanation?: Localized
}

/** One step on the adaptive ladder. Home level is offset 0, band 1. */
export type DifficultyState = {
  band: Band
  offset: LevelOffset
  correctStreak: number
  wrongStreak: number
  /** Questions answered while already above the chosen level. */
  aboveCount: number
}

/** A wrong question waiting in the Pensieve. Two recalls in a row return it. */
export type PensieveItem = {
  id: string
  question: Question
  recalls: number
  wait: number
}

/** Curfew lives on the profile so a refresh cannot turn the lights back on. */
export type CurfewState = {
  playedMs: number
  lastSeenAt: number
  restUntil?: number
}

export type PasswordLock = { salt: string; hash: string }

// Player profile from design doc §6.5, plus the fields the rules need.
export type Player = {
  schemaVersion: 1
  playerId: string
  nickname: string
  avatar: string
  house: HouseId | null
  wand: { core: WandCore; skin: string }
  wandChosen: boolean
  cardSeen: boolean
  storySeen: boolean
  grades: { english: EnglishLevel; math: MathGrade }
  level: number
  housePoints: number
  galleons: number
  stats: {
    english: { answered: number; correct: number }
    math: { answered: number; correct: number }
  }
  bestStreak: number
  currentStreak: number
  pensieve: PensieveItem[]
  inventory: string[]
  unlockedAchievements: string[]
  customSettings: Record<string, string>
  status: 'pending' | 'active'
  password: PasswordLock
  failedLogins: number
  lockedUntil?: number
  curfew: CurfewState
  difficulty: { english: DifficultyState; math: DifficultyState }
}
