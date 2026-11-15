import type { OutingRule, Task, TaskType } from '../types'

/** Task types that count as "going out" — either one resets the clock. */
export const OUTING_TYPES: TaskType[] = ['walk', 'potty']

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Whether `date` falls inside the rule's overnight window (which may wrap
 *  past midnight, e.g. 22:00–06:00). Equal start and end = no window. */
export function isOvernight(date: Date, rule: OutingRule): boolean {
  const start = minutesOfDay(rule.overnightStart)
  const end = minutesOfDay(rule.overnightEnd)
  if (start === end) return false
  const now = date.getHours() * 60 + date.getMinutes()
  return start < end ? now >= start && now < end : now >= start || now < end
}

/** The first moment the overnight window ends at or after `date`. */
function overnightEndAfter(date: Date, rule: OutingRule): Date {
  const end = minutesOfDay(rule.overnightEnd)
  const result = new Date(date)
  result.setHours(Math.floor(end / 60), end % 60, 0, 0)
  if (result < date) result.setDate(result.getDate() + 1)
  return result
}

/** When the next walk or potty break is due: everyHours after the last one,
 *  pushed to the morning when that lands overnight. */
export function nextOutingDue(lastOut: Date, rule: OutingRule): Date {
  const due = new Date(lastOut.getTime() + rule.everyHours * 3_600_000)
  return isOvernight(due, rule) ? overnightEndAfter(due, rule) : due
}

/** The most recent completed walk/potty break among `tasks`, if any. */
export function latestOuting(tasks: Task[]): Task | undefined {
  let latest: Task | undefined
  for (const t of tasks) {
    if (t.status !== 'done' || !t.completedAt || !OUTING_TYPES.includes(t.type)) continue
    if (!latest || t.completedAt > latest.completedAt!) latest = t
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
