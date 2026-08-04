import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Button from './Button'

const pad = (n: number) => String(n).padStart(2, '0')

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5))
const MERIDIEMS = ['am', 'pm']

export function formatTimeValue(value: string): string {
  const [h, m] = value.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${pad(m)} ${ampm}`
}

const ROW = 40
const VISIBLE = 5
const PAD_ROWS = Math.floor(VISIBLE / 2)
// Odd number of repeated cycles so there's always a clear "middle" copy to
// silently recenter back into — the illusion of infinite scroll is just
// scrolling through a long repeated list and jumping, unseen, once you
// drift too close to either end of it.
const LOOP_COPIES = 9
const MIDDLE_CYCLE = Math.floor(LOOP_COPIES / 2)

function Wheel({
  options,
  value,
  onChange,
  width,
  loop = false,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  width: string
  loop?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cycleLen = options.length
  const rendered = loop ? Array.from({ length: LOOP_COPIES }, () => options).flat() : options

  useEffect(() => {
    const baseIdx = Math.max(0, options.indexOf(value))
    const idx = loop ? MIDDLE_CYCLE * cycleLen + baseIdx : baseIdx
    ref.current?.scrollTo({ top: idx * ROW })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function clampedIndex(el: HTMLDivElement) {
    return Math.min(rendered.length - 1, Math.max(0, Math.round(el.scrollTop / ROW)))
  }

  function handleScroll() {
    const el = ref.current
    if (!el) return
    const idx = clampedIndex(el)
    if (rendered[idx] !== value) onChange(rendered[idx])
    // settle exactly onto a row after scrolling stops (for browsers where
    // snap doesn't fire on programmatic/momentum scroll)
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const settledIdx = clampedIndex(el)
      const target = settledIdx * ROW
      if (Math.abs(el.scrollTop - target) > 1) {
        el.scrollTo({ top: target, behavior: 'smooth' })
      }
      if (loop) {
        const cycle = Math.floor(settledIdx / cycleLen)
        if (cycle <= 1 || cycle >= LOOP_COPIES - 2) {
          const offset = settledIdx % cycleLen
          el.scrollTo({ top: (MIDDLE_CYCLE * cycleLen + offset) * ROW })
        }
      }
    }, 120)
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className={`no-scrollbar overflow-y-auto snap-y snap-mandatory ${width}`}
      style={{ height: ROW * VISIBLE }}
    >
      <div style={{ height: ROW * PAD_ROWS }} />
      {rendered.map((o, i) => (
        <button
          key={i}
          onClick={() => ref.current?.scrollTo({ top: i * ROW, behavior: 'smooth' })}
          className={`w-full snap-center flex items-center justify-center font-dm transition-colors ${
            o === value
              ? 'text-text-primary font-bold text-[26px]'
              : 'text-text-muted/60 text-[22px]'
          }`}
          style={{ height: ROW }}
        >
          {o}
        </button>
      ))}
      <div style={{ height: ROW * PAD_ROWS }} />
    </div>
  )
}

export function TimeWheelSheet({
  value,
  onConfirm,
  onClose,
}: {
  value: string // "HH:mm" 24h
  onConfirm: (v: string) => void
  onClose: () => void
}) {
  const [h24, m] = value.split(':').map(Number)
  const snappedMin = pad(Math.round(m / 5) * 5 === 60 ? 55 : Math.round(m / 5) * 5)
  const [hour, setHour] = useState(String(h24 % 12 === 0 ? 12 : h24 % 12))
  const [minute, setMinute] = useState(MINUTES.includes(snappedMin) ? snappedMin : '00')
  const [meridiem, setMeridiem] = useState(h24 < 12 ? 'am' : 'pm')

  // Scrolling past the 11↔12 boundary crosses into the next half of the
  // day (11am → 12pm, or 11pm → 12am) — flip am/pm to match, same as a
  // real clock, instead of leaving the two wheels fully independent.
  function handleHourChange(nextHour: string) {
    const crossedBoundary =
      (hour === '11' && nextHour === '12') || (hour === '12' && nextHour === '11')
    if (crossedBoundary) setMeridiem((m) => (m === 'am' ? 'pm' : 'am'))
    setHour(nextHour)
  }

  function handleDone() {
    let h = Number(hour) % 12
    if (meridiem === 'pm') h += 12
    onConfirm(`${pad(h)}:${minute}`)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-cream rounded-t-[22px] px-6 pt-5 pb-8">
        <p className="font-outfit font-bold text-[22px] text-text-primary text-center mb-2">
          Time
        </p>
        <div className="relative">
          {/* highlight band */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#f3f4f6] rounded-[14px] pointer-events-none"
            style={{ height: ROW + 8 }}
          />
          <div className="relative flex items-stretch justify-center">
            <Wheel options={HOURS} value={hour} onChange={handleHourChange} width="w-[72px]" loop />
            <div
              className="flex items-center justify-center font-dm font-bold text-[24px] text-text-primary w-6"
              style={{ height: ROW * VISIBLE }}
            >
              :
            </div>
            <Wheel options={MINUTES} value={minute} onChange={setMinute} width="w-[72px]" loop />
            <Wheel options={MERIDIEMS} value={meridiem} onChange={setMeridiem} width="w-[80px]" />
          </div>
        </div>
        <div className="mt-5">
          <Button fullWidth onClick={handleDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Field-style trigger that opens the wheel sheet. */
export function TimePickerButton({
  value,
  onChange,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className={`relative text-left ${className}`}>
        {formatTimeValue(value)}
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </button>
      {open && (
        <TimeWheelSheet
          value={value}
          onConfirm={(v) => {
            onChange(v)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
