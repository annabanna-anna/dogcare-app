import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, Check } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import DogCard from '../components/DogCard'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import Button from '../components/Button'
import { listDogs } from '../lib/dogs'
import { listStays } from '../lib/stays'
import { seedSampleDogs } from '../lib/seed'
import type { Dog, Stay } from '../types'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function DogListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [dogs, setDogs] = useState<Dog[]>([])
  const [stays, setStays] = useState<Stay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const letterRefs = useRef<Record<string, HTMLElement | null>>({})
  const now = new Date()

  const justAddedName = (location.state as { justAddedName?: string } | null)?.justAddedName
  const [addedBanner, setAddedBanner] = useState<string | null>(null)
  const [bannerLeaving, setBannerLeaving] = useState(false)

  useEffect(() => {
    if (!justAddedName) return
    setAddedBanner(justAddedName)
    setBannerLeaving(false)
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justAddedName])

  useEffect(() => {
    if (!addedBanner) return
    const timer = setTimeout(() => setBannerLeaving(true), 2000)
    return () => clearTimeout(timer)
  }, [addedBanner])

  useEffect(() => {
    if (!bannerLeaving) return
    const timer = setTimeout(() => setAddedBanner(null), 200)
    return () => clearTimeout(timer)
  }, [bannerLeaving])

  function load() {
    return Promise.all([listDogs(), listStays()]).then(([dogRows, stayRows]) => {
      setDogs(dogRows)
      setStays(stayRows)
    })
  }

  useEffect(() => {
    let cancelled = false
    load()
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSeed() {
    setSeeding(true)
    setError(null)
    try {
      await seedSampleDogs()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add sample dogs.')
    } finally {
      setSeeding(false)
    }
  }

  function getNextStay(dogId: string) {
    return stays
      .filter((s) => s.dogId === dogId && new Date(s.endDate) >= now)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  }

  function isActive(dogId: string) {
    return stays.some(
      (s) => s.dogId === dogId && new Date(s.startDate) <= now && new Date(s.endDate) >= now,
    )
  }

  const { activeDogs, letterGroups, availableLetters } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = [...dogs]
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
      const letter = dog.name[0]?.toUpperCase() ?? '#'
      const last = groups[groups.length - 1]
      if (last && last.letter === letter) last.dogs.push(dog)
      else groups.push({ letter, dogs: [dog] })
    }
    return {
      activeDogs: active,
      letterGroups: groups,
      availableLetters: new Set(groups.map((g) => g.letter)),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dogs, stays])

  const nothingFound = activeDogs.length === 0 && letterGroups.length === 0

  function jumpTo(letter: string) {
    letterRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      {/* Header + search stay pinned while the list scrolls */}
      <div className="sticky top-0 z-30 bg-cream pb-3">
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
      </div>

      {addedBanner && (
        <div
          className={`${bannerLeaving ? 'toast-out' : 'toast-in'} fixed top-6 left-1/2 w-full max-w-[430px] px-6 z-50 pointer-events-none`}
        >
          <div className="bg-[#dcfce7] rounded-[12px] px-4 py-3 flex items-center gap-2 shadow-lg">
            <Check size={16} className="text-[#15803d] shrink-0" />
            <p className="font-dm text-[13px] text-[#15803d]">
              {addedBanner} was successfully added.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 bg-[#fee2e2] rounded-[12px] px-4 py-3">
          <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="px-6 mt-4 font-dm text-[14px] text-text-secondary">Loading dogs…</p>
      ) : (
        <>
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
                className="scroll-mt-[156px]"
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

            {nothingFound && dogs.length > 0 && (
              <p className="font-dm text-[14px] text-text-secondary text-center py-10">
                No dogs match “{query}”.
              </p>
            )}
          </div>

          {dogs.length === 0 && (
            <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
              <DotLottieReact
                src="/splash.lottie"
                loop
                autoplay
                style={{ width: 140, height: 140 }}
              />
              <p className="font-outfit font-bold text-[22px] text-text-primary">No dogs yet</p>
              <p className="font-dm text-[14px] text-text-secondary">
                Tap + to add your first dog.
              </p>
              <Button variant="ghost" size="sm" disabled={seeding} onClick={handleSeed} className="mt-2">
                {seeding ? 'Adding sample dogs…' : 'Add 3 sample dogs (for testing)'}
              </Button>
            </div>
          )}

          {/* Alphabet index rail */}
          {!query && !nothingFound && (
            <div className="fixed top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 flex justify-end pr-2 pointer-events-none">
              <div className="flex flex-col items-center pointer-events-auto">
                {ALPHABET.map((letter) => {
                  const enabled = availableLetters.has(letter)
                  return (
                    <button
                      key={letter}
                      onClick={() => enabled && jumpTo(letter)}
                      disabled={!enabled}
                      className={`font-dm font-bold text-[10px] leading-[15px] w-4 text-center ${
                        enabled ? 'text-cobalt' : 'text-text-muted/40'
                      }`}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating add button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 flex justify-end pr-6 pointer-events-none">
        <button
          onClick={() => navigate('/dogs/new')}
          className="pointer-events-auto size-14 rounded-full bg-coral flex items-center justify-center text-white active:bg-coral-deep active:scale-95 transition-all duration-100"
          aria-label="Add dog"
        >
          <Plus size={26} />
        </button>
      </div>
    </div>
  )
}
