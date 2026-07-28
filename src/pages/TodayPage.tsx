import { useState, useMemo, useEffect } from 'react'
import { CheckCircle, CalendarPlus } from 'lucide-react'
import DogIcon from '../components/icons/DogIcon'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import TaskCard from '../components/TaskCard'
import BottomNav from '../components/BottomNav'
import { listTasksBetween, updateTaskStatus } from '../lib/tasks'
import { listStays } from '../lib/stays'
import { listDogs } from '../lib/dogs'
import type { Dog, Stay, Task, TaskStatus } from '../types'
import { formatTodayHeading } from '../utils/dateUtils'

export default function TodayPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeDogs, setActiveDogs] = useState<{ dog: Dog; stay: Stay }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date()
    dayEnd.setHours(23, 59, 59, 999)

    Promise.all([
      listTasksBetween(dayStart.toISOString(), dayEnd.toISOString()),
      listDogs(),
      listStays(),
    ])
      .then(([taskRows, dogRows, stayRows]) => {
        if (cancelled) return
        setTasks(taskRows)
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
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const todayTasks = useMemo(
    () => [...tasks].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [tasks],
  )

  // Group tasks by dogName
  const tasksByDog = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const t of todayTasks) {
      if (!map[t.dogName]) map[t.dogName] = []
      map[t.dogName].push(t)
    }
    return map
  }, [todayTasks])

  const doneCount = todayTasks.filter((t) => t.status === 'done').length
  const total = todayTasks.length

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
      <div className="px-6 pt-8 pb-4 flex items-end justify-between">
        <div>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-1">
            {formatTodayHeading()}
          </p>
          <h1 className="font-outfit font-bold text-[56px] leading-none text-cobalt tracking-tight">
            Today
          </h1>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 bg-[#fee2e2] rounded-[12px] px-4 py-3">
          <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="px-6 font-dm text-[14px] text-text-secondary">Loading your day…</p>
      ) : (
        <>
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

          {/* Progress */}
          {total > 0 && (
            <section className="px-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest">
                  Reminders
                </p>
                {doneCount === total && (
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-coral" />
                    <span className="font-dm font-bold text-[12px] text-coral">
                      All done!
                    </span>
                  </div>
                )}
                {doneCount < total && (
                  <span className="font-dm font-bold text-[12px] text-text-secondary">
                    {doneCount}/{total} done
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-coral rounded-full transition-all duration-500"
                  style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
                />
              </div>
            </section>
          )}

          {/* Tasks grouped by dog */}
          {Object.entries(tasksByDog).map(([dogName, dogTasks]) => (
            <section key={dogName} className="px-6 mb-4">
              <p className="font-dm font-bold text-[12px] text-text-muted uppercase tracking-widest mb-3">
                {dogName}
              </p>
              <div>
                {dogTasks.map((task, i) => (
                  <div key={task.id} className={i === dogTasks.length - 1 ? '[&_.connector]:opacity-0' : ''}>
                    <TaskCard
                      task={task}
                      onDone={(id) => updateStatus(id, 'done')}
                      onSkip={(id) => updateStatus(id, 'skipped')}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {todayTasks.length === 0 && (
            <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
              <p className="font-outfit font-bold text-[22px] text-text-primary">
                No tasks today
              </p>
              <p className="font-dm text-[14px] text-text-secondary">
                Start a stay to generate care tasks.
              </p>
              <div className="mt-3">
                <Button onClick={() => navigate('/stays/new')}>
                  <CalendarPlus size={18} />
                  Start a Stay
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <BottomNav />
    </div>
  )
}
