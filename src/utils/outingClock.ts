import type { DayPart, OutingRule, Task, TaskType } from '../types'

/** Task types that count as "going out" — either one resets the clock. */
export const OUTING_TYPES: TaskType[] = ['walk', 'potty']

export const DEFAULT_OUTING_RULE: OutingRule = {
  everyHours: 4,
  wakeTime: '07:00',
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

/** A set walk this close to the start or end of the day stands in for the
 *  morning / bedtime potty break. */
export const BOOKEND_MINUTES = 30

/** Whether one of the set walk times (HH:MM) falls within BOOKEND_MINUTES of
 *  `hhmm` — then that walk is the first (or last) time out, not a potty break. */
export function walkCoversTime(hhmm: string, walkTimes: string[]): boolean {
  const at = minutesOfDay(hhmm)
  return walkTimes.some((w) => Math.abs(minutesOfDay(w) - at) <= BOOKEND_MINUTES)
}

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
  const end = minutesOfDay(rule.wakeTime)
  if (start === end) return false
  const now = date.getHours() * 60 + date.getMinutes()
  return start < end ? now >= start && now < end : now >= start || now < end
}

/** When the dog next needs to go out: everyHours after the last time, pushed
 *  to the first time out in the morning when that lands overnight. */
export function nextOutingDue(lastOut: Date, rule: OutingRule): Date {
  const due = new Date(lastOut.getTime() + rule.everyHours * 3_600_000)
  if (!isOvernight(due, rule)) return due
  const morning = atTime(due, rule.wakeTime)
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

/** One planned time out: a long walk pulled into place, or a potty break in a gap. */
export interface PlannedOuting {
  at: Date
  type: 'walk' | 'potty'
  /** The long-walk task this fills (walks only). */
  taskId?: string
  /** "4 hrs after last out", "Before the 2–5 PM window ends", … */
  reason: string
}

interface PlanInput {
  lastOut: Date
  /** What the clock counts from, for the first reason: "last out", "the morning walk". */
  lastLabel: string
  rule: OutingRule
  /** Today's pending walks and potty breaks for this stay. */
  pending: Task[]
  /** The day being planned. */
  today: Date
  /** When the stay ends (pick-up) — nothing is planned from then on. */
  until?: Date
}

/** The rest of the day from the last time out: every `everyHours` the dog goes
 *  out again. A slot inside a long-walk window becomes that walk (or the walk
 *  moves up so the window isn't missed); any other slot is a potty break. A
 *  set-time walk or potty break (e.g. "Before bed") restarts the clock where it
 *  sits. Stops at bedtime, or when the stay ends. */
export function planOutings({ lastOut, lastLabel, rule, pending, today, until }: PlanInput): PlannedOuting[] {
  const hrs = `${rule.everyHours} ${rule.everyHours === 1 ? 'hr' : 'hrs'}`
  const day = today
  const wake = atTime(today, rule.wakeTime)
  const bedtime = atTime(day, rule.bedtime)
  const windows = pending
    .filter((t) => t.type === 'walk' && t.dayPart)
    .map((t) => {
      const info = dayPartInfo(t.dayPart!)
      const date = new Date(t.scheduledTime)
      return { task: t, range: info.range, start: atTime(date, info.start), end: atTime(date, info.end) }
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  const fixed = pending
    .filter((t) => !t.dayPart)
    .map((t) => ({ task: t, at: new Date(t.scheduledTime) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime())

  const plan: PlannedOuting[] = []
  const used = new Set<string>()
  let t = lastOut
  let label = lastLabel
  for (let guard = 0; guard < 24; guard++) {
    // Overnight (or a last time out before today) starts the day at wake-up.
    const nextDue = nextOutingDue(t, rule)
    const due = nextDue < wake ? wake : nextDue
    const after =
      due.getTime() === t.getTime() + rule.everyHours * 3_600_000 ? `${hrs} after ${label}` : 'First time out today'
    const set = fixed.find((f) => f.at > t && f.at <= due)
    const w = windows.find((x) => !used.has(x.task.id) && x.end > t)
    // Inside the window → the walk; past its end → moved up to the end; a
    // window that opens later than `due` waits for a later slot.
    const walkAt = w ? new Date(Math.min(Math.max(due.getTime(), w.start.getTime()), w.end.getTime())) : null
    const walk = w && walkAt && walkAt <= due ? { w, at: walkAt } : null

    const nextAt = set && (!walk || set.at <= walk.at) ? set.at : walk ? walk.at : due
    if (until && nextAt >= until) break
    if (set && (!walk || set.at <= walk.at)) {
      t = set.at
      label = `the ${set.task.title.toLowerCase()}`
    } else if (walk) {
      used.add(walk.w.task.id)
      plan.push({
        at: walk.at,
        type: 'walk',
        taskId: walk.w.task.id,
        reason:
          walk.at.getTime() === due.getTime()
            ? `${after} · inside ${walk.w.range}`
            : `Before the ${walk.w.range} window ends`,
      })
      t = walk.at
      label = `the ${walk.w.task.title.toLowerCase()}`
    } else {
      // The bedtime break covers anything this close to it.
      if (due.getTime() >= bedtime.getTime() - 30 * 60_000 || !isSameLocalDay(due, day)) break
      plan.push({ at: due, type: 'potty', reason: after })
      t = due
      label = 'the potty break'
    }
    if (t >= bedtime || !isSameLocalDay(t, day)) break
  }
  return plan
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
