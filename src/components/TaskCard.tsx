import { useState } from 'react'
import { PawPrint, Pill, CheckCircle2, Circle } from 'lucide-react'
import DogBowlIcon from './icons/DogBowlIcon'
import type { Task, TaskType } from '../types'
import { formatTime } from '../utils/dateUtils'

interface Props {
  task: Task
  onDone: (id: string) => void
  onUndo: (id: string) => void
  /** Hide the small dog-name line when the list is already scoped to one dog. */
  showDogName?: boolean
  /** Tighter time↔icon gap, a smaller 1.5rem icon badge (vs the usual
   *  2rem), 12px time type, ":00" dropped from on-the-hour times, and
   *  smaller title/note/Done type (14px/10px/10px vs 16px/13px/12px) —
   *  opt-in for space-constrained contexts (the marketing site's phone
   *  mockups), off by default so every other screen keeps its current
   *  sizing. */
  dense?: boolean
}

// Scatter directions for the celebratory paw prints flying out of the button
const PAW_BURSTS = [
  { dx: '-30px', dy: '-26px', rot: '-30deg', delay: '0s' },
  { dx: '2px', dy: '-36px', rot: '10deg', delay: '0.06s' },
  { dx: '30px', dy: '-22px', rot: '35deg', delay: '0.12s' },
  { dx: '-16px', dy: '24px', rot: '-15deg', delay: '0.1s' },
  { dx: '22px', dy: '20px', rot: '20deg', delay: '0.04s' },
]

const typeConfig: Record<TaskType, { icon: React.ComponentType<{ size?: string | number; className?: string }>; bg: string; iconColor: string }> = {
  walk:       { icon: PawPrint,       bg: 'bg-green-vivid', iconColor: 'text-white' },
  meal:       { icon: DogBowlIcon,   bg: 'bg-coral',       iconColor: 'text-white' },
  medication: { icon: Pill,           bg: 'bg-blue-task',   iconColor: 'text-white' },
  potty:      { icon: PawPrint,       bg: 'bg-green-vivid', iconColor: 'text-white' },
  other:      { icon: PawPrint,       bg: 'bg-[#6b7280]',   iconColor: 'text-white' },
}

export default function TaskCard({ task, onDone, onUndo, showDogName = true, dense = false }: Props) {
  const { icon: Icon, bg } = typeConfig[task.type] ?? typeConfig.other
  // Bumped on each Done tap; keying the burst on it restarts the animation
  const [burst, setBurst] = useState(0)
  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'
  const isOverdue = task.status === 'overdue'
  const isCompleted = isDone || isSkipped
  const displayTime = dense
    ? formatTime(task.scheduledTime).replace(':00 ', ' ')
    : formatTime(task.scheduledTime)

  return (
    <div className={`relative flex ${dense ? 'gap-0.5' : 'gap-3'} pb-5`}>
      {/* Time column — narrower in dense mode: compact times ("8 AM", "12
          PM") never need the full 68px the app's longest label ("11:30
          AM") does. */}
      <div className={`${dense ? 'w-10' : 'w-[68px]'} shrink-0 pt-1 ${isCompleted ? 'opacity-50' : ''}`}>
        <span
          className={`font-dm font-bold ${dense ? 'text-[12px]' : 'text-[13px]'} ${
            isOverdue ? 'text-coral' : 'text-text-primary'
          }`}
        >
          {displayTime}
        </span>
      </div>

      {/* Timeline column — icon badge is 1.5rem (size-6) in dense mode vs
          the app's usual 2rem (size-8). */}
      <div
        className={`flex flex-col items-center ${dense ? 'w-6' : 'w-8'} shrink-0 ${
          isCompleted ? 'opacity-50' : ''
        }`}
      >
        <div
          className={`${dense ? 'size-6' : 'size-8'} rounded-full flex items-center justify-center shrink-0 ${bg}`}
        >
          <Icon size={dense ? 13 : 17} className="text-white" />
        </div>
        {/* connector line – always present, fades at end of list via CSS in parent */}
        <div className="flex-1 w-0.5 bg-border-faint rounded min-h-0" />
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isCompleted ? 'opacity-50' : ''}`}>
        {showDogName && (
          <p className="font-dm text-[11px] text-text-muted leading-none mb-1">
            {task.dogName}
          </p>
        )}
        <p
          className={`font-dm font-bold ${dense ? 'text-[14px]' : 'text-[16px]'} leading-tight ${
            isOverdue ? 'text-coral' : 'text-text-primary'
          }`}
        >
          {task.title}
          {isOverdue && (
            <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-coral">
              Overdue
            </span>
          )}
        </p>
        {task.note && (
          <p
            className={`font-dm ${dense ? 'text-[10px]' : 'text-[13px]'} text-text-secondary mt-1 leading-snug`}
          >
            {task.note}
          </p>
        )}

        {isSkipped && (
          <p className="font-dm text-[12px] text-text-muted font-semibold mt-1">
            – Skipped
          </p>
        )}
      </div>

      {/* Done action, right-aligned; tapping again undoes an accidental Done */}
      {!isSkipped && (
        <div className="relative self-center shrink-0">
          <button
            onClick={() => {
              if (isDone) {
                onUndo(task.id)
              } else {
                setBurst((b) => b + 1)
                onDone(task.id)
              }
            }}
            aria-pressed={isDone}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-dm font-bold ${
              dense ? 'text-[10px]' : 'text-[12px]'
            } transition-colors ${
              isDone
                ? 'bg-[#15803d] text-white active:bg-[#166534]'
                : 'bg-[#dcfce7] text-[#15803d] active:bg-[#bbf7d0]'
            } ${burst > 0 && isDone ? 'done-pop' : ''}`}
          >
            {isDone ? <CheckCircle2 size={13} /> : <Circle size={13} />}
            Done
          </button>
          {burst > 0 && isDone && (
            <span key={burst} aria-hidden="true">
              {PAW_BURSTS.map((p, i) => (
                <PawPrint
                  key={i}
                  size={16}
                  className="paw-burst fill-current"
                  style={
                    {
                      '--dx': p.dx,
                      '--dy': p.dy,
                      '--rot': p.rot,
                      '--delay': p.delay,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
