import { useEffect } from 'react'
import { RUNES } from '../data/catalog'
import { useI18n } from '../i18n'

const ROWS = ['abcdefghi', 'jklmnopqr', 'stuvwxyz']

type PadProps = { onKey: (k: string) => void; onBackspace: () => void; onEnter: () => void; disabled?: boolean }

// §6.4: physical keyboard also works on desktop / iPad with keyboard.
function usePhysicalKeys({ onKey, onBackspace, onEnter, disabled }: PadProps, allowed: RegExp) {
  useEffect(() => {
    if (disabled) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') onBackspace()
      else if (e.key === 'Enter') onEnter()
      else if (e.key.length === 1 && allowed.test(e.key)) onKey(e.key.toLowerCase())
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onKey, onBackspace, onEnter, disabled, allowed])
}

const keyCls =
  'grid h-12 min-w-0 flex-1 place-items-center rounded-xl font-title text-xl font-bold uppercase transition active:scale-90 sm:h-14 sm:text-2xl short:h-10 short:text-lg'
const stone = 'bg-gradient-to-b from-[#6b5aa8] to-[#3a2c63] text-gold-300 shadow-[0_3px_0_#1b1430] ring-1 ring-white/10'

const LETTERS = /[a-z]/i
export function LetterStones(props: PadProps & { blocks?: string[] }) {
  usePhysicalKeys(props, LETTERS)
  const { t } = useI18n()
  const rows = props.blocks ? [props.blocks.join('')] : ROWS
  return (
    <div className={`flex w-full flex-col gap-1.5 ${props.disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-1.5">
          {r.split('').map((c, j) => (
            <button key={c + j} className={`${keyCls} ${stone}`} onClick={() => props.onKey(c)}>{c}</button>
          ))}
          {i === rows.length - 1 && (
            <>
              <button className={`${keyCls} bg-night-700 text-parchment ring-1 ring-white/10`} onClick={props.onBackspace} aria-label="Backspace">⌫</button>
              <button className={`${keyCls} flex-[2] bg-gradient-to-b from-gold-300 to-gold-500 text-base text-night-900 normal-case`} onClick={props.onEnter}>{t('cast')}</button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

const DIGITS = /[0-9./%-]/
export function NumberPad(props: PadProps) {
  usePhysicalKeys(props, DIGITS)
  const { t } = useI18n()
  const keys = ['7', '8', '9', '/', '4', '5', '6', '%', '1', '2', '3', '.', '0']
  return (
    <div className={`grid w-full max-w-md grid-cols-4 gap-1.5 self-center ${props.disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {keys.map((k) => (
        <button key={k} className={`${keyCls} ${/\d/.test(k) ? stone : 'bg-night-700 text-gold-400 ring-1 ring-gold-400/30'}`} onClick={() => props.onKey(k)}>{k}</button>
      ))}
      <button className={`${keyCls} bg-night-700 text-parchment ring-1 ring-white/10`} onClick={props.onBackspace} aria-label="Backspace">⌫</button>
      <button className={`${keyCls} col-span-2 bg-gradient-to-b from-gold-300 to-gold-500 text-base text-night-900 normal-case`} onClick={props.onEnter}>{t('cast')}</button>
    </div>
  )
}

export function RunePad({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: boolean }) {
  const { t, l } = useI18n()
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`flex gap-3 ${error ? 'wobble' : ''}`}>
        {[0, 1, 2, 3].map((i) => {
          const r = RUNES.find((x) => x.id === value[i])
          return (
            <div key={i} className={`grid size-14 place-items-center rounded-2xl text-3xl ring-2 ${r ? 'bg-night-700 ring-gold-400' : 'bg-night-900/60 ring-white/15'} ${error ? 'ring-gryffindor' : ''}`}>
              {r?.icon ?? ''}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {RUNES.map((r) => (
          <button
            key={r.id}
            disabled={value.length >= 4}
            onClick={() => onChange([...value, r.id])}
            className="flex size-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-night-600 to-night-800 ring-1 ring-gold-400/30 transition active:scale-90 disabled:opacity-50"
          >
            <span className="text-3xl">{r.icon}</span>
            <span className="text-[11px] text-parchment/70">{l(r.name)}</span>
          </button>
        ))}
      </div>
      <button className="min-h-11 px-4 text-sm text-parchment/70 underline" onClick={() => onChange([])}>{t('clear')}</button>
    </div>
  )
}
