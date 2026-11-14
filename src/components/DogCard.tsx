import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DogPhotoStack from './DogPhotoStack'
import type { Dog, Stay } from '../types'
import { formatShortDate, isSameDay } from '../utils/dateUtils'
import { dogDisplayBreed, dogDisplayName } from '../utils/dogDisplay'

interface Props {
  dog: Dog
  nextStay?: Stay
  index?: number
}

/** Stay tag text: "Until Nov 18" / "Ends today" while staying, otherwise the
 *  range with the month written once when it doesn't change ("Nov 20 – 23"). */
function stayLabel(stay: Stay, active: boolean): string {
  const start = new Date(stay.startDate)
  const end = new Date(stay.endDate)
  if (active) return isSameDay(end, new Date()) ? 'Ends today' : `Until ${formatShortDate(stay.endDate)}`
  if (isSameDay(start, end)) return formatShortDate(stay.startDate)
  const endText =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
      ? String(end.getDate())
      : formatShortDate(stay.endDate)
  return `${formatShortDate(stay.startDate)} – ${endText}`
}

export default function DogCard({ dog, nextStay }: Props) {
  const navigate = useNavigate()
  const photos = [
    { name: dog.name, photoUrl: dog.photoUrl },
    ...dog.additionalDogs.map((m) => ({ name: m.name, photoUrl: m.photoUrl })),
  ]
  const now = new Date()
  const stayActive =
    !!nextStay && new Date(nextStay.startDate) <= now && new Date(nextStay.endDate) >= now

  return (
    <button
      onClick={() => navigate(`/dogs/${dog.id}`)}
      // Same shape as the profile page's dog card — concentric corners:
      // card radius (26) = photo radius (12) + padding (14)
      className="w-full bg-cream border border-border-light rounded-[26px] p-3.5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
    >
      {/* Avatar — a group stacks each dog's photo diagonally, first dog in front.
          The front photo sits in the card's corner, so it keeps the same 12px radius */}
      <DogPhotoStack dogs={photos} size={64} radius={12} stackRadius={12} ringClassName="ring-cream" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + breed read as one unit; the owner sits apart below */}
        <div>
          <p className="font-outfit font-semibold text-[18px] text-text-primary leading-tight truncate">
            {dogDisplayName(dog)}
          </p>
          <p className="font-dm text-[12px] leading-tight text-text-secondary truncate">{dogDisplayBreed(dog)}</p>
        </div>
        {/* Owner and stay tag share one line, so a stay never makes the card
            taller — filled while staying now, outlined when upcoming */}
        {(dog.ownerName || nextStay) && (
          <div className="flex items-center gap-2 mt-2.5 min-w-0">
            {dog.ownerName && (
              <p className="font-dm text-[13px] leading-tight text-text-primary truncate">{dog.ownerName}</p>
            )}
            {nextStay && (
              <span
                className={`shrink-0 rounded-full px-[7px] h-4 inline-flex items-center text-[10px] leading-none font-dm font-bold uppercase tracking-wide ${
                  stayActive ? 'bg-coral text-white' : 'border-[1.5px] border-coral text-coral'
                }`}
              >
                {stayLabel(nextStay, stayActive)}
              </span>
            )}
          </div>
        )}
      </div>

      <ChevronRight size={20} className="shrink-0 text-text-primary" strokeWidth={2.5} />
    </button>
  )
}
