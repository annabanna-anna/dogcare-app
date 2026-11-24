import { useState } from 'react'
import Button from './Button'
import { TimeWheel } from './TimePicker'
import { TASK_TYPE_STYLE } from './taskTypeStyle'
import { formatTime } from '../utils/dateUtils'
import type { PlannedOuting } from '../utils/outingClock'

interface Props {
  dogName: string
  /** Where the wheel starts: the current last-out time, or now. */
  initial: Date
  /** The rest of today if the dog was last out at `at` — walks and potty breaks. */
  previewFor: (at: Date) => { at: Date; title: string; type: PlannedOuting['type'] | 'fixed'; fixedType?: 'walk' | 'potty' }[]
  /** Changing a time that's already set: Save stays off until the wheel moves
   *  to a different time. A first answer ("Pick a time") can save as-is. */
  requireChange?: boolean
  onSave: (at: Date) => void
  onClose: () => void
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The "HH:MM" the wheel lands on for a time — minutes snap to 5. */
function wheelValue(d: Date): string {
  const m = Math.min(Math.round(d.getMinutes() / 5) * 5, 55)
  return `${pad(d.getHours())}:${pad(m)}`
}

/** "Pick a time" for when the dog was last out. A time later than now means
 *  last night (picking 11:30 PM at 1 AM); one that only rounds past now (the
 *  wheel steps by 5 minutes) is just now. */
function resolve(hhmm: string, now: Date): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  if (d > now) {
    if (d.getTime() - now.getTime() <= 5 * 60_000) return new Date(now)
    d.setDate(d.getDate() - 1)
  }
  return d
}

export default function LastOutSheet({ dogName, initial, previewFor, requireChange, onSave, onClose }: Props) {
  const [openedAt] = useState(() => new Date())
  const [at, setAt] = useState(initial)
  // Compared as the wheel shows it (5-min steps), so scrolling away and back
  // to the starting time counts as no change.
  const [picked, setPicked] = useState<string | null>(null)
  const changed = picked !== null && picked !== wheelValue(initial)
  const preview = previewFor(at)

  return (
    // Above the bottom nav (z-50).
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[480px] max-h-[90svh] overflow-y-auto bg-white rounded-t-[24px] px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-light" />
        <p className="font-outfit font-bold text-[24px] text-text-primary leading-tight">When was {dogName} last out?</p>
        <p className="font-dm text-[14px] text-text-secondary mt-1 mb-3">Walk, potty break or drop-off — any time out counts.</p>
        <TimeWheel
          value={`${pad(initial.getHours())}:${pad(initial.getMinutes())}`}
          onChange={(v) => {
            setPicked(v)
            setAt(resolve(v, openedAt))
          }}
        />
        <div className="bg-card rounded-[16px] px-4 py-3 mt-4 mb-5">
          <p className="font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-2">Then today</p>
          {preview.length === 0 ? (
            <p className="font-dm text-[13px] text-text-secondary">Nothing more before bed.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {preview.map((p, i) => {
                const type = p.type === 'fixed' ? (p.fixedType ?? 'potty') : p.type
                const { icon: Icon, bg } = TASK_TYPE_STYLE[type]
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-[72px] shrink-0 font-dm font-bold text-[13px] text-text-secondary">
                      {p.type === 'fixed' ? '' : '~'}
                      {formatTime(p.at.toISOString())}
                    </span>
                    <span className={`size-6 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon size={13} className="text-white" />
                    </span>
                    <span className="font-dm font-bold text-[14px] text-text-primary truncate">{p.title}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <Button fullWidth disabled={requireChange && !changed} onClick={() => onSave(at)}>
          Save
        </Button>
      </div>
    </div>
  )
}
