export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function formatShortDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDayHeading(isoString: string): string {
  const date = new Date(isoString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isOverdue(scheduledTime: string): boolean {
  return new Date(scheduledTime) < new Date()
}

export function toDateKey(isoString: string): string {
  return isoString.slice(0, 10)
}

/** Local calendar date as "YYYY-MM-DD" — unlike toDateKey(date.toISOString()),
 *  this doesn't shift across midnight UTC, so it matches how a calendar event's
 *  own date (all-day or timed-with-offset) actually reads for this user. */
export function toLocalDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Combines a local calendar day ("YYYY-MM-DD") and time ("HH:mm") into a
 *  real, unambiguous ISO timestamp. A naive `${day}T${time}` string with no
 *  timezone gets reinterpreted as UTC once it round-trips through Postgres,
 *  silently shifting the stored instant by the user's local offset (e.g. a
 *  7:30am local pick coming back as 12:30am) — this avoids that. */
export function combineLocalDateTime(day: string, time: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, date, hours, minutes, 0, 0).toISOString()
}

export function formatTodayHeading(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase()
}
