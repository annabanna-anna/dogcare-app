import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PawPrint,
  Pill,
  AlertTriangle,
  Heart,
  CalendarPlus,
  CalendarDays,
  Pencil,
  Clock,
  Trash2,
  StickyNote,
} from 'lucide-react'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import DogIcon from '../components/icons/DogIcon'
import PageHeader from '../components/PageHeader'
import CareNoteSection from '../components/CareNoteSection'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import { getDog, deleteDog } from '../lib/dogs'
import { listStays } from '../lib/stays'
import { formatTime, formatShortDate } from '../utils/dateUtils'
import type { Dog, Stay, TaskType } from '../types'

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
  const [currentStay, setCurrentStay] = useState<Stay | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const now = new Date()
    listStays()
      .then((stays) => {
        if (cancelled) return
        const upcoming = stays
          .filter((s) => s.dogId === id && new Date(s.endDate) >= now)
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
        setCurrentStay(upcoming[0] ?? null)
      })
      .catch(() => {})
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

        {/* Current stay info + Edit Stay CTA, grouped in one card */}
        {currentStay ? (
          <div className="bg-white border border-border-light rounded-[16px] p-4 flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <div className="size-9 rounded-[10px] bg-[#eef1fd] flex items-center justify-center shrink-0">
                <CalendarDays size={18} className="text-cobalt" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-dm font-bold text-[14px] text-text-primary leading-none">
                    {new Date(currentStay.startDate) <= new Date() &&
                    new Date(currentStay.endDate) >= new Date()
                      ? 'Staying now'
                      : 'Upcoming stay'}
                  </p>
                  {new Date(currentStay.startDate) <= new Date() &&
                    new Date(currentStay.endDate) >= new Date() && (
                      <span className="text-[11px] font-dm font-bold bg-[#dcfce7] text-[#15803d] rounded-full px-2 py-0.5">
                        Active
                      </span>
                    )}
                </div>
                <p className="font-dm text-[13px] text-text-secondary">
                  {formatShortDate(currentStay.startDate)} {formatTime(currentStay.startDate)} →{' '}
                  {formatShortDate(currentStay.endDate)} {formatTime(currentStay.endDate)}
                </p>
                {currentStay.notes && (
                  <p className="font-dm text-[13px] text-text-muted mt-1">{currentStay.notes}</p>
                )}
              </div>
            </div>
            <Button
              fullWidth
              onClick={() => navigate(`/stays/${currentStay.id}/edit`)}
            >
              <Pencil size={18} />
              Edit Stay
            </Button>
          </div>
        ) : (
          <Button
            fullWidth
            onClick={() => navigate(`/stays/new?dog=${dog.id}`)}
          >
            <CalendarPlus size={18} />
            Start a Stay
          </Button>
        )}

        {/* Care Notes */}
        <CareNoteSection
          title="Behavior"
          icon={<Heart size={16} />}
          content={dog.behaviorNotes}
          emptyText="No behavior notes."
        />
        <CareNoteSection
          title="Food"
          icon={<DogBowlIcon size={16} />}
          content={dog.foodNotes}
          emptyText="No food notes."
        />
        <CareNoteSection
          title="Medication"
          icon={<Pill size={16} />}
          content={dog.medicationNotes}
          emptyText="No medications."
        />
        <CareNoteSection
          title="Walks"
          icon={<PawPrint size={16} />}
          content={dog.walkNotes}
          emptyText="No walk notes."
        />
        <CareNoteSection
          title="Emergency Notes"
          icon={<AlertTriangle size={16} />}
          content={dog.emergencyNotes}
          emptyText="No emergency notes."
        />
        <CareNoteSection
          title="Other Notes"
          icon={<StickyNote size={16} />}
          content={dog.otherNotes}
          emptyText="No other notes."
        />

        {/* Daily Schedule */}
        <div className="bg-white border border-border-light rounded-[16px] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-coral shrink-0" />
            <h3 className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-wide">
              Daily Schedule
            </h3>
            {dog.walkTimeFlexible && (
              <span className="ml-auto text-[11px] font-dm font-bold bg-[#eef1fd] text-cobalt rounded-full px-2 py-0.5">
                Walk time flexible
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {dog.careSchedule.map((entry, i) => {
              const Icon = typeIcon[entry.taskType] ?? PawPrint
              return (
              <div key={i} className={`flex gap-3 ${entry.note ? 'items-start' : 'items-center'}`}>
                <span
                  className={`font-dm font-bold text-[13px] text-text-primary w-[68px] shrink-0 ${
                    entry.note ? 'pt-0.5' : ''
                  }`}
                >
                  {formatTime(`2000-01-01T${entry.time}:00`)}
                </span>
                <div
                  className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                    entry.note ? 'mt-0.5' : ''
                  }`}
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
        {/* Delete */}
        <Button fullWidth variant="danger" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={18} />
          Delete Dog
        </Button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-[380px] bg-cream rounded-[22px] p-6">
            <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight mb-2">
              Delete {dog.name}?
            </p>
            <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
              This removes {dog.name}'s profile, care instructions, and every stay and task
              linked to them. This can't be undone.
            </p>
            {deleteError && (
              <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3 mb-3">
                <p className="font-dm text-[13px] text-[#b91c1c]">{deleteError}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                variant="danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  setDeleteError(null)
                  try {
                    await deleteDog(dog.id)
                    navigate('/dogs')
                  } catch (e) {
                    setDeleteError(e instanceof Error ? e.message : 'Could not delete. Please try again.')
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Dog'}
              </Button>
              <Button fullWidth variant="ghost" disabled={deleting} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
