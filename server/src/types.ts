export type HouseId = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'
export type EnglishLevel = 'starters' | 'movers' | 'flyers'
export type MathGrade = 1 | 2 | 3 | 4 | 5 | 6
export type WandCore = 'phoenix' | 'dragon' | 'unicorn'
export type Band = 0 | 1 | 2
export type LevelOffset = -1 | 0 | 1

export type DifficultyState = {
  band: Band
  offset: LevelOffset
  correctStreak: number
  wrongStreak: number
  aboveCount: number
}

export type CurfewState = {
  playedMs: number
  lastSeenAt: number
  restUntil?: number
}

export type PasswordLock = { salt: string; hash: string }

/** Same shape the web client stores. Password stays in the database only. */
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
  pensieve: unknown[]
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

export type PublicPlayer = Omit<Player, 'password'> & { password: PasswordLock }
