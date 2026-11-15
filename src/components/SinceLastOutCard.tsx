import { Clock } from 'lucide-react'
import { TASK_TYPE_STYLE } from './taskTypeStyle'
import type { OutingRule, TaskType } from '../types'
import { formatTime } from '../utils/dateUtils'
import { formatDuration, isOvernight, nextOutingDue } from '../utils/outingClock'

interface Props {
  rule: OutingRule
  /** When the dog was last out — the stay's start (drop-off) if nothing's logged yet. */
  lastOutAt: Date
  /** What the last outing was ("Walk", "Potty break"), or null for drop-off. */
  lastOutLabel: string | null
  now: Date
  /** Shown when several dogs have their own clock today. */
  dogName?: string
  onLog: (type: TaskType) => void
}

const LOG_BUTTONS: { type: TaskType; label: string }[] = [
  { type: 'potty', label: 'Log potty break' },
  { type: 'walk', label: 'Log walk' },
]

/** Today's "every X hours" clock: time since the last walk or potty break,
 *  when the next one is due, and one-tap logging. */
export default function SinceLastOutCard({ rule, lastOutAt, lastOutLabel, now, dogName, onLog }: Props) {
  const elapsed = now.getTime() - lastOutAt.getTime()
  const due = nextOutingDue(lastOutAt, rule)
  const overnight = isOvernight(now, rule)
  const overdue = !overnight && now > due
  const progress = Math.min(1, elapsed / (rule.everyHours * 3_600_000))

  const lastOutText = lastOutLabel
    ? `Last out ${formatTime(lastOutAt.toISOString())} · ${lastOutLabel}.`
    : `Dropped off ${formatTime(lastOutAt.toISOString())}.`
  const status = overnight
    ? `Overnight — next out by ${formatTime(due.toISOString())}.`
    : overdue
      ? `Overdue by ${formatDuration(now.getTime() - due.getTime())}.`
      : `Next out by ~${formatTime(due.toISOString())}.`

  return (
    <div className="bg-card rounded-[20px] p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock size={14} className="text-text-secondary shrink-0" />
        <p className="font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest">
          Since last out
        </p>
        {dogName && (
          <p className="ml-auto font-dm font-bold text-[12px] text-coral uppercase tracking-widest truncate">
            {dogName}
          </p>
        )}
      </div>
      <p className="flex items-baseline gap-2 mb-3">
        <span
          className={`font-outfit font-bold text-[40px] leading-none tracking-tight ${
            overdue ? 'text-coral' : 'text-text-primary'
          }`}
        >
          {formatDuration(elapsed)}
        </span>
        <span className="font-dm font-bold text-[14px] text-text-secondary">
          of {rule.everyHours} {rule.everyHours === 1 ? 'hr' : 'hrs'}
        </span>
      </p>
      <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden mb-2" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            overdue ? 'bg-coral' : overnight ? 'bg-text-muted' : 'bg-green-vivid'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="font-dm text-[12px] text-text-secondary mb-3">
        {lastOutText} <span className={overdue ? 'font-bold text-coral' : ''}>{status}</span>
      </p>
      <div className="flex gap-2">
        {LOG_BUTTONS.map(({ type, label }) => {
          const { icon: Icon, bg } = TASK_TYPE_STYLE[type]
          return (
            <button
              key={type}
              type="button"
              onClick={() => onLog(type)}
              className="flex-1 min-w-0 flex items-center justify-center gap-2 bg-white border border-border-light rounded-full pl-1.5 pr-3 py-1.5 active:scale-[0.97] transition-transform"
            >
              <span className={`size-7 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={14} className="text-white" />
              </span>
              <span className="font-dm font-bold text-[13px] text-text-primary truncate">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
