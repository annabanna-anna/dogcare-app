import type { Dog, Stay, Task, TaskType } from '../types'
import { scheduleEntryDogName, stayDisplayName, stayingDogs } from './dogDisplay'
import { atTime, dayPartInfo, walkCoversTime } from './outingClock'

const TASK_TITLES: Record<TaskType, string> = {
  walk: 'Walk',
  meal: 'Meal',
  medication: 'Medication',
  potty: 'Potty break',
  other: 'Care task',
}

export function generateTasksForStay(dog: Dog, stay: Stay): Task[] {
  const tasks: Task[] = []
  const start = new Date(stay.startDate)
  const end = new Date(stay.endDate)

  // Walk through each day of the stay
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)

  let taskIndex = 0

  // Entries limited to a dog who isn't on this stay are left out entirely
  const staying = new Set(stayingDogs(dog, stay.dogKeys).map((d) => d.key))
  // With a going-out rule, set-time walk entries only count when the long
  // walks are planned at set times.
  const rule = dog.outingRule
  const schedule = dog.careSchedule.filter(
    (entry) =>
      (!entry.forDog || staying.has(entry.forDog)) &&
      !(entry.taskType === 'walk' && rule && rule.longWalks !== 'set-times'),
  )
  const stayDogName = stayDisplayName(dog, stay.dogKeys)
  const setWalkTimes = schedule.filter((e) => e.taskType === 'walk').map((e) => e.time)

  while (current <= end) {
    for (const entry of schedule) {
      const [hours, minutes] = entry.time.split(':').map(Number)
      const scheduledTime = new Date(current)
      scheduledTime.setHours(hours, minutes, 0, 0)

      // Skip tasks before stay start or after stay end
      if (scheduledTime < start || scheduledTime > end) continue

      const title = entry.customTitle?.trim() || TASK_TITLES[entry.taskType] || 'Care task'

      tasks.push({
        id: `generated-${stay.id}-${taskIndex++}`,
        stayId: stay.id,
        dogId: dog.id,
        dogName: scheduleEntryDogName(dog, entry.forDog) ?? stayDogName,
        type: entry.taskType,
        title,
        scheduledTime: scheduledTime.toISOString(),
        note: entry.note || undefined,
        status: 'pending',
      })
    }

    if (rule) {
      // Long walks planned for a part of the day sit at the window's start;
      // Today labels them by the window instead of a clock time.
      const outings = [
        ...(rule.longWalks === 'time-of-day'
          ? rule.dayPartWalks.map((w) => {
              const part = dayPartInfo(w.dayPart)
              // A window still open at drop-off counts from drop-off.
              const opens = atTime(current, part.start)
              const closes = atTime(current, part.end)
              return {
                type: 'walk' as const,
                title: `${part.label} walk`,
                at: opens < start && closes > start ? new Date(start) : opens,
                note: [`Around ${part.range}`, w.note?.trim()].filter(Boolean).join(' · '),
                dayPart: w.dayPart,
              }
            })
          : []),
        // The day's bookends are potty breaks, unless a set walk sits right
        // there — then that walk is the first / last time out.
        ...(walkCoversTime(rule.wakeTime, setWalkTimes)
          ? []
          : [{ type: 'potty' as const, title: 'Morning potty', at: atTime(current, rule.wakeTime), note: '', dayPart: undefined }]),
        ...(walkCoversTime(rule.bedtime, setWalkTimes)
          ? []
          : [{ type: 'potty' as const, title: 'Before bed', at: atTime(current, rule.bedtime), note: '', dayPart: undefined }]),
      ]
      for (const o of outings) {
        if (o.at < start || o.at > end) continue
        tasks.push({
          id: `generated-${stay.id}-${taskIndex++}`,
          stayId: stay.id,
          dogId: dog.id,
          dogName: stayDogName,
          type: o.type,
          title: o.title,
          scheduledTime: o.at.toISOString(),
          note: o.note || undefined,
          status: 'pending',
          dayPart: o.dayPart,
        })
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return tasks
}
