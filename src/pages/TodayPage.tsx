import { useState, useMemo } from 'react'
import { CheckCircle, Dog as DogIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import TaskCard from '../components/TaskCard'
import BottomNav from '../components/BottomNav'
import { mockTasks } from '../data/mockTasks'
import { mockStays } from '../data/mockStays'
import { mockDogs } from '../data/mockDogs'
import type { Task, TaskStatus } from '../types'
import { formatTodayHeading, toDateKey } from '../utils/dateUtils'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)

  const todayKey = toDateKey(new Date().toISOString())

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => toDateKey(t.scheduledTime) === todayKey)
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [tasks, todayKey],
  )

  // Active stays (dogs currently being cared for)
  const today = new Date()
  const activeStays = mockStays.filter(
    (s) => new Date(s.startDate) <= today && new Date(s.endDate) >= today,
  )

  const activeDogs = activeStays
    .map((s) => {
      const dog = mockDogs.find((d) => d.id === s.dogId)
      return dog ? { dog, stay: s } : null
    })
    .filter(Boolean) as { dog: (typeof mockDogs)[0]; stay: (typeof mockStays)[0] }[]

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
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <p className="font-gabarito font-bold text-[13px] text-coral uppercase tracking-wide mb-1">
          {formatTodayHeading()}
        </p>
        <h1 className="font-teachers font-extrabold text-[56px] leading-none text-text-primary">
          Today
        </h1>
      </div>

      {/* Active Care */}
      {activeDogs.length > 0 && (
        <section className="px-6 mb-6">
          <p className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
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
                  className="flex items-center gap-3 border border-border-light rounded-[10px] px-3 py-2 bg-white active:bg-gray-50"
                >
                  <div className="size-8 rounded-full overflow-hidden bg-[#f3f4f6] flex items-center justify-center shrink-0">
                    {dog.photoUrl ? (
                      <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
                    ) : (
                      <DogIcon size={16} className="text-[#d1d5db]" />
                    )}
                  </div>
                  <div>
                    <p className="font-teachers font-semibold text-[14px] text-text-primary leading-none">
                      {dog.name}
                    </p>
                    <p className="font-gabarito text-[12px] text-text-secondary mt-0.5">
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
            <p className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest">
              Reminders
            </p>
            {doneCount === total && (
              <div className="flex items-center gap-1">
                <CheckCircle size={14} className="text-green-vivid" />
                <span className="font-gabarito text-[12px] text-text-secondary">
                  All done!
                </span>
              </div>
            )}
            {doneCount < total && (
              <span className="font-gabarito text-[12px] text-text-secondary">
                {doneCount}/{total} done
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-border-faint rounded-full overflow-hidden">
            <div
              className="h-full bg-green-vivid rounded-full transition-all duration-500"
              style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
            />
          </div>
        </section>
      )}

      {/* Tasks grouped by dog */}
      {Object.entries(tasksByDog).map(([dogName, dogTasks]) => (
        <section key={dogName} className="px-6 mb-4">
          <p className="font-gabarito font-extrabold text-[12px] text-text-muted uppercase tracking-widest mb-3">
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
          <span className="text-5xl">🐾</span>
          <p className="font-gabarito font-bold text-[17px] text-text-primary">
            No tasks today
          </p>
          <p className="font-gabarito text-[14px] text-text-secondary">
            Start a stay to generate care tasks.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
