import { useMemo, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import DogCard from '../components/DogCard'
import BottomNav from '../components/BottomNav'
import WaggingDog from '../components/WaggingDog'
import { mockDogs } from '../data/mockDogs'
import { mockStays } from '../data/mockStays'
import type { Dog } from '../types'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function DogListPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const letterRefs = useRef<Record<string, HTMLElement | null>>({})
  const now = new Date()

  function getNextStay(dogId: string) {
    return mockStays
      .filter((s) => s.dogId === dogId && new Date(s.endDate) >= now)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  }

  function isActive(dogId: string) {
    return mockStays.some(
      (s) => s.dogId === dogId && new Date(s.startDate) <= now && new Date(s.endDate) >= now,
    )
  }

  const { activeDogs, letterGroups, availableLetters } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = [...mockDogs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(
        (d) =>
          !q ||
          `${d.name} ${d.breed} ${d.ownerName}`.toLowerCase().includes(q),
      )
    const active = filtered.filter((d) => isActive(d.id))
    const rest = filtered.filter((d) => !isActive(d.id))
    const groups: { letter: string; dogs: Dog[] }[] = []
    for (const dog of rest) {
      const letter = dog.name[0].toUpperCase()
      const last = groups[groups.length - 1]
      if (last && last.letter === letter) last.dogs.push(dog)
      else groups.push({ letter, dogs: [dog] })
    }
    return {
      activeDogs: active,
      letterGroups: groups,
      availableLetters: new Set(groups.map((g) => g.letter)),
    }
  }, [query, now.getTime()])

  const nothingFound = activeDogs.length === 0 && letterGroups.length === 0

  function jumpTo(letter: string) {
    letterRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader title="Dogs" />

      {/* Search */}
      <div className="px-6 mt-2">
        <div className="bg-card rounded-full px-4 py-3 flex items-center gap-2.5">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dogs, breeds, owners"
            className="flex-1 min-w-0 bg-transparent font-dm text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="px-6 mt-4 flex flex-col gap-5">
        {/* Active stays first */}
        {activeDogs.length > 0 && (
          <section>
            <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
              Active
            </p>
            <div className="flex flex-col gap-3">
              {activeDogs.map((dog, i) => (
                <DogCard key={dog.id} dog={dog} nextStay={getNextStay(dog.id)} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Alphabetical groups */}
        {letterGroups.map((group, gi) => (
          <section
            key={group.letter}
            ref={(el) => {
              letterRefs.current[group.letter] = el
            }}
            className="scroll-mt-4"
          >
            <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
              {group.letter}
            </p>
            <div className="flex flex-col gap-3">
              {group.dogs.map((dog, i) => (
                <DogCard
                  key={dog.id}
                  dog={dog}
                  nextStay={getNextStay(dog.id)}
                  index={activeDogs.length + gi + i}
                />
              ))}
            </div>
          </section>
        ))}

        {nothingFound && mockDogs.length > 0 && (
          <p className="font-dm text-[14px] text-text-secondary text-center py-10">
            No dogs match “{query}”.
          </p>
        )}
      </div>

      {mockDogs.length === 0 && (
        <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
          <WaggingDog size={120} className="animate-pop-in" />
          <p className="font-outfit font-bold text-[22px] text-text-primary">No dogs yet</p>
          <p className="font-dm text-[14px] text-text-secondary">
            Tap + to add your first dog.
          </p>
        </div>
      )}

      {/* Alphabet index rail */}
      {!query && !nothingFound && (
        <div className="fixed top-1/2 -translate-y-1/2 left-1/2 translate-x-[192px] z-40 flex flex-col items-center">
          {ALPHABET.map((letter) => {
            const enabled = availableLetters.has(letter)
            return (
              <button
                key={letter}
                onClick={() => enabled && jumpTo(letter)}
                disabled={!enabled}
                className={`font-dm font-bold text-[10px] leading-[15px] w-4 text-center ${
                  enabled ? 'text-coral' : 'text-text-muted/40'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      )}

      {/* Floating add button */}
      <button
        onClick={() => navigate('/dogs/new')}
        className="fixed bottom-24 left-1/2 translate-x-[135px] z-40 size-14 rounded-full bg-coral flex items-center justify-center text-white active:bg-coral-deep active:scale-95 transition-all duration-100"
        aria-label="Add dog"
      >
        <Plus size={26} />
      </button>

      <BottomNav />
    </div>
  )
}
