import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Outcome, Question } from '../data/types'
import { checkAnswer } from '../data/questions'
import { speak, useI18n } from '../i18n'
import { LetterStones, NumberPad } from './keyboards'
import { Bar, Button, SpeakButton } from './ui'

export type { Outcome }

// Shared by every classroom and the Boss battle. Wrong-answer rules from §4.2 / Q4 / Q10:
// 1st wrong (or time-out) -> hint + retry with a fresh timer; 2nd -> show answer + explanation.
export function QuestionPlay({ q, seconds, keyboard, onDone, onMiss }: { q: Question; seconds: number; keyboard: 'letters' | 'numbers'; onDone: (o: Outcome) => void; onMiss?: () => void }) {
  const { t, l, lang } = useI18n()
  const [input, setInput] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [phase, setPhase] = useState<'answering' | 'hint' | 'reveal' | 'correct'>('answering')
  const [left, setLeft] = useState(seconds)
  const [shake, setShake] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const started = useRef(Date.now())

  const isSpelling = q.type === 'spelling'
  const maxLen = isSpelling ? q.answer.length : 10

  // Starters get letter blocks (only the word's letters + a few extras), §6.2
  const blocks = useMemo(() => {
    if (!isSpelling || q.level !== 'starters') return undefined
    const extra = 'aeioumnrst'.split('').filter((c) => !q.answer.includes(c)).slice(0, 3)
    return [...new Set([...q.answer.split(''), ...extra])].sort(() => Math.random() - 0.5)
  }, [q, isSpelling])

  useEffect(() => { if (isSpelling && q.audio) speak(q.audio, 'en-word') }, [q, isSpelling])

  const fail = useCallback((byTime: boolean) => {
    setTimedOut(byTime)
    setShake((n) => n + 1)
    onMiss?.()
    if (attempt === 0) { setAttempt(1); setPhase('hint') }
    else setPhase('reveal')
  }, [attempt, onMiss])

  useEffect(() => {
    if (phase !== 'answering') return
    started.current = Date.now()
    setLeft(seconds)
    const id = setInterval(() => {
      const remain = seconds - (Date.now() - started.current) / 1000
      setLeft(Math.max(0, remain))
      if (remain <= 0) { clearInterval(id); fail(true) }
    }, 100)
    return () => clearInterval(id)
  }, [phase, seconds, fail])

  const submit = useCallback(() => {
    if (phase !== 'answering' || !input) return
    if (checkAnswer(q, input)) { setPhase('correct'); setTimeout(() => onDone(attempt === 0 ? 'first' : 'hint'), 1100) }
    else fail(false)
  }, [phase, input, q, attempt, onDone, fail])

  const onKey = useCallback((k: string) => setInput((s) => (s.length < maxLen ? s + k : s)), [maxLen])
  const onBack = useCallback(() => setInput((s) => s.slice(0, -1)), [])
  const hintText = typeof q.hint === 'string' ? q.hint : q.hint ? l(q.hint) : ''
  const urgent = left <= 5

  return (
    <div className="flex w-full flex-1 flex-col gap-3 landscape:flex-row landscape:items-stretch">
      {/* prompt */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-14 text-right font-title text-xl font-bold tabular-nums ${urgent ? 'text-red-400' : 'text-gold-300'}`}>{Math.ceil(left)}{t('sec')}</span>
          <Bar value={left} max={seconds} color={urgent ? '#ef4444' : '#e9c46a'} className="flex-1" />
        </div>
        <div className="parchment relative flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl p-4 text-center short:gap-1 short:p-2">
          <div className="text-6xl sm:text-7xl short:text-4xl">{q.image}</div>
          <div className="flex items-center gap-2">
            <div className="font-title text-lg font-bold sm:text-xl short:text-base">{isSpelling ? l(q.prompt) : lang === 'zh' ? q.prompt.zh : q.prompt.en}</div>
            {isSpelling ? (
              <SpeakButton word text={q.audio ?? q.answer} className="bg-parchment-dark ring-ink/20" />
            ) : (
              <SpeakButton text={l(q.prompt)} className="bg-parchment-dark ring-ink/20" />
            )}
          </div>
          <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} className="mt-1 flex min-h-14 flex-wrap justify-center gap-1.5">
            {isSpelling
              ? Array.from({ length: q.answer.length }).map((_, i) => (
                  <div key={i} className={`grid size-11 place-items-center rounded-lg border-b-4 font-title text-2xl font-bold uppercase sm:size-12 ${input[i] ? 'border-night-600 bg-white/70' : 'border-ink/30 bg-white/30'}`}>
                    {input[i] ?? ''}
                  </div>
                ))
              : <div className="min-w-40 rounded-xl border-b-4 border-night-600 bg-white/70 px-4 py-2 font-title text-3xl font-bold tabular-nums">{input || ' '}</div>}
          </motion.div>
          <AnimatePresence>
            {phase === 'hint' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-night-900 p-4 text-parchment">
                <div className="text-4xl">🖋️</div>
                {timedOut && <div className="font-bold text-red-300">{t('timeUp')}</div>}
                <div className="font-title text-gold-300">{t('hintTitle')}</div>
                <div className="font-title text-3xl tracking-widest text-gold-300">{hintText}</div>
                <Button onClick={() => { setInput(''); setPhase('answering') }}>{t('tryAgain')}</Button>
              </motion.div>
            )}
            {phase === 'reveal' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-night-900 p-4 text-parchment">
                {timedOut && <div className="font-bold text-red-300">{t('timeUp')}</div>}
                <div className="text-parchment/70">{t('answerWas')}</div>
                <div className="font-title text-4xl font-bold uppercase text-gold-300">{q.answer}</div>
                {q.explanation && <div className="max-w-md text-parchment/90">💡 {l(q.explanation)}</div>}
                <div className="text-sm text-parchment/60">🌀 {t('intoPensieve')}</div>
                <Button onClick={() => onDone('wrong')}>{t('next')} →</Button>
              </motion.div>
            )}
            {phase === 'correct' && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-gold-300/95 text-night-900">
                <div className="text-6xl">✨</div>
                <div className="font-title text-2xl font-bold">{t('correct')}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* custom keyboard, §2.3 / Q17 */}
      <div className="flex flex-col justify-end landscape:w-[46%]">
        {keyboard === 'letters'
          ? <LetterStones blocks={blocks} onKey={onKey} onBackspace={onBack} onEnter={submit} disabled={phase !== 'answering'} />
          : <NumberPad onKey={onKey} onBackspace={onBack} onEnter={submit} disabled={phase !== 'answering'} />}
      </div>
    </div>
  )
}
