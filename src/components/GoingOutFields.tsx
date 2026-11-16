import { type ReactNode } from 'react'
import { Plus, Minus } from 'lucide-react'
import { TimePickerButton } from './TimePicker'
import { TASK_TYPE_STYLE } from './taskTypeStyle'
import type { DayPart, LongWalkTiming, OutingRule } from '../types'
import { DAY_PARTS } from '../utils/outingClock'

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
        <span
          className={`size-[22px] rounded-full bg-white shrink-0 ${
            selected ? 'border-[7px] border-coral' : 'border-[1.5px] border-border-light'
          }`}
        />
        <span className="min-w-0">
          <span className="block font-dm font-bold text-[15px] text-text-primary">{label}</span>
          {hint && <span className="block font-dm text-[12px] text-text-secondary">{hint}</span>}
        </span>
      </button>
      {selected && children}
    </div>
  )
}

/** How often, last time out before bed, and "ask when it happened". */
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
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-dm font-bold text-[14px] text-text-primary">Last time out before bed</p>
          <p className="font-dm text-[12px] text-text-secondary">Bedtime potty break · change any time</p>
        </div>
        <TimePickerButton
          value={rule.bedtime}
          onChange={(v) => onPatch({ bedtime: v })}
          className="w-[112px] shrink-0 bg-white border border-border-light rounded-[10px] pl-3 pr-7 py-2 font-dm font-bold text-[13px] text-text-primary"
        />
      </div>
      <div className="border-t border-border-light" />
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-dm font-bold text-[14px] text-text-primary">Ask when it happened</p>
          <p className="font-dm text-[12px] text-text-secondary">
            When you log late, pick the real time so the clock stays right.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={rule.askWhenItHappened}
          aria-label="Ask when it happened"
          onClick={() => onPatch({ askWhenItHappened: !rule.askWhenItHappened })}
          className={`relative w-[46px] h-[26px] rounded-full shrink-0 transition-colors ${
            rule.askWhenItHappened ? 'bg-coral' : 'bg-[#d1d1d1]'
          }`}
        >
          <span
            className={`absolute top-[3px] size-5 rounded-full bg-white transition-[left] ${
              rule.askWhenItHappened ? 'left-[23px]' : 'left-[3px]'
            }`}
          />
        </button>
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
    <div role="radiogroup" aria-label="When are the long walks?" className="flex flex-col gap-2">
      {longWalkOptions.map((opt) => (
        <RadioCard
          key={opt.value}
          selected={rule.longWalks === opt.value}
          label={opt.label}
          hint={opt.hint}
          onSelect={() => onPatch({ longWalks: opt.value })}
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
                      <span className="font-dm font-bold text-[13px]">{part.label}</span>
                      <span className={`font-dm text-[11px] ${on ? 'text-white/90' : 'text-text-muted'}`}>
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
                      className="w-full bg-white border border-border-faint rounded-[10px] px-3 py-2 font-dm text-[13px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors"
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

const DAY_START = 7 * 60

/** A sketch of one day under the rule: long walks where they're planned,
 *  potty breaks whenever it's been everyHours, and the bedtime one. */
export function typicalDay(rule: OutingRule, walkTimes: string[]): { at: number; kind: 'walk' | 'potty' }[] {
  const walks = [...new Set(walkTimes.map(minutesOf))].sort((a, b) => a - b)
  const bed = minutesOf(rule.bedtime) || 24 * 60
  const gap = rule.everyHours * 60
  const first = walks.length && walks[0] < DAY_START ? walks[0] : DAY_START
  const points: { at: number; kind: 'walk' | 'potty' }[] = [
    { at: first, kind: walks.includes(first) ? 'walk' : 'potty' },
  ]
  let last = first
  for (;;) {
    const walk = walks.find((w) => w > last && w <= last + gap && w < bed)
    if (walk !== undefined) {
      points.push({ at: walk, kind: 'walk' })
      last = walk
    } else if (last + gap < bed - 30) {
      last += gap
      points.push({ at: last, kind: 'potty' })
    } else break
  }
  if (bed > last) points.push({ at: bed, kind: 'potty' })
  return points
}

/** The "A typical day" strip on the how-often question. */
export function TypicalDay({ rule, walkTimes }: { rule: OutingRule; walkTimes: string[] }) {
  const points = typicalDay(rule, walkTimes)
  // Short gaps make too many labels to fit; keep the walks and the ends.
  const crowded = points.length > 7
  return (
    <div className="bg-white border border-border-light rounded-[16px] px-4 pt-4 pb-3">
      {/* Zero-width columns put each dot's center on the line's ends; the
          padding leaves room for the end labels. */}
      <div className="relative flex justify-between items-start px-4">
        <div className="absolute left-4 right-4 top-[11px] h-0.5 bg-border-light" />
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
                className={`font-dm text-[11px] text-text-secondary whitespace-nowrap ${showLabel ? '' : 'invisible'}`}
              >
                {shortClock(p.at)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <span className="flex items-center gap-1.5 font-dm text-[12px] text-text-secondary">
          <span className={`size-2.5 rounded-full ${TASK_TYPE_STYLE.walk.bg}`} />
          Long walk
        </span>
        <span className="flex items-center gap-1.5 font-dm text-[12px] text-text-secondary">
          <span className={`size-2.5 rounded-full ${TASK_TYPE_STYLE.potty.bg}`} />
          Potty break
        </span>
      </div>
    </div>
  )
}
