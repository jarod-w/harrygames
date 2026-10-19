import type { Localized } from '../i18n'

export type HouseId = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'
export type EnglishLevel = 'starters' | 'movers' | 'flyers'
export type MathGrade = 1 | 2 | 3 | 4 | 5 | 6
export type WandCore = 'phoenix' | 'dragon' | 'unicorn'
export type ClassroomId = 'charms' | 'potions' | 'arithmancy'

// Question format from design doc §6.3
export type Question = {
  id: string
  subject: 'english' | 'math' | 'logic'
  classroom: ClassroomId
  level?: EnglishLevel
  grade?: MathGrade
  type: 'spelling' | 'choice' | 'input' | 'sequence' | 'sudoku'
  prompt: Localized
  image?: string // emoji placeholder in the prototype
  audio?: string
  answer: string
  hint?: string | Localized
  explanation?: Localized
}

// Player profile from design doc §6.5
export type Player = {
  schemaVersion: 1
  playerId: string
  nickname: string
  avatar: string
  house: HouseId
  wand: { core: WandCore; skin: string }
  grades: { english: EnglishLevel; math: MathGrade }
  level: number
  housePoints: number
  galleons: number
  stats: {
    english: { answered: number; correct: number }
    math: { answered: number; correct: number }
  }
  bestStreak: number
  mistakes: string[]
  inventory: string[]
  unlockedAchievements: string[]
  customSettings: Record<string, string>
  status: 'pending' | 'active'
}
