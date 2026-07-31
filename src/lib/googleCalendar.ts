import { supabase } from './supabase'
import { setTaskGoogleRef } from './tasks'
import type { Task, TaskType } from '../types'

// This is a fully client-side integration: it asks Google for calendar
// read/write access on top of normal sign-in, stores the resulting access
// token in localStorage, and calls the Calendar API directly from the
// browser. No server component (no refresh-token storage, no client secret
// on the client) — when the ~1hr access token expires, the user just
// reconnects.
//
// Two directions:
// - Pull: calendar selection is fully automatic, not a user-facing setting —
//   if the connected account has a calendar whose name looks like Rover's own
//   calendar-sync feature, we use only that calendar and only its confirmed
//   bookings (Rover tags those "[B]", vs. "[U]" for a pending request). If no
//   such calendar exists, we fall back to the primary calendar, unfiltered.
// - Push: care tasks for a confirmed stay are written to a dedicated
//   "GoodPup" calendar (created on first push if it doesn't exist yet), kept
//   separate from the user's own events and from the Rover-synced one. Push
//   is opt-out (on by default once connected) and, per task type, can go to
//   Calendar as a timed event or to Google Tasks as a checkable to-do —
//   Google's own "Tasks" product (visible in Google Calendar's sidebar and
//   the Google Tasks app), not Apple's Reminders app, which Google doesn't
//   expose an API to sync into directly.
const TOKEN_KEY = 'goodpup-google-calendar-token'
const REQUEST_MARKER = 'goodpup-requesting-calendar-scope'
const ROVER_CACHE_KEY = 'goodpup-google-calendar-rover-cache'
const PUSH_CALENDAR_CACHE_KEY = 'goodpup-google-calendar-push-id'
const PUSH_TASKLIST_CACHE_KEY = 'goodpup-google-tasklist-push-id'
const PUSH_ENABLED_KEY = 'goodpup-google-calendar-push-enabled'
const PUSH_FORMAT_KEY = 'goodpup-google-calendar-push-format'
const PUSH_ERROR_KEY = 'goodpup-google-calendar-push-error'
const PUSH_CALENDAR_NAME = 'GoodPup'
const CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks'
const ROVER_BOOKED_TAG = '[b]'
const EVENT_DURATION_MS: Record<TaskType, number> = {
  walk: 30 * 60 * 1000,
  meal: 15 * 60 * 1000,
  medication: 15 * 60 * 1000,
  potty: 15 * 60 * 1000,
  other: 15 * 60 * 1000,
}

export type PushFormat = 'event' | 'task'

interface StoredToken {
  accessToken: string
  expiresAt: number // epoch ms
}

interface RoverCache {
  calendarId: string | null // detected Rover calendar id, or null if none found
}

export interface GoogleCalendarEvent {
  id: string
  title: string
  start: string // ISO datetime, or a bare date for all-day events
  end: string
  allDay: boolean
  htmlLink: string
}

interface GoogleCalendarListEntry {
  id: string
  summary: string
  primary: boolean
}

function readToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredToken
    if (!parsed.accessToken || parsed.expiresAt < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export function isGoogleCalendarConnected(): boolean {
  return readToken() !== null
}

/** Starts the OAuth round-trip requesting Calendar read access (full-page redirect). */
export async function connectGoogleCalendar(redirectPath = '/settings'): Promise<void> {
  localStorage.setItem(REQUEST_MARKER, '1')
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${redirectPath}`,
      scopes: CALENDAR_SCOPE,
      // select_account forces Google's account chooser every time, even if
      // the browser only has one session — otherwise Google can silently
      // reuse whatever Google account is already active (e.g. the one used
      // to log into GoodPup), which may not be the one Rover is synced to.
      queryParams: { access_type: 'offline', prompt: 'consent select_account' },
    },
  })
  if (error) {
    localStorage.removeItem(REQUEST_MARKER)
    throw error
  }
}

export function disconnectGoogleCalendar(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROVER_CACHE_KEY)
  localStorage.removeItem(PUSH_CALENDAR_CACHE_KEY)
  localStorage.removeItem(PUSH_TASKLIST_CACHE_KEY)
  localStorage.removeItem(PUSH_ERROR_KEY)
}

/** Whether pushing tasks to Google Calendar is turned on at all — separate
 *  from being connected. Defaults to on once connected, matching the
 *  behavior before this was made configurable. */
export function isPushEnabled(): boolean {
  return localStorage.getItem(PUSH_ENABLED_KEY) !== '0'
}

export function setPushEnabled(enabled: boolean): void {
  localStorage.setItem(PUSH_ENABLED_KEY, enabled ? '1' : '0')
}

const defaultPushFormats: Record<TaskType, PushFormat> = {
  walk: 'event',
  meal: 'event',
  medication: 'event',
  potty: 'event',
  other: 'event',
}

function readPushFormats(): Record<TaskType, PushFormat> {
  const raw = localStorage.getItem(PUSH_FORMAT_KEY)
  if (!raw) return { ...defaultPushFormats }
  try {
    return { ...defaultPushFormats, ...(JSON.parse(raw) as Partial<Record<TaskType, PushFormat>>) }
  } catch {
    return { ...defaultPushFormats }
  }
}

/** How each task type should be pushed — as a timed Calendar event, or as a
 *  checkable Google Task. Defaults to "event" for every type. */
export function getPushFormats(): Record<TaskType, PushFormat> {
  return readPushFormats()
}

export function setPushFormat(type: TaskType, format: PushFormat): void {
  const next = { ...readPushFormats(), [type]: format }
  localStorage.setItem(PUSH_FORMAT_KEY, JSON.stringify(next))
}

/** Reason the most recent push attempt failed, if it did — pushes are
 *  fire-and-forget from the caller's side, so this is how a silent failure
 *  (e.g. the Tasks API not being enabled yet) becomes visible in Settings. */
export function getLastPushError(): string | null {
  return localStorage.getItem(PUSH_ERROR_KEY)
}

/** Called from App.tsx's auth-state listener on every session change. Only
 *  stores the token if it came from connectGoogleCalendar() above — a plain
 *  "Continue with Google" login also carries a provider_token, but one that
 *  was never granted Calendar access, so it must not be treated as connected. */
export function captureProviderTokenIfRequested(providerToken: string | null | undefined): void {
  const requested = localStorage.getItem(REQUEST_MARKER) === '1'
  if (!requested) return
  localStorage.removeItem(REQUEST_MARKER)
  if (!providerToken) return
  const stored: StoredToken = { accessToken: providerToken, expiresAt: Date.now() + 55 * 60 * 1000 }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
}

async function listGoogleCalendars(accessToken: string): Promise<GoogleCalendarListEntry[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401) {
    disconnectGoogleCalendar()
    throw new Error('EXPIRED')
  }
  if (!res.ok) throw new Error('Could not load your Google calendars.')
  const data = (await res.json()) as {
    items?: { id: string; summary?: string; primary?: boolean }[]
  }
  return (data.items ?? []).map((item) => ({
    id: item.id,
    summary: item.summary || item.id,
    primary: item.primary ?? false,
  }))
}

function getRoverCache(): RoverCache | null {
  const raw = localStorage.getItem(ROVER_CACHE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as RoverCache
  } catch {
    return null
  }
}

/** Best-effort, synchronous: true once a Rover calendar has been detected
 *  and cached. False before the first fetch, or if none was found. */
export function isUsingRoverCalendar(): boolean {
  return !!getRoverCache()?.calendarId
}

/** Resolves (and caches) which calendar to actually pull events from:
 *  a detected Rover calendar, or "primary" if none exists. */
async function resolveTargetCalendar(
  accessToken: string,
): Promise<{ calendarId: string; isRover: boolean }> {
  const cached = getRoverCache()
  if (cached) {
    return cached.calendarId
      ? { calendarId: cached.calendarId, isRover: true }
      : { calendarId: 'primary', isRover: false }
  }
  let calendars: GoogleCalendarListEntry[]
  try {
    calendars = await listGoogleCalendars(accessToken)
  } catch {
    return { calendarId: 'primary', isRover: false } // don't cache — retry next time
  }
  const rover = calendars.find((c) => c.summary.toLowerCase().includes('rover'))
  const calendarId = rover ? (rover.primary ? 'primary' : rover.id) : null
  localStorage.setItem(ROVER_CACHE_KEY, JSON.stringify({ calendarId } satisfies RoverCache))
  return calendarId ? { calendarId, isRover: true } : { calendarId: 'primary', isRover: false }
}

/** Pulls upcoming events from the resolved calendar (Rover's, if found —
 *  filtered to confirmed bookings only — otherwise primary, unfiltered). */
export async function listUpcomingGoogleEvents(maxResults = 10): Promise<GoogleCalendarEvent[]> {
  const token = readToken()
  if (!token) throw new Error('NOT_CONNECTED')

  const { calendarId, isRover } = await resolveTargetCalendar(token.accessToken)

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
  })
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } },
  )
  if (res.status === 401) {
    disconnectGoogleCalendar()
    throw new Error('EXPIRED')
  }
  if (!res.ok) throw new Error('Could not load Google Calendar events.')

  const data = (await res.json()) as {
    items?: { id: string; summary?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string }; htmlLink: string }[]
  }
  const events = (data.items ?? []).map((item) => ({
    id: item.id,
    title: item.summary || '(No title)',
    start: item.start?.dateTime ?? item.start?.date ?? '',
    end: item.end?.dateTime ?? item.end?.date ?? '',
    allDay: !item.start?.dateTime,
    htmlLink: item.htmlLink,
  }))
  return isRover ? events.filter((e) => e.title.toLowerCase().includes(ROVER_BOOKED_TAG)) : events
}

/** Parses Rover's "[TAG] Dog Name / Owner Name" event-title convention.
 *  Returns null for titles that don't match — callers should just skip those. */
export function parseRoverStyleTitle(title: string): { dogName: string; ownerName: string } | null {
  const withoutTag = title.replace(/^\[[^\]]*\]\s*/, '')
  const parts = withoutTag.split('/').map((p) => p.trim())
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return { dogName: parts[0], ownerName: parts[1] }
}

/** Finds (or creates, on first push) the dedicated "GoodPup" calendar that
 *  pushed care tasks are written to — kept separate from the user's own
 *  events and from the Rover-synced calendar used for pulling. */
async function resolveGoodPupCalendarId(accessToken: string): Promise<string> {
  const cached = localStorage.getItem(PUSH_CALENDAR_CACHE_KEY)
  if (cached) return cached

  const calendars = await listGoogleCalendars(accessToken)
  const existing = calendars.find((c) => c.summary.toLowerCase() === PUSH_CALENDAR_NAME.toLowerCase())
  if (existing) {
    localStorage.setItem(PUSH_CALENDAR_CACHE_KEY, existing.id)
    return existing.id
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ summary: PUSH_CALENDAR_NAME, description: 'Care tasks from GoodPup.' }),
  })
  if (res.status === 401 || res.status === 403) {
    disconnectGoogleCalendar()
    throw new Error('EXPIRED')
  }
  if (!res.ok) throw new Error('Could not create the GoodPup calendar.')
  const created = (await res.json()) as { id: string }
  localStorage.setItem(PUSH_CALENDAR_CACHE_KEY, created.id)
  return created.id
}

/** Finds (or creates, on first push) the dedicated "GoodPup" Google Tasks
 *  list that tasks pushed as to-dos (rather than calendar events) go into. */
async function resolveGoodPupTaskListId(accessToken: string): Promise<string> {
  const cached = localStorage.getItem(PUSH_TASKLIST_CACHE_KEY)
  if (cached) return cached

  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401 || res.status === 403) {
    disconnectGoogleCalendar()
    throw new Error('EXPIRED')
  }
  if (!res.ok) throw new Error('Could not load your Google Task lists.')
  const data = (await res.json()) as { items?: { id: string; title?: string }[] }
  const existing = (data.items ?? []).find(
    (list) => (list.title ?? '').toLowerCase() === PUSH_CALENDAR_NAME.toLowerCase(),
  )
  if (existing) {
    localStorage.setItem(PUSH_TASKLIST_CACHE_KEY, existing.id)
    return existing.id
  }

  const createRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: PUSH_CALENDAR_NAME }),
  })
  if (createRes.status === 401 || createRes.status === 403) {
    disconnectGoogleCalendar()
    throw new Error('EXPIRED')
  }
  if (!createRes.ok) throw new Error('Could not create the GoodPup task list.')
  const created = (await createRes.json()) as { id: string }
  localStorage.setItem(PUSH_TASKLIST_CACHE_KEY, created.id)
  return created.id
}

async function deleteCalendarEventBestEffort(
  calendarId: string,
  accessToken: string,
  eventId: string,
): Promise<void> {
  try {
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    )
  } catch {
    // best-effort cleanup only — a stale leftover event isn't worth failing over
  }
}

async function deleteGoogleTaskBestEffort(
  tasklistId: string,
  accessToken: string,
  taskId: string,
): Promise<void> {
  try {
    await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(taskId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    )
  } catch {
    // best-effort cleanup only
  }
}

/** Creates or updates the Calendar event for a task — if it was already
 *  pushed as an event, PATCHes that same event instead of creating a new
 *  one (falls back to creating fresh if it's since been deleted in Google).
 *  Returns the event id to persist back onto the task row. */
async function upsertCalendarEvent(calendarId: string, accessToken: string, task: Task): Promise<string> {
  const start = new Date(task.scheduledTime)
  const end = new Date(start.getTime() + EVENT_DURATION_MS[task.type])
  const body = JSON.stringify({
    summary: `${task.title} — ${task.dogName}`,
    description: task.note || undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  })
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

  if (task.googleExtId && task.googleExtKind === 'event') {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(task.googleExtId)}`,
      { method: 'PATCH', headers, body },
    )
    if (res.status === 401 || res.status === 403) {
      disconnectGoogleCalendar()
      throw new Error('EXPIRED')
    }
    if (res.ok) return ((await res.json()) as { id: string }).id
    if (res.status !== 404) throw new Error('Could not push tasks to Google Calendar.')
    // 404 — the event was deleted on Google's side since; fall through and recreate it.
  } else if (task.googleExtId && task.googleExtKind === 'task') {
    // Switched from Task to Event format — clean up the stale Google Task.
    const tasklistId = await resolveGoodPupTaskListId(accessToken)
    await deleteGoogleTaskBestEffort(tasklistId, accessToken, task.googleExtId)
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: 'POST', headers, body },
  )
  if (res.status === 401 || res.status === 403) {
    disconnectGoogleCalendar()
    throw new Error('EXPIRED')
  }
  if (!res.ok) throw new Error('Could not push tasks to Google Calendar.')
  return ((await res.json()) as { id: string }).id
}

/** Same idea as upsertCalendarEvent, for the Google Tasks side. */
async function upsertGoogleTask(tasklistId: string, accessToken: string, task: Task): Promise<string> {
  const scheduledTime = new Date(task.scheduledTime)
  // Google Tasks' `due` field only carries a date, not a time-of-day — it's
  // discarded by Google's own apps no matter what we send. Putting the time
  // in the title is the only way it actually shows up anywhere.
  const time = scheduledTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const body = JSON.stringify({
    title: `${time} — ${task.title} — ${task.dogName}`,
    notes: task.note || undefined,
    due: scheduledTime.toISOString(),
  })
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }

  if (task.googleExtId && task.googleExtKind === 'task') {
    const res = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(task.googleExtId)}`,
      { method: 'PATCH', headers, body },
    )
    if (res.status === 401 || res.status === 403) {
      disconnectGoogleCalendar()
      throw new Error('EXPIRED')
    }
    if (res.ok) return ((await res.json()) as { id: string }).id
    if (res.status !== 404) throw new Error('Could not push tasks to Google Tasks.')
    // 404 — the task was deleted/completed-and-cleared on Google's side; recreate it.
  } else if (task.googleExtId && task.googleExtKind === 'event') {
    // Switched from Event to Task format — clean up the stale Calendar event.
    const calendarId = await resolveGoodPupCalendarId(accessToken)
    await deleteCalendarEventBestEffort(calendarId, accessToken, task.googleExtId)
  }

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks`,
    { method: 'POST', headers, body },
  )
  if (res.status === 401 || res.status === 403) {
    disconnectGoogleCalendar()
    throw new Error('EXPIRED')
  }
  if (!res.ok) throw new Error('Could not push tasks to Google Tasks.')
  return ((await res.json()) as { id: string }).id
}

/** Best-effort cleanup for tasks about to be discarded (e.g. a stay being
 *  regenerated with a new date range) — removes whatever they were last
 *  pushed as, so regenerating doesn't leave orphaned duplicates behind in
 *  Google Calendar/Tasks. Silently does nothing if not connected. */
export async function deletePushedTasksFromGoogle(tasks: Task[]): Promise<void> {
  const token = readToken()
  if (!token) return
  const pushed = tasks.filter((t) => t.googleExtId && t.googleExtKind)
  if (pushed.length === 0) return

  const eventIds = pushed.filter((t) => t.googleExtKind === 'event')
  const taskIds = pushed.filter((t) => t.googleExtKind === 'task')

  if (eventIds.length > 0) {
    const calendarId = await resolveGoodPupCalendarId(token.accessToken).catch(() => null)
    if (calendarId) {
      for (const t of eventIds) {
        await deleteCalendarEventBestEffort(calendarId, token.accessToken, t.googleExtId!)
      }
    }
  }
  if (taskIds.length > 0) {
    const tasklistId = await resolveGoodPupTaskListId(token.accessToken).catch(() => null)
    if (tasklistId) {
      for (const t of taskIds) {
        await deleteGoogleTaskBestEffort(tasklistId, token.accessToken, t.googleExtId!)
      }
    }
  }
}

/** Pushes a stay's care tasks to Google — each task type goes to the
 *  GoodPup calendar (as a timed event) or the GoodPup Google Tasks list (as
 *  a checkable to-do) depending on the user's per-type preference. Tasks
 *  that were already pushed get updated in place rather than duplicated,
 *  tracked via each task's stored googleExtId/googleExtKind. A no-op if
 *  push is turned off. Fire-and-forget from the caller's perspective —
 *  best-effort, doesn't block or roll back stay creation if it fails. */
export async function pushTasksToGoogleCalendar(tasks: Task[]): Promise<void> {
  if (!isPushEnabled()) return
  const token = readToken()
  if (!token) throw new Error('NOT_CONNECTED')

  try {
    const formats = getPushFormats()
    const eventTasks = tasks.filter((t) => formats[t.type] !== 'task')
    const todoTasks = tasks.filter((t) => formats[t.type] === 'task')

    if (eventTasks.length > 0) {
      const calendarId = await resolveGoodPupCalendarId(token.accessToken)
      for (const task of eventTasks) {
        const id = await upsertCalendarEvent(calendarId, token.accessToken, task)
        await setTaskGoogleRef(task.id, 'event', id)
      }
    }
    if (todoTasks.length > 0) {
      const tasklistId = await resolveGoodPupTaskListId(token.accessToken)
      for (const task of todoTasks) {
        const id = await upsertGoogleTask(tasklistId, token.accessToken, task)
        await setTaskGoogleRef(task.id, 'task', id)
      }
    }
    localStorage.removeItem(PUSH_ERROR_KEY)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not push tasks to Google.'
    localStorage.setItem(
      PUSH_ERROR_KEY,
      message === 'EXPIRED' ? 'Your Google Calendar connection expired — reconnect to retry.' : message,
    )
    throw e
  }
}
