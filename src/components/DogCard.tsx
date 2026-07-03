import { Dog as DogIcon, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Dog, Stay } from '../types'
import { formatShortDate } from '../utils/dateUtils'

interface Props {
  dog: Dog
  nextStay?: Stay
}

export default function DogCard({ dog, nextStay }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/dogs/${dog.id}`)}
      className="w-full bg-white border border-border-light rounded-[16px] p-4 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="shrink-0 size-14 rounded-[12px] overflow-hidden bg-[#f3f4f6] flex items-center justify-center">
        {dog.photoUrl ? (
          <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
        ) : (
          <DogIcon size={28} className="text-[#d1d5db]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-teachers font-semibold text-[18px] text-text-primary leading-tight">
          {dog.name}
        </p>
        <p className="font-gabarito text-[13px] text-text-secondary mt-0.5 truncate">
          {dog.breed} · {dog.ownerName}
        </p>
        {nextStay ? (
          <span className="inline-flex items-center mt-1.5 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-gabarito font-bold text-[#15803d]">
            Stay: {formatShortDate(nextStay.startDate)} – {formatShortDate(nextStay.endDate)}
          </span>
        ) : (
          <span className="inline-flex items-center mt-1.5 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-gabarito font-bold text-text-muted">
            No upcoming stay
          </span>
        )}
      </div>

      <ChevronRight size={18} className="shrink-0 text-[#d1d1d1]" />
    </button>
  )
}
