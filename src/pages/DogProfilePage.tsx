import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PawPrint,
  Pill,
  AlertTriangle,
  Heart,
  CalendarPlus,
  Pencil,
  Clock,
} from 'lucide-react'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import DogIcon from '../components/icons/DogIcon'
import PageHeader from '../components/PageHeader'
import CareNoteSection from '../components/CareNoteSection'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import { getDog } from '../lib/dogs'
import { formatTime } from '../utils/dateUtils'
import type { Dog, TaskType } from '../types'

const typeLabel: Record<TaskType, string> = {
  walk: 'Walk',
  meal: 'Meal',
  medication: 'Medication',
  potty: 'Potty break',
  other: 'Task',
}

const typeBg: Record<TaskType, string> = {
  walk: '#18ba1d',
  meal: '#ff4514',
  medication: '#2344dd',
  potty: '#18ba1d',
  other: '#6b7280',
}

const typeIcon: Record<TaskType, React.ComponentType<{ size?: string | number; className?: string }>> = {
  walk: PawPrint,
  meal: DogBowlIcon,
  medication: Pill,
  potty: PawPrint,
  other: PawPrint,
}

export default function DogProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dog, setDog] = useState<Dog | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getDog(id)
      .then((d) => !cancelled && setDog(d))
      .catch(() => !cancelled && setDog(null))
    return () => {
      cancelled = true
    }
  }, [id])

  if (dog === undefined) {
    return (
      <div className="min-h-svh bg-cream flex items-center justify-center px-6">
        <p className="font-dm text-[14px] text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (!dog) {
    return (
      <div className="min-h-svh bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-outfit font-bold text-[17px] text-text-primary mb-2">Dog not found</p>
          <Button onClick={() => navigate('/dogs')} variant="secondary">
            Back to Dogs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader
        back
        title={dog.name}
        subtitle={`${dog.breed} · ${dog.size}`}
        right={
          <button
            onClick={() => navigate(`/dogs/${dog.id}/edit`)}
            className="size-10 rounded-full bg-white border border-border-light flex items-center justify-center text-text-secondary active:bg-gray-50"
          >
            <Pencil size={16} />
          </button>
        }
      />

      <div className="px-6 mt-2 flex flex-col gap-4">
        {/* Photo + owner card */}
        <div className="bg-white border border-border-light rounded-[16px] p-4 flex gap-4 items-center">
          <div className="size-20 rounded-[14px] overflow-hidden bg-[#f3f4f6] shrink-0">
            {dog.photoUrl ? (
              <img src={dog.photoUrl} alt={dog.name} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-text-muted"><DogIcon size={36} /></div>
            )}
          </div>
          <div>
            <p className="font-outfit font-bold text-[22px] text-text-primary leading-none mb-1">
              {dog.name}
            </p>
            <p className="font-dm text-[14px] text-text-secondary">{dog.breed}</p>
            <p className="font-dm font-semibold text-[14px] text-text-primary mt-2">
              {dog.ownerName}
            </p>
            <p className="font-dm text-[13px] text-text-secondary">{dog.ownerContact}</p>
          </div>
        </div>

        {/* Start stay CTA */}
        <Button
          fullWidth
          onClick={() => navigate(`/stays/new?dog=${dog.id}`)}
        >
          <CalendarPlus size={18} />
          Start a Stay
        </Button>

        {/* Care Notes */}
        <CareNoteSection
          title="Behavior"
          icon={<Heart size={14} />}
          content={dog.behaviorNotes}
          accentColor="#ff4514"
          emptyText="No behavior notes."
        />
        <CareNoteSection
          title="Food"
          icon={<DogBowlIcon size={14} />}
          content={dog.foodNotes}
          accentColor="#ff4514"
          emptyText="No food notes."
        />
        <CareNoteSection
          title="Medication"
          icon={<Pill size={14} />}
          content={dog.medicationNotes}
          accentColor="#2344dd"
          emptyText="No medications."
        />
        <CareNoteSection
          title="Walks"
          icon={<PawPrint size={14} />}
          content={dog.walkNotes}
          accentColor="#18ba1d"
          emptyText="No walk notes."
        />
        <CareNoteSection
          title="Emergency Notes"
          icon={<AlertTriangle size={14} />}
          content={dog.emergencyNotes}
          accentColor="#dc2626"
          emptyText="No emergency notes."
        />

        {/* Daily Schedule */}
        <div className="bg-white border border-border-light rounded-[16px] p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-full flex items-center justify-center bg-cobalt shrink-0">
              <Clock size={14} className="text-white" />
            </div>
            <h3 className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-wide">
              Daily Schedule
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            {dog.careSchedule.map((entry, i) => {
              const Icon = typeIcon[entry.taskType] ?? PawPrint
              return (
              <div key={i} className="flex items-start gap-3">
                <span className="font-dm font-bold text-[13px] text-text-primary w-[68px] shrink-0 pt-0.5">
                  {formatTime(`2000-01-01T${entry.time}:00`)}
                </span>
                <div
                  className="size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: typeBg[entry.taskType] ?? '#6b7280' }}
                >
                  <Icon size={12} className="text-white" />
                </div>
                <div>
                  <p className="font-dm font-bold text-[14px] text-text-primary leading-none">
                    {typeLabel[entry.taskType]}
                  </p>
                  {entry.note && (
                    <p className="font-dm text-[12px] text-text-secondary mt-0.5">
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
