import { useCallback, useEffect, useRef, useState } from 'react'
import { AppContext, type Route } from './app/state'
import { isPlayRoute } from './game/flow'
import { isResting, tickCurfew } from './game/curfew'
import { I18nProvider, useI18n } from './i18n'
import type { Player } from './data/types'
import { Login, Pending, Register, Sorting, Splash, Story, WandChoice, WizardCard } from './screens/onboarding'
import { Boss, Classroom, Hub, Result, Review } from './screens/play'
import { Admin, Curfew, HouseCup, Pensieve, Settings, Shop } from './screens/meta'
import { SESSION_KEY, storage } from './services/StorageService'

const toHash = (r: Route) => (r.name === 'classroom' ? `classroom/${r.id}` : r.name === 'result' ? 'result' : r.name)

const SCREENS: { label: string; route: Route }[] = [
  { label: '1 · Splash 开场', route: { name: 'splash' } },
  { label: '2 · Login 登录', route: { name: 'login' } },
  { label: '3 · Register 注册', route: { name: 'register' } },
  { label: '4 · Owl waiting 等待批准', route: { name: 'pending' } },
  { label: '5 · Sorting Hat 分院', route: { name: 'sorting' } },
  { label: '6 · Wand core 杖芯', route: { name: 'wand' } },
  { label: '7 · Wizard card 巫师卡', route: { name: 'card' } },
  { label: '8 · Story 开场剧情', route: { name: 'story' } },
  { label: '9 · Castle 城堡主页', route: { name: 'hub' } },
  { label: '10 · Charms 魔咒课', route: { name: 'classroom', id: 'charms' } },
  { label: '11 · Potions 魔药课', route: { name: 'classroom', id: 'potions' } },
  { label: '12 · Arithmancy 算术占卜', route: { name: 'classroom', id: 'arithmancy' } },
  { label: '13 · Result 结算', route: { name: 'result', id: 'charms', correct: 4, total: 5, streak: 3, points: 40, gold: 20 } },
  { label: '14 · Boss 墨影', route: { name: 'boss' } },
  { label: '15 · House Cup 学院杯', route: { name: 'houseCup' } },
  { label: '16 · Pensieve 冥想盆', route: { name: 'pensieve' } },
  { label: '17 · Pensieve practice', route: { name: 'review' } },
  { label: '18 · Diagon Alley 对角巷', route: { name: 'shop' } },
  { label: '19 · Curfew 宵禁', route: { name: 'curfew' } },
  { label: '20 · Settings 设置', route: { name: 'settings' } },
  { label: '21 · Admin 校长办公室', route: { name: 'admin' } },
]

function fromHash(): Route {
  const h = location.hash.slice(1)
  const s = SCREENS.find((x) => toHash(x.route) === h)
  return s?.route ?? { name: 'splash' }
}

const NEEDS_PLAYER = new Set<Route['name']>(['sorting', 'wand', 'card', 'story', 'settings', 'result', 'review'])

function ProtoMenu({ go }: { go: (r: Route) => void }) {
  const [open, setOpen] = useState(false)
  const { t, lang, setLang } = useI18n()
  return (
    <div className="fixed bottom-2 left-2 z-[100] flex flex-col items-start gap-2 opacity-70 hover:opacity-100">
      {open && (
        <div className="max-h-[70vh] w-60 overflow-y-auto rounded-2xl bg-night-900/95 p-2 text-sm shadow-2xl ring-1 ring-gold-400/40 backdrop-blur">
          <div className="px-2 pb-1 font-title text-gold-300">{t('protoMenu')}</div>
          {SCREENS.map((s) => (
            <button key={s.label} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-night-700" onClick={() => { go(s.route); setOpen(false) }}>{s.label}</button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button className="h-8 rounded-full bg-night-700/90 px-3 text-sm font-bold ring-1 ring-gold-400/40" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>{lang === 'en' ? '中' : 'EN'}</button>
        <button className="h-8 rounded-full bg-gold-400/90 px-3 text-sm font-bold text-night-900" onClick={() => setOpen(!open)}>☰ Proto</button>
      </div>
    </div>
  )
}

function RotateHint() {
  const { t } = useI18n()
  const [portrait, setPortrait] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(orientation: portrait) and (max-width: 700px)')
    const f = () => setPortrait(m.matches)
    f(); m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  if (!portrait || dismissed) return null
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-night-950/95 p-8 text-center" onClick={() => setDismissed(true)}>
      <div className="text-7xl" style={{ animation: 'float 2s ease-in-out infinite' }}>📱↻</div>
      <div className="font-title text-xl text-gold-300">{t('rotate')}</div>
      <div className="text-xs text-parchment/40">(tap to continue anyway)</div>
    </div>
  )
}

function Router() {
  const [route, setRoute] = useState<Route>(fromHash)
  const [player, setPlayerState] = useState<Player | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const playerRef = useRef<Player | null>(null)
  const routeRef = useRef(route)
  const holdRef = useRef(false)
  const lightsRef = useRef(false)
  useEffect(() => { routeRef.current = route }, [route])

  const setPlayer = useCallback((p: Player | null) => {
    playerRef.current = p
    setPlayerState(p)
    if (p) sessionStorage.setItem(SESSION_KEY, p.playerId)
    else {
      sessionStorage.removeItem(SESSION_KEY)
      void storage.endSession()
    }
  }, [])

  const patchPlayer = useCallback((fn: (p: Player) => Player) => {
    if (!playerRef.current) return null
    const next = fn(playerRef.current)
    playerRef.current = next
    setPlayerState(next)
    return next
  }, [])

  const setHoldCurfew = useCallback((held: boolean) => { holdRef.current = held }, [])
  const takeLightsOut = useCallback(() => {
    const due = lightsRef.current
    lightsRef.current = false
    return due
  }, [])

  const go = useCallback((r: Route) => {
    const current = playerRef.current
    const next = current && isPlayRoute(r) && isResting(current.curfew, Date.now()) ? { name: 'curfew' as const } : r
    routeRef.current = next
    setRoute(next)
    history.replaceState(null, '', '#' + toHash(next))
    window.scrollTo(0, 0)
  }, [])

  const goRef = useRef(go)
  useEffect(() => { goRef.current = go }, [go])

  useEffect(() => {
    const onHash = () => {
      const next = fromHash()
      routeRef.current = next
      setRoute(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (player) void storage.savePlayer(player)
  }, [player])

  useEffect(() => {
    const id = window.setInterval(() => {
      const at = Date.now()
      setNow(at)
      const current = playerRef.current
      if (!current || current.status !== 'active') return
      const tick = tickCurfew(current.curfew, at, { paused: routeRef.current.name === 'curfew' })
      const latest = playerRef.current
      if (!latest) return
      const next = { ...latest, curfew: tick.state }
      playerRef.current = next
      setPlayerState(next)
      if (tick.justOut && holdRef.current) lightsRef.current = true
      if (tick.resting && !holdRef.current && isPlayRoute(routeRef.current)) goRef.current({ name: 'curfew' })
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const preview = useCallback(async (r: Route) => {
    const needs = isPlayRoute(r) || NEEDS_PLAYER.has(r.name)
    if (needs && !playerRef.current) {
      const sample = (await storage.listPlayers()).find((p) => p.status === 'active' && p.house)
      if (sample) setPlayer(sample)
    }
    go(r)
  }, [go, setPlayer])

  const screen = (() => {
    const needs = isPlayRoute(route) || NEEDS_PLAYER.has(route.name)
    if (needs && !player) return <Login />
    switch (route.name) {
      case 'splash': return <Splash />
      case 'login': return <Login />
      case 'register': return <Register />
      case 'pending': return <Pending />
      case 'sorting': return <Sorting />
      case 'wand': return <WandChoice />
      case 'card': return <WizardCard />
      case 'story': return <Story />
      case 'hub': return <Hub />
      case 'classroom': return <Classroom key={route.id} id={route.id} />
      case 'result': return <Result {...route} />
      case 'boss': return <Boss />
      case 'houseCup': return <HouseCup />
      case 'pensieve': return <Pensieve />
      case 'review': return <Review />
      case 'shop': return <Shop />
      case 'curfew': return <Curfew />
      case 'settings': return <Settings />
      case 'admin': return <Admin />
    }
  })()

  return (
    <AppContext.Provider value={{
      route,
      go,
      player,
      setPlayer,
      patchPlayer,
      setHoldCurfew,
      takeLightsOut,
      now,
    }}>
      {screen}
      <ProtoMenu go={preview} />
      <RotateHint />
    </AppContext.Provider>
  )
}

export default function App() {
  return <I18nProvider><Router /></I18nProvider>
}
