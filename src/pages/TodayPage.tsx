import { useState, useMemo, useEffect, useRef, type PointerEvent } from 'react'
import { CalendarPlus, Clock, UserPlus, CalendarDays, CalendarCheck2, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import TaskCard from '../components/TaskCard'
import LogTimeSheet from '../components/LogTimeSheet'
import LastOutSheet from '../components/LastOutSheet'
import LastOutPrompt from '../components/LastOutPrompt'
import EditTimeSheet from '../components/EditTimeSheet'
import { createTasks, deleteTasksByIds, getLastOuting, listTasksBetween, updateTaskStatus, updateTaskTimes, type TaskTimeChange } from '../lib/tasks'
import { pushTasksToGoogleCalendar } from '../lib/googleCalendar'
import { listStays, setStayLastOut } from '../lib/stays'
import { listDogs } from '../lib/dogs'
import {
  isGoogleCalendarConnected,
  listUpcomingGoogleEvents,
  parseRoverStyleTitle,
  type GoogleCalendarEvent,
} from '../lib/googleCalendar'
import { PRIMARY_DOG_KEY, type Dog, type Stay, type Task, type TaskStatus, type TaskType } from '../types'
import { joinDogNames, stayDisplayName, stayingDogs } from '../utils/dogDisplay'
import {
  addDays,
  formatDayHeading,
  formatTime,
  formatTodayHeading,
  isSameDay,
  startOfWeek,
  toLocalDateKey,
} from '../utils/dateUtils'
import { OUTING_TYPES, atTime, dayPartInfo, latestOuting, planOutings } from '../utils/outingClock'

const DISMISSED_KEY = 'heypup-dismissed-stay-suggestions'
const OUTING_TITLES: Partial<Record<TaskType, string>> = { walk: 'Walk', potty: 'Potty break' }
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function TodayPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [activeDogs, setActiveDogs] = useState<{ dog: Dog; stay: Stay }[]>([])
  const [loading, setLoading] = useState(true)
  // Last completed walk/potty break per stay, for "every X hours" dogs. Tasks
  // checked off on this page are merged in live, so this only needs one fetch.
  const [lastOutings, setLastOutings] = useState<Record<string, Task | null>>({})
  const [now, setNow] = useState(() => new Date())
  // The walk/potty break just logged, while the "when did it happen?" sheet is open.
  const [logPrompt, setLogPrompt] = useState<{ task: Task; dog: Dog } | null>(null)
  // "When was the dog last out?" — Pick a time, or Change on the clock strip.
  const [lastOutSheet, setLastOutSheet] = useState<{ dog: Dog; stay: Stay; initial: Date; task?: Task } | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The set-time task whose time is being changed.
  const [editTask, setEditTask] = useState<Task | null>(null)
  // "Morning walk moved to 8:30 AM" — with the times before, so Undo can put them back.
  const [moveToast, setMoveToast] = useState<{ message: string; previous: TaskTimeChange[] } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // One entry per dog profile named on a calendar event (a multi-dog booking
  // can name dogs on different profiles). `candidates` normally holds a single
  // profile; more than one means a name matched several dogs we couldn't tell
  // apart, so the card asks the sitter to pick. `names` is who the event
  // mentions; `dogKeys` is set when only some dogs on the profile are booked.
  const [suggestions, setSuggestions] = useState<
    { id: string; candidates: Dog[]; names: string[]; dogKeys?: string[]; event: GoogleCalendarEvent }[]
  >([])
  const [newDogSuggestions, setNewDogSuggestions] = useState<
    { dogName: string; ownerName: string; event: GoogleCalendarEvent }[]
  >([])
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [showPastTasks, setShowPastTasks] = useState(false)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const didSwipe = useRef(false)

  const SWIPE_THRESHOLD = 40

  const handleWeekPointerDown = (e: PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY }
  }

  const handleWeekPointerUp = (e: PointerEvent) => {
    if (!swipeStart.current) return
    const deltaX = e.clientX - swipeStart.current.x
    const deltaY = e.clientY - swipeStart.current.y
    swipeStart.current = null
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return
    didSwipe.current = true
    setSelectedDate((d) => addDays(d, deltaX < 0 ? 7 : -7))
  }

  const handleWeekDayClick = (day: Date) => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    setSelectedDate(day)
  }

  // The date range whose tasks are loaded: the selected week, or the whole
  // month when the month grid is open.
  const range = useMemo(() => {
    if (viewMode === 'month') {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
    const start = startOfWeek(selectedDate)
    const end = addDays(start, 7)
    end.setMilliseconds(-1)
    return { start, end }
  }, [selectedDate, viewMode])
  const rangeKey = `${range.start.toISOString()}|${range.end.toISOString()}`

  useEffect(() => {
    let cancelled = false
    Promise.all([listDogs(), listStays()])
      .then(([dogRows, stayRows]) => {
        if (cancelled) return
        setDogs(dogRows)
        const now = new Date()
        const active = stayRows
          .filter((s) => new Date(s.startDate) <= now && new Date(s.endDate) >= now)
          .map((s) => {
            const dog = dogRows.find((d) => d.id === s.dogId)
            return dog ? { dog, stay: s } : null
          })
          .filter(Boolean) as { dog: Dog; stay: Stay }[]
        setActiveDogs(active)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load.'))
    return () => {
      cancelled = true
    }
  }, [])

  const clockStays = useMemo(() => activeDogs.filter(({ dog }) => dog.outingRule), [activeDogs])

  useEffect(() => {
    if (clockStays.length === 0) return
    let cancelled = false
    Promise.all(clockStays.map(({ stay }) => getLastOuting(stay.id).then((t) => [stay.id, t] as const)))
      .then((entries) => !cancelled && setLastOutings(Object.fromEntries(entries)))
      .catch(() => {}) // the clock falls back to drop-off time
    const tick = setInterval(() => setNow(new Date()), 30_000)
    return () => {
      cancelled = true
      clearInterval(tick)
    }
  }, [clockStays])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listTasksBetween(range.start.toISOString(), range.end.toISOString())
      .then((taskRows) => !cancelled && setTasks(taskRows))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey])

  // Suggest starting a stay when today's Google/Rover events name a dog we
  // already know, and that dog isn't already under active care.
  useEffect(() => {
    if (!isGoogleCalendarConnected() || dogs.length === 0) return
    let cancelled = false
    const todayKey = toLocalDateKey(new Date())
    const activeDogIds = new Set(activeDogs.map((a) => a.dog.id))

    listUpcomingGoogleEvents(20)
      .then((events) => {
        if (cancelled) return
        const matches: typeof suggestions = []
        const unmatched: { dogName: string; ownerName: string; event: GoogleCalendarEvent }[] = []
        const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
        for (const event of events) {
          // Only bookings that start today — one already under way was either
          // started in the app already or deliberately skipped.
          const startKey = event.allDay ? event.start.slice(0, 10) : toLocalDateKey(new Date(event.start))
          if (startKey !== todayKey) continue
          if (dismissedIds.includes(event.id)) continue
          const parsed = parseRoverStyleTitle(event.title)
          if (!parsed) continue

          // Each named dog → the profiles it could be (as the main dog or a
          // grouped member), then gather names that land on the same profile.
          const byProfile = new Map<string, { dog: Dog; keys: string[]; names: string[] }>()
          for (const name of parsed.dogNames) {
            const byName = dogs.flatMap((d) => {
              if (same(d.name, name)) return [{ dog: d, key: PRIMARY_DOG_KEY }]
              const member = d.additionalDogs.find((m) => same(m.name, name))
              return member ? [{ dog: d, key: member.id }] : []
            })
            if (byName.length === 0) {
              unmatched.push({ dogName: name, ownerName: parsed.ownerName, event })
              continue
            }
            // Two dogs can share a name — the owner on the event usually tells
            // them apart. Only fall back to the full name-match set when the
            // owner narrows it to nothing (or the title has no owner), so we
            // never silently pick the wrong dog.
            const byOwner = parsed.ownerName ? byName.filter((m) => same(m.dog.ownerName, parsed.ownerName)) : []
            const options = (byOwner.length > 0 ? byOwner : byName).filter((m) => !activeDogIds.has(m.dog.id))
            if (options.length === 0) continue
            if (options.length > 1) {
              matches.push({ id: `${event.id}:${name}`, candidates: options.map((m) => m.dog), names: [name], event })
              continue
            }
            const [{ dog, key }] = options
            const entry = byProfile.get(dog.id) ?? { dog, keys: [], names: [] }
            entry.keys.push(key)
            entry.names.push(name)
            byProfile.set(dog.id, entry)
          }
          for (const { dog, keys, names } of byProfile.values()) {
            const everyDog = keys.length >= dog.additionalDogs.length + 1
            matches.push({
              id: `${event.id}:${dog.id}`,
              candidates: [dog],
              names,
              dogKeys: everyDog ? undefined : keys,
              event,
            })
          }
        }
        setSuggestions(matches)
        setNewDogSuggestions(unmatched)
      })
      .catch(() => {}) // best-effort nudge, not worth surfacing as an error
    return () => {
      cancelled = true
    }
  }, [dogs, activeDogs, dismissedIds])

  // Start Stay link for a calendar suggestion; `keys` limits it to the
  // profile's dogs the event actually names.
  function stayFromEventUrl(dogId: string, event: GoogleCalendarEvent, dogKeys?: string[]): string {
    const keys = dogKeys ? `&keys=${encodeURIComponent(dogKeys.join(','))}` : ''
    return `/stays/new?dog=${dogId}&start=${encodeURIComponent(event.start)}&end=${encodeURIComponent(event.end)}${keys}`
  }

  function dismissSuggestion(eventId: string) {
    const next = [...dismissedIds, eventId]
    setDismissedIds(next)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
  }

  // Task-count dots for the day picker, keyed by local date.
  const taskKeys = useMemo(() => {
    const set = new Set<string>()
    for (const t of tasks) set.add(toLocalDateKey(new Date(t.scheduledTime)))
    return set
  }, [tasks])

  const selectedKey = toLocalDateKey(selectedDate)
  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => toLocalDateKey(new Date(t.scheduledTime)) === selectedKey)
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [tasks, selectedKey],
  )

  // Tasks group by stay, not by each task's dog name — a stay's dogs come
  // together, so a task for just one of them (Artemis's pill) sits in the
  // stay's list and is marked "Artemis only" instead of getting its own list.
  const stayLabels = useMemo(() => {
    const map = new Map<string, string>()
    for (const { dog, stay } of activeDogs) map.set(stay.id, stayDisplayName(dog, stay.dogKeys))
    // A stay that's over: its widest task name ("George & Artemis") names it.
    for (const t of tasks) {
      if (activeDogs.some((a) => a.stay.id === t.stayId)) continue
      const cur = map.get(t.stayId)
      if (!cur || t.dogName.length > cur.length) map.set(t.stayId, t.dogName)
    }
    return map
  }, [activeDogs, tasks])
  const stayLabel = (stayId: string) => stayLabels.get(stayId) ?? ''
  const onlyFor = (t: Task) => (t.dogName !== stayLabel(t.stayId) ? t.dogName : undefined)

  function groupByStay(list: Task[]) {
    const map: Record<string, Task[]> = {}
    for (const t of list) {
      if (!map[t.stayId]) map[t.stayId] = []
      map[t.stayId].push(t)
    }
    return map
  }

  // Upcoming tasks stay in the main list; done ones move into a collapsible
  // "Past tasks" section so they don't push what's next further down the page.
  const pendingTasks = useMemo(() => dayTasks.filter((t) => t.status !== 'done'), [dayTasks])
  const pastTasks = useMemo(() => dayTasks.filter((t) => t.status === 'done'), [dayTasks])
  const pendingByStay = useMemo(() => groupByStay(pendingTasks), [pendingTasks])
  const isMultiDog = useMemo(() => new Set(dayTasks.map((t) => t.stayId)).size > 1, [dayTasks])

  useEffect(() => {
    setShowPastTasks(false)
  }, [selectedKey])

  const isTodaySelected = isSameDay(selectedDate, new Date())
  const isPastSelected = !isTodaySelected && selectedDate < new Date()

  function updateStatus(id: string, status: TaskStatus, completedAt?: string) {
    const doneAt = status === 'done' ? (completedAt ?? new Date().toISOString()) : undefined
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, completedAt: doneAt } : t)))
    updateTaskStatus(id, status, doneAt).catch((e) => setError(e instanceof Error ? e.message : 'Could not save.'))
  }

  /** Undoes a checked-off task. One logged on the spot was never scheduled, so
   *  it's removed — the clock falls back to the time out before it — rather
   *  than coming back as a pending (and instantly overdue) task. */
  function undoTask(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task?.logged) return updateStatus(id, 'pending')
    setTasks((prev) => prev.filter((t) => t.id !== id))
    // The fetched last outing may be this same task — drop it so the clock
    // doesn't keep counting from it.
    setLastOutings((prev) => (prev[task.stayId]?.id === id ? { ...prev, [task.stayId]: null } : prev))
    deleteTasksByIds([id]).catch((e) => {
      setTasks((prev) => [...prev, task])
      setError(e instanceof Error ? e.message : 'Could not undo.')
    })
  }

  /** Checks a task off "just now", then — for a going-out dog that wants it —
   *  asks when it really happened. */
  function completeTask(task: Task) {
    updateStatus(task.id, 'done')
    const dog = clockStays.find(({ stay }) => stay.id === task.stayId)?.dog
    if (dog?.outingRule?.askWhenItHappened && OUTING_TYPES.includes(task.type)) {
      setLogPrompt({ task, dog })
    }
  }

  function lastOutingFor(stayId: string): Task | undefined {
    const loaded = tasks.filter((t) => t.stayId === stayId)
    const fetched = lastOutings[stayId]
    // The page's own copy wins, so un-checking that task is reflected too.
    const extra = fetched && !loaded.some((t) => t.id === fetched.id) ? [fetched] : []
    return latestOuting([...loaded, ...extra])
  }

  /** Logs a planned walk/potty break as done just now — a new task, marked
   *  `logged` so undoing it removes it again. */
  async function logOuting(dog: Dog, stay: Stay, type: TaskType) {
    const at = new Date()
    setNow(at)
    try {
      const created = await createTasks([
        {
          id: '',
          stayId: stay.id,
          dogId: dog.id,
          dogName: stayDisplayName(dog, stay.dogKeys),
          type,
          title: OUTING_TITLES[type] ?? 'Care task',
          scheduledTime: at.toISOString(),
          status: 'done',
          completedAt: at.toISOString(),
          logged: true,
        },
      ])
      setTasks((prev) => [...prev, ...created])
      if (dog.outingRule?.askWhenItHappened && created[0]) setLogPrompt({ task: created[0], dog })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    }
  }

  /** What a stay's clock counts from: the later of the last checked-off walk
   *  or potty break and the "when was the dog last out?" answer. */
  function lastOutFor(stay: Stay): { at: Date; label: string; task?: Task } | null {
    const task = lastOutingFor(stay.id)
    const taskAt = task?.completedAt ? new Date(task.completedAt) : null
    const stayAt = stay.lastOutAt ? new Date(stay.lastOutAt) : null
    if (task && taskAt && (!stayAt || taskAt >= stayAt)) {
      return { at: taskAt, label: `the ${task.title.toLowerCase()}`, task }
    }
    return stayAt ? { at: stayAt, label: 'last out' } : null
  }

  /** Saves when the dog was last out. Correcting a checked-off walk/potty break
   *  moves that task; otherwise the time is kept on the stay. */
  async function saveLastOut(stay: Stay, at: Date, task?: Task) {
    setNow(new Date())
    if (task) {
      updateStatus(task.id, 'done', at.toISOString())
      return
    }
    const iso = at.toISOString()
    const setLocal = (lastOutAt: string | undefined) =>
      setActiveDogs((prev) => prev.map((a) => (a.stay.id === stay.id ? { ...a, stay: { ...a.stay, lastOutAt } } : a)))
    const previous = stay.lastOutAt
    setLocal(iso)
    try {
      await setStayLastOut(stay.id, iso)
    } catch (e) {
      setLocal(previous) // didn't save — don't show a clock that isn't stored
      // Supabase errors are plain objects, not Error instances.
      const message = (e as { message?: string } | null)?.message
      setError(message ? `Could not save the last-out time: ${message}` : 'Could not save the last-out time.')
    }
  }

  const todayKey = toLocalDateKey(now)
  /** Today's pending walks and potty breaks for a stay. */
  const pendingOutings = (stayId: string) =>
    tasks.filter(
      (t) =>
        t.stayId === stayId &&
        t.status === 'pending' &&
        OUTING_TYPES.includes(t.type) &&
        toLocalDateKey(new Date(t.scheduledTime)) === todayKey,
    )

  // One going-out clock per stay: what it counts from, and the rest of today
  // planned from there — long walks placed in their windows, potty breaks in
  // the gaps. Nothing logged yet → ask when the dog was last out.
  const clocks = isTodaySelected
    ? clockStays.map(({ dog, stay }) => {
        const rule = dog.outingRule!
        const last = lastOutFor(stay)
        const firstDay = toLocalDateKey(new Date(stay.startDate)) === todayKey
        // On the first day, a long walk whose window closed before the clock
        // started (or before now, if it hasn't) is past — we can't know whether
        // it happened, so it moves to past tasks instead of showing overdue.
        const startedAt = stay.lastOutAt ? new Date(stay.lastOutAt) : last ? null : now
        const passed = new Set(
          pendingOutings(stay.id)
            .filter((t) => {
              if (!firstDay || !startedAt || !t.dayPart) return false
              return atTime(new Date(t.scheduledTime), dayPartInfo(t.dayPart).end) <= startedAt
            })
            .map((t) => t.id),
        )
        const pending = pendingOutings(stay.id).filter((t) => !passed.has(t.id))
        const plan = last
          ? planOutings({ lastOut: last.at, lastLabel: last.label, rule, pending, today: now, until: new Date(stay.endDate) })
          : []
        return {
          dog,
          stay,
          rule,
          dogName: stayDisplayName(dog, stay.dogKeys),
          last,
          // Wait for the last-outing fetch before asking, so the card doesn't flash.
          ask: !last && stay.id in lastOutings,
          plan,
          passed,
        }
      })
    : []
  const walkPlans = new Map(
    clocks.flatMap((c) =>
      c.plan.flatMap((p, i) => (p.taskId ? [[p.taskId, { at: p.at, reason: p.reason, next: i === 0 }] as const] : [])),
    ),
  )
  const passedIds = new Set(clocks.flatMap((c) => [...c.passed]))
  const pottyPlans = clocks.flatMap((c) =>
    c.plan.flatMap((p, i) => (p.type === 'potty' ? [{ clock: c, at: p.at, reason: p.reason, next: i === 0 }] : [])),
  )

  /** "Then today" in the pick-a-time sheet: the plan if the dog was last out at `at`. */
  function previewFor(stay: Stay, rule: NonNullable<Dog['outingRule']>, at: Date) {
    const pending = pendingOutings(stay.id).filter((t) => !passedIds.has(t.id))
    const plan = planOutings({ lastOut: at, lastLabel: 'last out', rule, pending, today: new Date(), until: new Date(stay.endDate) })
    const titleOf = (id?: string) => pending.find((t) => t.id === id)?.title ?? 'Walk'
    return [
      ...plan.map((p) => ({ at: p.at, type: p.type, title: p.type === 'walk' ? titleOf(p.taskId) : 'Potty break' })),
      ...pending
        .filter((t) => !t.dayPart && new Date(t.scheduledTime) > at && new Date(t.scheduledTime) < new Date(stay.endDate))
        .map((t) => ({
          at: new Date(t.scheduledTime),
          type: 'fixed' as const,
          fixedType: t.type as 'walk' | 'potty',
          title: t.title,
        })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime())
  }

  /** A task with a real set time: not a walk planned by time of day, and not
   *  one the going-out clock places. */
  const hasSetTime = (t: Task) => t.status === 'pending' && !t.dayPart && !walkPlans.has(t.id)

  /** Same-day walks and potty breaks after `task` that can move along with it. */
  function followersOf(task: Task): Task[] {
    if (!OUTING_TYPES.includes(task.type)) return []
    const from = new Date(task.scheduledTime)
    const day = toLocalDateKey(from)
    return tasks
      .filter(
        (t) =>
          t.id !== task.id &&
          t.stayId === task.stayId &&
          OUTING_TYPES.includes(t.type) &&
          hasSetTime(t) &&
          toLocalDateKey(new Date(t.scheduledTime)) === day &&
          new Date(t.scheduledTime) > from,
      )
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
  }

  /** Applies new times locally, saves them, and re-pushes to Google if it's on. */
  async function applyTimes(changes: TaskTimeChange[]) {
    applyLocalOnly(changes)
    await updateTaskTimes(changes)
    const byId = new Map(changes.map((c) => [c.id, c]))
    const moved = tasks.filter((t) => byId.has(t.id)).map((t) => withTime(t, byId.get(t.id)!))
    pushTasksToGoogleCalendar(moved).catch(() => {}) // best-effort, like stay creation
  }

  const withTime = (t: Task, c: TaskTimeChange): Task => ({
    ...t,
    scheduledTime: c.scheduledTime,
    originalTime: c.originalTime ?? undefined,
  })

  async function saveEditedTime(task: Task, at: Date, moveRest: boolean) {
    setEditTask(null)
    const shift = at.getTime() - new Date(task.scheduledTime).getTime()
    const followers = moveRest ? followersOf(task) : []
    const moving = [task, ...followers]
    const previous = moving.map((t) => ({ id: t.id, scheduledTime: t.scheduledTime, originalTime: t.originalTime ?? null }))
    const changes = moving.map((t) => {
      const scheduledTime = new Date(new Date(t.scheduledTime).getTime() + shift).toISOString()
      // Keep the first time it had; moving it back there clears it.
      const original = t.originalTime ?? t.scheduledTime
      return {
        id: t.id,
        scheduledTime,
        originalTime: new Date(original).getTime() === new Date(scheduledTime).getTime() ? null : original,
      }
    })
    const time = formatTime(at.toISOString())
    const message =
      followers.length > 0
        ? `${task.title} moved to ${time} — ${followers.length === 1 ? 'the one' : followers.length} after it moved too`
        : `${task.title} moved to ${time}`
    try {
      await applyTimes(changes)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      setMoveToast({ message, previous })
      toastTimer.current = setTimeout(() => setMoveToast(null), 6000)
    } catch (e) {
      applyLocalOnly(previous)
      setError((e as { message?: string } | null)?.message ?? 'Could not save the new time.')
    }
  }

  function applyLocalOnly(changes: TaskTimeChange[]) {
    const byId = new Map(changes.map((c) => [c.id, c]))
    setTasks((prev) => prev.map((t) => (byId.has(t.id) ? withTime(t, byId.get(t.id)!) : t)))
  }

  async function undoMove() {
    if (!moveToast) return
    const { previous } = moveToast
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setMoveToast(null)
    try {
      await applyTimes(previous)
    } catch (e) {
      setError((e as { message?: string } | null)?.message ?? 'Could not undo.')
    }
  }

  // Past tasks: done ones, plus first-day walks whose window had already passed.
  const pastList = [...pastTasks, ...pendingTasks.filter((t) => passedIds.has(t.id))].sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
  )
  const pastListByStay = groupByStay(pastList)

  type Item =
    | { kind: 'task'; time: Date; task: Task }
    | { kind: 'potty'; time: Date; potty: (typeof pottyPlans)[number] }
    | { kind: 'ask'; time: Date; clock: (typeof clocks)[number] }
  const pendingGroups = [
    ...new Set([...Object.keys(pendingByStay), ...clocks.filter((c) => c.ask || c.plan.length).map((c) => c.stay.id)]),
  ].map((stayId) => {
    const dogTasks = pendingByStay[stayId] ?? []
    const items: Item[] = [
      ...dogTasks
        .filter((task) => !passedIds.has(task.id))
        .map((task) => ({
          kind: 'task' as const,
          time: walkPlans.get(task.id)?.at ?? new Date(task.scheduledTime),
          task,
        })),
      ...pottyPlans.filter((p) => p.clock.stay.id === stayId).map((potty) => ({ kind: 'potty' as const, time: potty.at, potty })),
    ].sort((a, b) => a.time.getTime() - b.time.getTime())
    const clock = clocks.find((c) => c.stay.id === stayId)
    if (clock?.ask) items.unshift({ kind: 'ask', time: now, clock })
    return {
      stayId,
      dogName: clock?.dogName ?? stayLabel(stayId),
      clock,
      items,
    }
  })
  return (
    <div className="min-h-svh bg-cream pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cream px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1 h-[13px] leading-none">
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest leading-none">
            {formatTodayHeading(selectedDate)}
          </p>
          {!isTodaySelected && (
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              aria-label="Jump to today"
              className="flex items-center gap-1 text-coral active:scale-95 transition-transform leading-none"
            >
              <CalendarCheck2 size={14} />
              <span className="font-dm font-bold text-[13px] uppercase tracking-widest leading-none underline underline-offset-2">
                Today
              </span>
            </button>
          )}
        </div>
        <div className="flex items-end justify-between">
          <h1 className="font-outfit font-bold text-[56px] leading-none text-cobalt tracking-tight">
            {formatDayHeading(selectedDate.toISOString()).split(',')[0]}
          </h1>
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'week' ? 'month' : 'week'))}
            aria-label={viewMode === 'week' ? 'Show month' : 'Show week'}
            aria-pressed={viewMode === 'month'}
            className={`size-11 rounded-full flex items-center justify-center transition-colors active:scale-[0.94] ${
              viewMode === 'month' ? 'bg-cobalt text-white' : 'bg-card text-cobalt'
            }`}
          >
            <CalendarDays size={20} />
          </button>
        </div>
      </div>

      {/* Day picker */}
      {viewMode === 'week' ? (
        <div
          className="px-6 mb-6 touch-pan-y"
          onPointerDown={handleWeekPointerDown}
          onPointerUp={handleWeekPointerUp}
        >
          <div className="flex justify-between">
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(startOfWeek(selectedDate), i)
              const key = toLocalDateKey(day)
              const isSelected = key === selectedKey
              const isToday = isSameDay(day, new Date())
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleWeekDayClick(day)}
                  className="flex flex-col items-center gap-1.5 active:scale-[0.94] transition-transform"
                >
                  <span className="font-dm font-bold text-[11px] uppercase tracking-widest text-text-muted">
                    {WEEKDAY_LETTERS[i]}
                  </span>
                  <span
                    className={`size-10 rounded-full flex items-center justify-center font-dm font-bold text-[15px] transition-colors ${
                      isSelected
                        ? 'bg-coral text-white'
                        : isToday
                          ? 'bg-coral-soft text-coral'
                          : 'text-text-primary'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span
                    className={`size-1.5 rounded-full ${
                      taskKeys.has(key) ? (isSelected ? 'bg-coral' : 'bg-coral/50') : 'bg-transparent'
                    }`}
                  />
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="px-6 mb-6">
          <div className="bg-card rounded-[20px] p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
                className="size-9 rounded-full flex items-center justify-center text-text-secondary active:scale-[0.94]"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="font-outfit font-bold text-[17px] text-text-primary">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
                className="size-9 rounded-full flex items-center justify-center text-text-secondary active:scale-[0.94]"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_LETTERS.map((l, i) => (
                <span
                  key={i}
                  className="text-center font-dm font-bold text-[11px] uppercase tracking-widest text-text-muted"
                >
                  {l}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from(
                { length: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() },
                (_, i) => (
                  <span key={`blank-${i}`} />
                ),
              )}
              {Array.from(
                { length: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() },
                (_, i) => {
                  const day = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1)
                  const key = toLocalDateKey(day)
                  const isSelected = key === selectedKey
                  const isToday = isSameDay(day, new Date())
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day)
                        setViewMode('week')
                      }}
                      className="flex flex-col items-center gap-0.5 active:scale-[0.94] transition-transform"
                    >
                      <span
                        className={`size-9 rounded-full flex items-center justify-center font-dm font-bold text-[14px] transition-colors ${
                          isSelected
                            ? 'bg-coral text-white'
                            : isToday
                              ? 'bg-coral-soft text-coral'
                              : 'text-text-primary'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`size-1 rounded-full ${
                          taskKeys.has(key)
                            ? isSelected
                              ? 'bg-coral'
                              : 'bg-coral/50'
                            : 'bg-transparent'
                        }`}
                      />
                    </button>
                  )
                },
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-6 mb-4 bg-[#fee2e2] rounded-[12px] px-4 py-3">
          <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="px-6 font-dm text-[14px] text-text-secondary">Loading your day…</p>
      ) : (
        <>
          {/* Suggested stays, from today's Google/Rover events */}
          {isTodaySelected && suggestions.length > 0 && (
            <div className="px-6 mb-6 flex flex-col gap-3">
              {suggestions.map(({ id, candidates, names, dogKeys, event }) => {
                const [dog] = candidates
                const ambiguous = candidates.length > 1
                const label = joinDogNames(names)
                return (
                  <div
                    key={id}
                    className="bg-[#eef1fd] border border-[#d3daf8] rounded-[26px] p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-[10px] overflow-hidden bg-white flex items-center justify-center shrink-0">
                        {!ambiguous && dog.photoUrl ? (
                          <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
                        ) : (
                          <DogIcon size={18} className="text-text-muted" />
                        )}
                      </div>
                      <p className="font-dm font-bold text-[15px] text-text-primary leading-snug">
                        {ambiguous
                          ? `Which ${label} are you taking care of today?`
                          : `Are you taking care of ${label} starting today?`}
                      </p>
                    </div>
                    <p className="font-dm text-[12px] text-text-secondary mb-3">
                      {ambiguous
                        ? `You have ${candidates.length} dogs named ${label} — pick the right one to start their stay.`
                        : `Found on your calendar — start a stay to generate ${label}'s care tasks.`}
                    </p>
                    {ambiguous ? (
                      <>
                        <div className="flex flex-col gap-2 mb-3">
                          {candidates.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => navigate(stayFromEventUrl(c.id, event))}
                              className="flex items-center gap-3 bg-white rounded-[16px] px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
                            >
                              <div className="size-9 rounded-[6px] overflow-hidden bg-[#f3f4f6] flex items-center justify-center shrink-0">
                                {c.photoUrl ? (
                                  <img src={c.photoUrl} alt={c.name} className="size-full object-cover" />
                                ) : (
                                  <DogIcon size={16} className="text-text-muted" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-dm font-semibold text-[14px] text-text-primary leading-none truncate">
                                  {c.ownerName || 'No owner on file'}
                                </p>
                                <p className="font-dm text-[12px] text-text-secondary mt-1 truncate">
                                  {c.breed}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => dismissSuggestion(event.id)}>
                          Not now
                        </Button>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(stayFromEventUrl(dog.id, event, dogKeys))}
                        >
                          Start a Stay
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => dismissSuggestion(event.id)}>
                          Not now
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* New dogs found on the calendar that aren't in the app yet */}
          {isTodaySelected && newDogSuggestions.length > 0 && (
            <div className="px-6 mb-6 flex flex-col gap-3">
              {newDogSuggestions.map(({ dogName, ownerName, event }) => (
                <div
                  key={`${event.id}:${dogName}`}
                  className="bg-[#eef1fd] border border-[#d3daf8] rounded-[26px] p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-[10px] overflow-hidden bg-white flex items-center justify-center shrink-0">
                      <UserPlus size={18} className="text-cobalt" />
                    </div>
                    <p className="font-dm font-bold text-[15px] text-text-primary leading-snug">
                      {dogName} isn't in your dog list yet
                    </p>
                  </div>
                  <p className="font-dm text-[12px] text-text-secondary mb-3">
                    Found on your calendar for today — add {dogName} to set up their care schedule.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/dogs/new?name=${encodeURIComponent(dogName)}&owner=${encodeURIComponent(ownerName)}`,
                        )
                      }
                    >
                      Add Dog
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => dismissSuggestion(event.id)}>
                      Not now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Care */}
          {activeDogs.length > 0 && (
            <section className="px-6 mb-6">
              <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
                Active Care
              </p>
              {/* One row that scrolls sideways, bleeding to the screen edges so
                  cards slide out of view instead of clipping at the gutter */}
              <div className="no-scrollbar flex gap-3 overflow-x-auto -mx-6 px-6 py-0.5">
                {activeDogs.map(({ dog, stay }) => {
                  const endDate = new Date(stay.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  return (
                    <Link
                      key={stay.id}
                      to={`/dogs/${dog.id}`}
                      className="flex shrink-0 items-center gap-2 rounded-full pl-1.5 pr-5 py-1.5 bg-cream border border-border-light active:scale-[0.97] transition-transform"
                    >
                      {/* A group's photos overlap side by side, first dog in front */}
                      <div className="flex shrink-0">
                        {stayingDogs(dog, stay.dogKeys).map((d, i) => (
                          <div
                            key={i}
                            // ring in the pill color separates overlapping photos
                            className={`relative size-9 rounded-full overflow-hidden bg-[#f3f4f6] flex items-center justify-center ring-2 ring-cream ${
                              i > 0 ? '-ml-3' : ''
                            }`}
                            style={{ zIndex: 3 - i }}
                          >
                            {d.photoUrl ? (
                              <img src={d.photoUrl} alt={d.name} className="size-full object-cover" />
                            ) : (
                              <DogIcon size={17} className="text-text-muted" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="font-dm font-semibold text-[14px] text-text-primary leading-none whitespace-nowrap">
                          {stayDisplayName(dog, stay.dogKeys)}
                        </p>
                        <p className="font-dm text-[12px] text-text-secondary mt-0.5 whitespace-nowrap">
                          Until {endDate}
                        </p>
                      </div>
                    </Link>
                  )
                })}
                <button
                  type="button"
                  onClick={() => navigate('/stays/new')}
                  className="flex shrink-0 self-center items-center gap-1.5 whitespace-nowrap rounded-full h-12 px-4 border border-dashed border-border-light text-text-muted font-dm font-medium text-[13px] active:scale-[0.97] transition-transform"
                >
                  <CalendarPlus size={15} />
                  Start another stay
                </button>
              </div>
            </section>
          )}

          {/* Tasks grouped by dog */}
          {pendingGroups.map(({ stayId, dogName, clock, items }) => (
            <section key={stayId} className="px-6 mb-4">
              {isMultiDog && (
                <p className="font-dm font-bold text-[12px] text-coral uppercase tracking-widest mb-3">
                  {dogName}
                </p>
              )}
              {/* What the going-out clock is counting from, with a way to fix it */}
              {clock?.last && (
                <div className="mb-4 bg-card rounded-[12px] pl-3 pr-1 py-1 flex items-center gap-2.5">
                  <Clock size={16} className="text-green-vivid shrink-0" />
                  <p className="flex-1 min-w-0 font-dm font-medium text-[13px] text-text-primary leading-snug py-2">
                    Out every {clock.rule.everyHours} {clock.rule.everyHours === 1 ? 'hr' : 'hrs'} · last out{' '}
                    {formatTime(clock.last.at.toISOString())}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setLastOutSheet({ dog: clock.dog, stay: clock.stay, initial: clock.last!.at, task: clock.last!.task })
                    }
                    className="shrink-0 px-3 py-2 rounded-full font-dm font-bold text-[13px] text-coral active:bg-coral-soft"
                  >
                    Change
                  </button>
                </div>
              )}
              <div>
                {items.map((item, i) =>
                  item.kind === 'ask' ? (
                    <LastOutPrompt
                      key={`last-out-${item.clock.stay.id}`}
                      dogName={item.clock.dogName}
                      onJustNow={() => void saveLastOut(item.clock.stay, new Date())}
                      onPickTime={() => setLastOutSheet({ dog: item.clock.dog, stay: item.clock.stay, initial: new Date() })}
                    />
                  ) : item.kind === 'potty' ? (
<div key={`potty-${item.potty.clock.stay.id}-${item.time.getTime()}`} className={i === items.length - 1 ? '[&_.connector]:opacity-0' : ''}>
                      {/* A planned potty break isn't stored until it's logged,
                          but it swipes like any other task: done → logged now
                          (then "when did it happen?" if the dog asks for it). */}
                      <TaskCard
                        task={{
                          id: `planned-${item.potty.clock.stay.id}-${item.time.getTime()}`,
                          stayId: item.potty.clock.stay.id,
                          dogId: item.potty.clock.dog.id,
                          dogName: item.potty.clock.dogName,
                          type: 'potty',
                          title: 'Potty break',
                          scheduledTime: item.potty.at.toISOString(),
                          status: 'pending',
                        }}
                        onDone={() => void logOuting(item.potty.clock.dog, item.potty.clock.stay, 'potty')}
                        onUndo={() => {}}
                        showDogName={false}
                        plan={{ at: item.potty.at, reason: item.potty.reason, next: item.potty.next }}
                      />
                    </div>
                  ) : (
                    <div key={item.task.id} className={i === items.length - 1 ? '[&_.connector]:opacity-0' : ''}>
                      <TaskCard
                        task={item.task}
                        onDone={() => completeTask(item.task)}
                        onUndo={undoTask}
                        showDogName={false}
                        onlyFor={onlyFor(item.task)}
                        plan={walkPlans.get(item.task.id)}
                        onEdit={hasSetTime(item.task) ? () => setEditTask(item.task) : undefined}
                      />
                    </div>
                  ),
                )}
              </div>
            </section>
          ))}

          {isTodaySelected && dayTasks.length > 0 && pendingTasks.every((t) => passedIds.has(t.id)) && pottyPlans.length === 0 && !clocks.some((c) => c.ask) && (
            <div className="px-6 mb-6">
              <div className="rise-in bg-[#dcfce7] rounded-[20px] p-6 flex flex-col items-center text-center gap-2">
                <div className="size-12 rounded-full bg-white flex items-center justify-center">
                  <PartyPopper size={22} className="text-[#15803d]" />
                </div>
                <p className="font-outfit font-bold text-[20px] text-[#15803d] leading-tight">
                  All done for today!
                </p>
                <p className="font-dm text-[13px] text-[#166534]">
                  Every task is checked off — nice work.
                </p>
              </div>
            </div>
          )}

          {pastList.length > 0 && (
            <section className="px-6 mb-4">
              <button
                type="button"
                onClick={() => setShowPastTasks((v) => !v)}
                className="font-dm font-bold text-[12px] text-text-muted uppercase tracking-widest mb-3"
              >
                {showPastTasks ? 'Hide' : 'Show'} past tasks ({pastList.length})
              </button>
              {showPastTasks &&
                Object.entries(pastListByStay).map(([stayId, dogTasks]) => (
                  <div key={stayId} className="mb-4 last:mb-0">
                    {/* Always labeled, even for a single dog — once a stay ends,
                        the Active Care card that named the dog is gone, so this
                        is the only thing left saying whose tasks these were. */}
                    <p className="font-dm font-bold text-[12px] text-coral uppercase tracking-widest mb-3">
                      {stayLabel(stayId)}
                    </p>
                    {dogTasks.map((task, i) => (
                      <div
                        key={task.id}
                        className={i === dogTasks.length - 1 ? '[&_.connector]:opacity-0' : ''}
                      >
                        <TaskCard
                          task={task}
                          onDone={(id) => updateStatus(id, 'done')}
                          onUndo={undoTask}
                          showDogName={false}
                          onlyFor={onlyFor(task)}
                          passed={passedIds.has(task.id)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </section>
          )}

          {dayTasks.length === 0 && (
            <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
              <p className="font-outfit font-bold text-[22px] text-text-primary">
                {isTodaySelected
                  ? 'No tasks today'
                  : `No tasks ${formatDayHeading(selectedDate.toISOString()).split(',')[0].replace('Tomorrow', 'tomorrow')}`}
              </p>
              {!isPastSelected && (
                <>
                  <p className="font-dm text-[14px] text-text-secondary">
                    Start a stay to generate care tasks.
                  </p>
                  <div className="mt-3">
                    <Button onClick={() => navigate('/stays/new')}>
                      <CalendarPlus size={18} />
                      Start a Stay
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      {logPrompt && (
        <LogTimeSheet
          type={logPrompt.task.type}
          title={logPrompt.task.title}
          dogName={logPrompt.task.dogName}
          rule={logPrompt.dog.outingRule!}
          onConfirm={(at) => {
            updateStatus(logPrompt.task.id, 'done', at.toISOString())
            setLogPrompt(null)
          }}
          onClose={() => setLogPrompt(null)}
        />
      )}
      {editTask && (
        <EditTimeSheet
          task={editTask}
          followers={followersOf(editTask)}
          onSave={(at, moveRest) => void saveEditedTime(editTask, at, moveRest)}
          onClose={() => setEditTask(null)}
        />
      )}
      {moveToast && (
        // Sits just above the bottom nav.
        <div className="fixed inset-x-0 bottom-28 z-40 flex justify-center px-6 pointer-events-none">
          <div className="rise-in pointer-events-auto w-full max-w-[432px] bg-text-primary rounded-[14px] pl-4 pr-2 py-2 flex items-center gap-3" role="status">
            <p className="flex-1 min-w-0 font-dm font-medium text-[13px] text-white leading-snug py-1.5">{moveToast.message}</p>
            <button
              type="button"
              onClick={() => void undoMove()}
              className="shrink-0 px-3 py-2 rounded-full font-dm font-bold text-[13px] text-white underline underline-offset-2 active:bg-white/10"
            >
              Undo
            </button>
          </div>
        </div>
      )}
      {lastOutSheet && (
        <LastOutSheet
          dogName={stayDisplayName(lastOutSheet.dog, lastOutSheet.stay.dogKeys)}
          initial={lastOutSheet.initial}
          previewFor={(at) => previewFor(lastOutSheet.stay, lastOutSheet.dog.outingRule!, at)}
          onSave={(at) => {
            const { stay, task } = lastOutSheet
            setLastOutSheet(null)
            void saveLastOut(stay, at, task)
          }}
          onClose={() => setLastOutSheet(null)}
        />
      )}
    </div>
  )
}
