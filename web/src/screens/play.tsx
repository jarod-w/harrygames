import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { CURFEW_MS, useApp } from '../app/state'
import { CLASSROOMS, getClassroom } from '../classrooms/registry'
import { QuestionPlay, type Outcome } from '../components/QuestionPlay'
import { Avatar, Bar, Button, Crest, Screen, SpeakButton, Stat } from '../components/ui'
import { CastleSilhouette, Inkshade } from '../components/art'
import { HOUSES } from '../data/catalog'
import { charmsQuestions, potionsQuestion } from '../data/questions'
import type { ClassroomId } from '../data/types'
import { useI18n } from '../i18n'

function useCurfewLeft() {
  const { sessionStart } = useApp()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const ms = Math.max(0, CURFEW_MS - (now - sessionStart))
  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`
}

export function TopBar({ back }: { back?: boolean }) {
  const { player, go } = useApp()
  const { t } = useI18n()
  const curfew = useCurfewLeft()
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 short:mb-1">
      {back ? (
        <Button variant="ghost" className="!px-3" onClick={() => go({ name: 'hub' })}>← 🏰</Button>
      ) : (
        <button onClick={() => go({ name: 'settings' })} className="flex items-center gap-2 rounded-full pr-3 active:scale-95">
          <Avatar icon={player.avatar} size="sm" ring={HOUSES[player.house].color} />
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

export function Classroom({ id }: { id: ClassroomId }) {
  const { go, player } = useApp()
  const { t } = useI18n()
  const room = getClassroom(id)
  const questions = useMemo(() => room.makeRound(player), [room, player])
  const [i, setI] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [shield, setShield] = useState(player.wand.core === 'unicorn')
  const [toast, setToast] = useState<string | null>(null)
  const seconds = Math.round(room.seconds(player) * (player.wand.core === 'phoenix' ? 1.2 : 1))

  const flash = (s: string) => { setToast(s); setTimeout(() => setToast(null), 1800) }

  const done = (o: Outcome) => {
    let s = streak
    if (o === 'first') { s = streak + 1; setCorrect((c) => c + 1); if (s % 3 === 0) flash(t('levelUp')) }
    else if (o === 'hint') { s = 0; setCorrect((c) => c + 1) }
    else if (shield) { setShield(false); flash(t('shieldUsed')) }
    else s = 0
    setStreak(s)
    const nb = Math.max(best, s)
    setBest(nb)
    if (i + 1 >= questions.length) go({ name: 'result', id, correct: correct + (o !== 'wrong' ? 1 : 0), total: questions.length, streak: nb })
    else setI(i + 1)
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
        <span className="font-title text-parchment/80">{i + 1} / {questions.length}</span>
      </div>
      <div className="mb-2 flex items-center gap-2 text-sm text-parchment/70 short:hidden">{t(room.askKey)} <SpeakButton text={t(room.askKey)} className="!size-8 text-base" /></div>
      <QuestionPlay key={questions[i].id + i} q={questions[i]} seconds={seconds} keyboard={room.keyboard} onDone={done} />
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-gold-400 px-5 py-2 font-bold text-night-900 shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  )
}

export function Result({ id, correct, total, streak }: { id: ClassroomId; correct: number; total: number; streak: number }) {
  const { go, player, setPlayer } = useApp()
  const { t } = useI18n()
  const points = correct * 10
  const gold = correct * 5
  useEffect(() => {
    setPlayer({ ...player, housePoints: player.housePoints + points, galleons: player.galleons + gold })
    const end = Date.now() + 1200
    const f = () => { confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 } }); confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 } }); if (Date.now() < end) requestAnimationFrame(f) }
    f()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const { go, player } = useApp()
  const { t, l } = useI18n()
  const [bossHp, setBossHp] = useState(BOSS_HP)
  const [hp, setHp] = useState(3)
  const [n, setN] = useState(0)
  const [hit, setHit] = useState<'boss' | 'me' | null>(null)
  const [shield, setShield] = useState(player.wand.core === 'unicorn')
  const [msg, setMsg] = useState('')
  // Mixed English + maths, each at the player's own level (§4.3)
  const q = useMemo(() => (n % 2 === 0 ? charmsQuestions(player.grades.english)[n % 8] : potionsQuestion(player.grades.math, n)), [n, player])
  const dmg = player.wand.core === 'dragon' ? 25 : 20
  const won = bossHp <= 0
  const lost = hp <= 0

  useEffect(() => { if (won) confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } }) }, [won])

  const done = (o: Outcome) => {
    if (o !== 'wrong') { setBossHp((h) => h - (o === 'first' ? dmg : dmg / 2)); setHit('boss'); setMsg(t('attack')) }
    if (o !== 'first') {
      if (shield) { setShield(false); setMsg(t('shieldUsed')) }
      else { setHp((h) => h - 1); setHit('me'); setMsg(t('counter')) }
    }
    setTimeout(() => setHit(null), 600)
    setN(n + 1)
  }

  return (
    <Screen>
      <TopBar back />
      <div className="mb-2 flex items-center gap-4">
        <motion.div animate={hit === 'boss' ? { x: [0, 12, -12, 0], scale: [1, 0.9, 1] } : { y: [0, -6, 0] }} transition={hit ? { duration: 0.4 } : { repeat: Infinity, duration: 3 }}>
          <Inkshade size={won ? 120 : 96} mood={won ? 'happy' : hit === 'boss' ? 'hurt' : 'hungry'} />
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
      {won || lost ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="max-w-xl font-title text-2xl text-gold-300">{won ? t('bossWin') : t('counter')}</div>
          {won && <div className="text-parchment/70">📚 {l({ en: 'Reading and learning feed magic.', zh: '读书和学习，就是魔法的养料。' })}</div>}
          <Button onClick={() => go({ name: 'hub' })}>{t('backToCastle')}</Button>
        </div>
      ) : (
        <QuestionPlay key={q.id + n} q={q} seconds={20} keyboard={q.subject === 'english' ? 'letters' : 'numbers'} onDone={done} />
      )}
    </Screen>
  )
}
