import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { useApp } from '../app/state'
import { Avatar, Button, Crest, Panel, Parchment, Screen, SpeakButton, Title } from '../components/ui'
import { RunePad } from '../components/keyboards'
import { CastleSilhouette, Inkshade, Wand } from '../components/art'
import { AVATARS, ENGLISH_LEVELS, HOUSE_IDS, HOUSES, MATH_GRADES, SORTING_QUESTIONS, WAND_CORES, WAND_SKINS } from '../data/catalog'
import type { HouseId, Player } from '../data/types'
import { storage } from '../services/StorageService'
import { useI18n } from '../i18n'

export function Splash() {
  const { go } = useApp()
  const { t } = useI18n()
  return (
    <Screen className="items-center justify-center text-center">
      <button
        className="flex flex-1 flex-col items-center justify-center gap-4"
        onClick={() => {
          // §6.4: a user tap unlocks audio + speech on iOS
          try { window.speechSynthesis?.speak(new SpeechSynthesisUtterance('')) } catch { /* ignore */ }
          go({ name: 'login' })
        }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <div className="font-display text-5xl text-gold-300 glow-gold sm:text-7xl">{t('appTitle')}</div>
          <div className="mt-2 font-title text-lg text-parchment/80 sm:text-2xl">{t('appSubtitle')}</div>
        </motion.div>
        <CastleSilhouette className="float mt-2 w-[min(520px,85vw)]" />
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="font-title text-xl text-gold-400"
        >
          ✨ {t('tapToEnter')} ✨
        </motion.div>
      </button>
      <div className="text-xs text-parchment/40">{t('fanNotice')}</div>
    </Screen>
  )
}

export function Login() {
  const { go, setPlayer } = useApp()
  const { t } = useI18n()
  const [players, setPlayers] = useState<Player[]>([])
  const [picked, setPicked] = useState<Player | null>(null)
  const [runes, setRunes] = useState<string[]>([])
  const [tries, setTries] = useState(0)
  const [err, setErr] = useState(false)

  useEffect(() => { storage.listPlayers().then((ps) => setPlayers(ps.filter((p) => p.status === 'active'))) }, [])

  useEffect(() => {
    if (runes.length !== 4 || !picked) return
    // Prototype: any 4 runes work except 4 identical ones (to show the error state)
    const ok = new Set(runes).size > 1
    const id = setTimeout(() => {
      if (ok) { setPlayer(picked); go({ name: 'hub' }) }
      else { setErr(true); setTries((n) => n + 1); setTimeout(() => { setErr(false); setRunes([]) }, 600) }
    }, 250)
    return () => clearTimeout(id)
  }, [runes, picked, go, setPlayer])

  if (picked)
    return (
      <Screen className="items-center">
        <div className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <div className="flex flex-col items-center gap-3">
            <Avatar icon={picked.avatar} size="lg" ring={HOUSES[picked.house].color} />
            <div className="font-title text-xl text-gold-300">{picked.nickname}</div>
            <div className="flex items-center gap-2 text-parchment/80">{t('tapRunes')} <SpeakButton text={t('tapRunes')} /></div>
            {tries > 0 && <div className="max-w-60 text-center text-sm text-red-300">{tries >= 5 ? t('locked') : t('wrongRunes')}</div>}
            <div className="max-w-60 text-center text-xs text-parchment/50">{t('forgotRunes')}</div>
            <Button variant="ghost" onClick={() => { setPicked(null); setRunes([]) }}>← {t('back')}</Button>
          </div>
          <RunePad value={runes} onChange={setRunes} error={err} />
        </div>
      </Screen>
    )

  return (
    <Screen>
      <div className="flex items-center justify-center gap-2">
        <Title className="text-center">{t('whoAreYou')}</Title>
        <SpeakButton text={t('whoAreYou')} />
      </div>
      <div className="mx-auto mt-6 grid w-full max-w-4xl grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {players.map((p) => (
          <button key={p.playerId} onClick={() => setPicked(p)} className="flex flex-col items-center gap-2 rounded-2xl p-3 transition active:scale-95 hover:bg-night-700/50">
            <Avatar icon={p.avatar} ring={HOUSES[p.house].color} />
            <span className="line-clamp-1 text-sm font-semibold">{p.nickname}</span>
          </button>
        ))}
        <button onClick={() => go({ name: 'register' })} className="flex flex-col items-center gap-2 rounded-2xl p-3 transition active:scale-95 hover:bg-night-700/50">
          <div className="grid size-16 place-items-center rounded-full border-2 border-dashed border-gold-400/60 text-3xl text-gold-400">＋</div>
          <span className="text-sm font-semibold text-gold-400">{t('newWizard')}</span>
        </button>
      </div>
    </Screen>
  )
}

export function Register() {
  const { go, setPlayer, player } = useApp()
  const { t, l } = useI18n()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [eng, setEng] = useState<Player['grades']['english']>('movers')
  const [math, setMath] = useState<Player['grades']['math']>(3)
  const [runes, setRunes] = useState<string[]>([])
  const chip = (on: boolean) => `min-h-11 rounded-xl px-4 font-bold transition ${on ? 'bg-gold-400 text-night-900' : 'bg-night-700 text-parchment ring-1 ring-white/10'}`
  return (
    <Screen>
      <Title className="text-center">{t('createProfile')}</Title>
      <div className="mx-auto mt-5 grid w-full max-w-5xl gap-5 md:grid-cols-2">
        <Panel className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-title text-gold-300">{t('nickname')}</span>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder={t('nicknamePh')} maxLength={16}
              autoCorrect="off" autoCapitalize="off" autoComplete="off" spellCheck={false}
              className="min-h-12 rounded-xl bg-night-950 px-4 text-lg text-parchment outline-none ring-1 ring-gold-400/40 focus:ring-2"
            />
            <span className="text-xs text-parchment/50">🔒 {t('privacyNote')}</span>
          </label>
          <div>
            <div className="mb-2 font-title text-gold-300">{t('pickAvatar')}</div>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button key={a} onClick={() => setAvatar(a)} className={`grid size-12 place-items-center rounded-full text-2xl transition ${a === avatar ? 'bg-gold-400/30 ring-2 ring-gold-400' : 'bg-night-700'}`}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 font-title text-gold-300">📖 {t('englishLevel')}</div>
            <div className="flex flex-wrap gap-2">
              {ENGLISH_LEVELS.map((e) => <button key={e.id} className={chip(eng === e.id)} onClick={() => setEng(e.id)}>{l(e.name)}</button>)}
            </div>
          </div>
          <div>
            <div className="mb-2 font-title text-gold-300">🔢 {t('mathGrade')}</div>
            <div className="flex flex-wrap gap-2">
              {MATH_GRADES.map((g) => <button key={g} className={chip(math === g)} onClick={() => setMath(g)}>P{g}</button>)}
            </div>
          </div>
        </Panel>
        <Panel className="flex flex-col items-center gap-3">
          <div className="font-title text-gold-300">{t('setRunes')}</div>
          <RunePad value={runes} onChange={setRunes} />
        </Panel>
      </div>
      <div className="mt-5 flex justify-center gap-3">
        <Button variant="ghost" onClick={() => go({ name: 'login' })}>← {t('back')}</Button>
        <Button
          disabled={!name.trim() || runes.length < 4}
          onClick={() => {
            setPlayer({ ...player, playerId: 'wiz_new', nickname: name.trim(), avatar, grades: { english: eng, math }, housePoints: 0, galleons: 50, status: 'pending', mistakes: [], bestStreak: 0 })
            go({ name: 'pending' })
          }}
        >
          🦉 {t('sendOwl')}
        </Button>
      </div>
    </Screen>
  )
}

export function Pending() {
  const { go } = useApp()
  const { t } = useI18n()
  return (
    <Screen className="items-center justify-center text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <motion.div
          className="text-8xl"
          animate={{ x: [-60, 60, -60], y: [0, -20, 0], rotate: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          🦉✉️
        </motion.div>
        <div className="flex items-center gap-2">
          <Title>{t('owlSending')}</Title>
          <SpeakButton text={t('owlSending')} />
        </div>
        <p className="max-w-md text-parchment/70">{t('owlWait')}</p>
        {/* Prototype shortcut: pretend Dad approved */}
        <Button variant="ghost" onClick={() => go({ name: 'sorting' })}>(Prototype) Dad approved → </Button>
      </div>
    </Screen>
  )
}

export function Sorting() {
  const { go, player, setPlayer } = useApp()
  const { t, l } = useI18n()
  const [step, setStep] = useState(0)
  const [votes, setVotes] = useState<HouseId[]>([])
  const [counts, setCounts] = useState<Record<HouseId, number> | null>(null)
  const [choice, setChoice] = useState<HouseId | null>(null)
  useEffect(() => { storage.houseCounts().then(setCounts) }, [])

  const suggested = useMemo(() => {
    const tally: Record<string, number> = {}
    votes.forEach((v) => (tally[v] = (tally[v] ?? 0) + 1))
    return (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'gryffindor') as HouseId
  }, [votes])

  if (step < SORTING_QUESTIONS.length) {
    const q = SORTING_QUESTIONS[step]
    return (
      <Screen className="items-center">
        <div className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 sm:flex-row">
          <div className="flex flex-col items-center">
            <div className="float text-8xl">🎩</div>
            <div className="font-title text-gold-300">{t('sortingTitle')}</div>
            <div className="mt-1 text-sm italic text-parchment/60">{t('sortingIntro')}</div>
          </div>
          <Parchment className="w-full max-w-lg">
            <div className="mb-1 text-sm text-ink/60">{step + 1} / {SORTING_QUESTIONS.length}</div>
            <div className="mb-4 flex items-start gap-2">
              <div className="flex-1 font-title text-xl font-bold">{l(q.q)}</div>
              <SpeakButton text={l(q.q)} className="bg-parchment-dark ring-ink/20" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o) => (
                <button key={o.house} onClick={() => { setVotes([...votes, o.house]); setStep(step + 1) }}
                  className="min-h-14 rounded-2xl bg-white/60 px-4 py-3 text-left font-semibold ring-1 ring-ink/15 transition active:scale-95 hover:bg-white">
                  {l(o.text)}
                </button>
              ))}
            </div>
          </Parchment>
        </div>
      </Screen>
    )
  }

  const picked = choice ?? suggested
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0
  const crowded = counts && total > 0 && counts[picked] / total > 0.34
  return (
    <Screen className="items-center">
      <div className="mt-2 font-title text-parchment/70">{t('hatSuggests')}</div>
      <motion.div key={picked} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="my-3 flex items-center gap-4">
        <Crest house={picked} size={80} />
        <div>
          <div className="font-display text-4xl" style={{ color: HOUSES[picked].color === 'var(--color-hufflepuff)' ? '#f6dc8f' : '#fff' }}>{l(HOUSES[picked].name)}</div>
          <div className="text-parchment/70">{l(HOUSES[picked].trait)}</div>
        </div>
      </motion.div>
      {crowded && <div className="mb-3 max-w-lg rounded-xl bg-gold-400/15 px-4 py-2 text-center text-sm text-gold-300">🎩 {t('crowdedHint')}</div>}
      <div className="mb-2 text-sm text-parchment/60">{t('chooseOther')}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {HOUSE_IDS.map((h) => (
          <button key={h} onClick={() => setChoice(h)}
            className={`flex flex-col items-center gap-1 rounded-2xl p-3 transition ${picked === h ? 'bg-night-600 ring-2 ring-gold-400' : 'bg-night-800 ring-1 ring-white/10'}`}>
            <Crest house={h} size={40} />
            <span className="text-sm font-bold">{l(HOUSES[h].name)}</span>
            <span className="text-xs text-parchment/50">{counts?.[h] ?? 0} {t('wizards')}</span>
          </button>
        ))}
      </div>
      <Button className="mt-5" onClick={() => { setPlayer({ ...player, house: picked }); go({ name: 'wand' }) }}>{t('accept')}</Button>
    </Screen>
  )
}

export function WandChoice() {
  const { go, player, setPlayer } = useApp()
  const { t } = useI18n()
  const [core, setCore] = useState(player.wand.core)
  return (
    <Screen className="items-center">
      <Title className="text-center">{t('wandTitle')}</Title>
      <p className="mt-1 max-w-xl text-center text-sm text-parchment/60">{t('wandNote')}</p>
      <div className="mt-6 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {WAND_CORES.map((c) => (
          <button key={c.id} onClick={() => setCore(c.id)}
            className={`flex flex-col items-center gap-2 rounded-3xl p-5 text-center transition active:scale-95 ${core === c.id ? 'bg-night-600 ring-2 ring-gold-400' : 'bg-night-800 ring-1 ring-white/10'}`}>
            <div className="text-6xl">{c.icon}</div>
            <Wand colors={WAND_SKINS[0].colors} className="w-40" />
            <div className="font-title text-lg font-bold text-gold-300">{t(c.nameKey)}</div>
            <div className="text-sm text-parchment/80">{t(c.descKey)}</div>
          </button>
        ))}
      </div>
      <Button className="mt-6" onClick={() => { setPlayer({ ...player, wand: { ...player.wand, core } }); go({ name: 'card' }) }}>{t('next')} →</Button>
    </Screen>
  )
}

export function WizardCard() {
  const { go, player } = useApp()
  const { t, l } = useI18n()
  const core = WAND_CORES.find((c) => c.id === player.wand.core)!
  useEffect(() => { confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#e9c46a', '#f6dc8f', '#ffffff'] }) }, [])
  return (
    <Screen className="items-center justify-center">
      <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.8 }}>
        <Parchment className="w-[min(420px,90vw)] border-4 border-gold-500">
          <div className="text-center font-display text-lg text-ink/80">{t('wizardCard')}</div>
          <div className="mt-3 flex items-center gap-4">
            <Avatar icon={player.avatar} size="lg" ring={HOUSES[player.house].color} />
            <div className="flex-1">
              <div className="font-title text-2xl font-bold">{player.nickname}</div>
              <div className="mt-1 flex items-center gap-2 text-sm"><Crest house={player.house} size={22} /> {l(HOUSES[player.house].name)}</div>
              <div className="mt-1 text-sm">{core.icon} {t(core.nameKey)}</div>
              <div className="mt-1 text-sm">📖 {player.grades.english} · 🔢 P{player.grades.math}</div>
            </div>
          </div>
        </Parchment>
      </motion.div>
      <Button className="mt-6" onClick={() => go({ name: 'story' })}>{t('begin')} →</Button>
    </Screen>
  )
}

export function Story() {
  const { go } = useApp()
  const { t } = useI18n()
  const [i, setI] = useState(0)
  const lines = [t('story1'), t('story2'), t('story3')]
  return (
    <Screen className="items-center justify-center text-center">
      <div className="font-display text-2xl text-gold-300 glow-gold">{t('storyTitle')}</div>
      <div className="my-4 h-44">
        {i >= 1 && <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}><Inkshade size={170} className="float" /></motion.div>}
        {i === 0 && <div className="text-8xl opacity-60">🏰</div>}
      </div>
      <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex max-w-2xl items-center gap-2 text-xl leading-relaxed">
        {lines[i]} <SpeakButton text={lines[i]} />
      </motion.p>
      <div className="mt-6">
        {i < lines.length - 1 ? <Button onClick={() => setI(i + 1)}>{t('next')} →</Button> : <Button onClick={() => go({ name: 'hub' })}>⚡ {t('imIn')}</Button>}
      </div>
    </Screen>
  )
}
