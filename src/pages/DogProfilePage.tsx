import { useParams, useNavigate } from 'react-router-dom'
import {
  PawPrint,
  UtensilsCrossed,
  Pill,
  AlertTriangle,
  Heart,
  CalendarPlus,
  Pencil,
  Clock,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import CareNoteSection from '../components/CareNoteSection'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import { mockDogs } from '../data/mockDogs'
import { formatTime } from '../utils/dateUtils'
import type { TaskType } from '../types'

const typeLabel: Record<TaskType, string> = {
  walk: 'Walk',
  meal: 'Meal',
  medication: 'Medication',
  potty: 'Potty break',
  play: 'Play time',
  groom: 'Grooming',
  other: 'Task',
}

const typeBg: Record<TaskType, string> = {
  walk: '#18ba1d',
  meal: '#ff4514',
  medication: '#2486ff',
  potty: '#18ba1d',
  play: '#f59e0b',
  groom: '#8b5cf6',
  other: '#6b7280',
}

export default function DogProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dog = mockDogs.find((d) => d.id === id)

  if (!dog) {
    return (
      <div className="min-h-svh bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-gabarito font-bold text-[17px] text-text-primary mb-2">Dog not found</p>
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
              <div className="size-full flex items-center justify-center text-4xl">🐶</div>
            )}
          </div>
          <div>
            <p className="font-teachers font-extrabold text-[22px] text-text-primary leading-none mb-1">
              {dog.name}
            </p>
            <p className="font-gabarito text-[14px] text-text-secondary">{dog.breed}</p>
            <p className="font-gabarito font-semibold text-[14px] text-text-primary mt-2">
              {dog.ownerName}
            </p>
            <p className="font-gabarito text-[13px] text-text-secondary">{dog.ownerContact}</p>
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
          icon={<UtensilsCrossed size={14} />}
          content={dog.foodNotes}
          accentColor="#ff4514"
          emptyText="No food notes."
        />
        <CareNoteSection
          title="Medication"
          icon={<Pill size={14} />}
          content={dog.medicationNotes}
          accentColor="#2486ff"
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
            <div className="size-7 rounded-full flex items-center justify-center bg-[#1f1f1f] shrink-0">
              <Clock size={14} className="text-white" />
            </div>
            <h3 className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-wide">
              Daily Schedule
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            {dog.careSchedule.map((entry, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-gabarito font-extrabold text-[13px] text-text-primary w-[68px] shrink-0 pt-0.5">
                  {formatTime(`2000-01-01T${entry.time}:00`)}
                </span>
                <div
                  className="size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: typeBg[entry.taskType] ?? '#6b7280' }}
                >
                  <PawPrint size={12} className="text-white" />
                </div>
                <div>
                  <p className="font-gabarito font-bold text-[14px] text-text-primary leading-none">
                    {typeLabel[entry.taskType]}
                  </p>
                  {entry.note && (
                    <p className="font-gabarito text-[12px] text-text-secondary mt-0.5">
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
