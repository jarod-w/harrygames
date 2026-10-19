import type { Band, DifficultyState, EnglishLevel, LevelOffset, MathGrade, Outcome, Player } from '../data/types'

export const ENGLISH_LADDER: EnglishLevel[] = ['starters', 'movers', 'flyers']
const BANDS: Band[] = [0, 1, 2]

export function freshDifficulty(): DifficultyState {
  return { band: 1, offset: 0, correctStreak: 0, wrongStreak: 0, aboveCount: 0 }
}

export type DiffChange = 'up' | 'down' | null

type Slot = { offset: LevelOffset; band: Band }

/** Levels the player may touch: home, plus at most one step either way. */
export function allowedSlots(homeIndex: number, length: number): Slot[] {
  const slots: Slot[] = []
  for (const offset of [-1, 0, 1] as LevelOffset[]) {
    const index = homeIndex + offset
    if (index < 0 || index >= length) continue
    for (const band of BANDS) slots.push({ offset, band })
  }
  return slots
}

function move(homeIndex: number, length: number, state: DifficultyState, dir: 1 | -1): { state: DifficultyState; change: DiffChange } {
  const slots = allowedSlots(homeIndex, length)
  const at = slots.findIndex((s) => s.offset === state.offset && s.band === state.band)
  const next = slots[at + dir]
  if (!next) return { state: { ...state, correctStreak: 0, wrongStreak: 0 }, change: null }
  return {
    change: dir === 1 ? 'up' : 'down',
    state: {
      ...state,
      offset: next.offset,
      band: next.band,
      correctStreak: 0,
      wrongStreak: 0,
      aboveCount: next.offset === 1 ? state.aboveCount : 0,
    },
  }
}

/**
 * Q9: three first-try corrects raise one band, two full misses lower one band.
 * A hint clears the correct streak and does not count as a miss.
 * A unicorn shield absorbs the miss: the correct streak stays, and it is not a miss.
 */
export function applyDifficulty(
  homeIndex: number,
  state: DifficultyState,
  outcome: Outcome,
  opts: { shield: boolean; ladderLength: number },
): { state: DifficultyState; change: DiffChange } {
  let next: DifficultyState = { ...state }
  if (next.offset === 1) next.aboveCount += 1
  else next.aboveCount = 0

  if (outcome === 'first') {
    next.wrongStreak = 0
    next.correctStreak += 1
    if (next.correctStreak >= 3) return move(homeIndex, opts.ladderLength, next, 1)
    return { state: next, change: null }
  }
  if (outcome === 'hint') {
    next.correctStreak = 0
    return { state: next, change: null }
  }
  if (opts.shield) return { state: next, change: null }
  next.correctStreak = 0
  next.wrongStreak += 1
  if (next.wrongStreak >= 2) return move(homeIndex, opts.ladderLength, next, -1)
  return { state: next, change: null }
}

export function resolveEnglish(player: Player): { level: EnglishLevel; band: Band } {
  const home = ENGLISH_LADDER.indexOf(player.grades.english)
  const index = Math.max(0, Math.min(ENGLISH_LADDER.length - 1, home + player.difficulty.english.offset))
  return { level: ENGLISH_LADDER[index], band: player.difficulty.english.band }
}

export function resolveMath(player: Player): { grade: MathGrade; band: Band } {
  const home = player.grades.math - 1
  const index = Math.max(0, Math.min(5, home + player.difficulty.math.offset))
  return { grade: (index + 1) as MathGrade, band: player.difficulty.math.band }
}

export const ABOVE_HINT_AT = 8
