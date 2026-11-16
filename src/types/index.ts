// ─── Dog ────────────────────────────────────────────────────────────────────

export type DogSize = 'small' | 'medium' | 'large' | 'extra-large'

export type YesNoUnsure = 'yes' | 'no' | 'unsure'

export interface CareScheduleEntry {
  time: string     // e.g. "08:00"
  taskType: TaskType
  note?: string
  customTitle?: string   // short task title, e.g. "Nail trim" or a medicine's name; required when taskType is 'other'
  forDog?: string        // one dog's key (PRIMARY_DOG_KEY or a group member's id); unset = every dog on the profile
}

/** Rough parts of the day a long walk can be planned for instead of a set time. */
export type DayPart = 'morning' | 'midday' | 'afternoon' | 'evening'

export interface DayPartWalk {
  dayPart: DayPart
  note?: string
}

/** How the long walks are planned: at set times (walk entries in the care
 *  schedule), by rough time of day (dayPartWalks), or not yet known. */
export type LongWalkTiming = 'set-times' | 'time-of-day' | 'unsure'

/** "Going out": the dog needs to be out at least every everyHours. Long
 *  walks and potty breaks both reset that clock; potty breaks fill the gaps
 *  between long walks, plus one before bed. Null on a dog = no clock, set
 *  times only. */
export interface OutingRule {
  everyHours: number
  bedtime: string              // last time out before bed, e.g. "22:00"
  askWhenItHappened: boolean   // logging a walk/potty break asks for the real time
  longWalks: LongWalkTiming
  dayPartWalks: DayPartWalk[]  // used when longWalks is 'time-of-day'
}

/** Key the profile's own (first) dog uses in CareScheduleEntry.forDog. */
export const PRIMARY_DOG_KEY = 'primary'

/** Care instructions kept per dog — each dog in a group has its own. */
export interface DogCareNotes {
  behaviorNotes: string
  foodNotes: string
  medicationNotes: string
  walkNotes: string
  emergencyNotes: string
  otherNotes: string
  hasAllergies: YesNoUnsure
  allergyNotes: string   // which allergen(s) — optional detail when hasAllergies is 'yes' or 'no'
  goesToDogParks: YesNoUnsure
  dogParkNotes: string   // optional detail (e.g. fenced parks only) when goesToDogParks is 'yes' or 'no'
}

/** A second or third dog sharing this profile's owner, stays, and daily
 *  schedule, with its own photo and care instructions. */
export interface DogGroupMember extends DogCareNotes {
  id: string
  name: string
  breed: string
  size: DogSize
  photoUrl?: string
}

export interface Dog extends DogCareNotes {
  id: string
  name: string
  breed: string
  size: DogSize
  additionalDogs: DogGroupMember[]   // 0–2 more dogs sharing this profile
  ownerName: string
  ownerContact: string
  photoUrl?: string
  // Regular daily schedule
  walkTimeFlexible: boolean
  careSchedule: CareScheduleEntry[]
  outingRule: OutingRule | null
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
  dogKeys?: string[]  // which dogs on the profile are staying (PRIMARY_DOG_KEY or member ids); unset = every dog
  lastOutAt?: string  // "when was the dog last out?" answered on Today — starts the going-out clock
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
  dayPart?: DayPart       // a long walk planned for a part of the day, not a set time
  // What this task was last pushed to Google as — lets a re-push update the
  // same event/task instead of creating a duplicate.
  googleExtId?: string
  googleExtKind?: 'event' | 'task'
}
