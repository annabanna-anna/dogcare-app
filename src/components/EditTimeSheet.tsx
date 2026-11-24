import { useState } from 'react'
import RadioDot from './RadioDot'
import Button from './Button'
import { TimeWheel } from './TimePicker'
import { TASK_TYPE_STYLE } from './taskTypeStyle'
import type { Task } from '../types'
import { formatTime } from '../utils/dateUtils'

interface Props {
  task: Task
  /** Today's later walks/potty breaks that can move along with this one. */
  followers: Task[]
  onSave: (at: Date, moveRest: boolean) => void
  onClose: () => void
  /** Set when `task` is a time the going-out clock planned ("~4:24 PM"), with
   *  the plan's reason. Then the time shows with "~" and there's no "move
   *  the rest?" — everything after it is planned from when the dog goes out. */
  planned?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "+30 min", "−15 min", "+1 hr 30 min" */
export function formatShift(ms: number): string {
  const sign = ms < 0 ? '−' : '+'
  const total = Math.round(Math.abs(ms) / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${sign}${h ? `${h} hr` : ''}${h && m ? ' ' : ''}${m || !h ? `${m} min` : ''}`
}

const shortTime = (d: Date) => formatTime(d.toISOString()).replace(/ (AM|PM)$/, '')

/** Change one task's time for today. Once the time actually moves and there
 *  are walks/potty breaks after it, offers to move those by the same amount. */
export default function EditTimeSheet({ task, followers, onSave, onClose, planned }: Props) {
  const original = new Date(task.scheduledTime)
  const originalLabel = `${planned ? '~' : ''}${formatTime(original.toISOString())}`
  const [at, setAt] = useState(original)
  const [moveRest, setMoveRest] = useState(true)
  const { icon: Icon, bg } = TASK_TYPE_STYLE[task.type] ?? TASK_TYPE_STYLE.other

  const shift = at.getTime() - original.getTime()
  const changed = shift !== 0
  const suggest = changed && followers.length > 0
  const count = followers.length

  function pick(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number)
    const d = new Date(original)
    d.setHours(h, m, 0, 0)
    setAt(d)
  }

  return (
    // Above the bottom nav (z-50), so the Save button isn't covered.
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[480px] max-h-[90svh] overflow-y-auto bg-white rounded-t-[24px] px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-light" />
        <div className="flex items-center gap-3 mb-3">
          <span className={`size-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
            <Icon size={18} className="text-white" />
          </span>
          <div className="min-w-0">
            <p className="font-outfit font-bold text-[22px] text-text-primary leading-tight truncate">{task.title}</p>
            <p className="font-dm text-[14px] text-text-secondary">
              {planned ? `Planned ${originalLabel} · ${planned}` : 'Today only · the usual schedule stays the same'}
            </p>
          </div>
        </div>

        <TimeWheel value={`${pad(original.getHours())}:${pad(original.getMinutes())}`} onChange={pick} />

        <div className="flex items-center gap-2 mt-3 min-h-8">
          {changed ? (
            <>
              <span className="font-dm text-[16px] text-text-muted line-through">{originalLabel}</span>
              <span className="font-dm text-[16px] text-text-muted">→</span>
              <span className="font-dm font-bold text-[20px] text-text-primary">{formatTime(at.toISOString())}</span>
              <span className="px-2 py-0.5 rounded-full bg-coral-soft font-dm font-bold text-[12px] text-coral">
                {formatShift(shift)}
              </span>
            </>
          ) : (
            <span className="font-dm text-[14px] text-text-secondary">
              Now {originalLabel} — scroll to change
            </span>
          )}
        </div>

        {planned && changed && (
          <p className="font-dm text-[14px] text-text-secondary mt-2 leading-snug">
            Saved as today’s time, so the reminder goes off as usual. After it, the plan follows from when{' '}
            {task.dogName || 'the dog'} actually goes out.
          </p>
        )}

        {suggest && (
          <div className="bg-card rounded-[16px] px-4 py-3.5 mt-3">
            <p className="font-dm font-bold text-[16px] text-text-primary mb-2.5">
              Move the {count === 1 ? 'one' : count} after it too?
            </p>
            <ul className="flex flex-col gap-2 mb-3">
              {followers.map((f) => {
                const { icon: FIcon, bg: fbg } = TASK_TYPE_STYLE[f.type] ?? TASK_TYPE_STYLE.other
                const from = new Date(f.scheduledTime)
                const to = new Date(from.getTime() + shift)
                return (
                  <li key={f.id} className={`flex items-center gap-2.5 transition-opacity ${moveRest ? '' : 'opacity-45'}`}>
                    <span className={`size-6 rounded-full flex items-center justify-center shrink-0 ${fbg}`}>
                      <FIcon size={14} className="text-white" />
                    </span>
                    <span className="flex-1 min-w-0 font-dm font-bold text-[14px] text-text-primary truncate">{f.title}</span>
                    {moveRest ? (
                      <>
                        <span className="font-dm text-[14px] text-text-muted line-through">{shortTime(from)}</span>
                        <span className="font-dm font-bold text-[14px] text-text-primary whitespace-nowrap">
                          {formatTime(to.toISOString())}
                        </span>
                      </>
                    ) : (
                      <span className="font-dm text-[14px] text-text-secondary whitespace-nowrap">
                        {formatTime(from.toISOString())} · stays
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Move the rest too?">
              {[
                { value: true, label: `Yes, move them ${formatShift(shift)}` },
                { value: false, label: `No, only ${task.title}` },
              ].map((o) => {
                const selected = moveRest === o.value
                return (
                  <button
                    key={String(o.value)}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMoveRest(o.value)}
                    className={`flex items-center gap-2.5 bg-white rounded-[12px] px-3 py-2.5 text-left border transition-colors ${
                      selected ? 'border-2 border-text-primary' : 'border-border-light'
                    }`}
                  >
                    <RadioDot selected={selected} size="sm" tone="ink" />
                    <span className={`font-dm text-[14px] text-text-primary ${selected ? 'font-bold' : ''}`}>{o.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="font-dm text-[12px] text-text-secondary mt-2.5">Meals and meds keep their times.</p>
          </div>
        )}

        <Button fullWidth className="mt-5" disabled={!changed} onClick={() => onSave(at, suggest && moveRest)}>
          {suggest && moveRest ? `Save · move ${count + 1}` : 'Save'}
        </Button>
      </div>
    </div>
  )
}
