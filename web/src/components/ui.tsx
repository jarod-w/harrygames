import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { HOUSES } from '../data/catalog'
import type { HouseId } from '../data/types'
import { speak, useI18n } from '../i18n'

type Variant = 'gold' | 'ghost' | 'danger' | 'house'

export function Button({ variant = 'gold', className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    gold: 'bg-gradient-to-b from-gold-300 to-gold-500 text-night-900 shadow-[0_4px_0_#8a6420] active:translate-y-[3px] active:shadow-[0_1px_0_#8a6420]',
    ghost: 'bg-night-700/70 text-parchment border border-gold-400/40 active:bg-night-600',
    danger: 'bg-gryffindor text-white shadow-[0_4px_0_#5e1316] active:translate-y-[3px]',
    house: 'text-white shadow-[0_4px_0_#0006] active:translate-y-[3px]',
  }
  return (
    <button
      className={`min-h-11 min-w-11 rounded-2xl px-5 py-2.5 font-title font-bold tracking-wide transition disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-gold-400/25 bg-night-800/80 p-5 backdrop-blur ${className}`}>{children}</div>
}

export function Parchment({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`parchment rounded-3xl p-5 ${className}`}>{children}</div>
}

export function Title({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-title text-2xl font-bold text-gold-300 glow-gold sm:text-3xl ${className}`}>{children}</h1>
}

export function SpeakButton({ text, word = false, className = '' }: { text: string; word?: boolean; className?: string }) {
  const { lang } = useI18n()
  return (
    <button
      aria-label="Read aloud"
      onClick={(e) => { e.stopPropagation(); speak(text, word ? 'en-word' : lang) }}
      className={`inline-grid size-11 shrink-0 place-items-center rounded-full bg-night-700 text-xl ring-1 ring-gold-400/40 active:scale-90 ${className}`}
    >
      🔊
    </button>
  )
}

export function Crest({ house, size = 48 }: { house: HouseId; size?: number }) {
  const h = HOUSES[house]
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" aria-hidden>
      <path d="M20 1 L38 6 V22 C38 34 29 41 20 45 C11 41 2 34 2 22 V6 Z" fill={h.color} stroke="#e9c46a" strokeWidth="2" />
      <text x="20" y="29" textAnchor="middle" fontSize="18">{h.animal}</text>
    </svg>
  )
}

export function Avatar({ icon, size = 'md', ring }: { icon: string; size?: 'sm' | 'md' | 'lg'; ring?: string }) {
  const s = { sm: 'size-10 text-xl', md: 'size-16 text-3xl', lg: 'size-24 text-5xl' }[size]
  return (
    <div className={`grid place-items-center rounded-full bg-night-700 ${s}`} style={{ boxShadow: `0 0 0 3px ${ring ?? '#e9c46a66'}` }}>
      {icon}
    </div>
  )
}

export function Stat({ icon, value, label }: { icon: string; value: ReactNode; label?: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-night-900/70 px-3 py-1.5 ring-1 ring-gold-400/30" title={label}>
      <span>{icon}</span>
      <span className="font-bold tabular-nums text-gold-300">{value}</span>
    </div>
  )
}

export function Bar({ value, max, color = '#e9c46a', className = '' }: { value: number; max: number; color?: string; className?: string }) {
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-night-950/80 ring-1 ring-white/10 ${className}`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: color }} />
    </div>
  )
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sky stars relative flex min-h-full w-full flex-col overflow-x-hidden px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 short:pb-2 short:pt-2 ${className}`}>
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  )
}
