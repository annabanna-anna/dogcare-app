import { useState } from 'react'
import { Clock } from 'lucide-react'
import Button from './Button'
import { TimePickerButton } from './TimePicker'
import { TASK_TYPE_STYLE } from './taskTypeStyle'
import type { OutingRule, TaskType } from '../types'
import { formatTime } from '../utils/dateUtils'
import { nextOutingDue } from '../utils/outingClock'

interface Props {
  type: TaskType
  title: string
  dogName: string
  rule: OutingRule
  onConfirm: (at: Date) => void
  onClose: () => void
}

const AGO_OPTIONS = [
  { label: '15 min ago', minutes: 15 },
  { label: '30 min ago', minutes: 30 },
  { label: '1 hr ago', minutes: 60 },
]

function toHhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "Walk done — when did it happen?" Shown right after a walk or potty break
 *  is logged, already saved as "just now"; picking an earlier time moves it
 *  so a late check-off doesn't push the next time out back. */
export default function LogTimeSheet({ type, title, dogName, rule, onConfirm, onClose }: Props) {
  const [openedAt] = useState(() => new Date())
  const [at, setAt] = useState(openedAt)
  const [choice, setChoice] = useState<'now' | number | 'other'>('now')
  const { icon: Icon, bg } = TASK_TYPE_STYLE[type]
  const due = nextOutingDue(at, rule)

  function pickOther(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number)
    const d = new Date(openedAt)
    d.setHours(h, m, 0, 0)
    // A time later than now means last night, e.g. picking 11:30 PM at 1 AM.
    if (d > openedAt) d.setDate(d.getDate() - 1)
    setAt(d)
    setChoice('other')
  }

  const chipClass = (selected: boolean) =>
    `px-4 py-2 rounded-full font-dm font-bold text-[13px] transition-colors ${
      selected ? 'bg-coral text-white' : 'bg-white border border-border-light text-text-primary'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[480px] bg-white rounded-t-[24px] px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-light" />
        <div className="flex items-center gap-3 mb-4">
          <span className={`size-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
            <Icon size={18} className="text-white" />
          </span>
          <div className="min-w-0">
            <p className="font-outfit font-bold text-[22px] text-text-primary leading-tight">{title} done</p>
            <p className="font-dm text-[13px] text-text-secondary">{dogName} · when did it happen?</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setAt(openedAt)
              setChoice('now')
            }}
            className={chipClass(choice === 'now')}
          >
            Just now · {formatTime(openedAt.toISOString())}
          </button>
          {AGO_OPTIONS.map((o) => (
            <button
              key={o.minutes}
              type="button"
              onClick={() => {
                setAt(new Date(openedAt.getTime() - o.minutes * 60_000))
                setChoice(o.minutes)
              }}
              className={chipClass(choice === o.minutes)}
            >
              {o.label}
            </button>
          ))}
          <TimePickerButton
            value={toHhmm(at)}
            onChange={pickOther}
            className={`${chipClass(choice === 'other')} pr-8`}
          />
        </div>
        <div className="bg-card rounded-[16px] px-4 py-3 flex items-center gap-3 mb-5">
          <Clock size={18} className="text-green-vivid shrink-0" />
          <div className="min-w-0">
            <p className="font-dm font-bold text-[14px] text-text-primary">
              Next time out around {formatTime(due.toISOString())}
            </p>
            <p className="font-dm text-[12px] text-text-secondary">
              {rule.everyHours} {rule.everyHours === 1 ? 'hr' : 'hrs'} after {formatTime(at.toISOString())}
            </p>
          </div>
        </div>
        <Button fullWidth onClick={() => onConfirm(at)}>
          Save
        </Button>
      </div>
    </div>
  )
}
