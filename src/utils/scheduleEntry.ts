import type { CareScheduleEntry } from '../types'

/** Only "Other" tasks carry a title. Older setups saved titled meals (e.g.
 *  Snack time) and named medicines — a titled meal becomes Other, and any
 *  other title moves to the front of the note so nothing is lost. */
export function normalizeScheduleEntry(e: CareScheduleEntry): CareScheduleEntry {
  if (e.taskType === 'other' || e.customTitle === undefined) return { ...e }
  if (e.taskType === 'meal') return { ...e, taskType: 'other' }
  const { customTitle, ...rest } = e
  const title = customTitle.trim()
  const note = e.note?.trim() ?? ''
  if (!title || note.toLowerCase().includes(title.toLowerCase())) return { ...rest, note }
  return { ...rest, note: note ? `${title} · ${note}` : title }
}
