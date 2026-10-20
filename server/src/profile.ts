import { randomBytes } from 'node:crypto'
import { hashRunes, newSalt } from './password.ts'
import type { CurfewState, DifficultyState, EnglishLevel, HouseId, MathGrade, Player, WandCore } from './types.ts'

export const AVATARS = ['🦉', '🐈‍⬛', '🐸', '🐇', '🦊', '🐉', '🦄', '🐢', '🐼', '🦔', '🐧', '🐿️']
const HOUSES = new Set<HouseId>(['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'])
const ENGLISH = new Set<EnglishLevel>(['starters', 'movers', 'flyers'])
const CORES = new Set<WandCore>(['phoenix', 'dragon', 'unicorn'])

export function normalizeNickname(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function nicknameKey(name: string): string {
  return normalizeNickname(name).toLowerCase()
}

export function freshCurfew(now: number): CurfewState {
  return { playedMs: 0, lastSeenAt: now }
}

export function freshDifficulty(): DifficultyState {
  return { band: 1, offset: 0, correctStreak: 0, wrongStreak: 0, aboveCount: 0 }
}

const EMPTY_LOCK = { salt: '', hash: '' }

/** Strip the password hash. Other wizards also do not see the Pensieve or the curfew clock. */
export function toClient(player: Player, full: boolean): Player {
  if (full) return { ...player, password: EMPTY_LOCK }
  return {
    ...player,
    password: EMPTY_LOCK,
    pensieve: [],
    failedLogins: 0,
    lockedUntil: undefined,
    curfew: { playedMs: 0, lastSeenAt: 0 },
  }
}

export function createPlayer(input: {
  nickname: string
  avatar: string
  english: EnglishLevel
  math: MathGrade
  runes: readonly string[]
  now: number
}): Player {
  const salt = newSalt()
  return {
    schemaVersion: 1,
    playerId: `wiz_${randomBytes(6).toString('hex')}`,
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
    password: { salt, hash: hashRunes(input.runes, salt) },
    failedLogins: 0,
    curfew: freshCurfew(input.now),
    difficulty: { english: freshDifficulty(), math: freshDifficulty() },
  }
}

function clamp(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, Math.round(v)))
}

function asDifficulty(v: unknown, fallback: DifficultyState): DifficultyState {
  if (!v || typeof v !== 'object') return fallback
  const o = v as Record<string, unknown>
  const band = o.band
  const offset = o.offset
  if (band !== 0 && band !== 1 && band !== 2) return fallback
  if (offset !== -1 && offset !== 0 && offset !== 1) return fallback
  return {
    band,
    offset,
    correctStreak: clamp(o.correctStreak, 0, 100, 0),
    wrongStreak: clamp(o.wrongStreak, 0, 100, 0),
    aboveCount: clamp(o.aboveCount, 0, 100_000, 0),
  }
}

function asPair(v: unknown, fallback: { answered: number; correct: number }) {
  if (!v || typeof v !== 'object') return fallback
  const o = v as Record<string, unknown>
  const answered = clamp(o.answered, 0, 1_000_000, fallback.answered)
  const correct = Math.min(answered, clamp(o.correct, 0, 1_000_000, fallback.correct))
  return { answered, correct }
}

function asCurfew(v: unknown, fallback: CurfewState): CurfewState {
  if (!v || typeof v !== 'object') return fallback
  const o = v as Record<string, unknown>
  const playedMs = clamp(o.playedMs, 0, 24 * 60 * 60 * 1000, fallback.playedMs)
  const lastSeenAt = clamp(o.lastSeenAt, 0, 10_000_000_000_000, fallback.lastSeenAt)
  if (o.restUntil == null) return { playedMs, lastSeenAt }
  return { playedMs, lastSeenAt, restUntil: clamp(o.restUntil, 0, 10_000_000_000_000, lastSeenAt) }
}

function asStrings(v: unknown, max: number, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback
  return v.filter((x) => typeof x === 'string' && x.length > 0 && x.length <= 40).slice(0, max)
}

/**
 * The castle trusts the device for scores (the lessons run in the browser)
 * but never for who you are, whether Dad approved you, or your rune hash.
 */
export function mergeProfile(stored: Player, incoming: unknown): Player {
  if (!incoming || typeof incoming !== 'object') return stored
  const body = incoming as Record<string, unknown>
  if (body.playerId !== stored.playerId) return stored
  const next: Player = { ...stored, wand: { ...stored.wand }, grades: { ...stored.grades }, stats: { english: { ...stored.stats.english }, math: { ...stored.stats.math } }, curfew: { ...stored.curfew }, difficulty: { english: { ...stored.difficulty.english }, math: { ...stored.difficulty.math } } }

  if (body.house === null || (typeof body.house === 'string' && HOUSES.has(body.house as HouseId))) {
    next.house = body.house as HouseId | null
  }
  if (typeof body.avatar === 'string' && AVATARS.includes(body.avatar)) next.avatar = body.avatar
  if (body.wand && typeof body.wand === 'object') {
    const w = body.wand as Record<string, unknown>
    const core = !stored.wandChosen && typeof w.core === 'string' && CORES.has(w.core as WandCore) ? w.core as WandCore : stored.wand.core
    const skin = typeof w.skin === 'string' && w.skin.length > 0 && w.skin.length <= 40 ? w.skin : stored.wand.skin
    next.wand = { core, skin }
  }
  if (typeof body.wandChosen === 'boolean') next.wandChosen = body.wandChosen
  if (typeof body.cardSeen === 'boolean') next.cardSeen = body.cardSeen
  if (typeof body.storySeen === 'boolean') next.storySeen = body.storySeen
  if (body.grades && typeof body.grades === 'object') {
    const g = body.grades as Record<string, unknown>
    if (typeof g.english === 'string' && ENGLISH.has(g.english as EnglishLevel) && typeof g.math === 'number' && g.math >= 1 && g.math <= 6) {
      next.grades = { english: g.english as EnglishLevel, math: g.math as MathGrade }
    }
  }
  next.level = clamp(body.level, 1, 99, stored.level)
  next.housePoints = clamp(body.housePoints, 0, 1_000_000, stored.housePoints)
  next.galleons = clamp(body.galleons, 0, 1_000_000, stored.galleons)
  if (body.stats && typeof body.stats === 'object') {
    const s = body.stats as Record<string, unknown>
    next.stats = { english: asPair(s.english, stored.stats.english), math: asPair(s.math, stored.stats.math) }
  }
  next.bestStreak = clamp(body.bestStreak, 0, 1_000_000, stored.bestStreak)
  next.currentStreak = clamp(body.currentStreak, 0, 1_000_000, stored.currentStreak)
  if (Array.isArray(body.pensieve)) {
    next.pensieve = body.pensieve.filter((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string').slice(0, 80)
  }
  next.inventory = asStrings(body.inventory, 50, stored.inventory)
  next.unlockedAchievements = asStrings(body.unlockedAchievements, 50, stored.unlockedAchievements)
  if (body.customSettings && typeof body.customSettings === 'object' && !Array.isArray(body.customSettings)) {
    const settings: Record<string, string> = {}
    for (const [k, v] of Object.entries(body.customSettings as Record<string, unknown>).slice(0, 20)) {
      if (typeof v === 'string' && k.length <= 40 && v.length <= 80) settings[k] = v
    }
    next.customSettings = settings
  }
  if (body.difficulty && typeof body.difficulty === 'object') {
    const d = body.difficulty as Record<string, unknown>
    next.difficulty = {
      english: asDifficulty(d.english, stored.difficulty.english),
      math: asDifficulty(d.math, stored.difficulty.math),
    }
  }
  next.curfew = asCurfew(body.curfew, stored.curfew)
  return next
}
