import { useLayoutEffect, useRef, useState } from 'react'
import CroppedImg, { type PhotoCrop } from './CroppedImg'
import DogIcon from './icons/DogIcon'

interface TabDog {
  key: string
  name: string
  photoUrl?: string
  /** Live crop while the photo is being adjusted (Add/Edit Dog). */
  photoCrop?: PhotoCrop | null
}

interface Props {
  dogs: TabDog[]
  value: string
  onChange: (key: string) => void
}

/** Segmented switcher between the dogs on one profile, each with its photo.
 *  The white pill slides behind the active tab, like BottomNav's. */
export default function DogTabs({ dogs, value, onChange }: Props) {
  const activeIndex = Math.max(0, dogs.findIndex((d) => d.key === value))

  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pillRect, setPillRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    const activeItem = itemRefs.current[activeIndex]
    if (!track || !activeItem) return

    const measure = () => {
      const trackBox = track.getBoundingClientRect()
      const itemBox = activeItem.getBoundingClientRect()
      setPillRect({
        left: itemBox.left - trackBox.left,
        top: itemBox.top - trackBox.top,
        width: itemBox.width,
        height: itemBox.height,
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
    // dogs.length: adding/removing a dog in the edit form resizes every tab
  }, [activeIndex, dogs.length])

  return (
    <div ref={trackRef} role="tablist" className="relative isolate bg-card rounded-full p-1 flex gap-1">
      {pillRect && (
        <div
          className="absolute rounded-full bg-white border border-border-light transition-all duration-300 ease-out"
          style={{
            left: pillRect.left,
            top: pillRect.top,
            width: pillRect.width,
            height: pillRect.height,
          }}
        />
      )}
      {dogs.map((d, i) => {
        const active = i === activeIndex
        return (
          <button
            key={d.key}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(d.key)}
            className="relative z-10 flex-1 min-w-0 rounded-full py-1.5 px-2 flex items-center justify-center gap-2 border border-transparent"
          >
            <span
              className={`relative size-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-text-muted transition-[background-color,opacity] duration-300 ${
                active ? 'bg-card' : 'bg-white opacity-60'
              }`}
            >
              {d.photoUrl ? (
                <CroppedImg src={d.photoUrl} crop={d.photoCrop} />
              ) : (
                <DogIcon size={18} />
              )}
            </span>
            <span
              className={`font-dm font-bold text-[14px] truncate transition-colors duration-300 ${
                active ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {d.name || 'Unnamed'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
