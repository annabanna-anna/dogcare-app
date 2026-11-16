import type { DayPart, OutingRule, Task, TaskType } from '../types'

/** Task types that count as "going out" — either one resets the clock. */
export const OUTING_TYPES: TaskType[] = ['walk', 'potty']

export const DEFAULT_OUTING_RULE: OutingRule = {
  everyHours: 4,
  bedtime: '22:00',
  askWhenItHappened: true,
  longWalks: 'set-times',
  dayPartWalks: [],
}

/** The windows a "time of day" long walk can fall in. They don't overlap, so
 *  any logged walk lands in exactly one. */
export const DAY_PARTS: { key: DayPart; label: string; start: string; end: string; range: string }[] = [
  { key: 'morning', label: 'Morning', start: '06:00', end: '10:00', range: '6–10 AM' },
  { key: 'midday', label: 'Midday', start: '11:00', end: '14:00', range: '11 AM–2 PM' },
  { key: 'afternoon', label: 'Afternoon', start: '14:00', end: '17:00', range: '2–5 PM' },
  { key: 'evening', label: 'Evening', start: '17:00', end: '21:00', range: '5–9 PM' },
]

export function dayPartInfo(key: DayPart) {
  return DAY_PARTS.find((d) => d.key === key) ?? DAY_PARTS[0]
}

/** No potty breaks are expected between bedtime and the start of the morning. */
const WAKE_TIME = DAY_PARTS[0].start

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** `date` with its clock time set to `hhmm`. */
export function atTime(date: Date, hhmm: string): Date {
  const result = new Date(date)
  const minutes = minutesOfDay(hhmm)
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return result
}

/** Whether `date` falls between bedtime and the morning (the window may wrap
 *  past midnight, e.g. 22:00–06:00). */
export function isOvernight(date: Date, rule: OutingRule): boolean {
  const start = minutesOfDay(rule.bedtime)
  const end = minutesOfDay(WAKE_TIME)
  if (start === end) return false
  const now = date.getHours() * 60 + date.getMinutes()
  return start < end ? now >= start && now < end : now >= start || now < end
}

/** When the dog next needs to go out: everyHours after the last time, pushed
 *  to the morning when that lands overnight. */
export function nextOutingDue(lastOut: Date, rule: OutingRule): Date {
  const due = new Date(lastOut.getTime() + rule.everyHours * 3_600_000)
  if (!isOvernight(due, rule)) return due
  const morning = atTime(due, WAKE_TIME)
  if (morning < due) morning.setDate(morning.getDate() + 1)
  return morning
}

/** The most recent completed walk/potty break among `tasks`, if any. */
export function latestOuting(tasks: Task[]): Task | undefined {
  let latest: Task | undefined
  for (const t of tasks) {
    if (t.status !== 'done' || !t.completedAt || !OUTING_TYPES.includes(t.type)) continue
    if (!latest || new Date(t.completedAt) > new Date(latest.completedAt!)) latest = t
  }
  return latest
}

/** "2h 12m", "45m", "0m". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
