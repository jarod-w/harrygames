import { charmsQuestions, arithmancyQuestions, potionsQuestion } from '../data/questions'
import { TIME_BY_ENGLISH, timeByMath } from '../data/catalog'
import type { ClassroomId, Player, Question } from '../data/types'
import type { StringKey } from '../i18n/en'

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
  makeRound: (p: Player) => Question[]
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

export const CLASSROOMS: ClassroomDef[] = [
  {
    id: 'charms', icon: '🪄', nameKey: 'charms', descKey: 'charmsDesc', askKey: 'spellIt',
    keyboard: 'letters', accent: '#6b5aa8', roundSize: 5,
    seconds: (p) => TIME_BY_ENGLISH[p.grades.english],
    levelLabel: (p) => p.grades.english[0].toUpperCase() + p.grades.english.slice(1),
    makeRound: (p) => shuffle(charmsQuestions(p.grades.english)).slice(0, 5),
  },
  {
    id: 'potions', icon: '⚗️', nameKey: 'potions', descKey: 'potionsDesc', askKey: 'brew',
    keyboard: 'numbers', accent: '#1f6e43', roundSize: 5,
    seconds: (p) => timeByMath(p.grades.math),
    levelLabel: (p) => `P${p.grades.math}`,
    makeRound: (p) => Array.from({ length: 5 }, (_, i) => potionsQuestion(p.grades.math, i)),
  },
  {
    id: 'arithmancy', icon: '🔢', nameKey: 'arithmancy', descKey: 'arithmancyDesc', askKey: 'pattern',
    keyboard: 'numbers', accent: '#234f9c', roundSize: 4,
    seconds: (p) => timeByMath(p.grades.math),
    levelLabel: (p) => `P${p.grades.math}`,
    makeRound: (p) => shuffle(arithmancyQuestions(p.grades.math)),
  },
]

export const getClassroom = (id: ClassroomId) => CLASSROOMS.find((c) => c.id === id)!
