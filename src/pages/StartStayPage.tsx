import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dog as DogIcon, CalendarDays } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import BottomNav from '../components/BottomNav'
import { mockDogs } from '../data/mockDogs'

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function StartStayPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const preselectedDogId = params.get('dog') ?? ''

  const now = new Date()
  const weekLater = new Date(now)
  weekLater.setDate(now.getDate() + 7)

  const [selectedDogId, setSelectedDogId] = useState(preselectedDogId)
  const [startDate, setStartDate] = useState(toLocalDatetimeValue(now))
  const [endDate, setEndDate] = useState(toLocalDatetimeValue(weekLater))
  const [notes, setNotes] = useState('')

  const selectedDog = mockDogs.find((d) => d.id === selectedDogId)

  function handleGenerate() {
    if (!selectedDogId || !startDate || !endDate) return

    // Navigate to task preview with stay details in state
    navigate('/stays/preview', {
      state: {
        dogId: selectedDogId,
        startDate,
        endDate,
        notes,
      },
    })
  }

  const isValid = selectedDogId && startDate && endDate && new Date(endDate) > new Date(startDate)

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader back title="Start Stay" />

      <div className="px-6 mt-4 flex flex-col gap-5">
        {/* Dog selector */}
        <section>
          <p className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Which dog?
          </p>
          <div className="flex flex-col gap-2">
            {mockDogs.map((dog) => {
              const isSelected = dog.id === selectedDogId
              return (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDogId(dog.id)}
                  className={`flex items-center gap-3 p-3 rounded-[14px] border transition-colors text-left ${
                    isSelected
                      ? 'border-coral bg-[#fff5f3]'
                      : 'border-border-light bg-white active:bg-gray-50'
                  }`}
                >
                  <div className="size-12 rounded-[10px] overflow-hidden bg-[#f3f4f6] shrink-0 flex items-center justify-center">
                    {dog.photoUrl ? (
                      <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
                    ) : (
                      <DogIcon size={22} className="text-[#d1d5db]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-teachers font-semibold text-[16px] text-text-primary leading-none">
                      {dog.name}
                    </p>
                    <p className="font-gabarito text-[13px] text-text-secondary mt-0.5">
                      {dog.breed} · {dog.ownerName}
                    </p>
                  </div>
                  <div
                    className={`size-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-coral bg-coral' : 'border-border-light'
                    }`}
                  >
                    {isSelected && (
                      <div className="size-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Date range */}
        <section>
          <p className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Stay Dates
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block font-gabarito font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-1.5">
                Start
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-gabarito text-[15px] text-text-primary focus:outline-none focus:border-coral transition-colors appearance-none"
                />
                <CalendarDays
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-gabarito font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-1.5">
                End
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-gabarito text-[15px] text-text-primary focus:outline-none focus:border-coral transition-colors appearance-none"
                />
                <CalendarDays
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stay notes */}
        <section>
          <label className="block font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Owner travel details, special instructions..."
            className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-gabarito text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors resize-none"
          />
        </section>

        {/* CTA */}
        <Button fullWidth size="lg" onClick={handleGenerate} disabled={!isValid}>
          Generate Care Tasks
        </Button>

        {selectedDog && (
          <p className="font-gabarito text-[13px] text-text-secondary text-center">
            Tasks will be generated from {selectedDog.name}'s care schedule.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
