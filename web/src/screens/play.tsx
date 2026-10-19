import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { useApp } from '../app/state'
import { CLASSROOMS, bossQuestion, getClassroom } from '../classrooms/registry'
import { QuestionPlay, type Outcome } from '../components/QuestionPlay'
import { Avatar, Bar, Button, Crest, Screen, SpeakButton, Stat } from '../components/ui'
import { CastleSilhouette, Inkshade } from '../components/art'
import { HOUSES } from '../data/catalog'
import type { ClassroomId, Player, Question } from '../data/types'
import { curfewRemaining } from '../game/curfew'
import { ABOVE_HINT_AT } from '../game/difficulty'
import { finishRound } from '../game/pensieve'
import { applyAnswer, GALLEONS, POINTS, questionSeconds } from '../game/progress'
import { useI18n } from '../i18n'

function useCurfewLeft() {
  const { player, now } = useApp()
  if (!player) return '0:00'
  const ms = curfewRemaining(player.curfew, now).ms
  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`
}

export function TopBar({ back }: { back?: boolean }) {
  const { player, go } = useApp()
  const { t } = useI18n()
  const curfew = useCurfewLeft()
  if (!player) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 short:mb-1">
      {back ? (
        <Button variant="ghost" className="!px-3" onClick={() => go({ name: 'hub' })}>← 🏰</Button>
      ) : (
        <button onClick={() => go({ name: 'settings' })} className="flex items-center gap-2 rounded-full pr-3 active:scale-95">
          <Avatar icon={player.avatar} size="sm" ring={player.house ? HOUSES[player.house].color : undefined} />
          <span className="hidden font-semibold sm:inline">{player.nickname}</span>
        </button>
      )}
      <div className="flex-1" />
      <Stat icon="🏆" value={player.housePoints} label={t('housePoints')} />
      <Stat icon="🪙" value={player.galleons} label={t('galleons')} />
      <Stat icon="🌙" value={curfew} label={t('curfewIn')} />
    </div>
  )
}

export function Hub() {
  const { go, player } = useApp()
  const { t, l } = useI18n()
  if (!player?.house) return null
  const tile = 'relative flex flex-col items-start gap-1 overflow-hidden rounded-3xl p-4 text-left ring-1 ring-white/10 transition active:scale-[0.97]'
  return (
    <Screen>
      <TopBar />
      <div className="mb-3 flex items-center gap-3">
        <Crest house={player.house} size={34} />
        <div>
          <div className="font-title text-xl font-bold text-gold-300 glow-gold">{t('castle')}</div>
          <div className="text-xs text-parchment/60">{l(HOUSES[player.house].name)} · 📖 {player.grades.english} · 🔢 P{player.grades.math}</div>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
        {CLASSROOMS.map((c) => (
          <button key={c.id} className={tile} style={{ background: `linear-gradient(160deg, ${c.accent}, #120d1f)` }} onClick={() => go({ name: 'classroom', id: c.id })}>
            <div className="text-5xl">{c.icon}</div>
            <div className="mt-auto font-title text-lg font-bold">{t(c.nameKey)}</div>
            <div className="text-xs text-parchment/80">{t(c.descKey)}</div>
            <div className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-xs">{c.levelLabel(player)}</div>
          </button>
        ))}
        <button className={tile} style={{ background: 'linear-gradient(160deg, #4b3a86, #0b0814)' }} onClick={() => go({ name: 'boss' })}>
          <Inkshade size={64} />
          <div className="mt-auto font-title text-lg font-bold">{t('boss')}</div>
          <div className="text-xs text-parchment/80">{t('bossDesc')}</div>
        </button>
        {[
          { icon: '🏆', key: 'houseCup' as const, r: { name: 'houseCup' as const } },
          { icon: '🌀', key: 'pensieve' as const, r: { name: 'pensieve' as const } },
          { icon: '🛍️', key: 'diagonAlley' as const, r: { name: 'shop' as const } },
        ].map((x) => (
          <button key={x.key} className={`${tile} bg-night-800`} onClick={() => go(x.r)}>
            <div className="text-4xl">{x.icon}</div>
            <div className="mt-auto font-title text-lg font-bold">{t(x.key)}</div>
          </button>
        ))}
        <button className={`${tile} border-2 border-dashed border-white/15 bg-transparent opacity-60`} disabled>
          <div className="text-4xl">🧹</div>
          <div className="mt-auto font-title text-lg font-bold">Flying · 飞行课</div>
          <div className="text-xs">{t('comingSoon')}</div>
        </button>
      </div>
      <CastleSilhouette className="pointer-events-none mt-3 h-16 w-full opacity-70" />
    </Screen>
  )
}

function useHoldCurfew() {
  const { setHoldCurfew } = useApp()
  useEffect(() => {
    setHoldCurfew(true)
    return () => setHoldCurfew(false)
  }, [setHoldCurfew])
}

function rose(before: Player, after: Player, id: ClassroomId) {
  const track = id === 'charms' ? 'english' : 'math'
  const a = before.difficulty[track]
  const b = after.difficulty[track]
  if (a.band === b.band && a.offset === b.offset) return null
  const up = b.offset > a.offset || (b.offset === a.offset && b.band > a.band)
  return up ? 'up' : 'down'
}

export function Classroom({ id }: { id: ClassroomId }) {
  const { go, player, patchPlayer, takeLightsOut } = useApp()
  const { t } = useI18n()
  const room = getClassroom(id)
  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [streak, setStreak] = useState(player?.currentStreak ?? 0)
  const [shield, setShield] = useState(player?.wand.core === 'unicorn')
  const [toast, setToast] = useState<string | null>(null)
  const tally = useRef({ correct: 0, points: 0, gold: 0, best: player?.currentStreak ?? 0, touched: [] as string[] })
  const shieldRef = useRef(shield)
  useEffect(() => { shieldRef.current = shield }, [shield])
  useHoldCurfew()

  useEffect(() => {
    if (player && !question) setQuestion(room.makeOne(player, 0, []))
    // Dealt once; each answer asks for the next question from the updated profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, player])

  const flash = (s: string) => { setToast(s); window.setTimeout(() => setToast(null), 1800) }

  if (!player || !question) return null
  const track = id === 'charms' ? player.difficulty.english : player.difficulty.math

  const done = (outcome: Outcome) => {
    const useShield = outcome === 'wrong' && shieldRef.current
    if (useShield) shieldRef.current = false
    let nextPlayer: Player | null = null
    const updated = patchPlayer((current) => {
      const result = applyAnswer(current, { question, outcome, shield: useShield })
      nextPlayer = result.player
      return result.player
    })
    if (!updated || !nextPlayer) return
    const saved = nextPlayer as Player
    if (useShield) { setShield(false); flash(t('shieldUsed')) }
    tally.current.points += POINTS[outcome]
    tally.current.gold += GALLEONS[outcome]
    if (outcome !== 'wrong') tally.current.correct += 1
    tally.current.touched.push(question.id)
    setStreak(saved.currentStreak)
    tally.current.best = Math.max(tally.current.best, saved.currentStreak)
    const shift = rose(player, saved, id)
    if (shift) flash(shift === 'up' ? t('levelUp') : t('levelDown'))
    else if ((id === 'charms' ? saved.difficulty.english : saved.difficulty.math).aboveCount === ABOVE_HINT_AT) flash(t('aboveGrade'))

    const wrap = (profile: Player) => ({ ...profile, pensieve: finishRound(profile.pensieve, tally.current.touched) })
    if (index + 1 >= room.roundSize) {
      patchPlayer(wrap)
      if (takeLightsOut()) go({ name: 'curfew' })
      else go({ name: 'result', id, correct: tally.current.correct, total: room.roundSize, streak: tally.current.best, points: tally.current.points, gold: tally.current.gold })
      return
    }
    const n = index + 1
    setIndex(n)
    setQuestion(room.makeOne(saved, n, tally.current.touched))
  }

  return (
    <Screen>
      <TopBar back />
      <div className="mb-2 flex items-center gap-3 short:mb-1">
        <div className="text-3xl short:text-2xl">{room.icon}</div>
        <div className="font-title text-xl font-bold text-gold-300">{t(room.nameKey)}</div>
        <div className="rounded-full bg-night-700 px-2 py-0.5 text-xs">{room.levelLabel(player)}</div>
        <div className="flex-1" />
        {shield && <span title={t('unicorn')}>🦄</span>}
        <span className="text-sm text-parchment/70">🔥 {streak}</span>
        <span className="font-title text-parchment/80">{index + 1} / {room.roundSize}</span>
      </div>
      <div className="mb-2 flex items-center gap-2 text-sm text-parchment/70 short:hidden">{t(room.askKey)} <SpeakButton text={t(room.askKey)} className="!size-8 text-base" /></div>
      {track.aboveCount >= ABOVE_HINT_AT && <div className="mb-2 rounded-xl bg-gold-400/15 px-3 py-1.5 text-sm text-gold-300">{t('aboveGrade')}</div>}
      <QuestionPlay key={question.id + index} q={question} seconds={questionSeconds(player, question)} keyboard={room.keyboard} onDone={done} />
      <Toast text={toast} />
    </Screen>
  )
}

export function Result({ id, correct, total, streak, points, gold }: { id: ClassroomId; correct: number; total: number; streak: number; points: number; gold: number }) {
  const { go } = useApp()
  const { t } = useI18n()
  useEffect(() => {
    const end = Date.now() + 1200
    const burst = () => {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 } })
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 } })
      if (Date.now() < end) requestAnimationFrame(burst)
    }
    burst()
  }, [])
  return (
    <Screen className="items-center justify-center text-center">
      <div className="text-7xl">📜✨</div>
      <div className="mt-2 font-display text-3xl text-gold-300 glow-gold">{t('lessonComplete')}</div>
      <div className="mt-1 text-parchment/80">{correct * 3} {t('lettersReturned')}</div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Stat icon="🏆" value={`+${points}`} label={t('housePoints')} />
        <Stat icon="🪙" value={`+${gold}`} label={t('galleons')} />
        <Stat icon="🎯" value={`${correct}/${total}`} label={t('accuracy')} />
        <Stat icon="🔥" value={streak} label={t('bestStreak')} />
      </div>
      <div className="mt-6 flex gap-3">
        <Button variant="ghost" onClick={() => go({ name: 'classroom', id })}>{t('playAgain')}</Button>
        <Button onClick={() => go({ name: 'hub' })}>{t('backToCastle')}</Button>
      </div>
    </Screen>
  )
}

const BOSS_HP = 100
export function Boss() {
  const { go, player, patchPlayer, takeLightsOut } = useApp()
  const { t, l } = useI18n()
  const [bossHp, setBossHp] = useState(BOSS_HP)
  const [hp, setHp] = useState(3)
  const [n, setN] = useState(0)
  const [hit, setHit] = useState<'boss' | 'me' | null>(null)
  const [shield, setShield] = useState(player?.wand.core === 'unicorn')
  const [ended, setEnded] = useState<'win' | 'lose' | null>(null)
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState<Question | null>(null)
  const hpRef = useRef(3)
  const bossRef = useRef(BOSS_HP)
  const shieldRef = useRef(shield)
  useEffect(() => { shieldRef.current = shield }, [shield])
  useHoldCurfew()

  useEffect(() => {
    if (player && !q) setQ(bossQuestion(player, 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, q])

  useEffect(() => { if (ended === 'win') confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } }) }, [ended])

  if (!player || !q) return null
  const dmg = player.wand.core === 'dragon' ? 25 : 20

  const miss = () => {
    if (shieldRef.current) { shieldRef.current = false; setShield(false); setMsg(t('shieldUsed')); return }
    hpRef.current -= 1
    setHp(hpRef.current)
    setHit('me')
    setMsg(t('counter'))
    window.setTimeout(() => setHit(null), 600)
  }

  const done = (outcome: Outcome) => {
    const updated = patchPlayer((current) => applyAnswer(current, { question: q, outcome, shield: false }).player)
    if (outcome !== 'wrong') {
      const hitFor = outcome === 'first' ? dmg : Math.round(dmg / 2)
      bossRef.current = Math.max(0, bossRef.current - hitFor)
      setBossHp(bossRef.current)
      setHit('boss')
      setMsg(t('attack'))
      window.setTimeout(() => setHit(null), 600)
    }
    if (bossRef.current <= 0) { setEnded('win'); return }
    if (hpRef.current <= 0) { setEnded('lose'); return }
    if (takeLightsOut()) { go({ name: 'curfew' }); return }
    const nextN = n + 1
    setN(nextN)
    setQ(bossQuestion(updated ?? player, nextN))
  }

  return (
    <Screen>
      <TopBar back />
      <div className="mb-2 flex items-center gap-4">
        <motion.div animate={hit === 'boss' ? { x: [0, 12, -12, 0], scale: [1, 0.9, 1] } : { y: [0, -6, 0] }} transition={hit ? { duration: 0.4 } : { repeat: Infinity, duration: 3 }}>
          <Inkshade size={ended === 'win' ? 120 : 96} mood={ended === 'win' ? 'happy' : hit === 'boss' ? 'hurt' : 'hungry'} />
        </motion.div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2"><span className="w-16 font-title text-sm text-gold-300">{t('bossName')}</span><Bar value={bossHp} max={BOSS_HP} color="#8b5cf6" className="flex-1" /></div>
          <div className="flex items-center gap-2">
            <span className="w-16 font-title text-sm text-gold-300">{t('yourHp')}</span>
            <motion.div animate={hit === 'me' ? { x: [0, -8, 8, 0] } : {}} className="text-2xl">{'❤️'.repeat(Math.max(0, hp))}{'🖤'.repeat(3 - Math.max(0, hp))}{shield ? ' 🦄' : ''}</motion.div>
          </div>
          <div className="h-5 text-sm text-parchment/80">{msg}</div>
        </div>
      </div>
      {ended ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="max-w-xl font-title text-2xl text-gold-300">{ended === 'win' ? t('bossWin') : t('bossLose')}</div>
          {ended === 'win' && <div className="text-parchment/70">📚 {l({ en: 'Reading and learning feed magic.', zh: '读书和学习，就是魔法的养料。' })}</div>}
          <Button onClick={() => { if (takeLightsOut()) go({ name: 'curfew' }); else go({ name: 'hub' }) }}>{t('backToCastle')}</Button>
        </div>
      ) : (
        <QuestionPlay key={q.id + n} q={q} seconds={questionSeconds(player, q)} keyboard={q.subject === 'english' ? 'letters' : 'numbers'} onDone={done} onMiss={miss} />
      )}
    </Screen>
  )
}

export function Review() {
  const { go, player, patchPlayer, takeLightsOut } = useApp()
  const { t, l } = useI18n()
  const [queue] = useState<Question[]>(() => {
    const items = [...(player?.pensieve ?? [])].sort((a, b) => a.wait - b.wait)
    return items.map((item) => item.question)
  })
  const [index, setIndex] = useState(0)
  const [shield, setShield] = useState(player?.wand.core === 'unicorn')
  const shieldRef = useRef(shield)
  useEffect(() => { shieldRef.current = shield }, [shield])
  useHoldCurfew()
  if (!player) return null
  if (queue.length === 0) {
    return (
      <Screen className="items-center justify-center text-center">
        <div className="text-6xl">🌀</div>
        <p className="mt-3 max-w-md">{t('pensieveEmpty')}</p>
        <Button className="mt-4" onClick={() => go({ name: 'pensieve' })}>{t('back')}</Button>
      </Screen>
    )
  }
  const question = queue[index]
  const memory = player.pensieve.find((item) => item.id === question.id)
  const done = (outcome: Outcome) => {
    const useShield = outcome === 'wrong' && shieldRef.current
    if (useShield) shieldRef.current = false
    if (useShield) setShield(false)
    patchPlayer((current) => applyAnswer(current, { question, outcome, shield: useShield }).player)
    if (takeLightsOut()) { go({ name: 'curfew' }); return }
    if (index + 1 >= queue.length) go({ name: 'pensieve' })
    else setIndex(index + 1)
  }
  return (
    <Screen>
      <TopBar back />
      <div className="mb-2 font-title text-gold-300">🌀 {t('pensieveTitle')} · {index + 1} / {queue.length}</div>
      <QuestionPlay
        key={question.id + index}
        q={question}
        seconds={questionSeconds(player, question)}
        keyboard={question.subject === 'english' ? 'letters' : 'numbers'}
        onDone={done}
      />
      <div className="mt-2 text-center text-xs text-parchment/50">{l({ en: `${memory?.recalls ?? 0}/2 memories back`, zh: `已取回 ${memory?.recalls ?? 0}/2` })}</div>
    </Screen>
  )
}

function Toast({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed left-1/2 top-4 z-50 max-w-[90vw] -translate-x-1/2 rounded-full bg-gold-400 px-5 py-2 text-center font-bold text-night-900 shadow-lg">
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
