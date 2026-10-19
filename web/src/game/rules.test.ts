import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkAnswer } from '../data/questions'
import type { Player, Question } from '../data/types'
import { PLAY_LIMIT_MS, REST_MS, freshCurfew, tickCurfew } from './curfew'
import { ABOVE_HINT_AT, applyDifficulty, freshDifficulty, resolveEnglish, resolveMath } from './difficulty'
import { addMistake, finishRound, reviewPensieve } from './pensieve'
import { createPlayer, nicknameKey, setGrades } from './player'
import { checkRunes, hashRunes, LOCK_MS } from './password'
import { applyAnswer } from './progress'
import { homeRoute } from './flow'

const spell = (answer: string): Question => ({
  id: `charms_starters_${answer}`,
  subject: 'english',
  classroom: 'charms',
  level: 'starters',
  type: 'spelling',
  prompt: { en: answer, zh: answer },
  answer,
})

const sum = (answer: string): Question => ({
  id: `potions_${answer}`,
  subject: 'math',
  classroom: 'potions',
  grade: 2,
  type: 'input',
  prompt: { en: answer, zh: answer },
  answer,
})

async function wizard(): Promise<Player> {
  return createPlayer({ nickname: '  Luna   Bean ', avatar: '🐇', english: 'movers', math: 4, runes: ['owl', 'wand', 'broom', 'bolt'], now: 1_000 })
}

describe('answers', () => {
  const q = sum('1/2')
  it('accepts equal values', () => {
    assert.equal(checkAnswer(q, '1/2'), true)
    assert.equal(checkAnswer(q, '2/4'), true)
    assert.equal(checkAnswer(q, '0.5'), true)
    assert.equal(checkAnswer(q, '50%'), true)
  })
  it('rejects a rounded decimal that is not the fraction', () => {
    assert.equal(checkAnswer(sum('1/3'), '0.33'), false)
    assert.equal(checkAnswer(sum('1/3'), '1/3'), true)
  })
  it('matches spelling ignoring case', () => {
    assert.equal(checkAnswer(spell('castle'), ' Castle '), true)
    assert.equal(checkAnswer(spell('castle'), 'castel'), false)
  })
})

describe('difficulty', () => {
  const home = 1 // movers / P2
  it('raises one band after three first-try corrects', () => {
    let state = freshDifficulty()
    state = applyDifficulty(home, state, 'first', { shield: false, ladderLength: 3 }).state
    state = applyDifficulty(home, state, 'first', { shield: false, ladderLength: 3 }).state
    const up = applyDifficulty(home, state, 'first', { shield: false, ladderLength: 3 })
    assert.equal(up.change, 'up')
    assert.equal(up.state.band, 2)
    assert.equal(up.state.offset, 0)
    assert.equal(up.state.correctStreak, 0)
  })
  it('steps into the next level only after the hardest band', () => {
    let state = { ...freshDifficulty(), band: 2 as const }
    state = applyDifficulty(home, state, 'first', { shield: false, ladderLength: 3 }).state
    state = applyDifficulty(home, state, 'first', { shield: false, ladderLength: 3 }).state
    const up = applyDifficulty(home, state, 'first', { shield: false, ladderLength: 3 })
    assert.equal(up.state.offset, 1)
    assert.equal(up.state.band, 0)
  })
  it('never climbs more than one level', () => {
    let state = { ...freshDifficulty(), offset: 1 as const, band: 2 as const, correctStreak: 2 }
    const up = applyDifficulty(home, state, 'first', { shield: false, ladderLength: 3 })
    assert.equal(up.change, null)
    assert.equal(up.state.offset, 1)
    assert.equal(up.state.band, 2)
  })
  it('lowers one band after two full misses', () => {
    let state = freshDifficulty()
    state = applyDifficulty(home, state, 'wrong', { shield: false, ladderLength: 3 }).state
    const down = applyDifficulty(home, state, 'wrong', { shield: false, ladderLength: 3 })
    assert.equal(down.change, 'down')
    assert.equal(down.state.band, 0)
    assert.equal(down.state.offset, 0)
  })
  it('treats a hint as neither a streak nor a miss', () => {
    let state = { ...freshDifficulty(), correctStreak: 2, wrongStreak: 1 }
    const hint = applyDifficulty(home, state, 'hint', { shield: false, ladderLength: 3 })
    assert.equal(hint.change, null)
    assert.equal(hint.state.correctStreak, 0)
    assert.equal(hint.state.wrongStreak, 1)
    assert.equal(hint.state.band, 1)
  })
  it('lets unicorn hair keep the correct streak', () => {
    const state = { ...freshDifficulty(), correctStreak: 2, wrongStreak: 1 }
    const kept = applyDifficulty(home, state, 'wrong', { shield: true, ladderLength: 3 })
    assert.equal(kept.state.correctStreak, 2)
    assert.equal(kept.state.wrongStreak, 1)
    assert.equal(kept.change, null)
  })
  it('counts questions spent above the chosen level', () => {
    let state = { ...freshDifficulty(), offset: 1 as const }
    for (let i = 0; i < ABOVE_HINT_AT; i++) state = applyDifficulty(home, state, 'hint', { shield: false, ladderLength: 3 }).state
    assert.equal(state.aboveCount, ABOVE_HINT_AT)
  })
})


function playUntilLightsOut(startAt = 0) {
  let state = freshCurfew(startAt)
  let now = startAt
  let tick = tickCurfew(state, now)
  while (tick.state.restUntil == null && tick.state.playedMs < PLAY_LIMIT_MS) {
    now += 9 * 60 * 1000
    tick = tickCurfew(tick.state, now)
    if (tick.justOut) return tick
  }
  return tick
}

describe('curfew', () => {
  it('turns the lights out after 20 minutes of play', () => {
    const out = playUntilLightsOut()
    assert.equal(out.justOut, true)
    assert.equal(out.resting, true)
    assert.equal(out.state.restUntil, out.state.lastSeenAt + REST_MS)
  })
  it('keeps the lights out until the rest is over', () => {
    const out = playUntilLightsOut()
    const still = tickCurfew(out.state, out.state.restUntil! - 1)
    assert.equal(still.resting, true)
    const back = tickCurfew(still.state, out.state.restUntil!)
    assert.equal(back.resting, false)
    assert.equal(back.state.playedMs, 0)
    assert.equal(back.state.restUntil, undefined)
  })
  it('counts a 10 minute absence as a rest', () => {
    const played = tickCurfew(freshCurfew(0), 5 * 60 * 1000)
    const away = tickCurfew(played.state, played.state.lastSeenAt + REST_MS)
    assert.equal(away.state.playedMs, 0)
    assert.equal(away.resting, false)
  })
  it('does not start a new sitting while the lights-out screen is open', () => {
    const done = playUntilLightsOut()
    const cleared = tickCurfew(done.state, done.state.restUntil!)
    const waiting = tickCurfew(cleared.state, cleared.state.lastSeenAt + 60_000, { paused: true })
    assert.equal(waiting.state.playedMs, 0)
  })
})

describe('pensieve', () => {
  const q = spell('owl')
  it('returns a memory only after two correct recalls', () => {
    let items = addMistake([], q)
    assert.equal(items[0].wait, 1)
    items = finishRound(items, [])
    assert.equal(items[0].wait, 0)
    items = reviewPensieve(items, q.id, true)
    assert.equal(items.length, 1)
    assert.equal(items[0].recalls, 1)
    items = reviewPensieve(items, q.id, true)
    assert.equal(items.length, 0)
  })
  it('resets the recall count after a miss', () => {
    let items = reviewPensieve(addMistake([], q), q.id, true)
    items = reviewPensieve(items, q.id, false)
    assert.equal(items[0].recalls, 0)
  })
})

describe('profiles', () => {
  it('hashes the four runes and locks the door on the fifth miss', async () => {
    const player = await wizard()
    assert.equal(nicknameKey(player.nickname), 'luna bean')
    const ok = await checkRunes(player, ['owl', 'wand', 'broom', 'bolt'], 5_000)
    assert.equal(ok.ok, true)
    let current = player
    for (let i = 0; i < 4; i++) {
      const miss = await checkRunes(current, ['star', 'star', 'star', 'star'], 5_000)
      assert.equal(miss.ok, false)
      assert.equal(miss.reason, 'wrong')
      current = miss.player
    }
    const locked = await checkRunes(current, ['star', 'star', 'star', 'star'], 5_000)
    assert.equal(locked.reason, 'locked')
    assert.equal(locked.player.lockedUntil, 5_000 + LOCK_MS)
    const early = await checkRunes(locked.player, ['owl', 'wand', 'broom', 'bolt'], 5_000 + LOCK_MS - 1)
    assert.equal(early.reason, 'locked')
    const later = await checkRunes(locked.player, ['owl', 'wand', 'broom', 'bolt'], 5_000 + LOCK_MS)
    assert.equal(later.ok, true)
  })

  it('stores the same hash for the same salt', async () => {
    const a = await hashRunes(['owl', 'wand'], 'salt')
    const b = await hashRunes(['owl', 'wand'], 'salt')
    assert.equal(a, b)
    assert.notEqual(a, await hashRunes(['wand', 'owl'], 'salt'))
  })

  it('resets a track when its grade changes', async () => {
    let player = await wizard()
    player = { ...player, difficulty: { ...player.difficulty, math: { ...player.difficulty.math, band: 2, offset: 1, correctStreak: 2 } } }
    player = setGrades(player, { math: 5 })
    assert.equal(player.grades.math, 5)
    assert.deepEqual(player.difficulty.math, freshDifficulty())
    assert.equal(player.difficulty.english.band, 1)
  })

  it('sends a new wizard through approval before the castle', async () => {
    const player = await wizard()
    assert.equal(homeRoute(player, 1_000).name, 'pending')
    const approved = { ...player, status: 'active' as const }
    assert.equal(homeRoute(approved, 1_000).name, 'sorting')
    const housed = { ...approved, house: 'ravenclaw' as const, wandChosen: true, cardSeen: true, storySeen: true }
    assert.equal(homeRoute(housed, 1_000).name, 'hub')
  })
})

describe('a lesson updates the profile', () => {
  it('counts a first-try correct toward points, stats, and streak', async () => {
    const player = { ...(await wizard()), status: 'active' as const }
    const result = applyAnswer(player, { question: spell('cat'), outcome: 'first', shield: false })
    assert.equal(result.player.housePoints, 10)
    assert.equal(result.player.galleons, 5)
    assert.deepEqual(result.player.stats.english, { answered: 1, correct: 1 })
    assert.equal(result.player.currentStreak, 1)
    assert.equal(result.player.pensieve.length, 0)
  })
  it('files a second miss in the pensieve and keeps a shielded streak', async () => {
    const player = { ...(await wizard()), status: 'active' as const, currentStreak: 4 }
    const shielded = applyAnswer(player, { question: sum('8'), outcome: 'wrong', shield: true })
    assert.equal(shielded.shielded, true)
    assert.equal(shielded.player.currentStreak, 4)
    assert.deepEqual(shielded.player.stats.math, { answered: 1, correct: 0 })
    assert.deepEqual(shielded.player.pensieve.map((item) => item.id), ['potions_8'])
    const open = applyAnswer(shielded.player, { question: sum('9'), outcome: 'wrong', shield: false })
    assert.equal(open.player.currentStreak, 0)
  })
  it('resolves the ladder the classrooms read', async () => {
    const player = await wizard()
    assert.deepEqual(resolveEnglish(player), { level: 'movers', band: 1 })
    assert.deepEqual(resolveMath(player), { grade: 4, band: 1 })
  })
})
