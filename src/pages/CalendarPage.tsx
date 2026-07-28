import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import { listStays } from '../lib/stays'
import { listDogs } from '../lib/dogs'
import { formatShortDate } from '../utils/dateUtils'
import type { Dog, Stay } from '../types'

export default function CalendarPage() {
  const now = new Date()
  const [stays, setStays] = useState<Stay[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listStays(), listDogs()])
      .then(([stayRows, dogRows]) => {
        if (cancelled) return
        setStays(stayRows)
        setDogs(dogRows)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const upcomingStays = stays
    .filter((s) => new Date(s.endDate) >= now)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader title="Calendar" />

      <div className="px-6 mt-4 flex flex-col gap-4">
        <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest">
          Upcoming Stays
        </p>

        {error && (
          <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}

        {loading && <p className="font-dm text-[14px] text-text-secondary">Loading…</p>}

        {!loading && upcomingStays.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <CalendarDays size={40} className="text-[#d1d5db]" />
            <p className="font-outfit font-bold text-[17px] text-text-primary">
              No upcoming stays
            </p>
            <p className="font-dm text-[14px] text-text-secondary">
              Start a stay from a dog's profile.
            </p>
          </div>
        )}

        {upcomingStays.map((stay) => {
          const dog = dogs.find((d) => d.id === stay.dogId)
          if (!dog) return null
          const isActive = new Date(stay.startDate) <= now && new Date(stay.endDate) >= now
          return (
            <div
              key={stay.id}
              className="bg-white border border-border-light rounded-[16px] p-4 flex gap-4 items-center"
            >
              <div className="size-12 rounded-[10px] overflow-hidden bg-[#f3f4f6] shrink-0 flex items-center justify-center">
                {dog.photoUrl ? (
                  <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
                ) : (
                  <DogIcon size={22} className="text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-outfit font-semibold text-[17px] text-text-primary leading-none">
                    {dog.name}
                  </p>
                  {isActive && (
                    <span className="text-[11px] font-dm font-bold bg-[#dcfce7] text-[#15803d] rounded-full px-2 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                <p className="font-dm text-[13px] text-text-secondary">
                  {formatShortDate(stay.startDate)} → {formatShortDate(stay.endDate)}
                </p>
                {stay.notes && (
                  <p className="font-dm text-[13px] text-text-muted mt-1 truncate">
                    {stay.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
