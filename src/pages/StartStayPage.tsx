import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronDown, Check, Plus, Search, Trash2, X } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import { TimePickerButton } from '../components/TimePicker'
import PageHeader from '../components/PageHeader'
import DogPhotoStack, { DogPhoto } from '../components/DogPhotoStack'
import Button from '../components/Button'
import { listDogs } from '../lib/dogs'
import { getStay, updateStay, deleteStay } from '../lib/stays'
import { createTasks, deleteTasksByStay, listTasksByStay } from '../lib/tasks'
import { generateTasksForStay } from '../utils/taskGenerator'
import { combineLocalDateTime } from '../utils/dateUtils'
import {
  isGoogleCalendarConnected,
  pushTasksToGoogleCalendar,
  deletePushedTasksFromGoogle,
} from '../lib/googleCalendar'
import type { Dog } from '../types'
import {
  dogDisplayBreed,
  dogDisplayName,
  dogGroup,
  dogSearchText,
  dogsAtHome,
  joinDogNames,
  stayDisplayName,
  stayingDogs,
} from '../utils/dogDisplay'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Next quarter-hour from the given date, as "HH:mm". */
function toQuarterTimeValue(date: Date): string {
  const d = new Date(date)
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Rounds up to the next whole hour (or keeps it, if already on the hour). */
function roundUpToHour(date: Date): Date {
  const d = new Date(date)
  if (d.getMinutes() > 0 || d.getSeconds() > 0 || d.getMilliseconds() > 0) {
    d.setHours(d.getHours() + 1, 0, 0, 0)
  } else {
    d.setSeconds(0, 0)
  }
  return d
}

/** A profile's photo — or its dogs stacked diagonally, first dog in front, like the Dogs page cards. */
function ProfilePhoto({ dog, ringClassName }: { dog: Dog; ringClassName: string }) {
  return (
    <DogPhotoStack
      dogs={[dog, ...dog.additionalDogs]}
      size={44}
      radius={10}
      stackRadius={10}
      ringClassName={ringClassName}
    />
  )
}

function DogPickerSheet({
  dogs,
  selectedDogId,
  onSelect,
  onClose,
  onAddDog,
}: {
  dogs: Dog[]
  selectedDogId: string
  onSelect: (id: string) => void
  onClose: () => void
  onAddDog: () => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...dogs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((d) => !q || dogSearchText(d).includes(q))
  }, [query, dogs])

  // Lock the sheet to the height it opened at, so filtering doesn't make it
  // collapse while typing.
  const sheetRef = useRef<HTMLDivElement>(null)
  const [lockedHeight, setLockedHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (sheetRef.current) setLockedHeight(sheetRef.current.offsetHeight)
  }, [])

  // iOS doesn't resize the layout viewport for the keyboard — it scrolls the
  // page instead, which shoves a bottom sheet off-screen. Pin the overlay to
  // the *visual* viewport so the sheet always sits right above the keyboard.
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setViewport({ top: vv.offsetTop, height: vv.height })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      document.documentElement.style.overflow = prevOverflow
    }
  }, [])

  return (
    <div
      className="fixed inset-x-0 top-0 h-svh z-[60] flex items-end justify-center"
      style={viewport ? { top: viewport.top, height: viewport.height } : undefined}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={sheetRef}
        style={
          lockedHeight
            ? {
                height: lockedHeight,
                // With the keyboard up, shrink only as much as needed to fit.
                maxHeight: viewport ? viewport.height - 24 : undefined,
              }
            : undefined
        }
        className="relative w-full max-w-[430px] bg-cream rounded-t-[22px] pt-5 pb-8 max-h-[75svh] flex flex-col"
      >
        <div className="px-6 flex items-start justify-between mb-3">
          <p className="font-outfit font-bold text-[22px] text-text-primary leading-tight">
            Choose a dog
          </p>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-text-secondary shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 mb-3">
          <div className="bg-card rounded-full px-4 py-3 flex items-center gap-2.5">
            <Search size={18} className="text-text-muted shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dogs"
              className="flex-1 min-w-0 bg-transparent font-dm text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="px-6 flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {filtered.map((dog) => {
            const isSelected = dog.id === selectedDogId
            return (
              <button
                key={dog.id}
                onClick={() => onSelect(dog.id)}
                className={`flex items-center gap-3 p-3 rounded-[22px] border transition-colors text-left shrink-0 ${
                  isSelected
                    ? 'border-coral bg-[#fff5f3]'
                    : 'border-border-light bg-white active:bg-gray-50'
                }`}
              >
                <ProfilePhoto dog={dog} ringClassName={isSelected ? 'ring-[#fff5f3]' : 'ring-white'} />
                <div className="flex-1 min-w-0">
                  <p className="font-dm font-semibold text-[15px] text-text-primary leading-none">
                    {dogDisplayName(dog)}
                  </p>
                  <p className="font-dm text-[13px] text-text-secondary mt-0.5 truncate">
                    {dogDisplayBreed(dog)} · {dog.ownerName}
                  </p>
                </div>
                {isSelected && <Check size={18} className="text-coral shrink-0" strokeWidth={2.5} />}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="font-dm text-[14px] text-text-secondary text-center py-8">
              No dogs match “{query}”.
            </p>
          )}
        </div>

        <div className="px-6 pt-3 shrink-0">
          <button
            onClick={onAddDog}
            className="w-full flex items-center gap-3 p-3 rounded-[22px] border border-dashed border-coral/40 text-left active:bg-[#fff5f3] transition-colors"
          >
            <div className="size-11 rounded-[10px] bg-[#fff5f3] shrink-0 flex items-center justify-center">
              <Plus size={20} className="text-coral" />
            </div>
            <p className="font-dm font-semibold text-[15px] text-coral">Add New Dog</p>
          </button>
        </div>
      </div>
    </div>
  )
}

function DateTimeField({
  label,
  day,
  time,
  onDayChange,
  onTimeChange,
  invalid = false,
}: {
  label: string
  day: string
  time: string
  onDayChange: (v: string) => void
  onTimeChange: (v: string) => void
  /** Struck through in red — e.g. an end that falls before the start. */
  invalid?: boolean
}) {
  // Red + strikethrough, like iOS Calendar. The ::-webkit-datetime-edit
  // variants reach the date input's inner text, which ignores the input's own
  // text-decoration on iOS Safari.
  const invalidText = invalid
    ? 'text-[#b91c1c] line-through decoration-[#b91c1c] [&::-webkit-datetime-edit]:text-[#b91c1c] [&::-webkit-datetime-edit]:line-through'
    : 'text-text-primary'
  return (
    <div>
      <label className="block font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            type="date"
            value={day}
            onChange={(e) => onDayChange(e.target.value)}
            onClick={(e) => {
              const input = e.currentTarget
              if (typeof input.showPicker === 'function') input.showPicker()
            }}
            className={`w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] ${invalidText} focus:outline-none focus:border-coral transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0`}
          />
          <CalendarDays
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
        <TimePickerButton
          value={time}
          onChange={onTimeChange}
          className={`w-[132px] shrink-0 bg-white border border-border-light rounded-[12px] pl-4 pr-8 py-3 font-dm text-[15px] ${invalidText}`}
        />
      </div>
    </div>
  )
}

/** Order-insensitive key for comparing dog selections; null (every dog) → "". */
function dogKeysId(keys: string[] | null): string {
  return (keys ?? []).slice().sort().join(',')
}

/** Parses an optional ISO date/datetime query param into day+time fields,
 *  falling back to the given default when absent or unparseable. */
function parseDateParam(param: string | null, fallback: Date): { day: string; time: string } {
  if (!param) return { day: toDateValue(fallback), time: toQuarterTimeValue(fallback) }
  const parsed = new Date(param.length === 10 ? `${param}T00:00:00` : param)
  if (Number.isNaN(parsed.getTime())) return { day: toDateValue(fallback), time: toQuarterTimeValue(fallback) }
  return { day: toDateValue(parsed), time: toQuarterTimeValue(parsed) }
}

export default function StartStayPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { stayId } = useParams<{ stayId: string }>()
  const isEditMode = Boolean(stayId)

  const preselectedDogId = params.get('dog') ?? ''

  const now = new Date()
  const defaultStart = roundUpToHour(now)
  const fivePmToday = new Date(now)
  fivePmToday.setHours(17, 0, 0, 0)
  const defaultEnd =
    defaultStart > fivePmToday
      ? new Date(
          defaultStart.getFullYear(),
          defaultStart.getMonth(),
          defaultStart.getDate() + 1,
          defaultStart.getHours(),
          defaultStart.getMinutes(),
        )
      : fivePmToday

  const startParam = parseDateParam(params.get('start'), defaultStart)
  const endParam = parseDateParam(params.get('end'), defaultEnd)

  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStay, setLoadingStay] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDogId, setSelectedDogId] = useState(preselectedDogId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [startDay, setStartDay] = useState(startParam.day)
  const [startTime, setStartTime] = useState(startParam.time)
  const [endDay, setEndDay] = useState(endParam.day)
  const [endTime, setEndTime] = useState(endParam.time)
  const [endDayEdited, setEndDayEdited] = useState(isEditMode)
  const [notes, setNotes] = useState('')
  // Which dogs on the profile are staying; null = every dog
  // A calendar suggestion for only some dogs on a profile passes ?keys=.
  const [dogKeys, setDogKeys] = useState<string[] | null>(
    () => params.get('keys')?.split(',').filter(Boolean) || null,
  )
  // Loaded values in edit mode — Save stays disabled until something differs
  const [original, setOriginal] = useState<{
    startDate: string
    endDate: string
    notes: string
    dogKeys: string[] | null
  } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleStartDayChange(day: string) {
    setStartDay(day)
    if (!endDayEdited) setEndDay(day)
  }

  function handleEndDayChange(day: string) {
    setEndDayEdited(true)
    setEndDay(day)
  }

  useEffect(() => {
    listDogs()
      .then(setDogs)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isEditMode || !stayId) return
    let cancelled = false
    getStay(stayId)
      .then((stay) => {
        if (cancelled || !stay) return
        setSelectedDogId(stay.dogId)
        const start = parseDateParam(stay.startDate, now)
        const end = parseDateParam(stay.endDate, now)
        setStartDay(start.day)
        setStartTime(start.time)
        setEndDay(end.day)
        setEndTime(end.time)
        setEndDayEdited(true)
        setNotes(stay.notes ?? '')
        setDogKeys(stay.dogKeys ?? null)
        setOriginal({
          startDate: combineLocalDateTime(start.day, start.time),
          endDate: combineLocalDateTime(end.day, end.time),
          notes: stay.notes ?? '',
          dogKeys: stay.dogKeys ?? null,
        })
      })
      .finally(() => !cancelled && setLoadingStay(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, stayId])

  const selectedDog = dogs.find((d) => d.id === selectedDogId)
  const group = selectedDog ? dogGroup(selectedDog) : []
  const stayingKeys = new Set(selectedDog ? stayingDogs(selectedDog, dogKeys).map((d) => d.key) : [])
  const homeNames = selectedDog ? joinDogNames(dogsAtHome(selectedDog, dogKeys).map((d) => d.name)) : ''
  const stayName = selectedDog ? stayDisplayName(selectedDog, dogKeys) : ''

  function toggleStaying(key: string) {
    const next = stayingKeys.has(key)
      ? [...stayingKeys].filter((k) => k !== key)
      : [...stayingKeys, key]
    if (next.length === 0) return // at least one dog has to be staying
    // Profile order, and null once everyone's back on
    setDogKeys(next.length === group.length ? null : group.map((d) => d.key).filter((k) => next.includes(k)))
  }

  const startDate = combineLocalDateTime(startDay, startTime)
  const endDate = combineLocalDateTime(endDay, endTime)

  function handleGenerate() {
    if (!isValid) return
    navigate('/stays/preview', {
      state: { dogId: selectedDogId, startDate, endDate, notes, dogKeys: dogKeys ?? undefined },
    })
  }

  async function handleSaveEdit() {
    if (!isValid || !hasChanges || !stayId || !selectedDog || saving) return
    setSaving(true)
    setError(null)
    try {
      const stay = await updateStay(stayId, {
        startDate,
        endDate,
        notes,
        // Only touched when changed, so an untouched stay saves even before
        // the dog_keys column exists
        dogKeys: dogKeysChanged ? dogKeys : undefined,
      })
      const oldTasks = await listTasksByStay(stayId)
      if (isGoogleCalendarConnected()) {
        // Clean up whatever these were pushed as before regenerating, so
        // editing a stay doesn't leave stale duplicates behind in Google.
        await deletePushedTasksFromGoogle(oldTasks).catch(() => {})
      }
      await deleteTasksByStay(stayId)
      const newTasks = generateTasksForStay(selectedDog, stay)
      // Push the rows createTasks returns, not newTasks — only they carry
      // real DB ids, which the push needs to save each Google event ref.
      const createdTasks = await createTasks(newTasks)
      if (isGoogleCalendarConnected()) {
        pushTasksToGoogleCalendar(createdTasks).catch(() => {})
      }
      navigate(`/dogs/${selectedDog.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes. Please try again.')
      setSaving(false)
    }
  }

  async function handleDeleteStay() {
    if (!stayId || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const tasks = await listTasksByStay(stayId)
      if (isGoogleCalendarConnected()) {
        await deletePushedTasksFromGoogle(tasks).catch(() => {})
      }
      await deleteTasksByStay(stayId)
      await deleteStay(stayId)
      // replace: Back shouldn't return to the edit page of a stay that's gone.
      navigate(selectedDog ? `/dogs/${selectedDog.id}` : '/today', { replace: true })
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete. Please try again.')
      setDeleting(false)
    }
  }

  // Only flag it once both ends are filled in — an empty field isn't "wrong".
  const endBeforeStart =
    !!startDay && !!endDay && new Date(endDate) <= new Date(startDate)

  const isValid =
    selectedDogId && startDay && endDay && new Date(endDate) > new Date(startDate)
  const dogKeysChanged = original !== null && dogKeysId(dogKeys) !== dogKeysId(original.dogKeys)
  const hasChanges =
    !isEditMode ||
    (original !== null &&
      (startDate !== original.startDate ||
        endDate !== original.endDate ||
        notes !== original.notes ||
        dogKeysChanged))

  if (loadingStay) {
    return (
      <div className="min-h-svh bg-cream flex items-center justify-center px-6">
        <p className="font-dm text-[14px] text-text-secondary">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader back title={isEditMode ? 'Edit Stay' : 'Start Stay'} />

      <div className="px-6 mt-4 flex flex-col gap-5">
        {error && (
          <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}

        {/* Dog selector */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Which dog?
          </p>
          <button
            onClick={() => !loading && !isEditMode && setPickerOpen(true)}
            disabled={loading || isEditMode}
            className={`w-full flex items-center gap-3 p-3 rounded-[22px] border border-border-light bg-white transition-colors text-left ${
              selectedDog ? '' : 'active:bg-gray-50'
            } ${isEditMode ? 'opacity-70' : ''}`}
          >
            {selectedDog ? (
              <>
                <ProfilePhoto dog={selectedDog} ringClassName="ring-white" />
                <div className="flex-1 min-w-0">
                  <p className="font-dm font-semibold text-[15px] text-text-primary leading-none">
                    {dogDisplayName(selectedDog)}
                  </p>
                  <p className="font-dm text-[13px] text-text-secondary mt-0.5 truncate">
                    {dogDisplayBreed(selectedDog)} · {selectedDog.ownerName}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="size-11 rounded-[10px] bg-[#f3f4f6] shrink-0 flex items-center justify-center">
                  <DogIcon size={20} className="text-text-muted" />
                </div>
                <p className="flex-1 font-dm text-[15px] text-text-secondary">
                  {loading ? 'Loading dogs…' : 'Choose a dog'}
                </p>
              </>
            )}
            {!isEditMode && <ChevronDown size={18} className="text-text-muted shrink-0" />}
          </button>

          {/* Multi-dog profiles: everyone's on by default, tap a dog to leave it home */}
          {group.length > 1 && (
            <>
              <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mt-5 mb-3">
                Who's staying?
              </p>
              <div className="flex flex-wrap gap-2">
                {group.map((d) => {
                  const on = stayingKeys.has(d.key)
                  return (
                    <button
                      key={d.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleStaying(d.key)}
                      className={`flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1.5 border transition-colors ${
                        on ? 'border-coral bg-[#fff5f3]' : 'border-border-light bg-white active:bg-gray-50'
                      }`}
                    >
                      <div className={on ? '' : 'opacity-40'}>
                        {/* Round inside the pill (Shape Match Rule) */}
                        <DogPhoto src={d.photoUrl} alt={d.name} iconSize={14} className="size-7 rounded-full shrink-0" />
                      </div>
                      <span
                        className={`font-dm font-semibold text-[14px] ${
                          on ? 'text-text-primary' : 'text-text-muted'
                        }`}
                      >
                        {d.name}
                      </span>
                      {on ? (
                        <Check size={16} className="text-coral" strokeWidth={2.5} />
                      ) : (
                        <Plus size={16} className="text-text-muted" />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </section>

        {/* Date range */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Stay Dates
          </p>
          <div className="flex flex-col gap-3">
            <DateTimeField
              label="Start"
              day={startDay}
              time={startTime}
              onDayChange={handleStartDayChange}
              onTimeChange={setStartTime}
            />
            <DateTimeField
              label="End"
              day={endDay}
              time={endTime}
              onDayChange={handleEndDayChange}
              onTimeChange={setEndTime}
              invalid={endBeforeStart}
            />
          </div>
        </section>

        {/* Stay notes */}
        <section>
          <label className="block font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Owner travel details, special instructions..."
            className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors resize-none"
          />
        </section>

        {/* CTA */}
        <Button
          fullWidth
          size="lg"
          onClick={isEditMode ? () => void handleSaveEdit() : handleGenerate}
          disabled={!isValid || !hasChanges || saving}
        >
          {isEditMode ? (saving ? 'Saving…' : 'Save Changes') : 'Generate Care Tasks'}
        </Button>

        {selectedDog && (
          <p className="font-dm text-[13px] text-text-secondary text-center">
            {isEditMode
              ? `Care tasks will be regenerated from ${stayName}'s care schedule for the new dates.`
              : `Tasks will be generated from ${stayName}'s care schedule.`}
            {homeNames && ` Tasks just for ${homeNames} are skipped.`}
          </p>
        )}

        {isEditMode && (
          <Button fullWidth variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={18} />
            Delete Stay
          </Button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-[380px] bg-cream rounded-[22px] p-6">
            <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight mb-2">
              Delete this stay?
            </p>
            <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
              This removes the stay and every care task generated for it
              {selectedDog ? ` for ${stayName}` : ''}. This can't be undone.
            </p>
            {deleteError && (
              <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3 mb-3">
                <p className="font-dm text-[13px] text-[#b91c1c]">{deleteError}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                variant="danger"
                disabled={deleting}
                onClick={() => void handleDeleteStay()}
              >
                {deleting ? 'Deleting…' : 'Delete Stay'}
              </Button>
              <Button fullWidth variant="ghost" disabled={deleting} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <DogPickerSheet
          dogs={dogs}
          selectedDogId={selectedDogId}
          onSelect={(id) => {
            setSelectedDogId(id)
            setDogKeys(null)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
          onAddDog={() => navigate('/dogs/new')}
        />
      )}
    </div>
  )
}
