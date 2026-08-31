import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronDown, Check, Plus, Search, Trash2, X } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import { TimePickerButton } from '../components/TimePicker'
import PageHeader from '../components/PageHeader'
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

function DogAvatar({ dog, size }: { dog: Dog; size: number }) {
  return (
    <div
      className="rounded-[10px] overflow-hidden bg-[#f3f4f6] shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {dog.photoUrl ? (
        <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
      ) : (
        <DogIcon size={size * 0.5} className="text-text-muted" />
      )}
    </div>
  )
}

const MAX_DOGS_PER_STAY = 3

function DogPickerSheet({
  dogs,
  selectedDogIds,
  onToggle,
  onClose,
  onAddDog,
}: {
  dogs: Dog[]
  selectedDogIds: string[]
  onToggle: (id: string) => void
  onClose: () => void
  onAddDog: () => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...dogs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((d) => !q || `${d.name} ${d.breed} ${d.ownerName}`.toLowerCase().includes(q))
  }, [query, dogs])

  const atLimit = selectedDogIds.length >= MAX_DOGS_PER_STAY

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-cream rounded-t-[22px] pt-5 pb-8 max-h-[75svh] flex flex-col">
        <div className="px-6 flex items-start justify-between mb-3">
          <div>
            <p className="font-outfit font-bold text-[22px] text-text-primary leading-tight">
              Choose dogs
            </p>
            <p className="font-dm text-[13px] text-text-secondary mt-0.5">
              Up to {MAX_DOGS_PER_STAY} dogs from the same owner can share one stay.
            </p>
          </div>
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

        <div className="px-6 overflow-y-auto flex flex-col gap-2">
          {filtered.map((dog) => {
            const isSelected = selectedDogIds.includes(dog.id)
            const disabled = !isSelected && atLimit
            return (
              <button
                key={dog.id}
                onClick={() => !disabled && onToggle(dog.id)}
                disabled={disabled}
                className={`flex items-center gap-3 p-3 rounded-[14px] border transition-colors text-left shrink-0 ${
                  isSelected
                    ? 'border-coral bg-[#fff5f3]'
                    : disabled
                      ? 'border-border-light bg-white opacity-50'
                      : 'border-border-light bg-white active:bg-gray-50'
                }`}
              >
                <DogAvatar dog={dog} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-dm font-semibold text-[15px] text-text-primary leading-none">
                    {dog.name}
                  </p>
                  <p className="font-dm text-[13px] text-text-secondary mt-0.5 truncate">
                    {dog.breed} · {dog.ownerName}
                  </p>
                </div>
                <div
                  className={`size-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-coral bg-coral' : 'border-border-light'
                  }`}
                >
                  {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="font-dm text-[14px] text-text-secondary text-center py-8">
              No dogs match “{query}”.
            </p>
          )}
        </div>

        <div className="px-6 pt-3 shrink-0 flex flex-col gap-2">
          <button
            onClick={onAddDog}
            className="w-full flex items-center gap-3 p-3 rounded-[14px] border border-dashed border-coral/40 text-left active:bg-[#fff5f3] transition-colors"
          >
            <div className="size-11 rounded-[10px] bg-[#fff5f3] shrink-0 flex items-center justify-center">
              <Plus size={20} className="text-coral" />
            </div>
            <p className="font-dm font-semibold text-[15px] text-coral">Add New Dog</p>
          </button>
          <Button fullWidth onClick={onClose} disabled={selectedDogIds.length === 0}>
            Done
          </Button>
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
}: {
  label: string
  day: string
  time: string
  onDayChange: (v: string) => void
  onTimeChange: (v: string) => void
}) {
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
            className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary focus:outline-none focus:border-coral transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <CalendarDays
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
        <TimePickerButton
          value={time}
          onChange={onTimeChange}
          className="w-[132px] shrink-0 bg-white border border-border-light rounded-[12px] pl-4 pr-8 py-3 font-dm text-[15px] text-text-primary"
        />
      </div>
    </div>
  )
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

  const preselectedDogId = params.get('dog')

  const now = new Date()
  const defaultStart = new Date(now)
  defaultStart.setHours(9, 0, 0, 0)
  const defaultEnd = new Date(now)
  defaultEnd.setHours(17, 0, 0, 0)

  const startParam = parseDateParam(params.get('start'), defaultStart)
  const endParam = parseDateParam(params.get('end'), defaultEnd)

  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStay, setLoadingStay] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(
    preselectedDogId ? [preselectedDogId] : [],
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [startDay, setStartDay] = useState(startParam.day)
  const [startTime, setStartTime] = useState(startParam.time)
  const [endDay, setEndDay] = useState(endParam.day)
  const [endTime, setEndTime] = useState(endParam.time)
  const [endDayEdited, setEndDayEdited] = useState(isEditMode)
  const [notes, setNotes] = useState('')
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
        setSelectedDogIds(stay.dogIds)
        const start = parseDateParam(stay.startDate, now)
        const end = parseDateParam(stay.endDate, now)
        setStartDay(start.day)
        setStartTime(start.time)
        setEndDay(end.day)
        setEndTime(end.time)
        setEndDayEdited(true)
        setNotes(stay.notes ?? '')
      })
      .finally(() => !cancelled && setLoadingStay(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, stayId])

  const selectedDogs = dogs.filter((d) => selectedDogIds.includes(d.id))
  const primaryDog = selectedDogs[0]
  const namesLabel = selectedDogs.map((d) => d.name).join(' & ')
  const startDate = combineLocalDateTime(startDay, startTime)
  const endDate = combineLocalDateTime(endDay, endTime)

  function handleGenerate() {
    if (!isValid) return
    navigate('/stays/preview', {
      state: { dogIds: selectedDogIds, startDate, endDate, notes },
    })
  }

  async function handleSaveEdit() {
    if (!isValid || !stayId || selectedDogs.length === 0 || saving) return
    setSaving(true)
    setError(null)
    try {
      const stay = await updateStay(stayId, { dogIds: selectedDogIds, startDate, endDate, notes })
      const oldTasks = await listTasksByStay(stayId)
      if (isGoogleCalendarConnected()) {
        // Clean up whatever these were pushed as before regenerating, so
        // editing a stay doesn't leave stale duplicates behind in Google.
        await deletePushedTasksFromGoogle(oldTasks).catch(() => {})
      }
      await deleteTasksByStay(stayId)
      const newTasks = generateTasksForStay(selectedDogs, stay)
      // Push the rows createTasks returns, not newTasks — only they carry
      // real DB ids, which the push needs to save each Google event ref.
      const createdTasks = await createTasks(newTasks)
      if (isGoogleCalendarConnected()) {
        pushTasksToGoogleCalendar(createdTasks).catch(() => {})
      }
      navigate(`/dogs/${primaryDog.id}`)
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
      navigate(primaryDog ? `/dogs/${primaryDog.id}` : '/')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete. Please try again.')
      setDeleting(false)
    }
  }

  const isValid =
    selectedDogIds.length > 0 && startDay && endDay && new Date(endDate) > new Date(startDate)

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
            Which dog(s)?
          </p>
          {selectedDogs.length > 0 ? (
            <div className="flex flex-col gap-2">
              {selectedDogs.map((dog) => (
                <div
                  key={dog.id}
                  className="w-full flex items-center gap-3 p-3 rounded-[14px] border border-border-light bg-white"
                >
                  <DogAvatar dog={dog} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-dm font-semibold text-[15px] text-text-primary leading-none">
                      {dog.name}
                    </p>
                    <p className="font-dm text-[13px] text-text-secondary mt-0.5 truncate">
                      {dog.breed} · {dog.ownerName}
                    </p>
                  </div>
                  {!isEditMode && (
                    <button
                      onClick={() =>
                        setSelectedDogIds((ids) => ids.filter((id) => id !== dog.id))
                      }
                      className="size-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-text-secondary shrink-0"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {!isEditMode && selectedDogs.length < MAX_DOGS_PER_STAY && (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-[14px] border border-dashed border-coral/40 text-left active:bg-[#fff5f3] transition-colors"
                >
                  <div className="size-11 rounded-[10px] bg-[#fff5f3] shrink-0 flex items-center justify-center">
                    <Plus size={20} className="text-coral" />
                  </div>
                  <p className="font-dm font-semibold text-[15px] text-coral">Add another dog</p>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => !loading && !isEditMode && setPickerOpen(true)}
              disabled={loading || isEditMode}
              className="w-full flex items-center gap-3 p-3 rounded-[14px] border border-border-light bg-white transition-colors text-left active:bg-gray-50"
            >
              <div className="size-11 rounded-[10px] bg-[#f3f4f6] shrink-0 flex items-center justify-center">
                <DogIcon size={20} className="text-text-muted" />
              </div>
              <p className="flex-1 font-dm text-[15px] text-text-secondary">
                {loading ? 'Loading dogs…' : 'Choose dogs'}
              </p>
              <ChevronDown size={18} className="text-text-muted shrink-0" />
            </button>
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
          disabled={!isValid || saving}
        >
          {isEditMode ? (saving ? 'Saving…' : 'Save Changes') : 'Generate Care Tasks'}
        </Button>

        {selectedDogs.length > 0 && (
          <p className="font-dm text-[13px] text-text-secondary text-center">
            {isEditMode
              ? `Care tasks will be regenerated from ${namesLabel}'s care schedule for the new dates.`
              : `Tasks will be generated from ${namesLabel}'s care schedule.`}
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
              {selectedDogs.length > 0 ? ` for ${namesLabel}` : ''}. This can't be undone.
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
          selectedDogIds={selectedDogIds}
          onToggle={(id) =>
            setSelectedDogIds((ids) =>
              ids.includes(id)
                ? ids.filter((existing) => existing !== id)
                : ids.length < MAX_DOGS_PER_STAY
                  ? [...ids, id]
                  : ids,
            )
          }
          onClose={() => setPickerOpen(false)}
          onAddDog={() => navigate('/dogs/new')}
        />
      )}
    </div>
  )
}
