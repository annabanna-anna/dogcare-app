import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PawPrint, Pill, Toilet } from 'lucide-react'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { getDogsByIds } from '../lib/dogs'
import { createStay } from '../lib/stays'
import { createTasks } from '../lib/tasks'
import { generateTasksForStay } from '../utils/taskGenerator'
import { isGoogleCalendarConnected, pushTasksToGoogleCalendar } from '../lib/googleCalendar'
import { formatDayHeading, formatTime, toLocalDateKey } from '../utils/dateUtils'
import type { Dog, Task, TaskType } from '../types'

const typeIcon: Record<TaskType, React.ComponentType<{ size?: string | number; className?: string }>> = {
  walk: PawPrint,
  meal: DogBowlIcon,
  medication: Pill,
  potty: Toilet,
  other: PawPrint,
}

const typeBg: Record<TaskType, string> = {
  walk: 'bg-green-vivid',
  meal: 'bg-coral',
  medication: 'bg-blue-task',
  potty: 'bg-purple-task',
  other: 'bg-[#6b7280]',
}

interface LocationState {
  dogIds: string[]
  startDate: string
  endDate: string
  notes: string
}

export default function TaskPreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [dogs, setDogs] = useState<Dog[] | null | undefined>(undefined)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state?.dogIds?.length) {
      setDogs(null)
      return
    }
    let cancelled = false
    getDogsByIds(state.dogIds)
      .then((d) => !cancelled && setDogs(d.length > 0 ? d : null))
      .catch(() => !cancelled && setDogs(null))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.dogIds])

  const namesLabel = dogs?.map((d) => d.name).join(' & ') ?? ''

  const tasks = useMemo<Task[]>(() => {
    if (!dogs || !state) return []
    const stayId = `preview-stay-${Date.now()}`
    return generateTasksForStay(dogs, {
      id: stayId,
      dogIds: dogs.map((d) => d.id),
      startDate: state.startDate,
      endDate: state.endDate,
      notes: state.notes,
      createdAt: new Date().toISOString(),
    })
  }, [dogs, state])

  // Group tasks by date
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      const key = toLocalDateKey(new Date(task.scheduledTime))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [tasks])

  if (dogs === undefined) {
    return (
      <div className="min-h-svh bg-cream flex items-center justify-center px-6">
        <p className="font-dm text-[14px] text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (!state || !dogs) {
    return (
      <div className="min-h-svh bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-outfit font-bold text-[17px] text-text-primary mb-4">
            No stay data found.
          </p>
          <Button onClick={() => navigate('/stays/new')} variant="secondary">
            Start a Stay
          </Button>
        </div>
      </div>
    )
  }

  async function handleConfirm() {
    if (!dogs || !state || confirming) return
    setConfirming(true)
    setError(null)
    try {
      const stay = await createStay({
        dogIds: dogs.map((d) => d.id),
        startDate: state.startDate,
        endDate: state.endDate,
        notes: state.notes,
      })
      const finalTasks = generateTasksForStay(dogs, stay)
      // Push the rows createTasks returns, not finalTasks — only they carry
      // real DB ids, which the push needs to save each Google event ref.
      const createdTasks = await createTasks(finalTasks)
      if (isGoogleCalendarConnected()) {
        // Best-effort: a stay is already saved by this point, so a push
        // failure (expired token, API hiccup) shouldn't block the user.
        pushTasksToGoogleCalendar(createdTasks).catch(() => {})
      }
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this stay. Please try again.')
      setConfirming(false)
    }
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader
        back
        title="Preview Tasks"
        subtitle={`${namesLabel} · ${tasks.length} tasks`}
      />

      <div className="px-6 mt-4 flex flex-col gap-6">
        {error && (
          <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="font-outfit font-bold text-[17px] text-text-primary mb-2">
              No tasks generated
            </p>
            <p className="font-dm text-[14px] text-text-secondary">
              {namesLabel} has no care schedule entries yet. Add them to the dog profile first.
            </p>
          </div>
        )}

        {Array.from(grouped.entries()).map(([dateKey, dayTasks]) => (
          <section key={dateKey}>
            <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
              {formatDayHeading(`${dateKey}T12:00:00`)}
            </p>
            <div className="bg-white border border-border-light rounded-[16px] divide-y divide-border-faint overflow-hidden">
              {dayTasks.map((task) => {
                const Icon = typeIcon[task.type] ?? PawPrint
                const bg = typeBg[task.type] ?? 'bg-[#6b7280]'
                return (
                  <div key={task.id} className="flex items-start gap-3 p-4">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bg}`}
                    >
                      <Icon size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm font-bold text-[15px] text-text-primary leading-none">
                        {task.title}
                      </p>
                      {task.note && (
                        <p className="font-dm text-[13px] text-text-secondary mt-1 leading-snug">
                          {task.note}
                        </p>
                      )}
                    </div>
                    <span className="font-dm font-bold text-[13px] text-text-muted shrink-0 pt-0.5">
                      {formatTime(task.scheduledTime)}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {tasks.length > 0 && (
          <div className="flex flex-col gap-3">
            <Button fullWidth size="lg" onClick={handleConfirm} disabled={confirming}>
              {confirming ? 'Saving…' : 'Confirm Stay'}
            </Button>
            <Button fullWidth size="lg" variant="secondary" onClick={() => navigate(-1)}>
              Back to Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
