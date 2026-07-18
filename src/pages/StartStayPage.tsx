import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronDown, Check, Search, X } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import { TIME_OPTIONS } from '../utils/timeOptions'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import BottomNav from '../components/BottomNav'
import { mockDogs } from '../data/mockDogs'
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

function DogPickerSheet({
  selectedDogId,
  onSelect,
  onClose,
}: {
  selectedDogId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  const dogs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...mockDogs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((d) => !q || `${d.name} ${d.breed} ${d.ownerName}`.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-cream rounded-t-[22px] pt-5 pb-8 max-h-[75svh] flex flex-col">
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
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dogs"
              className="flex-1 min-w-0 bg-transparent font-dm text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="px-6 overflow-y-auto flex flex-col gap-2">
          {dogs.map((dog) => {
            const isSelected = dog.id === selectedDogId
            return (
              <button
                key={dog.id}
                onClick={() => onSelect(dog.id)}
                className={`flex items-center gap-3 p-3 rounded-[14px] border transition-colors text-left shrink-0 ${
                  isSelected
                    ? 'border-coral bg-[#fff5f3]'
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
                {isSelected && <Check size={18} className="text-coral shrink-0" strokeWidth={2.5} />}
              </button>
            )
          })}
          {dogs.length === 0 && (
            <p className="font-dm text-[14px] text-text-secondary text-center py-8">
              No dogs match “{query}”.
            </p>
          )}
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
            className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary focus:outline-none focus:border-coral transition-colors appearance-none"
          />
          <CalendarDays
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
        <div className="relative w-[132px] shrink-0">
          <select
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full bg-white border border-border-light rounded-[12px] pl-4 pr-8 py-3 font-dm text-[15px] text-text-primary focus:outline-none focus:border-coral transition-colors appearance-none"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}

export default function StartStayPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const preselectedDogId = params.get('dog') ?? ''

  const now = new Date()
  const weekLater = new Date(now)
  weekLater.setDate(now.getDate() + 7)

  const [selectedDogId, setSelectedDogId] = useState(preselectedDogId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [startDay, setStartDay] = useState(toDateValue(now))
  const [startTime, setStartTime] = useState(toQuarterTimeValue(now))
  const [endDay, setEndDay] = useState(toDateValue(weekLater))
  const [endTime, setEndTime] = useState(toQuarterTimeValue(weekLater))
  const [notes, setNotes] = useState('')

  const selectedDog = mockDogs.find((d) => d.id === selectedDogId)
  const startDate = `${startDay}T${startTime}`
  const endDate = `${endDay}T${endTime}`

  function handleGenerate() {
    if (!isValid) return
    navigate('/stays/preview', {
      state: { dogId: selectedDogId, startDate, endDate, notes },
    })
  }

  const isValid =
    selectedDogId && startDay && endDay && new Date(endDate) > new Date(startDate)

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader back title="Start Stay" />

      <div className="px-6 mt-4 flex flex-col gap-5">
        {/* Dog selector */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Which dog?
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            className={`w-full flex items-center gap-3 p-3 rounded-[14px] border transition-colors text-left ${
              selectedDog ? 'border-coral bg-[#fff5f3]' : 'border-border-light bg-white active:bg-gray-50'
            }`}
          >
            {selectedDog ? (
              <>
                <DogAvatar dog={selectedDog} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-dm font-semibold text-[15px] text-text-primary leading-none">
                    {selectedDog.name}
                  </p>
                  <p className="font-dm text-[13px] text-text-secondary mt-0.5 truncate">
                    {selectedDog.breed} · {selectedDog.ownerName}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="size-11 rounded-[10px] bg-[#f3f4f6] shrink-0 flex items-center justify-center">
                  <DogIcon size={20} className="text-text-muted" />
                </div>
                <p className="flex-1 font-dm text-[15px] text-text-secondary">Choose a dog</p>
              </>
            )}
            <ChevronDown size={18} className="text-text-muted shrink-0" />
          </button>
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
              onDayChange={setStartDay}
              onTimeChange={setStartTime}
            />
            <DateTimeField
              label="End"
              day={endDay}
              time={endTime}
              onDayChange={setEndDay}
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
        <Button fullWidth size="lg" onClick={handleGenerate} disabled={!isValid}>
          Generate Care Tasks
        </Button>

        {selectedDog && (
          <p className="font-dm text-[13px] text-text-secondary text-center">
            Tasks will be generated from {selectedDog.name}'s care schedule.
          </p>
        )}
      </div>

      {pickerOpen && (
        <DogPickerSheet
          selectedDogId={selectedDogId}
          onSelect={(id) => {
            setSelectedDogId(id)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  )
}
