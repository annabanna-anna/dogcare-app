import { Clock } from 'lucide-react'

interface Props {
  dogName: string
  onJustNow: () => void
  onPickTime: () => void
}

/** Shown before anything's been logged for a going-out dog: the clock needs a
 *  starting point before it can plan walks and potty breaks. Only the time
 *  matters — a walk, a potty break and a drop-off all count the same. */
export default function LastOutPrompt({ dogName, onJustNow, onPickTime }: Props) {
  return (
    <div className="mb-5 rounded-[16px] border-2 border-dashed border-coral/60 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="size-9 rounded-full flex items-center justify-center shrink-0 bg-coral-soft">
          <Clock size={18} className="text-coral" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-dm font-bold text-[16px] leading-tight text-text-primary">When was {dogName} last out?</p>
          <p className="font-dm text-[14px] text-text-secondary mt-0.5 leading-snug">
            Walk, potty break or drop-off — any time out counts.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onJustNow}
          className="flex-1 py-3 rounded-full bg-coral text-white font-dm font-bold text-[16px] active:bg-coral-deep transition-colors"
        >
          Just now
        </button>
        <button
          type="button"
          onClick={onPickTime}
          className="flex-1 py-3 rounded-full border-2 border-text-primary text-text-primary font-dm font-bold text-[16px] flex items-center justify-center gap-1.5 active:bg-gray-50 transition-colors"
        >
          <Clock size={16} />
          Pick a time
        </button>
      </div>
    </div>
  )
}
