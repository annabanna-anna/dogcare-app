import type { Dog, Stay, Task, TaskType } from '../types'

const TASK_TITLES: Record<TaskType, string> = {
  walk: 'Walk',
  meal: 'Meal',
  medication: 'Medication',
  potty: 'Potty break',
  other: 'Care task',
}

/** Generates care tasks for every dog on a stay (a stay can share its dates
 *  and notes across up to 3 dogs from the same owner), each still built from
 *  that dog's own care schedule. */
export function generateTasksForStay(dogs: Dog | Dog[], stay: Stay): Task[] {
  const tasks: Task[] = []
  const start = new Date(stay.startDate)
  const end = new Date(stay.endDate)

  let taskIndex = 0

  for (const dog of Array.isArray(dogs) ? dogs : [dogs]) {
    // Walk through each day of the stay
    const current = new Date(start)
    current.setHours(0, 0, 0, 0)

    while (current <= end) {
      for (const entry of dog.careSchedule) {
        const [hours, minutes] = entry.time.split(':').map(Number)
        const scheduledTime = new Date(current)
        scheduledTime.setHours(hours, minutes, 0, 0)

        // Skip tasks before stay start or after stay end
        if (scheduledTime < start || scheduledTime > end) continue

        const title =
          entry.taskType === 'other'
            ? entry.customTitle?.trim() || TASK_TITLES.other
            : TASK_TITLES[entry.taskType] || 'Care task'

        tasks.push({
          id: `generated-${stay.id}-${taskIndex++}`,
          stayId: stay.id,
          dogId: dog.id,
          dogName: dog.name,
          type: entry.taskType,
          title,
          scheduledTime: scheduledTime.toISOString(),
          note: entry.note || undefined,
          status: 'pending',
        })
      }

      current.setDate(current.getDate() + 1)
    }
  }

  return tasks
}
