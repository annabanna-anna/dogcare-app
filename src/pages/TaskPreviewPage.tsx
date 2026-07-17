import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PawPrint, Pill } from 'lucide-react'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { mockDogs } from '../data/mockDogs'
import { generateTasksForStay } from '../utils/taskGenerator'
import { formatDayHeading, formatTime, toDateKey } from '../utils/dateUtils'
import type { Task, TaskType } from '../types'

const typeIcon: Record<TaskType, React.ComponentType<{ size?: string | number; className?: string }>> = {
  walk: PawPrint,
  meal: DogBowlIcon,
  medication: Pill,
  potty: PawPrint,
  other: PawPrint,
}

const typeBg: Record<TaskType, string> = {
  walk: 'bg-green-vivid',
  meal: 'bg-coral',
  medication: 'bg-blue-task',
  potty: 'bg-green-vivid',
  other: 'bg-[#6b7280]',
}

interface LocationState {
  dogId: string
  startDate: string
  endDate: string
  notes: string
}

export default function TaskPreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const dog = state?.dogId ? mockDogs.find((d) => d.id === state.dogId) : undefined

  const tasks = useMemo<Task[]>(() => {
    if (!dog || !state) return []
    const stayId = `preview-stay-${Date.now()}`
    return generateTasksForStay(dog, {
      id: stayId,
      dogId: dog.id,
      startDate: state.startDate,
      endDate: state.endDate,
      notes: state.notes,
      createdAt: new Date().toISOString(),
    })
  }, [dog, state])

  // Group tasks by date
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      const key = toDateKey(task.scheduledTime)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [tasks])

  if (!state || !dog) {
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

  function handleConfirm() {
    // In a real app: save stay + tasks to Supabase
    alert(`Stay confirmed with ${tasks.length} tasks! (mock — data not persisted yet)`)
    navigate('/')
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader
        back
        title="Preview Tasks"
        subtitle={`${dog.name} · ${tasks.length} tasks`}
      />

      <div className="px-6 mt-4 flex flex-col gap-6">
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="font-outfit font-bold text-[17px] text-text-primary mb-2">
              No tasks generated
            </p>
            <p className="font-dm text-[14px] text-text-secondary">
              {dog.name} has no care schedule entries yet. Add them to the dog profile first.
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
            <Button fullWidth size="lg" onClick={handleConfirm}>
              Confirm Stay
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
