import { TIME_BY_ENGLISH, timeByMath } from '../data/catalog'
import type { Outcome, Player, Question } from '../data/types'
import { applyDifficulty, ENGLISH_LADDER, type DiffChange } from './difficulty'
import { addMistake, reviewPensieve } from './pensieve'

export const POINTS = { first: 10, hint: 10, wrong: 0 } as const
export const GALLEONS = { first: 5, hint: 5, wrong: 0 } as const

export type AnswerResult = { player: Player; change: DiffChange; shielded: boolean }

export function subjectOf(question: Question): 'english' | 'math' {
  return question.subject === 'english' ? 'english' : 'math'
}

export function questionSeconds(player: Player, question: Question): number {
  const base = question.subject === 'english'
    ? TIME_BY_ENGLISH[question.level ?? player.grades.english]
    : timeByMath(question.grade ?? player.grades.math)
  return player.wand.core === 'phoenix' ? Math.round(base * 1.2) : base
}

export function applyAnswer(player: Player, args: { question: Question; outcome: Outcome; shield: boolean }): AnswerResult {
  const track = subjectOf(args.question)
  const homeIndex = track === 'english' ? ENGLISH_LADDER.indexOf(player.grades.english) : player.grades.math - 1
  const ladderLength = track === 'english' ? ENGLISH_LADDER.length : 6
  const { state, change } = applyDifficulty(homeIndex, player.difficulty[track], args.outcome, {
    shield: args.shield,
    ladderLength,
  })

  const stats = player.stats[track]
  const correct = args.outcome !== 'wrong'
  let currentStreak = player.currentStreak
  let shielded = false
  if (args.outcome === 'first') currentStreak += 1
  else if (args.outcome === 'hint') currentStreak = 0
  else if (args.shield) shielded = true
  else currentStreak = 0

  const inPensieve = player.pensieve.some((item) => item.id === args.question.id)
  let pensieve = player.pensieve
  if (args.outcome === 'wrong') pensieve = addMistake(pensieve, args.question)
  else if (inPensieve) pensieve = reviewPensieve(pensieve, args.question.id, true)

  return {
    change,
    shielded,
    player: {
      ...player,
      housePoints: player.housePoints + POINTS[args.outcome],
      galleons: player.galleons + GALLEONS[args.outcome],
      stats: {
        ...player.stats,
        [track]: { answered: stats.answered + 1, correct: stats.correct + (correct ? 1 : 0) },
      },
      currentStreak,
      bestStreak: Math.max(player.bestStreak, currentStreak),
      difficulty: { ...player.difficulty, [track]: state },
      pensieve,
    },
  }
}
