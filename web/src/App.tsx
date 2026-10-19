import { useEffect, useState } from 'react'
import { AppContext, type Route } from './app/state'
import { I18nProvider, useI18n } from './i18n'
import type { Player } from './data/types'
import { Login, Pending, Register, Sorting, Splash, Story, WandChoice, WizardCard } from './screens/onboarding'
import { Boss, Classroom, Hub, Result } from './screens/play'
import { Admin, Curfew, HouseCup, Pensieve, Settings, Shop } from './screens/meta'

const DEMO: Player = {
  schemaVersion: 1, playerId: 'wiz_001', nickname: 'Little Hermione', avatar: '🦉', house: 'ravenclaw',
  wand: { core: 'phoenix', skin: 'skin_oak' }, grades: { english: 'movers', math: 4 }, level: 3,
  housePoints: 350, galleons: 120,
  stats: { english: { answered: 120, correct: 98 }, math: { answered: 80, correct: 61 } },
  bestStreak: 14, mistakes: [], inventory: ['skin_oak'], unlockedAchievements: [], customSettings: {}, status: 'active',
}

// Prototype: every screen is reachable by URL hash, e.g. #hub, #classroom/potions
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
  { label: '13 · Result 结算', route: { name: 'result', id: 'charms', correct: 4, total: 5, streak: 3 } },
  { label: '14 · Boss 墨影', route: { name: 'boss' } },
  { label: '15 · House Cup 学院杯', route: { name: 'houseCup' } },
  { label: '16 · Pensieve 冥想盆', route: { name: 'pensieve' } },
  { label: '17 · Diagon Alley 对角巷', route: { name: 'shop' } },
  { label: '18 · Curfew 宵禁', route: { name: 'curfew' } },
  { label: '19 · Settings 设置', route: { name: 'settings' } },
  { label: '20 · Admin 校长办公室', route: { name: 'admin' } },
]

const toHash = (r: Route) => (r.name === 'classroom' ? `classroom/${r.id}` : r.name)
function fromHash(): Route {
  const h = location.hash.slice(1)
  const s = SCREENS.find((x) => toHash(x.route) === h)
  return s?.route ?? { name: 'splash' }
}

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
  const [player, setPlayer] = useState<Player>(DEMO)
  const [sessionStart] = useState(Date.now())
  const [nonce, setNonce] = useState(0)
  const go = (r: Route) => { setRoute(r); setNonce((n) => n + 1); history.replaceState(null, '', '#' + toHash(r)); window.scrollTo(0, 0) }
  useEffect(() => { const f = () => setRoute(fromHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])

  const screen = (() => {
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
      case 'classroom': return <Classroom key={nonce} id={route.id} />
      case 'result': return <Result {...route} />
      case 'boss': return <Boss />
      case 'houseCup': return <HouseCup />
      case 'pensieve': return <Pensieve />
      case 'shop': return <Shop />
      case 'curfew': return <Curfew />
      case 'settings': return <Settings />
      case 'admin': return <Admin />
    }
  })()

  return (
    <AppContext.Provider value={{ route, go, player, setPlayer, sessionStart }}>
      {screen}
      <ProtoMenu go={go} />
      <RotateHint />
    </AppContext.Provider>
  )
}

export default function App() {
  return <I18nProvider><Router /></I18nProvider>
}
