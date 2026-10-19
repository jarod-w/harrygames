import { arithmancyQuestions, charmsQuestions, pickQuestion, potionsQuestion } from '../data/questions'
import { TIME_BY_ENGLISH, timeByMath } from '../data/catalog'
import type { ClassroomId, Player, Question } from '../data/types'
import type { StringKey } from '../i18n/en'
import { resolveEnglish, resolveMath } from '../game/difficulty'

// §3.2 Classroom registry: a new classroom = one new entry here, nothing else changes.
export type ClassroomDef = {
  id: ClassroomId
  icon: string
  nameKey: StringKey
  descKey: StringKey
  askKey: StringKey
  keyboard: 'letters' | 'numbers'
  accent: string
  roundSize: number
  seconds: (p: Player) => number
  levelLabel: (p: Player) => string
  makeOne: (p: Player, n: number, avoid: readonly string[]) => Question
}

function dueQuestion(player: Player, id: ClassroomId, avoid: readonly string[]): Question | undefined {
  return player.pensieve.find((item) => item.wait <= 0 && item.question.classroom === id && !avoid.includes(item.id))?.question
}

export const CLASSROOMS: ClassroomDef[] = [
  {
    id: 'charms', icon: '🪄', nameKey: 'charms', descKey: 'charmsDesc', askKey: 'spellIt',
    keyboard: 'letters', accent: '#6b5aa8', roundSize: 5,
    seconds: (p) => TIME_BY_ENGLISH[resolveEnglish(p).level],
    levelLabel: (p) => {
      const { level } = resolveEnglish(p)
      const mark = p.difficulty.english.offset > 0 ? ' ↑' : p.difficulty.english.offset < 0 ? ' ↓' : ''
      return level[0].toUpperCase() + level.slice(1) + mark
    },
    makeOne: (p, n, avoid) => {
      const due = n % 3 === 2 ? dueQuestion(p, 'charms', avoid) : undefined
      if (due) return due
      const { level, band } = resolveEnglish(p)
      return pickQuestion(charmsQuestions(level, band), avoid)
    },
  },
  {
    id: 'potions', icon: '⚗️', nameKey: 'potions', descKey: 'potionsDesc', askKey: 'brew',
    keyboard: 'numbers', accent: '#1f6e43', roundSize: 5,
    seconds: (p) => timeByMath(resolveMath(p).grade),
    levelLabel: (p) => `P${resolveMath(p).grade}${p.difficulty.math.offset > 0 ? ' ↑' : p.difficulty.math.offset < 0 ? ' ↓' : ''}`,
    makeOne: (p, n, avoid) => {
      const due = n % 3 === 2 ? dueQuestion(p, 'potions', avoid) : undefined
      if (due) return due
      const { grade, band } = resolveMath(p)
      return potionsQuestion(grade, band, n + p.stats.math.answered)
    },
  },
  {
    id: 'arithmancy', icon: '🔢', nameKey: 'arithmancy', descKey: 'arithmancyDesc', askKey: 'pattern',
    keyboard: 'numbers', accent: '#234f9c', roundSize: 4,
    seconds: (p) => timeByMath(resolveMath(p).grade),
    levelLabel: (p) => `P${resolveMath(p).grade}${p.difficulty.math.offset > 0 ? ' ↑' : p.difficulty.math.offset < 0 ? ' ↓' : ''}`,
    makeOne: (p, n, avoid) => {
      const due = n % 3 === 2 ? dueQuestion(p, 'arithmancy', avoid) : undefined
      if (due) return due
      const { grade, band } = resolveMath(p)
      return pickQuestion(arithmancyQuestions(grade, band), avoid)
    },
  },
]

export const getClassroom = (id: ClassroomId) => CLASSROOMS.find((c) => c.id === id)!

export function bossQuestion(player: Player, n: number): Question {
  if (n % 2 === 0) {
    const { level, band } = resolveEnglish(player)
    return pickQuestion(charmsQuestions(level, band), [], () => (n * 17) % 100 / 100)
  }
  const { grade, band } = resolveMath(player)
  return potionsQuestion(grade, band, n + 100, () => ((n * 13) % 97) / 97)
}
