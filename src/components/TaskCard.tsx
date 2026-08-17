import { useRef, useState } from 'react'
import { PawPrint, Pill, CheckCircle2, RotateCcw } from 'lucide-react'
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
   *  smaller title/note type (14px/10px vs 16px/13px) — opt-in for
   *  space-constrained contexts (the marketing site's phone mockups), off
   *  by default so every other screen keeps its current sizing. */
  dense?: boolean
}

// Distance (px) a swipe must travel before it commits to Done/Undo, and the
// hard clamp on how far the row can be dragged past that.
const SWIPE_THRESHOLD = 84
const SWIPE_MAX = 140

const typeConfig: Record<TaskType, { icon: React.ComponentType<{ size?: string | number; className?: string }>; bg: string; iconColor: string }> = {
  walk:       { icon: PawPrint,       bg: 'bg-green-vivid', iconColor: 'text-white' },
  meal:       { icon: DogBowlIcon,   bg: 'bg-coral',       iconColor: 'text-white' },
  medication: { icon: Pill,           bg: 'bg-blue-task',   iconColor: 'text-white' },
  potty:      { icon: PawPrint,       bg: 'bg-green-vivid', iconColor: 'text-white' },
  other:      { icon: PawPrint,       bg: 'bg-[#6b7280]',   iconColor: 'text-white' },
}

export default function TaskCard({ task, onDone, onUndo, showDogName = true, dense = false }: Props) {
  const { icon: Icon, bg } = typeConfig[task.type] ?? typeConfig.other
  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'
  const isOverdue = task.status === 'overdue'
  const isCompleted = isDone || isSkipped
  const displayTime = dense
    ? formatTime(task.scheduledTime).replace(':00 ', ' ')
    : formatTime(task.scheduledTime)

  // Swipe-to-complete is the only way to mark a task: dragging the whole
  // row left marks a pending task Done, dragging it right on a Done task
  // undoes it. There's no tap fallback — the row itself is the control.
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  // Shows a full-row "Done!" banner for a beat after a completing swipe,
  // so the swipe itself carries the payoff.
  const [celebrating, setCelebrating] = useState(false)
  const startXRef = useRef<number | null>(null)

  // Rests toward whichever side the row swipes, far enough that the
  // checkmark/undo badge is actually visible at rest — not just a color
  // sliver. Kept inside the page's own side padding (TodayPage's sections
  // use px-6/24px) so the negative-margin clipping buffer below never
  // pushes the row wider than the screen.
  const restPeek = dense ? 8 : 16
  const restOffset = isSkipped ? 0 : isDone ? restPeek : -restPeek

  const triggerComplete = () => {
    if (isDone) {
      onUndo(task.id)
      return
    }
    setCelebrating(true)
    window.setTimeout(() => {
      onDone(task.id)
      setCelebrating(false)
    }, 700)
  }

  // Swipe only — no tap fallback. Anything short of the threshold is just
  // an aborted drag and snaps back without triggering anything.
  const commitSwipe = () => {
    if (startXRef.current === null) return
    const triggered = Math.abs(dragX) > SWIPE_THRESHOLD
    startXRef.current = null
    setDragging(false)
    setDragX(0)

    if (triggered) triggerComplete()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSkipped || celebrating) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startXRef.current = e.clientX
    setDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null) return
    const delta = e.clientX - startXRef.current
    const clamped = isDone
      ? Math.min(Math.max(delta, 0), SWIPE_MAX)
      : Math.max(Math.min(delta, 0), -SWIPE_MAX)
    setDragX(clamped)
  }

  const handlePointerCancel = () => {
    startXRef.current = null
    setDragging(false)
    setDragX(0)
  }

  // How far into the swipe we are, 0→1 — drives the reveal panel's color
  // ramp and the badge's grow-as-you-commit feedback.
  const swipeProgress = isSkipped ? 0 : Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1)
  // The white card's own slide, expressed as a percentage of its own width
  // (not a fixed px amount) so it's fully pushed off to one side — not
  // just nudged over — by the time the drag reaches the commit threshold,
  // regardless of how wide the row actually renders.
  const slidePercent = isDone ? swipeProgress * 100 : -swipeProgress * 100
  const badgeTransition = { transition: dragging ? 'none' : 'transform 0.25s ease, left 0.25s ease' }
  // The badge travels from a fixed px inset near its resting edge to
  // dead-center (50%) of the row as the swipe completes. Using a
  // percentage for the endpoint — rather than tracking raw drag pixels —
  // is what makes it land exactly centered regardless of the row's actual
  // rendered width.
  const badgeRestInset = dense ? 14 : 18
  const badgeLeftPercent = isDone
    ? 0 + swipeProgress * 50
    : 100 - swipeProgress * 50
  const badgeLeft = isDone
    ? `calc(${badgeLeftPercent}% + ${(1 - swipeProgress) * badgeRestInset}px)`
    : `calc(${badgeLeftPercent}% - ${(1 - swipeProgress) * badgeRestInset}px)`

  return (
    <div
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={commitSwipe}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'pan-y' }}
      className={`relative isolate overflow-hidden select-none pb-5 ${dense ? 'px-2 -mx-2' : 'px-4 -mx-4'}`}
    >
      {/* Reveal layer behind the row: pale at rest, ramping to a solid
          darker fill as the swipe approaches the commit threshold — green
          "Done" swiping left, grey "Undo" swiping right on a done task.
          The badge itself grows along with it for the same reason. */}
      {!isSkipped && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-5 rounded-[10px] overflow-hidden">
          <div className={`absolute inset-0 ${isDone ? 'bg-[#f3f4f6]' : 'bg-[#dcfce7]'}`} />
          <div
            className={`absolute inset-0 ${isDone ? 'bg-[#4b5563]' : 'bg-[#166534]'}`}
            style={{ opacity: swipeProgress, ...badgeTransition }}
          />
          <div className="relative h-full">
            <div
              className="absolute top-1/2 flex items-center justify-center"
              style={{
                left: badgeLeft,
                transform: `translate(-50%, -50%) scale(${1 + swipeProgress * 0.5})`,
                ...badgeTransition,
              }}
            >
              {/* Crossfades from the resting color to white as the darker
                  overlay fills in behind it, so the icon reads clearly
                  against both the pale and the fully-committed background. */}
              {isDone ? (
                <>
                  <RotateCcw size={dense ? 12 : 16} className="text-[#6b7280]" style={{ opacity: 1 - swipeProgress, ...badgeTransition }} />
                  <RotateCcw size={dense ? 12 : 16} className="absolute inset-0 text-white" style={{ opacity: swipeProgress, ...badgeTransition }} />
                </>
              ) : (
                <>
                  <CheckCircle2 size={dense ? 12 : 16} className="text-green-vivid" style={{ opacity: 1 - swipeProgress, ...badgeTransition }} />
                  <CheckCircle2 size={dense ? 12 : 16} className="absolute inset-0 text-white" style={{ opacity: swipeProgress, ...badgeTransition }} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-row "Done!" celebration banner after a completing swipe */}
      {celebrating && (
        <div
          aria-hidden="true"
          className="swipe-celebrate absolute inset-x-0 top-0 bottom-5 z-10 flex items-center justify-center gap-2 rounded-2xl bg-[#dcfce7] font-dm font-bold text-[#15803d]"
        >
          <CheckCircle2 size={dense ? 16 : 20} />
          <span className={dense ? 'text-[13px]' : 'text-[16px]'}>Done!</span>
        </div>
      )}

      {/* The whole row — time, icon, and content — swipes together as one unit.
          Carries its own cream→dark-fill background so the darkening reads
          across the entire card, not just the strip the drag has exposed. */}
      <div
        style={{
          transform: `translateX(calc(${restOffset}px + ${slidePercent}%))`,
          transition: dragging ? 'none' : 'transform 0.25s ease',
        }}
        className="relative overflow-hidden rounded-r-[10px] bg-cream"
      >
        <div className={`relative flex ${dense ? 'gap-1' : 'gap-3'}`}>
        {/* Time column — narrower in dense mode: compact times ("8 AM", "12
            PM") never need the full 68px the app's longest label ("11:30
            AM") does. */}
        <div className={`${dense ? 'w-9 pl-1' : 'w-[68px] pl-2'} shrink-0 pt-1 ${isCompleted ? 'opacity-50' : ''}`}>
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

        {/* Content — min-height keeps every row (even a bare title with no
            dog name or note) as tall as the icon badge beside it, and
            flex+justify-center keeps short content vertically balanced
            inside that reserved height instead of hugging the top. */}
        <div
          className={`flex-1 min-w-0 flex flex-col justify-center ${dense ? 'min-h-9 pr-3' : 'min-h-11 pr-5'} py-1 ${
            isCompleted ? 'opacity-50' : ''
          }`}
        >
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
          {/* Rendered even without a note — an invisible placeholder line —
              so every row reserves the same one-line-of-description height
              instead of shrinking when a task happens to have no note. */}
          <p
            className={`font-dm ${dense ? 'text-[10px]' : 'text-[13px]'} text-text-secondary mt-1 leading-snug ${
              task.note ? '' : 'invisible'
            }`}
          >
            {task.note || 'placeholder'}
          </p>

          {isSkipped && (
            <p className="font-dm text-[12px] text-text-muted font-semibold mt-1">
              – Skipped
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
