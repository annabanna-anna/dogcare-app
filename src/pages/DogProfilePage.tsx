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
  ShieldAlert,
  Trees,
} from 'lucide-react'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import { TASK_TYPE_STYLE } from '../components/taskTypeStyle'
import DogIcon from '../components/icons/DogIcon'
import PageHeader from '../components/PageHeader'
import CareNoteSection from '../components/CareNoteSection'
import DogTabs from '../components/DogTabs'
import Button from '../components/Button'
import GoingOutBlock from '../components/GoingOutBlock'
import { getDog, deleteDog } from '../lib/dogs'
import { listStays } from '../lib/stays'
import { formatTime, formatShortDate } from '../utils/dateUtils'
import { PRIMARY_DOG_KEY, type Dog, type Stay, type TaskType, type YesNoUnsure } from '../types'
import {
  dogDisplayBreed,
  dogDisplayName,
  dogGroup,
  dogsAtHome,
  joinDogNames,
  scheduleEntryDogName,
  stayDisplayName,
} from '../utils/dogDisplay'

const typeLabel: Record<TaskType, string> = {
  walk: 'Walk',
  meal: 'Meal',
  medication: 'Medication',
  potty: 'Potty break',
  other: 'Task',
}

const yesNoUnsureLabel: Record<YesNoUnsure, string> = {
  yes: 'Yes',
  no: 'No',
  unsure: 'Not sure',
}

function QuickFactRow({
  icon,
  label,
  badgeLabel,
  accent,
}: {
  icon: React.ReactNode
  label: string
  badgeLabel: string
  accent: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-coral shrink-0 flex">{icon}</span>
        <span className="font-dm text-[14px] text-text-primary truncate">{label}</span>
      </div>
      <span
        className={`font-dm font-bold text-[12px] uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${
          accent ? 'bg-coral text-white' : 'bg-[#f2f2f2] text-text-secondary'
        }`}
      >
        {badgeLabel}
      </span>
    </div>
  )
}

export default function DogProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dog, setDog] = useState<Dog | null | undefined>(undefined)
  const [currentStay, setCurrentStay] = useState<Stay | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Deleting a dog wipes every stay and task with it, so it takes typing the
  // dog's name — a reflex tap (e.g. right after deleting a stay, whose dialog
  // looks the same) can't do it.
  const [deleteTyped, setDeleteTyped] = useState('')
  const [activeDogKey, setActiveDogKey] = useState(PRIMARY_DOG_KEY)

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

  const group = dogGroup(dog)
  const isGroup = group.length > 1
  // Care notes are per dog; the owner, stay, and daily schedule are shared.
  const care = group.find((d) => d.key === activeDogKey) ?? group[0]

  const scheduleCard = (
    <div className="bg-white border border-border-light rounded-[16px] p-4">
      <div className="flex items-start gap-2 mb-4">
        <Clock size={16} className="text-coral shrink-0 mt-[3px]" />
        <h3 className="font-dm font-bold text-[13px] leading-[22px] text-text-secondary uppercase tracking-wide whitespace-nowrap">
          Daily Schedule
        </h3>
        <div className="ml-auto flex flex-wrap justify-end gap-1">
          {isGroup && (
            <span className="text-[11px] font-dm font-bold bg-[#eef1fd] text-cobalt rounded-full px-2 py-0.5">
              {dogDisplayName(dog)}
            </span>
          )}
          {dog.outingRule && (
            <span className="text-[11px] font-dm font-bold bg-coral-soft text-coral rounded-full px-2 py-0.5">
              Out every {dog.outingRule.everyHours} {dog.outingRule.everyHours === 1 ? 'hr' : 'hrs'}
            </span>
          )}
          {dog.walkTimeFlexible && !dog.outingRule && (
            <span className="text-[11px] font-dm font-bold bg-[#eef1fd] text-cobalt rounded-full px-2 py-0.5">
              Walk time flexible
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {dog.outingRule && <GoingOutBlock rule={dog.outingRule} careSchedule={dog.careSchedule} />}
        {dog.careSchedule.map((entry, i) => {
          // With a going-out rule, walks are listed in the block above.
          if (dog.outingRule && entry.taskType === 'walk') return null
          const { icon: Icon, bg } = TASK_TYPE_STYLE[entry.taskType] ?? TASK_TYPE_STYLE.other
          const onlyFor = isGroup ? scheduleEntryDogName(dog, entry.forDog) : undefined
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
              className={`size-6 rounded-full flex items-center justify-center shrink-0 ${bg} ${
                entry.note ? 'mt-0.5' : ''
              }`}
            >
              <Icon size={12} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-dm font-bold text-[14px] text-text-primary leading-none">
                  {entry.customTitle?.trim() || typeLabel[entry.taskType]}
                </p>
                {onlyFor && (
                  <span className="text-[11px] font-dm font-bold bg-[#f2f2f2] text-text-secondary rounded-full px-2 py-0.5">
                    {onlyFor} only
                  </span>
                )}
              </div>
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
  )

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader
        back
        title={dogDisplayName(dog)}
        subtitle={dog.additionalDogs.length > 0 ? dogDisplayBreed(dog) : `${dog.breed} · ${dog.size}`}
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
        {/* Photo + owner card — one per dog on a group profile */}
        {group.map((d) => (
          <div
            key={d.key}
            // Concentric corners: card radius (26) = photo radius (12) + padding (14)
            className="bg-white border border-border-light rounded-[26px] p-3.5 flex gap-4 items-center"
          >
            <div className="size-16 rounded-[12px] overflow-hidden bg-[#f3f4f6] shrink-0">
              {d.photoUrl ? (
                <img src={d.photoUrl} alt={d.name} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-text-muted"><DogIcon size={30} /></div>
              )}
            </div>
            <div className="min-w-0">
              {/* Name + breed read as one unit; the owner sits apart below */}
              <div>
                <p className="font-outfit font-semibold text-[18px] text-text-primary leading-tight truncate">
                  {d.name}
                </p>
                <p className="font-dm text-[12px] leading-tight text-text-secondary truncate">{d.breed}</p>
              </div>
              <p className="font-dm text-[13px] leading-tight text-text-primary mt-2.5 truncate">
                {dog.ownerName}
              </p>
            </div>
          </div>
        ))}

        {/* Current stay info + Edit Stay CTA, grouped in one card */}
        {currentStay ? (
          <div className="bg-white border border-border-light rounded-[26px] p-4 flex flex-col gap-4">
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
                {dogsAtHome(dog, currentStay.dogKeys).length > 0 && (
                  <p className="font-dm text-[13px] text-text-secondary mt-0.5">
                    {stayDisplayName(dog, currentStay.dogKeys)} staying ·{' '}
                    {joinDogNames(dogsAtHome(dog, currentStay.dogKeys).map((d) => d.name))} at home
                  </p>
                )}
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

        {/* Shared schedule sits above the per-dog notes on a group profile */}
        {isGroup && scheduleCard}

        {isGroup && (
          <div className="flex flex-col gap-2.5">
            <h3 className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-wide">
              Care Notes
            </h3>
            <DogTabs dogs={group} value={care.key} onChange={setActiveDogKey} />
          </div>
        )}

        {/* Quick Facts */}
        <div className="bg-white border border-border-light rounded-[16px] p-4 flex flex-col gap-3">
          <QuickFactRow
            icon={<ShieldAlert size={16} />}
            label="Allergies"
            badgeLabel={yesNoUnsureLabel[care.hasAllergies]}
            accent={care.hasAllergies === 'yes'}
          />
          {care.hasAllergies !== 'unsure' && care.allergyNotes && (
            <p className="font-dm text-[13px] text-text-secondary leading-relaxed pl-6 -mt-1">
              {care.allergyNotes}
            </p>
          )}
          <QuickFactRow
            icon={<Trees size={16} />}
            label="Goes to Dog Parks"
            badgeLabel={yesNoUnsureLabel[care.goesToDogParks]}
            accent={care.goesToDogParks === 'yes'}
          />
          {care.goesToDogParks !== 'unsure' && care.dogParkNotes && (
            <p className="font-dm text-[13px] text-text-secondary leading-relaxed pl-6 -mt-1">
              {care.dogParkNotes}
            </p>
          )}
        </div>

        {/* Care Notes */}
        <CareNoteSection
          title="Behavior"
          icon={<Heart size={16} />}
          content={care.behaviorNotes}
          emptyText="No behavior notes."
        />
        <CareNoteSection
          title="Food"
          icon={<DogBowlIcon size={16} />}
          content={care.foodNotes}
          emptyText="No food notes."
        />
        <CareNoteSection
          title="Medication"
          icon={<Pill size={16} />}
          content={care.medicationNotes}
          emptyText="No medications."
        />
        <CareNoteSection
          title="Walks"
          icon={<PawPrint size={16} />}
          content={care.walkNotes}
          emptyText="No walk notes."
        />
        <CareNoteSection
          title="Emergency Notes"
          icon={<AlertTriangle size={16} />}
          content={care.emergencyNotes}
          emptyText="No emergency notes."
        />
        <CareNoteSection
          title="Other Notes"
          icon={<StickyNote size={16} />}
          content={care.otherNotes}
          emptyText="No other notes."
        />

        {!isGroup && scheduleCard}

        {/* Delete */}
        <Button
          fullWidth
          variant="danger"
          onClick={() => {
            setDeleteTyped('')
            setShowDeleteConfirm(true)
          }}
        >
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
              Delete {dogDisplayName(dog)}?
            </p>
            <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
              This removes {dogDisplayName(dog)}'s profile, care instructions, and every stay and task
              linked to them. This can't be undone.
            </p>
            <label className="block mb-4">
              <span className="block font-dm text-[13px] text-text-secondary mb-1.5">
                Type <span className="font-bold text-text-primary">{dog.name.trim()}</span> to confirm
              </span>
              <input
                type="text"
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full rounded-[12px] border border-border bg-white px-4 py-3 font-dm text-[16px] text-text-primary outline-none focus:border-text-primary"
              />
            </label>
            {deleteError && (
              <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3 mb-3">
                <p className="font-dm text-[13px] text-[#b91c1c]">{deleteError}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                variant="danger"
                disabled={deleting || deleteTyped.trim().toLowerCase() !== dog.name.trim().toLowerCase()}
                onClick={async () => {
                  if (deleteTyped.trim().toLowerCase() !== dog.name.trim().toLowerCase()) return
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
    </div>
  )
}
