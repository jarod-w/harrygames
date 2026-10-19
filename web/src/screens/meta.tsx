import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { REST_MS, useApp } from '../app/state'
import { TopBar } from './play'
import { Avatar, Bar, Button, Crest, Panel, Screen, SpeakButton, Title } from '../components/ui'
import { Wand } from '../components/art'
import { HOUSE_IDS, HOUSES, WAND_SKINS } from '../data/catalog'
import type { Player } from '../data/types'
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
  const byAcc = ps.filter((p) => acc(p).answered >= 50).sort((a, b) => acc(b).rate - acc(a).rate)
  const byStreak = [...ps].sort((a, b) => b.bestStreak - a.bestStreak)
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
              <span className="w-5 text-parchment/60">{i + 1}</span><Avatar icon={p.avatar} size="sm" ring={HOUSES[p.house].color} />
              <span className="flex-1 truncate">{p.nickname}</span><b className="tabular-nums">{Math.round(acc(p).rate * 100)}%</b>
            </div>
          ))}
          <div className="mt-2 text-xs text-parchment/50">{t('min50')}</div>
        </Panel>
        <Panel>
          <div className="mb-2 font-title text-gold-300">🔥 {t('topStreak')}</div>
          {byStreak.map((p, i) => (
            <div key={p.playerId} className="flex items-center gap-2 py-1">
              <span className="w-5 text-parchment/60">{i + 1}</span><Avatar icon={p.avatar} size="sm" ring={HOUSES[p.house].color} />
              <span className="flex-1 truncate">{p.nickname}</span><b className="tabular-nums">{p.bestStreak}</b>
            </div>
          ))}
        </Panel>
      </div>
    </Screen>
  )
}

export function Pensieve() {
  const { go } = useApp()
  const { t } = useI18n()
  const items = [
    { id: 'charms_movers_001', icon: '🏰', label: 'castle', done: 1 },
    { id: 'potions_g4_002', icon: '⚗️', label: '37 × 6', done: 0 },
    { id: 'arithmancy_g4_003', icon: '🚪', label: '2, 4, 8, 16, ?', done: 1 },
    { id: 'charms_movers_007', icon: '🏝️', label: 'island', done: 0 },
  ]
  return (
    <Screen>
      <TopBar back />
      <div className="flex flex-col items-center gap-2 text-center">
        <motion.div className="text-7xl" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}>🌀</motion.div>
        <Title>{t('pensieveTitle')}</Title>
        <p className="flex max-w-xl items-center gap-2 text-parchment/70">{t('pensieveDesc')} <SpeakButton text={t('pensieveDesc')} /></p>
      </div>
      <div className="mx-auto mt-4 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
        {items.map((m) => (
          <Panel key={m.id} className="flex items-center gap-3 !p-4">
            <div className="text-4xl">{m.icon}</div>
            <div className="flex-1">
              <div className="font-title font-bold">{m.label}</div>
              <div className="text-xs text-parchment/50">{m.id}</div>
            </div>
            <div className="flex gap-1">{[0, 1].map((k) => <span key={k} className={`size-4 rounded-full ${k < m.done ? 'bg-gold-400' : 'bg-night-600'}`} />)}</div>
          </Panel>
        ))}
      </div>
      <div className="mt-5 flex justify-center"><Button onClick={() => go({ name: 'classroom', id: 'charms' })}>{t('practice')}</Button></div>
    </Screen>
  )
}

export function Shop() {
  const { player, setPlayer } = useApp()
  const { t, l } = useI18n()
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
                <Button variant="ghost" disabled={equipped} onClick={() => setPlayer({ ...player, wand: { ...player.wand, skin: s.id } })}>{equipped ? '✓' : t('owned')}</Button>
              ) : (
                <Button disabled={player.galleons < s.price} onClick={() => setPlayer({ ...player, galleons: player.galleons - s.price, inventory: [...player.inventory, s.id], wand: { ...player.wand, skin: s.id } })}>
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
  const { go } = useApp()
  const { t } = useI18n()
  const [start] = useState(Date.now())
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const ms = Math.max(0, REST_MS - (now - start))
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-black p-6 text-center">
      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 4 }} className="text-8xl">🌙</motion.div>
      <div className="font-display text-4xl text-gold-300/80">{t('lightsOut')}</div>
      <p className="flex max-w-lg items-center gap-2 text-parchment/60">{t('curfewMsg')} <SpeakButton text={t('curfewMsg')} /></p>
      <div className="text-parchment/50">{t('lightsBack')}</div>
      <div className="font-title text-5xl tabular-nums text-parchment/80">{Math.floor(ms / 60000)}:{String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}</div>
      <button className="mt-6 text-xs text-white/20 underline" onClick={() => go({ name: 'hub' })}>(Prototype) skip</button>
    </div>
  )
}

export function Settings() {
  const { go } = useApp()
  const { t, lang, setLang } = useI18n()
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
        <div className="flex items-center gap-2 text-sm text-parchment/70">🔊 {t('speakHelp')} <SpeakButton text={t('speakHelp')} /></div>
        <Button variant="ghost" onClick={() => go({ name: 'login' })}>{t('logout')}</Button>
      </Panel>
    </Screen>
  )
}

export function Admin() {
  const { t, l } = useI18n()
  const [ps, setPs] = useState<Player[]>([])
  const [note, setNote] = useState('')
  useEffect(() => { storage.listPlayers().then(setPs) }, [])
  const approve = async (p: Player) => { await storage.savePlayer({ ...p, status: 'active' }); setPs(await storage.listPlayers()) }
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
              <Button className="!px-3 !py-1 text-sm" onClick={() => approve(p)}>{t('approve')}</Button>
              <Button variant="ghost" className="!px-3 !py-1 text-sm">{t('reject')}</Button>
            </div>
          ))}
        </Panel>
        <Panel className="overflow-x-auto">
          <div className="mb-2 font-title text-gold-300">{t('allPlayers')}</div>
          <table className="w-full text-sm">
            <tbody>
              {ps.filter((p) => p.status === 'active').map((p) => {
                const a = acc(p)
                return (
                  <tr key={p.playerId} className="border-t border-white/5">
                    <td className="py-1.5"><Avatar icon={p.avatar} size="sm" ring={HOUSES[p.house].color} /></td>
                    <td className="px-2">{p.nickname}<div className="text-xs text-parchment/50">{l(HOUSES[p.house].name)}</div></td>
                    <td className="px-2 whitespace-nowrap">📖 {p.grades.english}<br />🔢 P{p.grades.math}</td>
                    <td className="px-2 tabular-nums">{Math.round(a.rate * 100)}%<div className="text-xs text-parchment/50">{a.answered}</div></td>
                    <td className="px-2">{p.playerId === 'wiz_003' && <span className="text-xs text-gold-300">⬆ {t('stayingAbove')}</span>}</td>
                    <td className="text-right"><Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => setNote(`${p.nickname}: runes reset ✓`)}>{t('resetRunes')}</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {note && <div className="mt-2 text-sm text-gold-300">{note}</div>}
        </Panel>
      </div>
    </Screen>
  )
}
