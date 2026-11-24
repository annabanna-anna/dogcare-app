import { Children, type ReactNode } from 'react'
import RadioDot from './RadioDot'
import Switch from './Switch'
import { Plus, Minus, Sun, Moon, ArrowRight, type LucideIcon } from 'lucide-react'
import { TimePickerButton, formatTimeValue } from './TimePicker'
import { TASK_TYPE_STYLE } from './taskTypeStyle'
import type { DayPart, LongWalkTiming, OutingRule } from '../types'
import { BOOKEND_MINUTES, DAY_PARTS } from '../utils/outingClock'

const MIN_OUTING_HOURS = 1
const MAX_OUTING_HOURS = 12

export const longWalkOptions: { value: LongWalkTiming; label: string; hint: string }[] = [
  { value: 'set-times', label: 'Set times', hint: 'Exact times from the owner, e.g. 7:00 AM' },
  { value: 'time-of-day', label: 'Rough time of day', hint: 'Morning, midday, afternoon or evening' },
  { value: 'unsure', label: 'Not sure yet', hint: 'Log walks on Today as they happen' },
]

export const hrsLabel = (n: number) => `${n} ${n === 1 ? 'hr' : 'hrs'}`

/** A selectable card with a radio dot — the F pattern for "pick one". */
export function RadioCard({
  selected,
  label,
  hint,
  onSelect,
  children,
}: {
  selected: boolean
  label: string
  hint?: string
  onSelect: () => void
  children?: ReactNode
}) {
  return (
    <div
      className={`bg-white rounded-[16px] p-4 flex flex-col gap-3 ${
        selected ? 'border-2 border-coral' : 'border border-border-light'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex items-center gap-3 text-left"
      >
        <RadioDot selected={selected} />
        <span className="min-w-0">
          <span className="block font-dm font-bold text-[16px] text-text-primary">{label}</span>
          {hint && <span className="block font-dm text-[12px] text-text-secondary">{hint}</span>}
        </span>
      </button>
      {selected && children}
    </div>
  )
}

/** A tappable time tile — icon + small label over the time — that opens the time wheel. */
function DayTile({
  icon: Icon,
  label,
  value,
  onChange,
  ariaLabel,
}: {
  icon: LucideIcon
  label: string
  value: string
  onChange: (v: string) => void
  ariaLabel: string
}) {
  return (
    <TimePickerButton
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      className="flex-1 min-w-0 bg-white border border-border-light rounded-[14px] px-3 py-2.5 flex flex-col gap-1 active:scale-[0.98] transition-transform"
    >
      <span className="flex items-center gap-1.5 font-dm font-medium text-[12px] text-text-secondary">
        <Icon size={14} aria-hidden />
        {label}
      </span>
      <span className="font-dm font-bold text-[18px] text-text-primary">{formatTimeValue(value)}</span>
    </TimePickerButton>
  )
}

/** How often, their day (first out → last out), and "ask the real time". */
export function OutingSettingsCard({
  rule,
  onPatch,
}: {
  rule: OutingRule
  onPatch: (patch: Partial<OutingRule>) => void
}) {
  return (
    <div className="bg-card rounded-[20px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-dm font-bold text-[14px] text-text-primary">Out at least every</p>
          <p className="font-dm text-[12px] text-text-secondary">Walks and potty breaks both count</p>
        </div>
        <button
          type="button"
          aria-label="Fewer hours"
          disabled={rule.everyHours <= MIN_OUTING_HOURS}
          onClick={() => onPatch({ everyHours: rule.everyHours - 1 })}
          className="size-8 rounded-full bg-white border border-border-light flex items-center justify-center text-text-primary disabled:opacity-40 active:scale-[0.94] transition-transform"
        >
          <Minus size={14} />
        </button>
        <p className="font-outfit font-bold text-[18px] text-text-primary min-w-[52px] text-center">
          {hrsLabel(rule.everyHours)}
        </p>
        <button
          type="button"
          aria-label="More hours"
          disabled={rule.everyHours >= MAX_OUTING_HOURS}
          onClick={() => onPatch({ everyHours: rule.everyHours + 1 })}
          className="size-8 rounded-full bg-white border border-border-light flex items-center justify-center text-text-primary disabled:opacity-40 active:scale-[0.94] transition-transform"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="border-t border-border-light" />
      {/* The day's bookends. Each is a potty break unless a set walk lands
          within 30 min — then that walk is the first / last time out. */}
      <div className="flex flex-col gap-1">
        <p className="font-dm font-bold text-[14px] text-text-primary">Their day</p>
        <div className="flex items-center gap-2">
          <DayTile
            icon={Sun}
            label="First out"
            value={rule.wakeTime}
            onChange={(v) => onPatch({ wakeTime: v })}
            ariaLabel="First out in the morning"
          />
          <ArrowRight size={16} className="text-text-muted shrink-0" aria-hidden />
          <DayTile
            icon={Moon}
            label="Last out"
            value={rule.bedtime}
            onChange={(v) => onPatch({ bedtime: v })}
            ariaLabel="Last out before bed"
          />
        </div>
      </div>
      <div className="border-t border-border-light" />
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-dm font-bold text-[14px] text-text-primary">Ask the real time</p>
          <p className="font-dm text-[12px] text-text-secondary">on late logs</p>
        </div>
        <Switch
          label="Ask the real time on late logs"
          checked={rule.askWhenItHappened}
          onChange={(on) => onPatch({ askWhenItHappened: on })}
        />
      </div>
    </div>
  )
}

/** "When are the long walks?" — set times, rough time of day, or not sure yet.
 *  The set-time walk rows are the caller's (they live in the care schedule). */
export function LongWalkChoice({
  rule,
  onPatch,
  setTimeWalks,
  onAddWalk,
}: {
  rule: OutingRule
  onPatch: (patch: Partial<OutingRule>) => void
  setTimeWalks: ReactNode
  onAddWalk: () => void
}) {
  function toggleDayPart(key: DayPart) {
    const next = rule.dayPartWalks.some((w) => w.dayPart === key)
      ? rule.dayPartWalks.filter((w) => w.dayPart !== key)
      : [...rule.dayPartWalks, { dayPart: key, note: '' }]
    const order = DAY_PARTS.map((d) => d.key)
    onPatch({ dayPartWalks: next.sort((a, b) => order.indexOf(a.dayPart) - order.indexOf(b.dayPart)) })
  }
  function setDayPartNote(key: DayPart, note: string) {
    onPatch({ dayPartWalks: rule.dayPartWalks.map((w) => (w.dayPart === key ? { ...w, note } : w)) })
  }
  const WalkIcon = TASK_TYPE_STYLE.walk.icon

  return (
    <div role="radiogroup" aria-label="When are the walks?" className="flex flex-col gap-2">
      {longWalkOptions.map((opt) => (
        <RadioCard
          key={opt.value}
          selected={rule.longWalks === opt.value}
          label={opt.label}
          hint={opt.hint}
          onSelect={() => {
            // Each answer starts with one entry: a set-time walk, or a morning walk.
            if (opt.value === 'time-of-day' && rule.dayPartWalks.length === 0) {
              onPatch({ longWalks: opt.value, dayPartWalks: [{ dayPart: 'morning', note: '' }] })
              return
            }
            onPatch({ longWalks: opt.value })
            if (opt.value === 'set-times' && Children.toArray(setTimeWalks).length === 0) onAddWalk()
          }}
        >
          {opt.value === 'set-times' && (
            <>
              {setTimeWalks}
              <button
                type="button"
                onClick={onAddWalk}
                className="w-full py-3 rounded-[12px] border-2 border-dashed border-border-light flex items-center justify-center gap-1.5 font-dm font-bold text-[14px] text-text-secondary active:bg-gray-50 transition-colors"
              >
                <Plus size={16} />
                Add a walk
              </button>
            </>
          )}
          {opt.value === 'time-of-day' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {DAY_PARTS.map((part) => {
                  const on = rule.dayPartWalks.some((w) => w.dayPart === part.key)
                  return (
                    <button
                      key={part.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDayPart(part.key)}
                      className={`rounded-[14px] py-2 flex flex-col items-center transition-colors ${
                        on ? 'bg-coral text-white' : 'bg-white border border-border-light text-text-primary'
                      }`}
                    >
                      <span className="font-dm font-bold text-[14px]">{part.label}</span>
                      <span className={`font-dm text-[12px] ${on ? 'text-white/90' : 'text-text-muted'}`}>
                        {part.range}
                      </span>
                    </button>
                  )
                })}
              </div>
              {rule.dayPartWalks.map((w) => {
                const part = DAY_PARTS.find((d) => d.key === w.dayPart)!
                return (
                  <div key={w.dayPart} className="border border-border-light rounded-[12px] p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`size-6 rounded-full flex items-center justify-center shrink-0 ${TASK_TYPE_STYLE.walk.bg}`}>
                        <WalkIcon size={12} className="text-white" />
                      </span>
                      <p className="font-dm font-bold text-[14px] text-text-primary">{part.label} walk</p>
                    </div>
                    <input
                      type="text"
                      value={w.note ?? ''}
                      onChange={(e) => setDayPartNote(w.dayPart, e.target.value)}
                      placeholder="Note (optional) — e.g. 45 min, first thing out"
                      className="w-full bg-white border border-border-faint rounded-[10px] px-3 py-2 font-dm text-[14px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors"
                    />
                  </div>
                )
              })}
            </>
          )}
        </RadioCard>
      ))}
    </div>
  )
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** "7 AM", "6:30 PM". */
function shortClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const suffix = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
}


/** A long walk on the typical day: a set time, or a rough part of the day
 *  (`label`, e.g. "Morning") sketched at that window's start. */
export interface TypicalWalk {
  time: string
  label?: string
}

/** A sketch of one day under the rule: walks where they're planned, potty
 *  breaks whenever it's been everyHours, and the morning and bedtime ones. */
export function typicalDay(
  rule: OutingRule,
  walkTimes: TypicalWalk[],
): { at: number; kind: 'walk' | 'potty'; label?: string }[] {
  const labelAt = new Map(walkTimes.map((w) => [minutesOf(w.time), w.label]))
  const walks = [...labelAt.keys()].sort((a, b) => a - b)
  const bed = minutesOf(rule.bedtime) || 24 * 60
  const gap = rule.everyHours * 60
  // The day starts and ends with a potty break, unless a walk sits right there.
  const near = (a: number, b: number) => Math.abs(a - b) <= BOOKEND_MINUTES
  const wake = minutesOf(rule.wakeTime)
  const first = walks.find((w) => near(w, wake)) ?? Math.min(wake, walks[0] ?? wake)
  const points: { at: number; kind: 'walk' | 'potty'; label?: string }[] = [
    walks.includes(first) ? { at: first, kind: 'walk', label: labelAt.get(first) } : { at: first, kind: 'potty' },
  ]
  let last = first
  for (;;) {
    const walk = walks.find((w) => w > last && w <= last + gap && w <= bed + BOOKEND_MINUTES)
    if (walk !== undefined) {
      points.push({ at: walk, kind: 'walk', label: labelAt.get(walk) })
      last = walk
    } else if (last + gap < bed - BOOKEND_MINUTES) {
      last += gap
      points.push({ at: last, kind: 'potty' })
    } else break
  }
  if (bed > last && !near(last, bed)) points.push({ at: bed, kind: 'potty' })
  return points
}

/** The "A typical day" strip on the how-often question. */
export function TypicalDay({ rule, walkTimes }: { rule: OutingRule; walkTimes: TypicalWalk[] }) {
  const points = typicalDay(rule, walkTimes)
  // Short gaps make too many labels to fit; keep the walks and the ends.
  const crowded = points.length > 7
  return (
    <div className="bg-white border border-border-light rounded-[16px] px-4 pt-4 pb-3">
      {/* Zero-width columns put each dot's center on the line's ends; the
          padding leaves room for the end labels. */}
      <div className="relative flex justify-between items-start px-4">
        <div className="absolute left-4 right-4 top-3 -translate-y-1/2 h-0.5 bg-border-light" />
        {points.map((p, i) => {
          const showLabel = !crowded || p.kind === 'walk' || i === 0 || i === points.length - 1
          return (
            <div key={i} className="relative flex flex-col items-center gap-1.5 w-0">
              <span className="h-6 flex items-center">
                <span
                  className={`rounded-full ${
                    p.kind === 'walk' ? `size-6 ${TASK_TYPE_STYLE.walk.bg}` : `size-4 ${TASK_TYPE_STYLE.potty.bg}`
                  }`}
                />
              </span>
              <span
                className={`font-dm text-[12px] text-text-secondary whitespace-nowrap ${showLabel ? '' : 'invisible'}`}
              >
                {/* A rough-time walk has no clock time yet — name its part of the day. */}
                {p.label ?? shortClock(p.at)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <span className="flex items-center gap-1.5 font-dm text-[12px] text-text-secondary">
          <span className={`size-2.5 rounded-full ${TASK_TYPE_STYLE.walk.bg}`} />
          Walk
        </span>
        <span className="flex items-center gap-1.5 font-dm text-[12px] text-text-secondary">
          <span className={`size-2.5 rounded-full ${TASK_TYPE_STYLE.potty.bg}`} />
          Potty break
        </span>
      </div>
    </div>
  )
}
