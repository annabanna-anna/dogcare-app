import { PawPrint, UtensilsCrossed, Pill, Zap, Scissors, CheckCircle2, MinusCircle } from 'lucide-react'
import type { Task, TaskType } from '../types'
import { formatTime } from '../utils/dateUtils'

interface Props {
  task: Task
  onDone: (id: string) => void
  onSkip: (id: string) => void
}

const typeConfig: Record<TaskType, { icon: typeof PawPrint; bg: string; iconColor: string }> = {
  walk:       { icon: PawPrint,       bg: 'bg-green-vivid', iconColor: 'text-white' },
  meal:       { icon: UtensilsCrossed,bg: 'bg-coral',       iconColor: 'text-white' },
  medication: { icon: Pill,           bg: 'bg-blue-task',   iconColor: 'text-white' },
  potty:      { icon: PawPrint,       bg: 'bg-green-vivid', iconColor: 'text-white' },
  play:       { icon: Zap,            bg: 'bg-[#f59e0b]',   iconColor: 'text-white' },
  groom:      { icon: Scissors,       bg: 'bg-[#8b5cf6]',   iconColor: 'text-white' },
  other:      { icon: PawPrint,       bg: 'bg-[#6b7280]',   iconColor: 'text-white' },
}

export default function TaskCard({ task, onDone, onSkip }: Props) {
  const { icon: Icon, bg } = typeConfig[task.type] ?? typeConfig.other
  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'
  const isOverdue = task.status === 'overdue'
  const isMedication = task.type === 'medication'
  const isCompleted = isDone || isSkipped

  return (
    <div
      className={`relative flex gap-3 pb-5 ${isCompleted ? 'opacity-50' : ''}`}
    >
      {/* Time column */}
      <div className="w-[68px] shrink-0 pt-1">
        <span
          className={`font-gabarito font-extrabold text-[13px] ${
            isOverdue ? 'text-coral' : 'text-text-primary'
          }`}
        >
          {formatTime(task.scheduledTime)}
        </span>
      </div>

      {/* Timeline column */}
      <div className="flex flex-col items-center w-8 shrink-0">
        <div
          className={`size-8 rounded-full flex items-center justify-center shrink-0 ${bg} ${
            isMedication ? 'ring-2 ring-[#2486ff] ring-offset-2 ring-offset-cream' : ''
          }`}
        >
          <Icon size={17} className="text-white" />
        </div>
        {/* connector line – always present, fades at end of list via CSS in parent */}
        <div className="flex-1 w-0.5 bg-border-faint rounded min-h-0" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-gabarito text-[11px] text-text-muted leading-none mb-1">
          {task.dogName}
        </p>
        <p
          className={`font-gabarito font-bold text-[16px] leading-tight ${
            isOverdue ? 'text-coral' : 'text-text-primary'
          }`}
        >
          {task.title}
          {isOverdue && (
            <span className="ml-2 text-[11px] font-extrabold uppercase tracking-wide text-coral">
              Overdue
            </span>
          )}
          {isMedication && !isCompleted && (
            <span className="ml-2 text-[11px] font-extrabold uppercase tracking-wide text-blue-task">
              Med
            </span>
          )}
        </p>
        {task.note && (
          <p className="font-gabarito text-[13px] text-text-secondary mt-1 leading-snug">
            {task.note}
          </p>
        )}

        {/* Actions */}
        {!isCompleted && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onDone(task.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#dcfce7] text-[#15803d] font-gabarito font-bold text-[12px] active:bg-[#bbf7d0] transition-colors"
            >
              <CheckCircle2 size={13} />
              Done
            </button>
            <button
              onClick={() => onSkip(task.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3f4f6] text-text-secondary font-gabarito font-bold text-[12px] active:bg-[#e5e7eb] transition-colors"
            >
              <MinusCircle size={13} />
              Skip
            </button>
          </div>
        )}

        {isDone && (
          <p className="font-gabarito text-[12px] text-[#15803d] font-semibold mt-1">
            ✓ Completed
          </p>
        )}
        {isSkipped && (
          <p className="font-gabarito text-[12px] text-text-muted font-semibold mt-1">
            – Skipped
          </p>
        )}
      </div>
    </div>
  )
}
