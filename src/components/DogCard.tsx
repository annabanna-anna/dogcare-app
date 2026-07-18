import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DogIcon from './icons/DogIcon'
import type { Dog, Stay } from '../types'
import { formatShortDate } from '../utils/dateUtils'

interface Props {
  dog: Dog
  nextStay?: Stay
  index?: number
}

export default function DogCard({ dog, nextStay }: Props) {
  const navigate = useNavigate()
  const [imgFailed, setImgFailed] = useState(false)
  const showPhoto = dog.photoUrl && !imgFailed

  return (
    <button
      onClick={() => navigate(`/dogs/${dog.id}`)}
      className="w-full bg-cream border border-border-light rounded-[22px] p-4 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
    >
      {/* Avatar */}
      <div className="shrink-0 size-16 rounded-[18px] overflow-hidden bg-[#f3f4f6] flex items-center justify-center">
        {showPhoto ? (
          <img
            src={dog.photoUrl}
            alt={dog.name}
            className="size-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <DogIcon size={30} className="text-text-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight">
          {dog.name}
        </p>
        <p className="font-dm text-[13px] text-text-secondary mt-0.5 truncate">
          {dog.breed} · {dog.ownerName}
        </p>
        {nextStay ? (
          <span className="inline-flex items-center mt-2 rounded-full bg-coral px-2.5 py-1 text-[11px] font-dm font-bold uppercase tracking-wide text-white">
            {formatShortDate(nextStay.startDate)} – {formatShortDate(nextStay.endDate)}
          </span>
        ) : (
          <span className="inline-flex items-center mt-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-dm font-bold text-text-muted">
            No upcoming stay
          </span>
        )}
      </div>

      <ChevronRight size={20} className="shrink-0 text-text-primary" strokeWidth={2.5} />
    </button>
  )
}
