import { TASK_TYPE_STYLE } from './taskTypeStyle'
import type { CareScheduleEntry, OutingRule } from '../types'
import { formatTime } from '../utils/dateUtils'
import { dayPartInfo, walkCoversTime } from '../utils/outingClock'

const clock = (hhmm: string) => formatTime(`2000-01-01T${hhmm}:00`)

/** The going-out rule read back like the review step: one "out at least
 *  every N hrs" block, with walks as anchors and potty breaks between, from
 *  the morning potty to the bedtime one. */
export default function GoingOutBlock({ rule, careSchedule }: { rule: OutingRule; careSchedule: CareScheduleEntry[] }) {
  const hrs = `${rule.everyHours} ${rule.everyHours === 1 ? 'hr' : 'hrs'}`
  const setWalks =
    rule.longWalks === 'set-times'
      ? careSchedule.filter((e) => e.taskType === 'walk').sort((a, b) => a.time.localeCompare(b.time))
      : []
  // A set walk at the start / end of the day stands in for that potty break.
  const setWalkTimes = setWalks.map((e) => e.time)
  const walks =
    rule.longWalks === 'set-times'
      ? setWalks.map((e) => ({ when: clock(e.time), sub: e.note }))
      : rule.longWalks === 'time-of-day'
        ? rule.dayPartWalks.map((w) => {
            const part = dayPartInfo(w.dayPart)
            return { when: part.label, sub: [part.range, w.note?.trim()].filter(Boolean).join(' · ') }
          })
        : []
  const lines: { when: string; muted?: boolean; accent?: boolean; type: 'walk' | 'potty'; title: string; sub?: string }[] = [
    walkCoversTime(rule.wakeTime, setWalkTimes)
      ? null
      : { when: clock(rule.wakeTime), type: 'potty' as const, title: 'Morning potty' },
    ...walks.slice(0, 1).map((w) => ({ ...w, type: 'walk' as const, title: 'Walk' })),
    walks.length === 0
      ? { when: 'Not set', muted: true, type: 'walk' as const, title: 'Walks', sub: 'Logged on Today as they happen' }
      : null,
    { when: 'Between', accent: true, type: 'potty' as const, title: 'Potty breaks', sub: `When it’s been ${hrs}` },
    ...walks.slice(1).map((w) => ({ ...w, type: 'walk' as const, title: 'Walk' })),
    walkCoversTime(rule.bedtime, setWalkTimes)
      ? null
      : { when: clock(rule.bedtime), type: 'potty' as const, title: 'Before bed' },
  ].filter((l): l is NonNullable<typeof l> => l !== null)

  return (
    <div className="bg-card rounded-[14px] p-3.5 flex flex-col gap-3">
      <div>
        <p className="font-dm font-bold text-[16px] text-text-primary">Out at least every {hrs}</p>
        <p className="font-dm text-[12px] text-text-secondary mt-0.5">
          Walks and potty breaks both count{rule.askWhenItHappened ? ' · asks when it happened' : ''}
        </p>
      </div>
      {lines.map((l, i) => {
        const { icon: Icon, bg } = TASK_TYPE_STYLE[l.type]
        return (
          <div key={i} className={`flex gap-3 ${l.sub ? 'items-start' : 'items-center'}`}>
            <span
              className={`font-dm font-bold text-[14px] w-[68px] shrink-0 ${l.sub ? 'pt-0.5' : ''} ${
                l.accent ? 'text-coral' : l.muted ? 'text-text-muted' : 'text-text-primary'
              }`}
            >
              {l.when}
            </span>
            <div
              className={`size-6 rounded-full flex items-center justify-center shrink-0 ${bg} ${
                l.sub ? 'mt-0.5' : ''
              } ${l.muted ? 'opacity-45' : ''}`}
            >
              <Icon size={12} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-dm font-bold text-[14px] text-text-primary leading-none">{l.title}</p>
              {l.sub && <p className="font-dm text-[12px] text-text-secondary mt-0.5">{l.sub}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
