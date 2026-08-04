import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ImagePlus, RefreshCw, Trash2, Plus, ChevronDown, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { getDog, createDog, updateDog, uploadDogPhoto } from '../lib/dogs'
import { regenerateFutureTasksForDog } from '../lib/stayTaskSync'
import { TimePickerButton } from '../components/TimePicker'
import { DOG_BREEDS } from '../data/dogBreeds'
import type { CareScheduleEntry, DogSize, TaskType } from '../types'

const scheduleTypeOptions: { value: TaskType; label: string }[] = [
  { value: 'walk', label: 'Walk' },
  { value: 'meal', label: 'Meal' },
  { value: 'medication', label: 'Medication' },
  { value: 'potty', label: 'Potty break' },
  { value: 'other', label: 'Other' },
]

const scheduleNotePlaceholder: Record<TaskType, string> = {
  walk: 'Note (optional) — e.g. avoid dog park',
  meal: 'Note (optional) — e.g. 1 cup of dried kibble',
  medication: 'Note (optional) — e.g. 1 pill with food',
  potty: 'Note (optional) — e.g. backyard only',
  other: 'Note (optional)',
}

interface FormState {
  name: string
  breed: string
  size: DogSize
  ownerName: string
  ownerContact: string
  behaviorNotes: string
  foodNotes: string
  medicationNotes: string
  walkNotes: string
  emergencyNotes: string
}

const defaultForm: FormState = {
  name: '',
  breed: '',
  size: 'medium',
  ownerName: '',
  ownerContact: '',
  behaviorNotes: '',
  foodNotes: '',
  medicationNotes: '',
  walkNotes: '',
  emergencyNotes: '',
}

const sizeOptions: { value: DogSize; label: string; weight: string }[] = [
  { value: 'small', label: 'Small', weight: 'under 25 lb' },
  { value: 'medium', label: 'Medium', weight: '25–60 lb' },
  { value: 'large', label: 'Large', weight: '60–90 lb' },
  { value: 'extra-large', label: 'XL', weight: '90+ lb' },
]

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-1.5">
      {children}
      {required && <span className="text-coral"> *</span>}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors"
    />
  )
}

function BreedAutocompleteInput({
  value,
  onChange,
  placeholder = 'e.g. Golden Retriever',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const query = value.trim().toLowerCase()
  const matches = query
    ? DOG_BREEDS.filter((b) => b.toLowerCase().includes(query)).slice(0, 6)
    : []

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-[12px] overflow-hidden">
          {matches.map((breed) => (
            <button
              key={breed}
              type="button"
              onClick={() => {
                onChange(breed)
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 font-dm text-[14px] text-text-primary active:bg-[#f3f4f6] transition-colors"
            >
              {breed}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatMixedBreed(breeds: string[]): string {
  const filled = breeds.map((b) => b.trim()).filter(Boolean)
  if (filled.length === 0) return ''
  if (filled.length === 1) return `${filled[0]} Mix`
  if (filled.length === 2) return `${filled[0]} & ${filled[1]} Mix`
  return `${filled.slice(0, -1).join(', ')} & ${filled[filled.length - 1]} Mix`
}

function BreedField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mixed, setMixed] = useState(false)
  const [mixedBreeds, setMixedBreeds] = useState<string[]>(['', ''])

  function updateMixedBreed(i: number, v: string) {
    const next = mixedBreeds.map((b, j) => (j === i ? v : b))
    setMixedBreeds(next)
    onChange(formatMixedBreed(next))
  }

  function addMixedBreedRow() {
    setMixedBreeds((prev) => [...prev, ''])
  }

  function removeMixedBreedRow(i: number) {
    setMixedBreeds((prev) => {
      const next = prev.filter((_, j) => j !== i)
      if (next.length <= 1) {
        setMixed(false)
        onChange(next[0]?.trim() ?? '')
        return ['', '']
      }
      onChange(formatMixedBreed(next))
      return next
    })
  }

  if (mixed) {
    return (
      <div className="flex flex-col gap-2">
        {mixedBreeds.map((breed, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="flex-1">
              <BreedAutocompleteInput
                value={breed}
                onChange={(v) => updateMixedBreed(i, v)}
                placeholder={i === 0 ? 'e.g. Pembroke Welsh Corgi' : 'e.g. Pomeranian'}
              />
            </div>
            {mixedBreeds.length > 1 && (
              <button
                type="button"
                onClick={() => removeMixedBreedRow(i)}
                aria-label="Remove breed"
                className="size-[46px] rounded-[12px] bg-[#f3f4f6] flex items-center justify-center text-text-secondary shrink-0 active:bg-[#e5e7eb] transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={addMixedBreedRow}
            className="flex items-center gap-1 font-dm font-bold text-[13px] text-coral"
          >
            <Plus size={14} />
            Add another breed
          </button>
          <button
            type="button"
            onClick={() => {
              setMixed(false)
              onChange('')
            }}
            className="font-dm font-medium text-[13px] text-text-secondary underline"
          >
            Not mixed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <BreedAutocompleteInput value={value} onChange={onChange} />
      <button
        type="button"
        onClick={() => {
          setMixed(true)
          setMixedBreeds(['', ''])
          onChange('')
        }}
        className="self-end font-dm font-medium text-[13px] text-coral underline"
      >
        This dog is a mix of multiple breeds
      </button>
    </div>
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors resize-none"
    />
  )
}

/**
 * Rectangular photo picker with adjustable crop:
 * drag the image to position it, slide to zoom. The visible
 * rectangle is what gets saved (baked via canvas on submit).
 */
function PhotoCropField({
  src,
  pan,
  zoom,
  natural,
  boxRef,
  onPick,
  onRemove,
  onPanChange,
  onZoomChange,
  onNatural,
}: {
  src: string | null
  pan: { x: number; y: number }
  zoom: number
  natural: { w: number; h: number } | null
  boxRef: React.RefObject<HTMLDivElement>
  onPick: (dataUrl: string) => void
  onRemove: () => void
  onPanChange: (p: { x: number; y: number }) => void
  onZoomChange: (z: number) => void
  onNatural: (n: { w: number; h: number }) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const drag = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

  function scaledSize(z = zoom) {
    if (!natural || !boxRef.current) return null
    const box = boxRef.current.getBoundingClientRect()
    const s = Math.max(box.width / natural.w, box.height / natural.h) * z
    return { dw: natural.w * s, dh: natural.h * s, bw: box.width, bh: box.height }
  }

  function clamp(p: { x: number; y: number }, z = zoom) {
    const dims = scaledSize(z)
    if (!dims) return p
    return {
      x: Math.min(0, Math.max(dims.bw - dims.dw, p.x)),
      y: Math.min(0, Math.max(dims.bh - dims.dh, p.y)),
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onPick(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleZoom(z: number) {
    const dims = scaledSize()
    if (dims) {
      // keep the crop centered while zooming
      const ratio = z / zoom
      const cx = dims.bw / 2
      const cy = dims.bh / 2
      onPanChange(clamp({ x: cx - (cx - pan.x) * ratio, y: cy - (cy - pan.y) * ratio }, z))
    }
    onZoomChange(z)
  }

  const dims = scaledSize()

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {!src ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-[4/3] rounded-[16px] border-2 border-dashed border-border-light bg-white flex flex-col items-center justify-center gap-2 text-text-secondary active:bg-gray-50 transition-colors"
        >
          <ImagePlus size={28} strokeWidth={1.8} />
          <span className="font-dm font-bold text-[14px]">Upload photo</span>
        </button>
      ) : (
        <>
          <div
            ref={boxRef}
            className="relative w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-card touch-none cursor-grab active:cursor-grabbing select-none"
            onPointerDown={(e) => {
              drag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!drag.current) return
              onPanChange(
                clamp({
                  x: drag.current.panX + (e.clientX - drag.current.startX),
                  y: drag.current.panY + (e.clientY - drag.current.startY),
                }),
              )
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img
              src={src}
              draggable={false}
              crossOrigin="anonymous"
              onLoad={(e) => {
                const img = e.currentTarget
                onNatural({ w: img.naturalWidth, h: img.naturalHeight })
              }}
              className="absolute top-0 left-0 pointer-events-none"
              style={
                dims
                  ? {
                      width: dims.dw,
                      height: dims.dh,
                      maxWidth: 'none',
                      transform: `translate(${pan.x}px, ${pan.y}px)`,
                    }
                  : { width: '100%', height: '100%', objectFit: 'cover' }
              }
            />
          </div>
          <p className="font-dm text-[12px] text-text-secondary mt-2">
            Drag the photo to choose what shows. Use the slider to zoom.
          </p>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="w-full mt-1 accent-coral"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border-light font-dm font-bold text-[13px] text-text-secondary active:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
              Replace
            </button>
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#fee2e2] font-dm font-bold text-[13px] text-[#b91c1c] active:bg-[#fecaca] transition-colors"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function AddEditDogPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id && id !== 'new')

  const [form, setForm] = useState<FormState>(() => ({
    ...defaultForm,
    name: searchParams.get('name') ?? defaultForm.name,
    ownerName: searchParams.get('owner') ?? defaultForm.ownerName,
  }))
  const [schedule, setSchedule] = useState<CareScheduleEntry[]>([])
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [existingName, setExistingName] = useState('Dog')
  const [loadingExisting, setLoadingExisting] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isEdit || !id) return
    let cancelled = false
    getDog(id)
      .then((d) => {
        if (cancelled) return
        if (!d) {
          setNotFound(true)
          return
        }
        setForm({
          name: d.name,
          breed: d.breed,
          size: d.size,
          ownerName: d.ownerName,
          ownerContact: d.ownerContact,
          behaviorNotes: d.behaviorNotes,
          foodNotes: d.foodNotes,
          medicationNotes: d.medicationNotes,
          walkNotes: d.walkNotes,
          emergencyNotes: d.emergencyNotes,
        })
        setSchedule(d.careSchedule.map((e) => ({ ...e })))
        setPhotoSrc(d.photoUrl ?? null)
        setExistingId(d.id)
        setExistingName(d.name)
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoadingExisting(false))
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function set<K extends keyof FormState>(key: K) {
    return (value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))
  }

  /** Renders the visible crop rectangle to a JPEG Blob. Returns undefined if the
   *  source image can't be read into a canvas (e.g. a remote photo without CORS). */
  async function bakePhotoBlob(): Promise<Blob | undefined> {
    if (!photoSrc || !natural || !boxRef.current) return undefined
    const box = boxRef.current.getBoundingClientRect()
    const s = Math.max(box.width / natural.w, box.height / natural.h) * zoom
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = photoSrc
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 880
      canvas.height = 660
      const ctx = canvas.getContext('2d')
      if (!ctx) return undefined
      ctx.drawImage(img, -pan.x / s, -pan.y / s, box.width / s, box.height / s, 0, 0, 880, 660)
      return await new Promise<Blob | undefined>((resolve) =>
        canvas.toBlob((blob) => resolve(blob ?? undefined), 'image/jpeg', 0.85),
      )
    } catch {
      return undefined
    }
  }

  const [scheduleWarning, setScheduleWarning] = useState<'empty' | 'no-walk' | null>(null)
  const [noWalkAcknowledged, setNoWalkAcknowledged] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)
  const scheduleSectionRef = useRef<HTMLElement>(null)
  const hasWalkEntry = schedule.some((e) => e.taskType === 'walk')

  function handleSubmit() {
    if (!form.name.trim()) {
      setNameTouched(true)
      return
    }
    if (schedule.length === 0) {
      setScheduleWarning('empty')
      return
    }
    if (!hasWalkEntry && !noWalkAcknowledged) {
      setScheduleWarning('no-walk')
      return
    }
    void doSave()
  }

  async function doSave() {
    setSaving(true)
    setError(null)
    try {
      const dogId = existingId ?? crypto.randomUUID()

      let photoUrl: string | null
      if (photoSrc === null) {
        photoUrl = null
      } else {
        const blob = await bakePhotoBlob()
        photoUrl = blob ? await uploadDogPhoto(dogId, blob) : photoSrc
      }

      const careSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time))
      const input = { ...form, photoUrl, careSchedule }

      if (isEdit && existingId) {
        const updated = await updateDog(existingId, input)
        // The care schedule may have changed — rebuild the future tasks of
        // any active/upcoming stay so Today reflects the edit immediately.
        await regenerateFutureTasksForDog(updated)
      } else {
        await createDog(dogId, input)
      }
      navigate(isEdit ? `/dogs/${dogId}` : '/dogs')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="min-h-svh bg-cream flex items-center justify-center px-6">
        <p className="font-dm text-[14px] text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (notFound) {
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
      <PageHeader back title={isEdit ? `Edit ${existingName}` : 'Add Dog'} />

      <div className="px-6 mt-4 flex flex-col gap-5">
        {error && (
          <div className="bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}

        {/* Photo */}
        <section>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
            Photo
          </p>
          <PhotoCropField
            src={photoSrc}
            pan={pan}
            zoom={zoom}
            natural={natural}
            boxRef={boxRef}
            onPick={(dataUrl) => {
              setPhotoSrc(dataUrl)
              setPan({ x: 0, y: 0 })
              setZoom(1)
              setNatural(null)
            }}
            onRemove={() => {
              setPhotoSrc(null)
              setNatural(null)
            }}
            onPanChange={setPan}
            onZoomChange={setZoom}
            onNatural={(n) => {
              setNatural(n)
              // center the image in the crop box initially
              if (boxRef.current) {
                const box = boxRef.current.getBoundingClientRect()
                const s = Math.max(box.width / n.w, box.height / n.h)
                setPan({ x: (box.width - n.w * s) / 2, y: (box.height - n.h * s) / 2 })
              }
            }}
          />
        </section>

        {/* Basic Info */}
        <section>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
            Basic Info
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel required>Dog's Name</FieldLabel>
              <Input value={form.name} onChange={set('name')} placeholder="e.g. Ollie" />
              {nameTouched && !form.name.trim() && (
                <p className="font-dm text-[12px] text-[#b91c1c] mt-1">Dog's name is required.</p>
              )}
            </div>
            <div>
              <FieldLabel>Breed</FieldLabel>
              <BreedField value={form.breed} onChange={set('breed')} />
            </div>
            <div>
              <FieldLabel>Size</FieldLabel>
              <div className="flex gap-2">
                {sizeOptions.map(({ value, label, weight }) => (
                  <button
                    key={value}
                    onClick={() => set('size')(value)}
                    className={`flex-1 py-2.5 rounded-[12px] border transition-colors ${
                      form.size === value
                        ? 'bg-coral border-coral text-white'
                        : 'bg-white border-border-light text-text-secondary'
                    }`}
                  >
                    <span className="font-dm font-bold text-[14px] block leading-tight">{label}</span>
                    <span
                      className={`font-dm text-[11px] block leading-tight ${
                        form.size === value ? 'text-white/80' : 'text-text-muted'
                      }`}
                    >
                      {weight}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Owner Info */}
        <section>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
            Owner
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Owner Name</FieldLabel>
              <Input value={form.ownerName} onChange={set('ownerName')} placeholder="Full name" />
            </div>
            <div>
              <FieldLabel>Contact</FieldLabel>
              <Input
                value={form.ownerContact}
                onChange={set('ownerContact')}
                placeholder="Phone or email"
                type="tel"
              />
            </div>
          </div>
        </section>

        {/* Care Notes */}
        <section>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
            Care Instructions
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Behavior Notes</FieldLabel>
              <Textarea
                value={form.behaviorNotes}
                onChange={set('behaviorNotes')}
                placeholder="Temperament, fears, habits, social behavior..."
              />
            </div>
            <div>
              <FieldLabel>Food Notes</FieldLabel>
              <Textarea
                value={form.foodNotes}
                onChange={set('foodNotes')}
                placeholder="Food type, portion size, allergies, schedule..."
              />
            </div>
            <div>
              <FieldLabel>Medication Notes</FieldLabel>
              <Textarea
                value={form.medicationNotes}
                onChange={set('medicationNotes')}
                placeholder="Medication names, doses, timing..."
              />
            </div>
            <div>
              <FieldLabel>Walk Notes</FieldLabel>
              <Textarea
                value={form.walkNotes}
                onChange={set('walkNotes')}
                placeholder="Duration, preferred routes, leash behavior..."
              />
            </div>
            <div>
              <FieldLabel>Emergency Notes</FieldLabel>
              <Textarea
                value={form.emergencyNotes}
                onChange={set('emergencyNotes')}
                placeholder="Vet name & number, emergency contacts, allergies..."
                rows={4}
              />
            </div>
          </div>
        </section>

        {/* Daily Schedule */}
        <section ref={scheduleSectionRef} className="scroll-mt-4">
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-1">
            Daily Schedule
          </p>
          <p className="font-dm text-[13px] text-text-secondary mb-3">
            Care tasks are generated from this schedule for every day of a stay.
          </p>
          <label className="flex items-center gap-2 px-1 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noWalkAcknowledged}
              onChange={(e) => setNoWalkAcknowledged(e.target.checked)}
              className="accent-coral size-4 shrink-0"
            />
            <span className="font-dm text-[13px] text-text-secondary">
              Walk time is flexible
            </span>
          </label>
          <div className="flex flex-col gap-2">
            {schedule.map((entry, i) => (
              <div key={i} className="bg-white border border-border-light rounded-[12px] p-3 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <TimePickerButton
                    value={entry.time}
                    onChange={(v) =>
                      setSchedule((prev) =>
                        prev.map((en, j) => (j === i ? { ...en, time: v } : en)),
                      )
                    }
                    className="w-[118px] shrink-0 bg-white border border-border-light rounded-[10px] pl-3 pr-7 py-2 font-dm font-bold text-[13px] text-text-primary"
                  />
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={entry.taskType}
                      onChange={(e) =>
                        setSchedule((prev) =>
                          prev.map((en, j) =>
                            j === i ? { ...en, taskType: e.target.value as TaskType } : en,
                          ),
                        )
                      }
                      className="w-full bg-white border border-border-light rounded-[10px] pl-3 pr-7 py-2 font-dm font-bold text-[13px] text-text-primary focus:outline-none focus:border-coral transition-colors appearance-none"
                    >
                      {scheduleTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />
                  </div>
                  <button
                    onClick={() => setSchedule((prev) => prev.filter((_, j) => j !== i))}
                    className="size-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-text-secondary shrink-0 active:bg-[#e5e7eb] transition-colors"
                    aria-label="Remove schedule entry"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={entry.note ?? ''}
                  onChange={(e) =>
                    setSchedule((prev) =>
                      prev.map((en, j) => (j === i ? { ...en, note: e.target.value } : en)),
                    )
                  }
                  placeholder={scheduleNotePlaceholder[entry.taskType]}
                  className="w-full bg-white border border-border-faint rounded-[10px] px-3 py-2 font-dm text-[13px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors"
                />
              </div>
            ))}
            <button
              onClick={() =>
                setSchedule((prev) => [...prev, { time: '08:00', taskType: 'walk', note: '' }])
              }
              className="w-full py-3 rounded-[12px] border-2 border-dashed border-border-light flex items-center justify-center gap-1.5 font-dm font-bold text-[14px] text-text-secondary active:bg-gray-50 transition-colors"
            >
              <Plus size={16} />
              Add to schedule
            </button>
          </div>
        </section>

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={!form.name.trim() || saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Dog'}
        </Button>
      </div>

      {/* Missing-schedule / missing-walk confirmation */}
      {scheduleWarning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setScheduleWarning(null)}
          />
          <div className="relative w-full max-w-[380px] bg-cream rounded-[22px] p-6">
            <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight mb-2">
              {scheduleWarning === 'empty' ? 'No daily schedule yet' : 'No walk scheduled'}
            </p>
            <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
              {scheduleWarning === 'empty'
                ? `Confirm how often ${form.name.trim() || 'this dog'} should be taken outside, fed, or given medication — care tasks during stays are generated from this schedule.`
                : `${form.name.trim() || 'This dog'} doesn't have a walk on the schedule. If that's intentional, you can save as-is — otherwise add one below.`}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                onClick={() => {
                  const warning = scheduleWarning
                  setScheduleWarning(null)
                  if (warning === 'empty') {
                    setSchedule((prev) =>
                      prev.length ? prev : [{ time: '08:00', taskType: 'walk', note: '' }],
                    )
                  } else {
                    setSchedule((prev) => [...prev, { time: '08:00', taskType: 'walk', note: '' }])
                  }
                  scheduleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {scheduleWarning === 'empty' ? 'Set the schedule' : 'Add a walk'}
              </Button>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => {
                  if (scheduleWarning === 'no-walk') setNoWalkAcknowledged(true)
                  setScheduleWarning(null)
                  void doSave()
                }}
              >
                {scheduleWarning === 'empty' ? 'Save without schedule' : 'Save without a walk'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
