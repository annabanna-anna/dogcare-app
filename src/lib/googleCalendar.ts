import { supabase } from './supabase'
import { setTaskGoogleRef } from './tasks'
import type { Task, TaskType } from '../types'

// Google Calendar integration. Calendar API calls still happen directly from
// the browser, but the connection itself is server-backed: Google access
// tokens expire after 1 hour (fixed, not configurable), so the refresh token
// Google issues at connect time is stored server-side by the google-oauth
// Edge Function, which mints fresh access tokens on demand. The user
// connects once; access tokens are refreshed underneath them.
//
// Access tokens are still cached in localStorage — they're short-lived and
// re-mintable, so losing them costs one round-trip. The refresh token never
// reaches localStorage; it goes straight from the Supabase session to the
// Edge Function.
//
// Two directions:
// - Pull: calendar selection is fully automatic, not a user-facing setting —
//   if the connected account has a calendar whose name looks like Rover's own
//   calendar-sync feature, we use only that calendar and only its confirmed
//   bookings (Rover tags those "[B]", vs. "[U]" for a pending request). If no
//   such calendar exists, we fall back to the primary calendar, unfiltered.
// - Push: care tasks for a confirmed stay are written to a dedicated
//   "HeyPup" calendar (created on first push if it doesn't exist yet), kept
//   separate from the user's own events and from the Rover-synced one. Push
//   is opt-out (on by default once connected). Everything is pushed as a
//   timed Calendar event — an earlier per-type option to push as Google
//   Tasks to-dos was removed because the Tasks API can't carry a
//   time-of-day, only a due date. The Tasks scope and cleanup helpers are
//   kept so to-dos pushed before the removal still get deleted when their
//   task is re-pushed (converting it to an event) or discarded.
const TOKEN_KEY = 'heypup-google-calendar-token'
const CONNECTED_KEY = 'heypup-google-calendar-connected'
const REQUEST_MARKER = 'heypup-requesting-calendar-scope'
const ROVER_CACHE_KEY = 'heypup-google-calendar-rover-cache'
const PUSH_CALENDAR_CACHE_KEY = 'heypup-google-calendar-push-id'
const PUSH_TASKLIST_CACHE_KEY = 'heypup-google-tasklist-push-id'
const PUSH_ENABLED_KEY = 'heypup-google-calendar-push-enabled'
const PUSH_ERROR_KEY = 'heypup-google-calendar-push-error'
const PUSH_CALENDAR_NAME = 'HeyPup'

/** Fired whenever the connected flag changes, so a mounted Settings page can
 *  update itself — connecting finishes asynchronously (an Edge Function
 *  round-trip) after the OAuth redirect has already landed the page back on
 *  Settings, so a one-time mount read of localStorage can be stale. */
const CONNECTION_CHANGED_EVENT = 'heypup:google-connection-changed'
function notifyConnectionChanged(): void {
  window.dispatchEvent(new Event(CONNECTION_CHANGED_EVENT))
}

/** Subscribes to connection-state changes (connect, disconnect, or a
 *  server reconciliation via syncGoogleConnectionState). Returns an
 *  unsubscribe function for use in a useEffect cleanup. */
export function onGoogleConnectionChanged(handler: () => void): () => void {
  window.addEventListener(CONNECTION_CHANGED_EVENT, handler)
  return () => window.removeEventListener(CONNECTION_CHANGED_EVENT, handler)
}
const CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks'
// Refresh this long before the token actually expires, so a call that starts
// just under the wire doesn't land after it.
const EXPIRY_MARGIN_MS = 5 * 60 * 1000
const EVENT_DURATION_MS: Record<TaskType, number> = {
  walk: 30 * 60 * 1000,
  meal: 15 * 60 * 1000,
  medication: 15 * 60 * 1000,
  potty: 15 * 60 * 1000,
  other: 15 * 60 * 1000,
}

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
  status: string // Google's own event status: 'confirmed' | 'tentative' | 'cancelled'
}

interface GoogleCalendarListEntry {
  id: string
  summary: string
  primary: boolean
}

function readCachedToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredToken
    if (!parsed.accessToken || parsed.expiresAt - EXPIRY_MARGIN_MS < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

/** Whether Google Calendar is connected. Reflects whether a refresh token is
 *  stored server-side — NOT whether the current access token is still
 *  valid — so it stays true across the hourly expiry. Synchronous so it can
 *  be read during render; kept in step with the server by
 *  syncGoogleConnectionState(). */
export function isGoogleCalendarConnected(): boolean {
  return localStorage.getItem(CONNECTED_KEY) === '1'
}

/** Clears this device's cached Google state without touching the stored
 *  refresh token — used when a connection turns out to be dead, and as part
 *  of a full disconnect. */
function clearLocalGoogleState(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(CONNECTED_KEY)
  localStorage.removeItem(ROVER_CACHE_KEY)
  localStorage.removeItem(PUSH_CALENDAR_CACHE_KEY)
  localStorage.removeItem(PUSH_TASKLIST_CACHE_KEY)
  localStorage.removeItem(PUSH_ERROR_KEY)
}

/** Calls the google-oauth Edge Function with the current user's session. */
async function callOAuthFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('google-oauth', { body })
  if (error) throw error
  return data as T
}

/** Starts the OAuth round-trip requesting Calendar read/write access
 *  (full-page redirect). */
export async function connectGoogleCalendar(redirectPath = '/settings'): Promise<void> {
  localStorage.setItem(REQUEST_MARKER, '1')
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${redirectPath}`,
      scopes: CALENDAR_SCOPE,
      // access_type=offline is what makes Google issue a refresh token at
      // all, and prompt=consent forces it to issue a *fresh* one on every
      // reconnect (Google otherwise only returns a refresh token on the
      // very first consent, leaving a reconnect with nothing to store).
      // select_account forces Google's account chooser every time, even if
      // the browser only has one session — otherwise Google can silently
      // reuse whatever Google account is already active (e.g. the one used
      // to log into HeyPup), which may not be the one Rover is synced to.
      queryParams: { access_type: 'offline', prompt: 'consent select_account' },
    },
  })
  if (error) {
    localStorage.removeItem(REQUEST_MARKER)
    throw error
  }
}

/** Forgets the connection everywhere — this device's caches and the stored
 *  refresh token. Best-effort on the server side: local state is cleared
 *  regardless, so the UI never gets stuck "connected" if the call fails. */
export async function disconnectGoogleCalendar(): Promise<void> {
  clearLocalGoogleState()
  notifyConnectionChanged()
  try {
    await callOAuthFunction({ action: 'disconnect' })
  } catch {
    // Local state is already gone; a leftover server row is harmless and
    // gets overwritten by the next connect.
  }
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

/** Reason the most recent push attempt failed, if it did — pushes are
 *  fire-and-forget from the caller's side, so this is how a silent failure
 *  (e.g. the Tasks API not being enabled yet) becomes visible in Settings. */
export function getLastPushError(): string | null {
  return localStorage.getItem(PUSH_ERROR_KEY)
}

/** Called from App.tsx's auth-state listener on every session change. Only
 *  acts if the session came from connectGoogleCalendar() above — a plain
 *  "Continue with Google" login also carries a provider_token, but one that
 *  was never granted Calendar access, so it must not be treated as connected.
 *
 *  Supabase only surfaces provider_refresh_token on the initial sign-in, not
 *  on later session refreshes, so this is the one moment it can be captured. */
export async function captureGoogleConnectionIfRequested(
  providerToken: string | null | undefined,
  providerRefreshToken: string | null | undefined,
): Promise<void> {
  const requested = localStorage.getItem(REQUEST_MARKER) === '1'
  if (!requested) return
  localStorage.removeItem(REQUEST_MARKER)
  if (!providerToken) return

  if (providerRefreshToken) {
    // Hand the refresh token straight to the server; it's never persisted
    // in the browser.
    await callOAuthFunction({ action: 'store', refreshToken: providerRefreshToken })
    localStorage.setItem(CONNECTED_KEY, '1')
    notifyConnectionChanged()
  }
  // Google's access tokens are 1hr; cache the one we just got so the first
  // calls after connecting don't need a refresh round-trip.
  const stored: StoredToken = { accessToken: providerToken, expiresAt: Date.now() + 60 * 60 * 1000 }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
}

/** Reconciles this device's connected flag with the server. Lets a user who
 *  connected on one device (or cleared site data on this one) stay connected
 *  without redoing OAuth. Best-effort — leaves the flag alone if the check
 *  fails, so an offline start doesn't read as a disconnect. */
export async function syncGoogleConnectionState(): Promise<void> {
  const { data, error } = await supabase.rpc('has_google_credentials')
  if (error) return
  const wasConnected = isGoogleCalendarConnected()
  if (data === true) localStorage.setItem(CONNECTED_KEY, '1')
  else clearLocalGoogleState()
  if (isGoogleCalendarConnected() !== wasConnected) notifyConnectionChanged()
}

/** Returns a usable access token, minting a fresh one via the Edge Function
 *  when the cached one is missing or near expiry. */
async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = readCachedToken()
    if (cached) return cached.accessToken
  }
  if (!isGoogleCalendarConnected()) throw new Error('NOT_CONNECTED')

  let result: { accessToken: string; expiresIn: number }
  try {
    result = await callOAuthFunction<{ accessToken: string; expiresIn: number }>({
      action: 'refresh',
    })
  } catch (e) {
    // The function returns 401/404 when the refresh token is revoked or
    // absent — the connection is genuinely gone, so stop claiming otherwise
    // and let the UI offer a reconnect. Anything else (network, 502) is
    // transient: keep the connection and let the caller retry later.
    const status = (e as { context?: { status?: number } }).context?.status
    if (status === 401 || status === 404) {
      clearLocalGoogleState()
      throw new Error('EXPIRED')
    }
    throw new Error('Could not reach Google — check your connection and try again.')
  }

  const stored: StoredToken = {
    accessToken: result.accessToken,
    expiresAt: Date.now() + result.expiresIn * 1000,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
  return result.accessToken
}

/** Every Google API call goes through here: attaches a valid access token,
 *  and on a 401 mints a fresh one and retries once. That second chance
 *  covers tokens revoked or invalidated mid-flight, which the proactive
 *  expiry margin can't predict.
 *
 *  403 is deliberately NOT treated as an expiry — it means the call was
 *  understood and refused (Tasks API not enabled on the project,
 *  insufficient scope, rate limit), so retrying with a new token would
 *  fail identically. Callers surface it as a real error instead. */
async function googleFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const send = async (token: string) =>
    fetch(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    })

  const res = await send(await getAccessToken())
  if (res.status !== 401) return res
  return send(await getAccessToken(true))
}

async function listGoogleCalendars(): Promise<GoogleCalendarListEntry[]> {
  const res = await googleFetch('https://www.googleapis.com/calendar/v3/users/me/calendarList')
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
async function resolveTargetCalendar(): Promise<{ calendarId: string; isRover: boolean }> {
  const cached = getRoverCache()
  if (cached) {
    return cached.calendarId
      ? { calendarId: cached.calendarId, isRover: true }
      : { calendarId: 'primary', isRover: false }
  }
  let calendars: GoogleCalendarListEntry[]
  try {
    calendars = await listGoogleCalendars()
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
  if (!isGoogleCalendarConnected()) throw new Error('NOT_CONNECTED')

  const { calendarId, isRover } = await resolveTargetCalendar()

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
  })
  const res = await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
  )
  if (!res.ok) throw new Error('Could not load Google Calendar events.')

  const data = (await res.json()) as {
    items?: { id: string; summary?: string; status?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string }; htmlLink: string }[]
  }
  const events = (data.items ?? []).map((item) => ({
    id: item.id,
    title: item.summary || '(No title)',
    start: item.start?.dateTime ?? item.start?.date ?? '',
    end: item.end?.dateTime ?? item.end?.date ?? '',
    allDay: !item.start?.dateTime,
    htmlLink: item.htmlLink,
    status: item.status ?? 'confirmed',
  }))
  // Rover marks a pending request as a 'tentative' Google Calendar event and
  // an accepted booking as 'confirmed' — that status field is Google's own,
  // set directly by Rover's sync, so it's the primary signal. The title
  // check is a fallback for events whose status doesn't come through as
  // expected: real Rover titles look like "Boarding: Dog / Owner" (no
  // bracket tag in practice, despite the older "[B]" assumption).
  return isRover
    ? events.filter((e) => e.status === 'confirmed' || /boarding|\[b\]/i.test(e.title))
    : events
}

/** Parses Rover's "Boarding: Dog Name / Owner Name" event-title convention
 *  (also accepts an older assumed "[TAG] Dog Name / Owner Name" form, in
 *  case some events still carry it). Returns null for titles that don't
 *  match — callers should just skip those. */
export function parseRoverStyleTitle(title: string): { dogName: string; ownerName: string } | null {
  const withoutTag = title.replace(/^(\[[^\]]*\]|[^:/]+:)\s*/, '')
  const parts = withoutTag.split('/').map((p) => p.trim())
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return { dogName: parts[0], ownerName: parts[1] }
}

/** Finds (or creates, on first push) the dedicated "HeyPup" calendar that
 *  pushed care tasks are written to — kept separate from the user's own
 *  events and from the Rover-synced calendar used for pulling. */
async function resolveHeyPupCalendarId(): Promise<string> {
  const cached = localStorage.getItem(PUSH_CALENDAR_CACHE_KEY)
  if (cached) {
    // Verify it still exists — the user may have deleted the calendar
    // itself, not just its events, which would otherwise silently fail
    // every push using this stale id.
    const check = await googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cached)}`,
    )
    if (check.ok) return cached
    localStorage.removeItem(PUSH_CALENDAR_CACHE_KEY)
  }

  const calendars = await listGoogleCalendars()
  const existing = calendars.find((c) => c.summary.toLowerCase() === PUSH_CALENDAR_NAME.toLowerCase())
  if (existing) {
    localStorage.setItem(PUSH_CALENDAR_CACHE_KEY, existing.id)
    return existing.id
  }

  const res = await googleFetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: PUSH_CALENDAR_NAME, description: 'Care tasks from HeyPup.' }),
  })
  if (!res.ok) throw new Error('Could not create the HeyPup calendar.')
  const created = (await res.json()) as { id: string }
  localStorage.setItem(PUSH_CALENDAR_CACHE_KEY, created.id)
  return created.id
}

/** Finds the dedicated "HeyPup" Google Tasks list — only used to clean up
 *  to-dos pushed back when the per-type Tasks format still existed. Never
 *  creates new to-dos anymore. */
async function resolveHeyPupTaskListId(): Promise<string> {
  const cached = localStorage.getItem(PUSH_TASKLIST_CACHE_KEY)
  if (cached) {
    // Same self-healing check as the calendar side — the user may have
    // deleted the whole "HeyPup" list, not just the tasks inside it.
    const check = await googleFetch(
      `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${encodeURIComponent(cached)}`,
    )
    if (check.ok) return cached
    localStorage.removeItem(PUSH_TASKLIST_CACHE_KEY)
  }

  const res = await googleFetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists')
  if (!res.ok) throw new Error('Could not load your Google Task lists.')
  const data = (await res.json()) as { items?: { id: string; title?: string }[] }
  const existing = (data.items ?? []).find(
    (list) => (list.title ?? '').toLowerCase() === PUSH_CALENDAR_NAME.toLowerCase(),
  )
  if (existing) {
    localStorage.setItem(PUSH_TASKLIST_CACHE_KEY, existing.id)
    return existing.id
  }

  const createRes = await googleFetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: PUSH_CALENDAR_NAME }),
  })
  if (!createRes.ok) throw new Error('Could not create the HeyPup task list.')
  const created = (await createRes.json()) as { id: string }
  localStorage.setItem(PUSH_TASKLIST_CACHE_KEY, created.id)
  return created.id
}

async function deleteCalendarEventBestEffort(calendarId: string, eventId: string): Promise<void> {
  try {
    await googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
    )
  } catch {
    // best-effort cleanup only — a stale leftover event isn't worth failing over
  }
}

async function deleteGoogleTaskBestEffort(tasklistId: string, taskId: string): Promise<void> {
  try {
    await googleFetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(tasklistId)}/tasks/${encodeURIComponent(taskId)}`,
      { method: 'DELETE' },
    )
  } catch {
    // best-effort cleanup only
  }
}

/** Creates or updates the Calendar event for a task — if it was already
 *  pushed as an event, PATCHes that same event instead of creating a new
 *  one (falls back to creating fresh if it's since been deleted in Google).
 *  Returns the event id to persist back onto the task row. */
async function upsertCalendarEvent(calendarId: string, task: Task): Promise<string> {
  const start = new Date(task.scheduledTime)
  const end = new Date(start.getTime() + EVENT_DURATION_MS[task.type])
  const body = JSON.stringify({
    summary: `${task.title} — ${task.dogName}`,
    description: task.note || undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  })
  const headers = { 'Content-Type': 'application/json' }

  if (task.googleExtId && task.googleExtKind === 'event') {
    const res = await googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(task.googleExtId)}`,
      { method: 'PATCH', headers, body },
    )
    if (res.ok) return ((await res.json()) as { id: string }).id
    if (res.status !== 404) throw new Error('Could not push tasks to Google Calendar.')
    // 404 — the event was deleted on Google's side since; fall through and recreate it.
  } else if (task.googleExtId && task.googleExtKind === 'task') {
    // Legacy: this task was pushed as a Google Tasks to-do before the Tasks
    // format was removed — clean it up so it isn't left behind alongside
    // the event we're about to create.
    const tasklistId = await resolveHeyPupTaskListId().catch(() => null)
    if (tasklistId) await deleteGoogleTaskBestEffort(tasklistId, task.googleExtId)
  }

  const res = await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: 'POST', headers, body },
  )
  if (!res.ok) throw new Error('Could not push tasks to Google Calendar.')
  return ((await res.json()) as { id: string }).id
}

/** Best-effort cleanup for tasks about to be discarded (e.g. a stay being
 *  regenerated with a new date range) — removes whatever they were last
 *  pushed as, so regenerating doesn't leave orphaned duplicates behind in
 *  Google Calendar/Tasks. Silently does nothing if not connected. */
export async function deletePushedTasksFromGoogle(tasks: Task[]): Promise<void> {
  if (!isGoogleCalendarConnected()) return
  const pushed = tasks.filter((t) => t.googleExtId && t.googleExtKind)
  if (pushed.length === 0) return

  const eventIds = pushed.filter((t) => t.googleExtKind === 'event')
  const taskIds = pushed.filter((t) => t.googleExtKind === 'task')

  if (eventIds.length > 0) {
    const calendarId = await resolveHeyPupCalendarId().catch(() => null)
    if (calendarId) {
      for (const t of eventIds) {
        await deleteCalendarEventBestEffort(calendarId, t.googleExtId!)
      }
    }
  }
  if (taskIds.length > 0) {
    const tasklistId = await resolveHeyPupTaskListId().catch(() => null)
    if (tasklistId) {
      for (const t of taskIds) {
        await deleteGoogleTaskBestEffort(tasklistId, t.googleExtId!)
      }
    }
  }
}

/** Pushes a stay's care tasks to the HeyPup calendar as timed events.
 *  Tasks that were already pushed get updated in place rather than
 *  duplicated, tracked via each task's stored googleExtId/googleExtKind —
 *  including legacy ones pushed as Google Tasks to-dos, which get converted
 *  to events (and the stale to-do deleted). A no-op if push is turned off.
 *  Fire-and-forget from the caller's perspective — best-effort, doesn't
 *  block or roll back stay creation if it fails. */
export async function pushTasksToGoogleCalendar(tasks: Task[]): Promise<void> {
  if (!isPushEnabled()) return
  if (!isGoogleCalendarConnected()) throw new Error('NOT_CONNECTED')

  try {
    if (tasks.length > 0) {
      const calendarId = await resolveHeyPupCalendarId()
      for (const task of tasks) {
        const id = await upsertCalendarEvent(calendarId, task)
        await setTaskGoogleRef(task.id, 'event', id)
      }
    }
    localStorage.removeItem(PUSH_ERROR_KEY)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not push tasks to Google.'
    localStorage.setItem(
      PUSH_ERROR_KEY,
      message === 'EXPIRED'
        ? 'Google access was revoked — reconnect to retry.'
        : message === 'NOT_CONNECTED'
          ? 'Google Calendar isn’t connected.'
          : message,
    )
    throw e
  }
}
