import { listStays } from './stays'
import { listTasksByStay, deleteTasksByIds, createTasks } from './tasks'
import {
  isGoogleCalendarConnected,
  deletePushedTasksFromGoogle,
  pushTasksToGoogleCalendar,
} from './googleCalendar'
import { generateTasksForStay } from '../utils/taskGenerator'
import type { Dog } from '../types'

/** Called after a dog's profile is saved: rebuilds the tasks of that dog's
 *  current and upcoming stays from the (possibly changed) care schedule, so
 *  edits show up on Today without restarting the stay.
 *
 *  Tasks the sitter already acted on (done/skipped) are kept as history —
 *  everything else, including pending tasks whose time has passed, is
 *  rebuilt, so removing a schedule entry also clears its leftover pending
 *  tasks. Tasks that were pushed to Google are cleaned up there first, and
 *  the rebuilt ones re-pushed, so the HeyPup calendar mirrors the change
 *  instead of accumulating stale copies. */
export async function regenerateFutureTasksForDog(dog: Dog): Promise<void> {
  const now = new Date()
  const stays = (await listStays()).filter(
    (s) => s.dogId === dog.id && new Date(s.endDate) >= now,
  )

  for (const stay of stays) {
    const existing = await listTasksByStay(stay.id)
    const kept = existing.filter((t) => t.status === 'done' || t.status === 'skipped')
    const rebuilt = existing.filter((t) => t.status !== 'done' && t.status !== 'skipped')

    if (isGoogleCalendarConnected()) {
      await deletePushedTasksFromGoogle(rebuilt).catch(() => {})
    }
    await deleteTasksByIds(rebuilt.map((t) => t.id))

    // Compare via epoch, not the raw strings — Postgres and toISOString()
    // format the same instant differently ("+00:00" vs "Z").
    const keptSlots = new Set(kept.map((t) => `${t.type}|${new Date(t.scheduledTime).getTime()}`))
    const regenerated = generateTasksForStay(dog, stay).filter(
      (t) => !keptSlots.has(`${t.type}|${new Date(t.scheduledTime).getTime()}`),
    )
    const created = await createTasks(regenerated)
    if (isGoogleCalendarConnected()) {
      pushTasksToGoogleCalendar(created).catch(() => {})
    }
  }
}
