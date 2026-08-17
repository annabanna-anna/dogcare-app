// ─── Dog ────────────────────────────────────────────────────────────────────

export type DogSize = 'small' | 'medium' | 'large' | 'extra-large'

export interface CareScheduleEntry {
  time: string     // e.g. "08:00"
  taskType: TaskType
  note?: string
}

export interface Dog {
  id: string
  name: string
  breed: string
  size: DogSize
  ownerName: string
  ownerContact: string
  photoUrl?: string
  // Care instructions
  behaviorNotes: string
  foodNotes: string
  medicationNotes: string
  walkNotes: string
  emergencyNotes: string
  otherNotes: string
  // Regular daily schedule
  walkTimeFlexible: boolean
  careSchedule: CareScheduleEntry[]
  createdAt: string
  updatedAt: string
}

// ─── Stay ────────────────────────────────────────────────────────────────────

export interface Stay {
  id: string
  dogId: string
  startDate: string   // ISO date string
  endDate: string     // ISO date string
  notes?: string
  createdAt: string
}

// ─── Task ────────────────────────────────────────────────────────────────────

export type TaskType = 'walk' | 'meal' | 'medication' | 'potty' | 'other'

export type TaskStatus = 'pending' | 'done' | 'skipped' | 'overdue'

export interface Task {
  id: string
  stayId: string
  dogId: string
  dogName: string
  type: TaskType
  title: string
  scheduledTime: string   // ISO datetime string
  note?: string
  status: TaskStatus
  completedAt?: string
  // What this task was last pushed to Google as — lets a re-push update the
  // same event/task instead of creating a duplicate.
  googleExtId?: string
  googleExtKind?: 'event' | 'task'
}
