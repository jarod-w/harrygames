import type { PensieveItem, Question } from '../data/types'

const WAIT_ROUNDS = 1

export function addMistake(items: PensieveItem[], question: Question): PensieveItem[] {
  const next: PensieveItem = { id: question.id, question, recalls: 0, wait: WAIT_ROUNDS }
  const had = items.some((item) => item.id === question.id)
  return had ? items.map((item) => (item.id === question.id ? next : item)) : [...items, next]
}

/** A success needs two in a row. A miss puts the memory back to zero. */
export function reviewPensieve(items: PensieveItem[], id: string, success: boolean): PensieveItem[] {
  return items.flatMap((item) => {
    if (item.id !== id) return [item]
    if (!success) return [{ ...item, recalls: 0, wait: WAIT_ROUNDS }]
    const recalls = item.recalls + 1
    if (recalls >= 2) return []
    return [{ ...item, recalls, wait: WAIT_ROUNDS }]
  })
}

/** Memories that were not in this round move one round closer to returning. */
export function finishRound(items: PensieveItem[], touchedIds: readonly string[]): PensieveItem[] {
  return items.map((item) => (touchedIds.includes(item.id) ? item : { ...item, wait: Math.max(0, item.wait - 1) }))
}
