import { useState, useMemo, useEffect, useRef, type PointerEvent } from 'react'
import { CalendarPlus, UserPlus, CalendarDays, CalendarCheck2, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import TaskCard from '../components/TaskCard'
import { listTasksBetween, updateTaskStatus } from '../lib/tasks'
import { listStays } from '../lib/stays'
import { listDogs } from '../lib/dogs'
import {
  isGoogleCalendarConnected,
  listUpcomingGoogleEvents,
  parseRoverStyleTitle,
  type GoogleCalendarEvent,
} from '../lib/googleCalendar'
import type { Dog, Stay, Task, TaskStatus } from '../types'
import {
  addDays,
  formatDayHeading,
  formatTodayHeading,
  isSameDay,
  startOfWeek,
  toLocalDateKey,
} from '../utils/dateUtils'

const DISMISSED_KEY = 'heypup-dismissed-stay-suggestions'
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function TodayPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [activeDogs, setActiveDogs] = useState<{ dog: Dog; stay: Stay }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // One entry per calendar event. `candidates` normally holds a single dog;
  // more than one means the event's name matched several dogs we couldn't tell
  // apart, so the card asks the sitter to pick.
  const [suggestions, setSuggestions] = useState<{ candidates: Dog[]; event: GoogleCalendarEvent }[]>(
    [],
  )
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
        const matches: { candidates: Dog[]; event: GoogleCalendarEvent }[] = []
        const unmatched: { dogName: string; ownerName: string; event: GoogleCalendarEvent }[] = []
        for (const event of events) {
          if (event.start.slice(0, 10) !== todayKey) continue
          if (dismissedIds.includes(event.id)) continue
          const parsed = parseRoverStyleTitle(event.title)
          if (!parsed) continue
          const byName = dogs.filter((d) => d.name.toLowerCase() === parsed.dogName.toLowerCase())
          if (byName.length === 0) {
            unmatched.push({ dogName: parsed.dogName, ownerName: parsed.ownerName, event })
            continue
          }
          // Two dogs can share a name — the owner on the event usually tells
          // them apart. Only fall back to the full name-match set when the
          // owner narrows it to nothing (e.g. the owner is spelled differently
          // in the app), so we never silently pick the wrong dog.
          const byOwner = byName.filter(
            (d) => d.ownerName.trim().toLowerCase() === parsed.ownerName.trim().toLowerCase(),
          )
          const candidates = (byOwner.length > 0 ? byOwner : byName).filter(
            (d) => !activeDogIds.has(d.id),
          )
          if (candidates.length > 0) matches.push({ candidates, event })
        }
        setSuggestions(matches)
        setNewDogSuggestions(unmatched)
      })
      .catch(() => {}) // best-effort nudge, not worth surfacing as an error
    return () => {
      cancelled = true
    }
  }, [dogs, activeDogs, dismissedIds])

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

  function groupByDog(list: Task[]) {
    const map: Record<string, Task[]> = {}
    for (const t of list) {
      if (!map[t.dogName]) map[t.dogName] = []
      map[t.dogName].push(t)
    }
    return map
  }

  // Upcoming tasks stay in the main list; done ones move into a collapsible
  // "Past tasks" section so they don't push what's next further down the page.
  const pendingTasks = useMemo(() => dayTasks.filter((t) => t.status !== 'done'), [dayTasks])
  const pastTasks = useMemo(() => dayTasks.filter((t) => t.status === 'done'), [dayTasks])
  const pendingByDog = useMemo(() => groupByDog(pendingTasks), [pendingTasks])
  const pastByDog = useMemo(() => groupByDog(pastTasks), [pastTasks])
  const isMultiDog = useMemo(() => new Set(dayTasks.map((t) => t.dogName)).size > 1, [dayTasks])

  useEffect(() => {
    setShowPastTasks(false)
  }, [selectedKey])

  const isTodaySelected = isSameDay(selectedDate, new Date())
  const isPastSelected = !isTodaySelected && selectedDate < new Date()

  function updateStatus(id: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : undefined }
          : t,
      ),
    )
    updateTaskStatus(id, status).catch((e) => setError(e instanceof Error ? e.message : 'Could not save.'))
  }

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
                      onClick={() => setSelectedDate(day)}
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
              {suggestions.map(({ candidates, event }) => {
                const [dog] = candidates
                const ambiguous = candidates.length > 1
                return (
                  <div
                    key={event.id}
                    className="bg-[#eef1fd] border border-[#d3daf8] rounded-[16px] p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-full overflow-hidden bg-white flex items-center justify-center shrink-0">
                        {!ambiguous && dog.photoUrl ? (
                          <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
                        ) : (
                          <DogIcon size={18} className="text-text-muted" />
                        )}
                      </div>
                      <p className="font-dm font-bold text-[15px] text-text-primary leading-snug">
                        {ambiguous
                          ? `Which ${dog.name} are you taking care of today?`
                          : `Are you taking care of ${dog.name} starting today?`}
                      </p>
                    </div>
                    <p className="font-dm text-[12px] text-text-secondary mb-3">
                      {ambiguous
                        ? `You have ${candidates.length} dogs named ${dog.name} — pick the right one to start their stay.`
                        : `Found on your calendar — start a stay to generate ${dog.name}'s care tasks.`}
                    </p>
                    {ambiguous ? (
                      <>
                        <div className="flex flex-col gap-2 mb-3">
                          {candidates.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/stays/new?dog=${c.id}&start=${encodeURIComponent(event.start)}&end=${encodeURIComponent(event.end)}`,
                                )
                              }
                              className="flex items-center gap-3 bg-white rounded-[12px] px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
                            >
                              <div className="size-9 rounded-full overflow-hidden bg-[#f3f4f6] flex items-center justify-center shrink-0">
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
                          onClick={() =>
                            navigate(
                              `/stays/new?dog=${dog.id}&start=${encodeURIComponent(event.start)}&end=${encodeURIComponent(event.end)}`,
                            )
                          }
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
                  key={event.id}
                  className="bg-[#eef1fd] border border-[#d3daf8] rounded-[16px] p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-full overflow-hidden bg-white flex items-center justify-center shrink-0">
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
              <div className="flex gap-3 flex-wrap">
                {activeDogs.map(({ dog, stay }) => {
                  const endDate = new Date(stay.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  return (
                    <Link
                      key={dog.id}
                      to={`/dogs/${dog.id}`}
                      className="flex items-center gap-3 rounded-full pl-1.5 pr-4 py-1.5 bg-cream border border-border-light active:scale-[0.97] transition-transform"
                    >
                      <div className="size-9 rounded-full overflow-hidden bg-[#f3f4f6] flex items-center justify-center shrink-0">
                        {dog.photoUrl ? (
                          <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
                        ) : (
                          <DogIcon size={17} className="text-text-muted" />
                        )}
                      </div>
                      <div>
                        <p className="font-dm font-semibold text-[14px] text-text-primary leading-none">
                          {dog.name}
                        </p>
                        <p className="font-dm text-[12px] text-text-secondary mt-0.5">
                          Until {endDate}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Tasks grouped by dog */}
          {Object.entries(pendingByDog).map(([dogName, dogTasks]) => (
            <section key={dogName} className="px-6 mb-4">
              {isMultiDog && (
                <p className="font-dm font-bold text-[12px] text-coral uppercase tracking-widest mb-3">
                  {dogName}
                </p>
              )}
              <div>
                {dogTasks.map((task, i) => (
                  <div key={task.id} className={i === dogTasks.length - 1 ? '[&_.connector]:opacity-0' : ''}>
                    <TaskCard
                      task={task}
                      onDone={(id) => updateStatus(id, 'done')}
                      onUndo={(id) => updateStatus(id, 'pending')}
                      showDogName={isMultiDog}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {isTodaySelected && dayTasks.length > 0 && pendingTasks.length === 0 && (
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

          {pastTasks.length > 0 && (
            <section className="px-6 mb-4">
              <button
                type="button"
                onClick={() => setShowPastTasks((v) => !v)}
                className="font-dm font-bold text-[12px] text-text-muted uppercase tracking-widest mb-3"
              >
                {showPastTasks ? 'Hide' : 'Show'} past tasks ({pastTasks.length})
              </button>
              {showPastTasks &&
                Object.entries(pastByDog).map(([dogName, dogTasks]) => (
                  <div key={dogName} className="mb-4 last:mb-0">
                    {/* Always labeled, even for a single dog — once a stay ends,
                        the Active Care card that named the dog is gone, so this
                        is the only thing left saying whose tasks these were. */}
                    <p className="font-dm font-bold text-[12px] text-coral uppercase tracking-widest mb-3">
                      {dogName}
                    </p>
                    {dogTasks.map((task, i) => (
                      <div
                        key={task.id}
                        className={i === dogTasks.length - 1 ? '[&_.connector]:opacity-0' : ''}
                      >
                        <TaskCard
                          task={task}
                          onDone={(id) => updateStatus(id, 'done')}
                          onUndo={(id) => updateStatus(id, 'pending')}
                          showDogName={isMultiDog}
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
    </div>
  )
}
