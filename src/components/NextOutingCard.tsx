import { TASK_TYPE_STYLE } from './taskTypeStyle'
import { formatTime } from '../utils/dateUtils'
import { formatDuration } from '../utils/outingClock'

interface Props {
  due: Date
  now: Date
  /** e.g. "4 hrs after the morning walk" */
  reason: string
  /** A long walk is planned before this is due — it only matters if that slips. */
  conditional: boolean
  onLog: () => void
}

/** The estimated next potty break between long walks: not a stored task, just
 *  "last time out + every X hrs", so it moves whenever something is logged. */
export default function NextOutingCard({ due, now, reason, conditional, onLog }: Props) {
  const { icon: Icon, bg } = TASK_TYPE_STYLE.potty
  const overdue = due < now
  return (
    <div
      className={`mb-5 rounded-[16px] border-2 border-dashed px-3 py-3 flex items-center gap-3 ${
        conditional ? 'border-border-light' : 'border-coral/60'
      }`}
    >
      <div className="w-[68px] shrink-0 flex flex-col items-start gap-1">
        <span className="font-dm font-bold text-[13px] text-text-secondary whitespace-nowrap">
          ~{formatTime(due.toISOString())}
        </span>
        {!conditional && (
          <span className="px-1.5 py-0.5 rounded-full bg-coral-soft font-dm font-bold text-[11px] text-coral whitespace-nowrap">
            {overdue ? 'Overdue' : `in ${formatDuration(due.getTime() - now.getTime())}`}
          </span>
        )}
      </div>
      <span className={`size-8 rounded-full flex items-center justify-center shrink-0 ${bg} ${conditional ? 'opacity-60' : ''}`}>
        <Icon size={17} className="text-white" />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-dm font-bold text-[16px] leading-tight ${conditional ? 'text-text-secondary' : 'text-text-primary'}`}>
          Potty break
        </p>
        <p className="font-dm text-[13px] text-text-secondary mt-0.5 leading-snug">{reason}</p>
      </div>
      <button
        type="button"
        onClick={onLog}
        className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-border-light font-dm font-bold text-[12px] text-text-primary active:scale-[0.96] transition-transform"
      >
        Log
      </button>
    </div>
  )
}
