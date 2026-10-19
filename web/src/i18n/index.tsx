import { createContext, useContext, useState, type ReactNode } from 'react'
import { en, type StringKey } from './en'
import { zh } from './zh'

export type Lang = 'en' | 'zh'
export type Localized = { en: string; zh: string }

const dicts = { en, zh }

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: StringKey) => string
  l: (v: Localized) => string
}

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('lang') as Lang) || 'en'
    } catch {
      return 'en'
    }
  })
  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('lang', l)
    } catch {
      /* ignore */
    }
  }
  const value: Ctx = {
    lang,
    setLang,
    t: (k) => dicts[lang][k],
    l: (v) => v[lang],
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}

export function speak(text: string, lang: Lang | 'en-word') {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'zh' ? 'zh-CN' : 'en-GB'
  u.rate = lang === 'en-word' ? 0.75 : 0.95
  window.speechSynthesis.speak(u)
}
