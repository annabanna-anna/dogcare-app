import type { ReactNode } from 'react'
import { Signal, Wifi, BatteryFull } from 'lucide-react'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * Device chrome (bezel, status bar, home indicator) shared by every product
 * mockup on the marketing site, so a screenshot always reads as "the app on
 * a phone" rather than a generic rounded card.
 */
export default function PhoneFrame({ children, className = '' }: Props) {
  return (
    <div
      className={`rounded-[38px] bg-text-primary p-[10px] shadow-[0_24px_60px_-24px_rgba(20,20,20,0.35)] ${className}`}
    >
      <div className="rounded-[28px] bg-cream overflow-hidden flex flex-col">
        <div className="relative flex items-center justify-between px-6 pt-2.5 pb-1 shrink-0">
          <span className="font-dm font-bold text-[11px] text-text-primary">9:41</span>
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1.5 -translate-x-1/2 h-[16px] w-[78px] rounded-full bg-text-primary"
          />
          <span className="flex items-center gap-1 text-text-primary">
            <Signal size={12} strokeWidth={2.5} />
            <Wifi size={12} strokeWidth={2.5} />
            <BatteryFull size={15} strokeWidth={2} />
          </span>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
        <div aria-hidden="true" className="flex justify-center pb-2 pt-1.5 shrink-0">
          <div className="h-1 w-28 rounded-full bg-text-primary/20" />
        </div>
      </div>
    </div>
  )
}
