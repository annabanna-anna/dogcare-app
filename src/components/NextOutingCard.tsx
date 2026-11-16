import { TASK_TYPE_STYLE } from './taskTypeStyle'
import { formatTime } from '../utils/dateUtils'
import { formatDuration } from '../utils/outingClock'

interface Props {
  due: Date
  now: Date
  /** e.g. "4 hrs after the morning walk" */
  reason: string
  /** The next time out today — highlighted, with a countdown and Log. Later
   *  ones are quieter: they move whenever something earlier is logged. */
  next: boolean
  dogName?: string
  onLog: () => void
}

/** A planned potty break between long walks: not a stored task, just "last
 *  time out + every X hrs", so it moves whenever something is logged. Laid
 *  out on the same grid as TaskCard (time · icon + connector · content) so it
 *  sits in the timeline like any other row; the dashed icon ring and "~"
 *  time are what mark it as planned rather than scheduled. */
export default function NextOutingCard({ due, now, reason, next, dogName, onLog }: Props) {
  const { icon: Icon, bg } = TASK_TYPE_STYLE.potty
  const overdue = due < now
  return (
    <div className="relative pb-5 px-4 -mx-4">
      {/* Same -16px rest offset as TaskCard, so the columns line up. */}
      <div className="relative flex gap-3 -translate-x-4">
        <div className="w-[68px] pl-2 shrink-0 pt-1 flex flex-col items-start">
          <span className="font-dm font-bold text-[13px] text-text-secondary whitespace-nowrap">
            ~{formatTime(due.toISOString())}
          </span>
          {next && (
            <span className="mt-1 inline-block px-1.5 py-0.5 rounded-full bg-coral-soft font-dm font-bold text-[11px] text-coral whitespace-nowrap">
              {overdue ? 'Overdue' : `in ${formatDuration(due.getTime() - now.getTime())}`}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center w-8 shrink-0">
          <div
            className={`size-8 rounded-full flex items-center justify-center shrink-0 outline-2 outline-dashed outline-offset-2 ${bg} ${
              next ? 'outline-coral/60' : 'outline-border-light opacity-60'
            }`}
          >
            <Icon size={17} className="text-white" />
          </div>
          <div className="connector flex-1 w-0.5 bg-border-faint rounded min-h-0 mt-1" />
        </div>
        <div className="flex-1 min-w-0 min-h-16 py-1 pr-5 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {dogName && <p className="font-dm text-[11px] text-text-muted leading-none mb-1">{dogName}</p>}
            <p className={`font-dm font-bold text-[16px] leading-tight ${next ? 'text-text-primary' : 'text-text-secondary'}`}>
              Potty break
            </p>
            <p className="font-dm text-[13px] text-text-secondary mt-1 leading-snug">{reason}</p>
          </div>
          {next && (
            <button
              type="button"
              onClick={onLog}
              className="shrink-0 self-center px-3 py-1.5 rounded-full bg-white border border-border-light font-dm font-bold text-[12px] text-text-primary active:scale-[0.96] transition-transform"
            >
              Log
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
