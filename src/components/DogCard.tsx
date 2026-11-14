import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DogIcon from './icons/DogIcon'
import type { Dog, Stay } from '../types'
import { formatShortDate } from '../utils/dateUtils'
import { dogDisplayBreed, dogDisplayName } from '../utils/dogDisplay'

// Diagonal stack for group profiles: photo size and step per dog count,
// all fitting the single-dog 64px slot.
const STACK = {
  2: { size: 46, step: 18 },
  3: { size: 40, step: 12 },
} as const

function DogPhoto({
  src,
  alt,
  className,
  iconSize,
  style,
}: {
  src?: string
  alt: string
  className: string
  iconSize: number
  style?: React.CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`overflow-hidden bg-[#f3f4f6] flex items-center justify-center ${className}`} style={style}>
      {src && !failed ? (
        <img src={src} alt={alt} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <DogIcon size={iconSize} className="text-text-muted" />
      )}
    </div>
  )
}

interface Props {
  dog: Dog
  nextStay?: Stay
  index?: number
}

export default function DogCard({ dog, nextStay }: Props) {
  const navigate = useNavigate()
  const photos = [
    { name: dog.name, photoUrl: dog.photoUrl },
    ...dog.additionalDogs.map((m) => ({ name: m.name, photoUrl: m.photoUrl })),
  ]
  const stack = photos.length > 1 ? STACK[Math.min(photos.length, 3) as 2 | 3] : null

  return (
    <button
      onClick={() => navigate(`/dogs/${dog.id}`)}
      // Same shape as the profile page's dog card — concentric corners:
      // card radius (26) = photo radius (12) + padding (14)
      className="w-full bg-cream border border-border-light rounded-[26px] p-3.5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
    >
      {/* Avatar — a group stacks each dog's photo diagonally, first dog in front */}
      {stack ? (
        <div className="shrink-0 size-16 relative">
          {photos.slice(0, 3).map((p, i) => (
            <DogPhoto
              key={i}
              src={p.photoUrl}
              alt={p.name}
              iconSize={Math.round(stack.size / 2)}
              // ring in the card color separates overlapping photos
              className="absolute rounded-[10px] ring-2 ring-cream"
              style={{
                width: stack.size,
                height: stack.size,
                left: i * stack.step,
                top: i * stack.step,
                zIndex: 3 - i,
              }}
            />
          ))}
        </div>
      ) : (
        <DogPhoto src={dog.photoUrl} alt={dog.name} iconSize={30} className="shrink-0 size-16 rounded-[12px]" />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + breed read as one unit; the owner sits apart below */}
        <div>
          <p className="font-outfit font-semibold text-[18px] text-text-primary leading-tight truncate">
            {dogDisplayName(dog)}
          </p>
          <p className="font-dm text-[12px] leading-tight text-text-secondary truncate">{dogDisplayBreed(dog)}</p>
        </div>
        {dog.ownerName && (
          <p className="font-dm text-[13px] leading-tight text-text-primary mt-2.5 truncate">
            {dog.ownerName}
          </p>
        )}
        {nextStay && (
          <span className="inline-flex items-center mt-1.5 rounded-full bg-coral px-2.5 py-1 text-[11px] font-dm font-bold uppercase tracking-wide text-white">
            {formatShortDate(nextStay.startDate)} – {formatShortDate(nextStay.endDate)}
          </span>
        )}
      </div>

      <ChevronRight size={20} className="shrink-0 text-text-primary" strokeWidth={2.5} />
    </button>
  )
}
