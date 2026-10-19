import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useApp } from '../app/state'
import { TopBar } from './play'
import { Avatar, Bar, Button, Crest, Panel, Screen, SpeakButton, Title } from '../components/ui'
import { Wand } from '../components/art'
import { RunePad } from '../components/keyboards'
import { ENGLISH_LEVELS, HOUSE_IDS, HOUSES, MATH_GRADES, WAND_SKINS } from '../data/catalog'
import type { EnglishLevel, MathGrade, Player } from '../data/types'
import { curfewRemaining } from '../game/curfew'
import { ABOVE_HINT_AT } from '../game/difficulty'
import { setGrades } from '../game/player'
import { lockRunes, matchesLock, withRunes } from '../game/password'
import { storage } from '../services/StorageService'
import { useI18n } from '../i18n'

const acc = (p: Player) => {
  const a = p.stats.english.answered + p.stats.math.answered
  return { answered: a, rate: a ? (p.stats.english.correct + p.stats.math.correct) / a : 0 }
}

export function HouseCup() {
  const { t, l } = useI18n()
  const [ps, setPs] = useState<Player[]>([])
  useEffect(() => { storage.listPlayers().then((x) => setPs(x.filter((p) => p.status === 'active'))) }, [])
  // Q14: house cup = points per wizard
  const houses = HOUSE_IDS.map((h) => {
    const m = ps.filter((p) => p.house === h)
    const total = m.reduce((s, p) => s + p.housePoints, 0)
    return { h, n: m.length, avg: m.length ? Math.round(total / m.length) : 0 }
  }).sort((a, b) => b.avg - a.avg)
  const max = Math.max(1, ...houses.map((x) => x.avg))
  const byAcc = ps.filter((p) => p.house && acc(p).answered >= 50).sort((a, b) => acc(b).rate - acc(a).rate)
  const byStreak = ps.filter((p) => p.house).sort((a, b) => b.bestStreak - a.bestStreak)
  return (
    <Screen>
      <TopBar back />
      <Title className="mb-3 text-center">🏆 {t('houseCupTitle')}</Title>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <Panel className="flex flex-col gap-3">
          {houses.map((x, i) => (
            <div key={x.h} className="flex items-center gap-3">
              <div className="w-6 text-center font-title text-lg text-gold-300">{i === 0 ? '🏆' : i + 1}</div>
              <Crest house={x.h} size={34} />
              <div className="flex-1">
                <div className="flex justify-between text-sm"><b>{l(HOUSES[x.h].name)}</b><span className="text-parchment/60">{x.n} {t('wizards')}</span></div>
                <Bar value={x.avg} max={max} color={HOUSES[x.h].color} className="mt-1 !h-4" />
              </div>
              <div className="w-14 text-right font-bold tabular-nums text-gold-300">{x.avg}</div>
            </div>
          ))}
          <div className="text-right text-xs text-parchment/50">{t('perWizard')}</div>
        </Panel>
        <Panel>
          <div className="mb-2 font-title text-gold-300">🎯 {t('topAccuracy')}</div>
          {byAcc.map((p, i) => (
            <div key={p.playerId} className="flex items-center gap-2 py-1">
              <span className="w-5 text-parchment/60">{i + 1}</span><Avatar icon={p.avatar} size="sm" ring={p.house ? HOUSES[p.house].color : undefined} />
              <span className="flex-1 truncate">{p.nickname}</span><b className="tabular-nums">{Math.round(acc(p).rate * 100)}%</b>
            </div>
          ))}
          <div className="mt-2 text-xs text-parchment/50">{t('min50')}</div>
        </Panel>
        <Panel>
          <div className="mb-2 font-title text-gold-300">🔥 {t('topStreak')}</div>
          {byStreak.map((p, i) => (
            <div key={p.playerId} className="flex items-center gap-2 py-1">
              <span className="w-5 text-parchment/60">{i + 1}</span><Avatar icon={p.avatar} size="sm" ring={p.house ? HOUSES[p.house].color : undefined} />
              <span className="flex-1 truncate">{p.nickname}</span><b className="tabular-nums">{p.bestStreak}</b>
            </div>
          ))}
        </Panel>
      </div>
    </Screen>
  )
}

export function Pensieve() {
  const { go, player } = useApp()
  const { t, l } = useI18n()
  const items = player?.pensieve ?? []
  return (
    <Screen>
      <TopBar back />
      <div className="flex flex-col items-center gap-2 text-center">
        <motion.div className="text-7xl" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}>🌀</motion.div>
        <Title>{t('pensieveTitle')}</Title>
        <p className="flex max-w-xl items-center gap-2 text-parchment/70">{t('pensieveDesc')} <SpeakButton text={t('pensieveDesc')} /></p>
      </div>
      {items.length === 0 ? <p className="mt-6 text-center text-parchment/60">{t('pensieveEmpty')}</p> : (
        <div className="mx-auto mt-4 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {items.map((m) => (
            <Panel key={m.id} className="flex items-center gap-3 !p-4">
              <div className="text-4xl">{m.question.image ?? '🌀'}</div>
              <div className="flex-1">
                <div className="font-title font-bold">{m.question.subject === 'english' ? m.question.answer : l(m.question.prompt)}</div>
                <div className="text-xs text-parchment/50">{m.wait <= 0 ? t('dueNow') : m.id}</div>
              </div>
              <div className="flex gap-1">{[0, 1].map((k) => <span key={k} className={`size-4 rounded-full ${k < m.recalls ? 'bg-gold-400' : 'bg-night-600'}`} />)}</div>
            </Panel>
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-center"><Button disabled={items.length === 0} onClick={() => go({ name: 'review' })}>{t('practice')}</Button></div>
    </Screen>
  )
}

export function Shop() {
  const { player, patchPlayer } = useApp()
  const { t, l } = useI18n()
  if (!player) return null
  return (
    <Screen>
      <TopBar back />
      <Title className="text-center">🛍️ {t('shopTitle')}</Title>
      <p className="mb-4 text-center text-sm text-parchment/60">{t('shopNote')}</p>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 md:grid-cols-3">
        {WAND_SKINS.map((s) => {
          const owned = player.inventory.includes(s.id) || s.price === 0
          const equipped = player.wand.skin === s.id
          return (
            <Panel key={s.id} className={`flex flex-col items-center gap-2 !p-4 ${equipped ? 'ring-2 ring-gold-400' : ''}`}>
              <Wand colors={s.colors} className="w-full max-w-48" />
              <div className="font-title font-bold">{l(s.name)}</div>
              {owned ? (
                <Button variant="ghost" disabled={equipped} onClick={() => patchPlayer((p) => ({ ...p, wand: { ...p.wand, skin: s.id } }))}>{equipped ? '✓' : t('owned')}</Button>
              ) : (
                <Button disabled={player.galleons < s.price} onClick={() => patchPlayer((p) => p.galleons < s.price ? p : ({ ...p, galleons: p.galleons - s.price, inventory: [...p.inventory, s.id], wand: { ...p.wand, skin: s.id } }))}>
                  🪙 {s.price} · {t('buy')}
                </Button>
              )}
            </Panel>
          )
        })}
      </div>
    </Screen>
  )
}

export function Curfew() {
  const { go, player, now } = useApp()
  const { t } = useI18n()
  const left = player ? curfewRemaining(player.curfew, now) : { kind: 'rest' as const, ms: 0 }
  const ready = left.kind === 'play'
  const ms = left.ms
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-black p-6 text-center">
      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 4 }} className="text-8xl">🌙</motion.div>
      <div className="font-display text-4xl text-gold-300/80">{t('lightsOut')}</div>
      <p className="flex max-w-lg items-center gap-2 text-parchment/60">{t('curfewMsg')} <SpeakButton text={t('curfewMsg')} /></p>
      {ready ? (
        <Button onClick={() => go({ name: 'hub' })}>{t('enterCastle')}</Button>
      ) : (
        <>
          <div className="text-parchment/50">{t('lightsBack')}</div>
          <div className="font-title text-5xl tabular-nums text-parchment/80">{Math.floor(ms / 60000)}:{String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}</div>
        </>
      )}
    </div>
  )
}

export function Settings() {
  const { go, player, patchPlayer, setPlayer } = useApp()
  const { t, l, lang, setLang } = useI18n()
  const [note, setNote] = useState('')
  const chip = (on: boolean) => `min-h-11 rounded-xl px-3 font-bold ${on ? 'bg-gold-400 text-night-900' : 'bg-night-700'}`
  if (!player) return null
  const saveGrades = (english: EnglishLevel, math: MathGrade) => {
    patchPlayer((p) => setGrades(p, { english, math }))
    setNote(t('gradesSaved'))
  }
  return (
    <Screen>
      <TopBar back />
      <Title className="text-center">⚙️ {t('settings')}</Title>
      <Panel className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4">
        <div>
          <div className="mb-2 font-title text-gold-300">{t('language')}</div>
          <div className="flex gap-2">
            {(['en', 'zh'] as const).map((x) => (
              <button key={x} onClick={() => setLang(x)} className={`min-h-11 flex-1 rounded-xl font-bold ${lang === x ? 'bg-gold-400 text-night-900' : 'bg-night-700'}`}>{x === 'en' ? 'English' : '中文'}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 font-title text-gold-300">{t('changeGrades')}</div>
          <div className="mb-2 flex flex-wrap gap-2">
            {ENGLISH_LEVELS.map((e) => <button key={e.id} className={chip(player.grades.english === e.id)} onClick={() => saveGrades(e.id, player.grades.math)}>{l(e.name)}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {MATH_GRADES.map((g) => <button key={g} className={chip(player.grades.math === g)} onClick={() => saveGrades(player.grades.english, g)}>P{g}</button>)}
          </div>
          {note && <div className="mt-2 text-sm text-gold-300">{note}</div>}
        </div>
        <div className="flex items-center gap-2 text-sm text-parchment/70">🔊 {t('speakHelp')} <SpeakButton text={t('speakHelp')} /></div>
        <Button variant="ghost" onClick={() => { setPlayer(null); go({ name: 'login' }) }}>{t('logout')}</Button>
      </Panel>
    </Screen>
  )
}

export function Admin() {
  const { player, setPlayer } = useApp()
  const { t, l } = useI18n()
  const [ps, setPs] = useState<Player[]>([])
  const [note, setNote] = useState('')
  const [gate, setGate] = useState<'loading' | 'set' | 'enter' | 'open'>('loading')
  const [runes, setRunes] = useState<string[]>([])
  const [err, setErr] = useState(false)
  const [resetId, setResetId] = useState<string | null>(null)
  const [resetRunes, setResetRunes] = useState<string[]>([])
  const reload = async () => setPs(await storage.listPlayers())
  useEffect(() => {
    void (async () => {
      const lock = await storage.getHeadmaster()
      setGate(lock ? 'enter' : 'set')
      await reload()
    })()
  }, [])

  useEffect(() => {
    if (runes.length !== 4 || gate === 'open' || gate === 'loading') return
    let cancel = false
    const id = window.setTimeout(() => {
      void (async () => {
        if (gate === 'set') {
          await storage.saveHeadmaster(await lockRunes(runes))
          if (!cancel) { setGate('open'); setRunes([]) }
          return
        }
        const lock = await storage.getHeadmaster()
        if (!lock || cancel) return
        const ok = await matchesLock(lock, runes)
        if (ok) { setGate('open'); setErr(false); setRunes([]) }
        else { setErr(true); window.setTimeout(() => { setErr(false); setRunes([]) }, 500) }
      })()
    }, 200)
    return () => { cancel = true; window.clearTimeout(id) }
  }, [runes, gate])

  const approve = async (p: Player) => {
    const next = { ...p, status: 'active' as const }
    await storage.savePlayer(next)
    if (player?.playerId === p.playerId) setPlayer(next)
    await reload()
  }
  const reject = async (p: Player) => {
    await storage.deletePlayer(p.playerId)
    if (player?.playerId === p.playerId) setPlayer(null)
    setNote(t('rejectedNote'))
    await reload()
  }
  const saveReset = async (p: Player) => {
    if (resetRunes.length < 4) return
    const next = await withRunes(p, resetRunes)
    await storage.savePlayer(next)
    if (player?.playerId === p.playerId) setPlayer(next)
    setResetId(null)
    setResetRunes([])
    setNote(`${p.nickname}: ${t('runesUpdated')}`)
    await reload()
  }

  if (gate !== 'open') {
    return (
      <Screen className="items-center">
        <Title className="text-center">{t('adminTitle')}</Title>
        <p className="mt-2 max-w-md text-center text-parchment/70">{gate === 'set' ? t('setHeadRunes') : t('headEnter')}</p>
        <p className="mb-4 max-w-md text-center text-xs text-parchment/50">{t('headRunesHint')}</p>
        <RunePad value={runes} onChange={setRunes} error={err} />
      </Screen>
    )
  }

  const pending = ps.filter((p) => p.status === 'pending')
  return (
    <Screen>
      <Title className="text-center">🧙‍♂️ {t('adminTitle')}</Title>
      <div className="mx-auto mt-4 grid w-full max-w-5xl gap-4 md:grid-cols-[1fr_2fr]">
        <Panel>
          <div className="mb-2 font-title text-gold-300">🦉 {t('pendingProfiles')} ({pending.length})</div>
          {pending.length === 0 && <div className="text-sm text-parchment/50">—</div>}
          {pending.map((p) => (
            <div key={p.playerId} className="flex items-center gap-2 py-1.5">
              <Avatar icon={p.avatar} size="sm" /><span className="flex-1">{p.nickname}</span>
              <Button className="!px-3 !py-1 text-sm" onClick={() => void approve(p)}>{t('approve')}</Button>
              <Button variant="ghost" className="!px-3 !py-1 text-sm" onClick={() => void reject(p)}>{t('reject')}</Button>
            </div>
          ))}
        </Panel>
        <Panel className="overflow-x-auto">
          <div className="mb-2 font-title text-gold-300">{t('allPlayers')}</div>
          <table className="w-full text-sm">
            <tbody>
              {ps.filter((p) => p.status === 'active').map((p) => {
                const a = acc(p)
                const above = p.difficulty.english.aboveCount >= ABOVE_HINT_AT || p.difficulty.math.aboveCount >= ABOVE_HINT_AT
                return (
                  <tr key={p.playerId} className="border-t border-white/5">
                    <td className="py-1.5"><Avatar icon={p.avatar} size="sm" ring={p.house ? HOUSES[p.house].color : undefined} /></td>
                    <td className="px-2">{p.nickname}<div className="text-xs text-parchment/50">{p.house ? l(HOUSES[p.house].name) : '…'}</div></td>
                    <td className="px-2 whitespace-nowrap">📖 {p.grades.english}<br />🔢 P{p.grades.math}</td>
                    <td className="px-2 tabular-nums">{Math.round(a.rate * 100)}%<div className="text-xs text-parchment/50">{a.answered}</div></td>
                    <td className="px-2">{above && <span className="text-xs text-gold-300">⬆ {t('stayingAbove')}</span>}</td>
                    <td className="text-right"><Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => { setResetId(p.playerId); setResetRunes([]) }}>{t('resetRunes')}</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {resetId && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="font-title text-gold-300">{ps.find((p) => p.playerId === resetId)?.nickname}</div>
              <RunePad value={resetRunes} onChange={setResetRunes} />
              <Button disabled={resetRunes.length < 4} onClick={() => {
                const target = ps.find((p) => p.playerId === resetId)
                if (target) void saveReset(target)
              }}>{t('resetRunes')}</Button>
            </div>
          )}
          {note && <div className="mt-2 text-sm text-gold-300">{note}</div>}
        </Panel>
      </div>
    </Screen>
  )
}
