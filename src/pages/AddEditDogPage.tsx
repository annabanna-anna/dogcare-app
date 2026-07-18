import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, RefreshCw, Trash2, Plus, ChevronDown, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { mockDogs } from '../data/mockDogs'
import { TimePickerButton } from '../components/TimePicker'
import type { CareScheduleEntry, DogSize, TaskType } from '../types'

const scheduleTypeOptions: { value: TaskType; label: string }[] = [
  { value: 'walk', label: 'Walk' },
  { value: 'meal', label: 'Meal' },
  { value: 'medication', label: 'Medication' },
  { value: 'potty', label: 'Potty break' },
  { value: 'other', label: 'Other' },
]

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

const sizeOptions: { value: DogSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'XL' },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-1.5">
      {children}
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
  const isEdit = id && id !== 'new'
  const existing = isEdit ? mockDogs.find((d) => d.id === id) : undefined

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          name: existing.name,
          breed: existing.breed,
          size: existing.size,
          ownerName: existing.ownerName,
          ownerContact: existing.ownerContact,
          behaviorNotes: existing.behaviorNotes,
          foodNotes: existing.foodNotes,
          medicationNotes: existing.medicationNotes,
          walkNotes: existing.walkNotes,
          emergencyNotes: existing.emergencyNotes,
        }
      : defaultForm,
  )

  const [schedule, setSchedule] = useState<CareScheduleEntry[]>(
    existing ? existing.careSchedule.map((e) => ({ ...e })) : [],
  )
  const [photoSrc, setPhotoSrc] = useState<string | null>(existing?.photoUrl ?? null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  function set<K extends keyof FormState>(key: K) {
    return (value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))
  }

  /** Render the visible crop rectangle to a canvas and return it as a JPEG data URL. */
  async function bakePhoto(): Promise<string | undefined> {
    if (!photoSrc) return undefined
    if (!natural || !boxRef.current) return photoSrc
    const box = boxRef.current.getBoundingClientRect()
    const s = Math.max(box.width / natural.w, box.height / natural.h) * zoom
    const img = new Image()
    img.src = photoSrc
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 880
    canvas.height = 660
    const ctx = canvas.getContext('2d')
    if (!ctx) return photoSrc
    ctx.drawImage(img, -pan.x / s, -pan.y / s, box.width / s, box.height / s, 0, 0, 880, 660)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false)
  const scheduleSectionRef = useRef<HTMLElement>(null)

  function handleSubmit() {
    if (schedule.length === 0) {
      setShowScheduleConfirm(true)
      return
    }
    void doSave()
  }

  async function doSave() {
    const photoUrl = await bakePhoto()
    const nowIso = new Date().toISOString()
    const careSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time))
    if (isEdit && existing) {
      Object.assign(existing, form, { photoUrl, careSchedule, updatedAt: nowIso })
    } else {
      mockDogs.push({
        id: `dog-${Date.now()}`,
        ...form,
        photoUrl,
        careSchedule,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
    }
    alert(isEdit ? `${form.name}'s profile updated! (mock)` : `${form.name} added! (mock)`)
    navigate(isEdit ? `/dogs/${id}` : '/dogs')
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader back title={isEdit ? `Edit ${existing?.name ?? 'Dog'}` : 'Add Dog'} />

      <div className="px-6 mt-4 flex flex-col gap-5">
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
              <FieldLabel>Dog's Name</FieldLabel>
              <Input value={form.name} onChange={set('name')} placeholder="e.g. Ollie" />
            </div>
            <div>
              <FieldLabel>Breed</FieldLabel>
              <Input value={form.breed} onChange={set('breed')} placeholder="e.g. Golden Retriever" />
            </div>
            <div>
              <FieldLabel>Size</FieldLabel>
              <div className="flex gap-2">
                {sizeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => set('size')(value)}
                    className={`flex-1 py-2.5 rounded-[12px] font-dm font-bold text-[14px] border transition-colors ${
                      form.size === value
                        ? 'bg-coral border-coral text-white'
                        : 'bg-white border-border-light text-text-secondary'
                    }`}
                  >
                    {label}
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
                  placeholder="Note (optional) — e.g. avoid dog park"
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

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={!form.name.trim()}>
          {isEdit ? 'Save Changes' : 'Add Dog'}
        </Button>
      </div>

      {/* Empty-schedule confirmation */}
      {showScheduleConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowScheduleConfirm(false)}
          />
          <div className="relative w-full max-w-[380px] bg-cream rounded-[22px] p-6">
            <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight mb-2">
              No daily schedule yet
            </p>
            <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
              Confirm how often {form.name.trim() || 'this dog'} should be taken outside, fed,
              or given medication — care tasks during stays are generated from this schedule.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                onClick={() => {
                  setShowScheduleConfirm(false)
                  setSchedule((prev) =>
                    prev.length ? prev : [{ time: '08:00', taskType: 'walk', note: '' }],
                  )
                  scheduleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Set the schedule
              </Button>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => {
                  setShowScheduleConfirm(false)
                  void doSave()
                }}
              >
                Save without schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
