import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ImagePlus, RefreshCw, Trash2, Plus, Minus, ChevronDown, Clock, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import DogTabs from '../components/DogTabs'
import DogIcon from '../components/icons/DogIcon'
import { getDog, createDog, updateDog, uploadDogPhoto } from '../lib/dogs'
import { regenerateFutureTasksForDog } from '../lib/stayTaskSync'
import { TimePickerButton } from '../components/TimePicker'
import { DOG_BREEDS } from '../data/dogBreeds'
import {
  PRIMARY_DOG_KEY,
  type CareScheduleEntry,
  type DogCareNotes,
  type DogGroupMember,
  type DogSize,
  type OutingRule,
  type TaskType,
  type YesNoUnsure,
} from '../types'
import { dogDisplayName, pickCareNotes } from '../utils/dogDisplay'

const MAX_DOGS_IN_GROUP = 3

function emptyGroupMember(): DogGroupMember {
  return { id: crypto.randomUUID(), name: '', breed: '', size: 'medium', ...pickCareNotes(defaultForm) }
}

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
  additionalDogs: DogGroupMember[]
  ownerName: string
  ownerContact: string
  behaviorNotes: string
  foodNotes: string
  medicationNotes: string
  walkNotes: string
  emergencyNotes: string
  otherNotes: string
  hasAllergies: YesNoUnsure
  allergyNotes: string
  goesToDogParks: YesNoUnsure
  dogParkNotes: string
  walkTimeFlexible: boolean
  outingRule: OutingRule | null
}

const DEFAULT_OUTING_RULE: OutingRule = { everyHours: 4, overnightStart: '22:00', overnightEnd: '06:00' }
const MIN_OUTING_HOURS = 1
const MAX_OUTING_HOURS = 12

const defaultForm: FormState = {
  name: '',
  breed: '',
  size: 'medium',
  additionalDogs: [],
  ownerName: '',
  ownerContact: '',
  behaviorNotes: '',
  foodNotes: '',
  medicationNotes: '',
  walkNotes: '',
  emergencyNotes: '',
  otherNotes: '',
  hasAllergies: 'unsure',
  allergyNotes: '',
  goesToDogParks: 'unsure',
  dogParkNotes: '',
  walkTimeFlexible: false,
  outingRule: null,
}

const sizeOptions: { value: DogSize; label: string; weight: string }[] = [
  { value: 'small', label: 'Small', weight: 'under 25 lb' },
  { value: 'medium', label: 'Medium', weight: '25–60 lb' },
  { value: 'large', label: 'Large', weight: '60–90 lb' },
  { value: 'extra-large', label: 'XL', weight: '90+ lb' },
]

const yesNoUnsureOptions: { value: YesNoUnsure; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
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
          const seeded = [value.trim(), '']
          setMixedBreeds(seeded)
          onChange(formatMixedBreed(seeded))
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
      onChange={(e) => {
        onChange(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = `${e.target.scrollHeight}px`
      }}
      ref={(el) => {
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
      }}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors resize-none overflow-hidden"
    />
  )
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

type CropGesture =
  | { kind: 'drag'; startX: number; startY: number; panX: number; panY: number }
  | {
      kind: 'pinch'
      startDist: number
      startZoom: number
      startPan: { x: number; y: number }
      startMid: { x: number; y: number }   // box-relative
    }

/**
 * Square photo picker with adjustable crop: drag to position, pinch to zoom
 * (trackpad pinch or ⌘/Ctrl + scroll on desktop). The visible square is what
 * gets saved (baked via canvas on submit).
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
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<CropGesture | null>(null)
  const [isTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)

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

  /** Zoom to z keeping box-relative point (cx, cy) fixed, starting from a given zoom/pan. */
  function zoomAt(z: number, cx: number, cy: number, from = { zoom, pan }, shift = { x: 0, y: 0 }) {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
    const ratio = next / from.zoom
    onPanChange(
      clamp(
        { x: cx - (cx - from.pan.x) * ratio + shift.x, y: cy - (cy - from.pan.y) * ratio + shift.y },
        next,
      ),
    )
    onZoomChange(next)
  }

  function boxPoint(clientX: number, clientY: number) {
    const r = boxRef.current!.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }

  /** (Re)start the gesture from whichever fingers/cursor are currently down. */
  function startGesture() {
    const pts = [...pointers.current.values()]
    if (pts.length >= 2) {
      const [a, b] = pts
      gesture.current = {
        kind: 'pinch',
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startZoom: zoom,
        startPan: pan,
        startMid: boxPoint((a.x + b.x) / 2, (a.y + b.y) / 2),
      }
    } else if (pts.length === 1) {
      gesture.current = { kind: 'drag', startX: pts[0].x, startY: pts[0].y, panX: pan.x, panY: pan.y }
    } else {
      gesture.current = null
    }
  }

  // Desktop zoom: trackpad pinch (arrives as ctrl+wheel) or ⌘/Ctrl + scroll. Plain
  // scrolling is left alone so the form still scrolls over the photo. Needs a
  // non-passive native listener to preventDefault; the ref keeps it on fresh state.
  const wheelZoom = useRef<(e: WheelEvent) => void>(() => {})
  wheelZoom.current = (e) => {
    if (!(e.ctrlKey || e.metaKey) || !boxRef.current) return
    e.preventDefault()
    const delta = Math.max(-50, Math.min(50, e.deltaY))
    const p = boxPoint(e.clientX, e.clientY)
    zoomAt(zoom * Math.exp(-delta * 0.006), p.x, p.y)
  }
  // Safari reports trackpad pinch as non-standard gesture events instead.
  const safariPinch = useRef<{ zoom: number; pan: { x: number; y: number } } | null>(null)
  const safariGesture = useRef<(type: string, e: Event & { scale?: number }) => void>(() => {})
  safariGesture.current = (type, e) => {
    if (!boxRef.current) return
    e.preventDefault()
    if (type === 'gesturestart') safariPinch.current = { zoom, pan }
    else if (safariPinch.current && e.scale) {
      const r = boxRef.current.getBoundingClientRect()
      zoomAt(safariPinch.current.zoom * e.scale, r.width / 2, r.height / 2, safariPinch.current)
    }
  }
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => wheelZoom.current(e)
    const onGesture = (e: Event) => safariGesture.current(e.type, e)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGesture)
    el.addEventListener('gesturechange', onGesture)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGesture)
      el.removeEventListener('gesturechange', onGesture)
    }
  }, [src, boxRef])

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
          className="w-full max-w-[280px] mx-auto aspect-square rounded-[16px] border-2 border-dashed border-border-light bg-white flex flex-col items-center justify-center gap-2 text-text-secondary active:bg-gray-50 transition-colors"
        >
          <ImagePlus size={28} strokeWidth={1.8} />
          <span className="font-dm font-bold text-[14px]">Upload photo</span>
        </button>
      ) : (
        <>
          <div
            ref={boxRef}
            className="relative w-full max-w-[280px] mx-auto aspect-square rounded-[16px] overflow-hidden bg-card touch-none cursor-grab active:cursor-grabbing select-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
              startGesture()
            }}
            onPointerMove={(e) => {
              if (!pointers.current.has(e.pointerId)) return
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
              const g = gesture.current
              if (!g) return
              if (g.kind === 'drag') {
                onPanChange(
                  clamp({ x: g.panX + (e.clientX - g.startX), y: g.panY + (e.clientY - g.startY) }),
                )
                return
              }
              // Pinch: scale around the starting midpoint, and follow the fingers as they move.
              const [a, b] = [...pointers.current.values()]
              const mid = boxPoint((a.x + b.x) / 2, (a.y + b.y) / 2)
              zoomAt(
                g.startZoom * (Math.hypot(a.x - b.x, a.y - b.y) / g.startDist),
                g.startMid.x,
                g.startMid.y,
                { zoom: g.startZoom, pan: g.startPan },
                { x: mid.x - g.startMid.x, y: mid.y - g.startMid.y },
              )
            }}
            onPointerUp={(e) => {
              pointers.current.delete(e.pointerId)
              startGesture()   // lifting one finger of a pinch continues as a drag
            }}
            onPointerCancel={(e) => {
              pointers.current.delete(e.pointerId)
              startGesture()
            }}
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
          {/* Drag/pinch is second nature on a phone; only desktop needs the zoom hint */}
          {!isTouch && (
            <p className="font-dm text-[12px] text-text-secondary mt-2">
              Drag to position. Pinch your trackpad, or hold ⌘/Ctrl and scroll, to zoom.
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-border-light font-dm font-bold text-[13px] text-text-secondary active:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
              Replace photo
            </button>
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#fee2e2] font-dm font-bold text-[13px] text-[#b91c1c] active:bg-[#fecaca] transition-colors"
            >
              <Trash2 size={14} />
              Remove photo
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** One dog in the Dogs section: a summary row that folds the photo/name/breed/size
 *  fields away. Folded content stays mounted (just hidden) so its photo can still save. */
function DogCard({
  open,
  onToggle,
  name,
  breed,
  size,
  photoUrl,
  children,
}: {
  open: boolean
  onToggle: () => void
  name: string
  breed: string
  size: DogSize
  photoUrl?: string
  children: React.ReactNode
}) {
  const sizeLabel = sizeOptions.find((o) => o.value === size)?.label ?? ''
  const hasName = Boolean(name.trim())
  return (
    <div className="bg-white border border-border-light rounded-[22px] p-3 flex flex-col gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-3 text-left"
      >
        <span className="size-11 rounded-[10px] overflow-hidden bg-[#f3f4f6] shrink-0 flex items-center justify-center text-text-muted">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <DogIcon size={22} />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span
            className={`block font-dm font-bold text-[16px] truncate ${
              hasName ? 'text-text-primary' : 'text-text-muted'
            }`}
          >
            {hasName ? name : 'New dog'}
          </span>
          <span className="block font-dm text-[13px] text-text-muted truncate">
            {hasName
              ? [breed.trim(), sizeLabel].filter(Boolean).join(' · ')
              : 'Add a photo, name, breed and size'}
          </span>
        </span>
        <ChevronDown
          size={20}
          className={`text-text-muted shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={open ? 'flex flex-col gap-3' : 'hidden'}>{children}</div>
    </div>
  )
}

function DogSizePicker({ value, onChange }: { value: DogSize; onChange: (v: DogSize) => void }) {
  return (
    <div className="flex gap-2">
      {sizeOptions.map(({ value: v, label, weight }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 rounded-[12px] border transition-colors ${
            value === v
              ? 'bg-coral border-coral text-white'
              : 'bg-white border-border-light text-text-secondary'
          }`}
        >
          <span className="font-dm font-bold text-[14px] block leading-tight">{label}</span>
          <span
            className={`font-dm text-[11px] block leading-tight ${
              value === v ? 'text-white/80' : 'text-text-muted'
            }`}
          >
            {weight}
          </span>
        </button>
      ))}
    </div>
  )
}

function snapshotOf(form: FormState, schedule: CareScheduleEntry[]): string {
  return JSON.stringify({ form, schedule })
}

interface PhotoHandle {
  src: () => string | null
  /** Renders the visible crop rectangle to a JPEG Blob. Returns undefined if the
   *  source image can't be read into a canvas (e.g. a remote photo without CORS). */
  bake: () => Promise<Blob | undefined>
}

/** PhotoCropField that owns its own crop state, so each dog in a group can have one. */
const DogPhotoField = forwardRef<
  PhotoHandle,
  { initialSrc: string | null; onSrcChange?: (src: string | null) => void; onEdit?: () => void }
>(function DogPhotoField({ initialSrc, onSrcChange, onEdit }, ref) {
  const [src, setSrc] = useState(initialSrc)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  // Only re-crop/re-upload when the user picked, dragged, or zoomed — an untouched
  // saved photo keeps its URL.
  const dirty = useRef(false)
  // The crop box is hidden while its dog card is collapsed (0×0), so bake from
  // the last size it was seen at.
  const lastBox = useRef<{ width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const r = boxRef.current?.getBoundingClientRect()
    if (r && r.width > 0) lastBox.current = { width: r.width, height: r.height }
  })

  useImperativeHandle(ref, () => ({
    src: () => src,
    async bake() {
      const box = lastBox.current
      if (!dirty.current || !src || !natural || !box) return undefined
      const s = Math.max(box.width / natural.w, box.height / natural.h) * zoom
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = src
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = 800
        canvas.height = 800
        const ctx = canvas.getContext('2d')
        if (!ctx) return undefined
        ctx.drawImage(img, -pan.x / s, -pan.y / s, box.width / s, box.height / s, 0, 0, 800, 800)
        return await new Promise<Blob | undefined>((resolve) =>
          canvas.toBlob((blob) => resolve(blob ?? undefined), 'image/jpeg', 0.85),
        )
      } catch {
        return undefined
      }
    },
  }))

  function changeSrc(next: string | null) {
    setSrc(next)
    onSrcChange?.(next)
    onEdit?.()
  }

  return (
    <PhotoCropField
      src={src}
      pan={pan}
      zoom={zoom}
      natural={natural}
      boxRef={boxRef}
      onPick={(dataUrl) => {
        dirty.current = true
        changeSrc(dataUrl)
        setPan({ x: 0, y: 0 })
        setZoom(1)
        setNatural(null)
      }}
      onRemove={() => {
        changeSrc(null)
        setNatural(null)
      }}
      onPanChange={(p) => {
        dirty.current = true
        setPan(p)
        onEdit?.()
      }}
      onZoomChange={(z) => {
        dirty.current = true
        setZoom(z)
        onEdit?.()
      }}
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
  )
})

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
  // Form + schedule as first shown, to tell whether leaving would lose edits.
  const baselineRef = useRef<string | null>(null)
  if (baselineRef.current === null && !isEdit) baselineRef.current = snapshotOf(form, schedule)
  const [photoEdited, setPhotoEdited] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  // Current photo per dog (PRIMARY_DOG_KEY or member id) — seeds each DogPhotoField
  // and shows in the care-notes dog tabs.
  const [photos, setPhotos] = useState<Record<string, string | null>>({})
  const mainPhotoRef = useRef<PhotoHandle>(null)
  const memberPhotoRefs = useRef<Record<string, PhotoHandle | null>>({})
  const [careKey, setCareKey] = useState(PRIMARY_DOG_KEY)
  // Which dog cards are unfolded. Editing starts all folded; adding starts with the new dog open.
  const [openDogs, setOpenDogs] = useState<Set<string>>(() => new Set(isEdit ? [] : [PRIMARY_DOG_KEY]))
  const [existingId, setExistingId] = useState<string | null>(null)
  const [existingName, setExistingName] = useState('Dog')
  const [loadingExisting, setLoadingExisting] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        const loaded: FormState = {
          name: d.name,
          breed: d.breed,
          size: d.size,
          additionalDogs: d.additionalDogs.map((m) => ({ ...m })),
          ownerName: d.ownerName,
          ownerContact: d.ownerContact,
          behaviorNotes: d.behaviorNotes,
          foodNotes: d.foodNotes,
          medicationNotes: d.medicationNotes,
          walkNotes: d.walkNotes,
          emergencyNotes: d.emergencyNotes,
          otherNotes: d.otherNotes,
          hasAllergies: d.hasAllergies,
          allergyNotes: d.allergyNotes,
          goesToDogParks: d.goesToDogParks,
          dogParkNotes: d.dogParkNotes,
          walkTimeFlexible: d.walkTimeFlexible,
          outingRule: d.outingRule,
        }
        const loadedSchedule = d.careSchedule.map((e) => ({ ...e }))
        setForm(loaded)
        setSchedule(loadedSchedule)
        baselineRef.current = snapshotOf(loaded, loadedSchedule)
        setPhotos({
          [PRIMARY_DOG_KEY]: d.photoUrl ?? null,
          ...Object.fromEntries(d.additionalDogs.map((m) => [m.id, m.photoUrl ?? null])),
        })
        setExistingId(d.id)
        setExistingName(dogDisplayName(d))
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

  const [scheduleWarning, setScheduleWarning] = useState<'empty' | 'no-walk' | null>(null)
  // Index of the group member awaiting "Remove this dog?" confirmation.
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null)
  const [nameTouched, setNameTouched] = useState(false)
  const [additionalNameTouched, setAdditionalNameTouched] = useState(false)
  const [otherTitleTouched, setOtherTitleTouched] = useState(false)
  const scheduleSectionRef = useRef<HTMLElement>(null)
  const hasWalkEntry = schedule.some((e) => e.taskType === 'walk')
  // Remembers the rule while "Set times" is picked, so switching back doesn't reset it.
  const lastOutingRule = useRef<OutingRule>(DEFAULT_OUTING_RULE)
  function setScheduleMode(everyXHours: boolean) {
    if (form.outingRule) lastOutingRule.current = form.outingRule
    set('outingRule')(everyXHours ? (form.outingRule ?? lastOutingRule.current) : null)
  }
  function patchOutingRule(patch: Partial<OutingRule>) {
    setForm((prev) => (prev.outingRule ? { ...prev, outingRule: { ...prev.outingRule, ...patch } } : prev))
  }
  const hasMissingOtherTitle = schedule.some(
    (e) => e.taskType === 'other' && !e.customTitle?.trim(),
  )
  const hasMissingAdditionalName = form.additionalDogs.some((m) => !m.name.trim())

  function updateAdditionalDog(i: number, patch: Partial<DogGroupMember>) {
    setForm((prev) => ({
      ...prev,
      additionalDogs: prev.additionalDogs.map((m, j) => (j === i ? { ...m, ...patch } : m)),
    }))
  }

  function setDogOpen(key: string, open: boolean) {
    setOpenDogs((prev) => {
      const next = new Set(prev)
      if (open) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function addAdditionalDog() {
    const member = emptyGroupMember()
    setForm((prev) => ({ ...prev, additionalDogs: [...prev.additionalDogs, member] }))
    setDogOpen(member.id, true)
  }

  function removeAdditionalDog(i: number) {
    const removedId = form.additionalDogs[i]?.id
    setForm((prev) => ({
      ...prev,
      additionalDogs: prev.additionalDogs.filter((_, j) => j !== i),
    }))
    // Entries only for this dog (e.g. its medication) shouldn't fall back to the others.
    setSchedule((prev) => prev.filter((e) => e.forDog !== removedId))
  }

  // The care-notes tabs stick right under the sticky header, whose height
  // changes when the title wraps or an error shows.
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerObserver = useRef<ResizeObserver | null>(null)
  const headerRef = useCallback((el: HTMLDivElement | null) => {
    headerObserver.current?.disconnect()
    if (!el) return
    headerObserver.current = new ResizeObserver(() => setHeaderHeight(el.offsetHeight))
    headerObserver.current.observe(el)
  }, [])

  // Care notes are edited one dog at a time; the tabs pick which.
  const careIndex = form.additionalDogs.findIndex((m) => m.id === careKey)
  const care: DogCareNotes = careIndex >= 0 ? form.additionalDogs[careIndex] : form
  function setCare<K extends keyof DogCareNotes>(key: K) {
    return (value: DogCareNotes[K]) =>
      careIndex >= 0
        ? updateAdditionalDog(careIndex, { [key]: value } as Partial<DogGroupMember>)
        : setForm((prev) => ({ ...prev, [key]: value }))
  }
  const groupDogs = [
    { key: PRIMARY_DOG_KEY, name: form.name.trim(), photoUrl: photos[PRIMARY_DOG_KEY] ?? undefined },
    ...form.additionalDogs.map((m) => ({ key: m.id, name: m.name.trim(), photoUrl: photos[m.id] ?? undefined })),
  ]
  const isGroup = groupDogs.length > 1

  const hasUnsavedChanges =
    photoEdited || (baselineRef.current !== null && snapshotOf(form, schedule) !== baselineRef.current)

  function handleBack() {
    if (hasUnsavedChanges) setShowLeaveConfirm(true)
    else navigate(-1)
  }

  function handleSubmit() {
    // Unfold any card hiding a missing-name error.
    if (!form.name.trim()) {
      setNameTouched(true)
      setDogOpen(PRIMARY_DOG_KEY, true)
      return
    }
    if (hasMissingAdditionalName) {
      setAdditionalNameTouched(true)
      setOpenDogs((prev) => new Set([...prev, ...form.additionalDogs.filter((m) => !m.name.trim()).map((m) => m.id)]))
      return
    }
    // An "every X hours" rule is a schedule on its own, walks included.
    if (schedule.length === 0 && !form.outingRule) {
      setScheduleWarning('empty')
      return
    }
    if (!hasWalkEntry && !form.walkTimeFlexible && !form.outingRule) {
      setScheduleWarning('no-walk')
      return
    }
    if (hasMissingOtherTitle) {
      setOtherTitleTouched(true)
      return
    }
    void doSave()
  }

  async function doSave() {
    setSaving(true)
    setError(null)
    try {
      const dogId = existingId ?? crypto.randomUUID()

      async function savePhoto(handle: PhotoHandle | null | undefined, memberId?: string) {
        const src = handle?.src() ?? null
        if (src === null) return null
        const blob = await handle?.bake()
        return blob ? await uploadDogPhoto(dogId, blob, memberId) : src
      }

      const photoUrl = await savePhoto(mainPhotoRef.current)
      const additionalDogs = await Promise.all(
        form.additionalDogs.map(async (m) => ({
          ...m,
          photoUrl: (await savePhoto(memberPhotoRefs.current[m.id], m.id)) ?? undefined,
        })),
      )

      const careSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time))
      const input = { ...form, additionalDogs, photoUrl, careSchedule }

      if (isEdit && existingId) {
        const updated = await updateDog(existingId, input)
        // The care schedule may have changed — rebuild the future tasks of
        // any active/upcoming stay so Today reflects the edit immediately.
        await regenerateFutureTasksForDog(updated)
      } else {
        await createDog(dogId, input)
      }
      navigate(
        isEdit ? `/dogs/${dogId}` : '/dogs',
        isEdit ? { replace: true } : { state: { justAddedName: dogDisplayName(form) } },
      )
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
            ? e.message
            : 'Could not save. Please try again.'
      setError(message)
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
    <div className="min-h-svh bg-cream">
      <div ref={headerRef} className="sticky top-0 z-20 bg-cream">
        <PageHeader back onBack={handleBack} title={isEdit ? `Edit ${existingName}` : 'Add Dog'} />
        {error && (
          <div className="mx-6 mb-2 bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 mt-4 flex flex-col gap-5">

        {/* Owner Info — shared by every dog, so it comes first */}
        <section>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
            Owner
          </p>
          <div>
            <FieldLabel>Owner Name</FieldLabel>
            <Input value={form.ownerName} onChange={set('ownerName')} placeholder="e.g. Sarah or Sarah K." />
          </div>
        </section>

        {/* Dogs — one collapsible card per dog */}
        <section>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
            Dogs
          </p>
          <div className="flex flex-col gap-3">
            <DogCard
              open={openDogs.has(PRIMARY_DOG_KEY)}
              onToggle={() => setDogOpen(PRIMARY_DOG_KEY, !openDogs.has(PRIMARY_DOG_KEY))}
              name={form.name}
              breed={form.breed}
              size={form.size}
              photoUrl={photos[PRIMARY_DOG_KEY] ?? undefined}
            >
              <DogPhotoField
                ref={mainPhotoRef}
                initialSrc={photos[PRIMARY_DOG_KEY] ?? null}
                onSrcChange={(src) => setPhotos((prev) => ({ ...prev, [PRIMARY_DOG_KEY]: src }))}
                onEdit={() => setPhotoEdited(true)}
              />
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
                <DogSizePicker value={form.size} onChange={set('size')} />
              </div>
            </DogCard>

            {form.additionalDogs.map((member, i) => (
              <DogCard
                key={member.id}
                open={openDogs.has(member.id)}
                onToggle={() => setDogOpen(member.id, !openDogs.has(member.id))}
                name={member.name}
                breed={member.breed}
                size={member.size}
                photoUrl={photos[member.id] ?? undefined}
              >
                <DogPhotoField
                  ref={(h) => {
                    memberPhotoRefs.current[member.id] = h
                  }}
                  initialSrc={photos[member.id] ?? null}
                  onSrcChange={(src) => setPhotos((prev) => ({ ...prev, [member.id]: src }))}
                  onEdit={() => setPhotoEdited(true)}
                />
                <div>
                  <FieldLabel required>Dog's Name</FieldLabel>
                  <Input
                    value={member.name}
                    onChange={(v) => updateAdditionalDog(i, { name: v })}
                    placeholder="e.g. Ollie"
                  />
                  {additionalNameTouched && !member.name.trim() && (
                    <p className="font-dm text-[12px] text-[#b91c1c] mt-1">
                      This dog's name is required.
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel>Breed</FieldLabel>
                  <BreedField
                    value={member.breed}
                    onChange={(v) => updateAdditionalDog(i, { breed: v })}
                  />
                </div>
                <div>
                  <FieldLabel>Size</FieldLabel>
                  <DogSizePicker
                    value={member.size}
                    onChange={(v) => updateAdditionalDog(i, { size: v })}
                  />
                </div>
                {/* Removing lives inside the open card so it can't be hit while expanding */}
                <button
                  type="button"
                  onClick={() => setConfirmRemoveIndex(i)}
                  className="w-full py-3 rounded-full flex items-center justify-center gap-2 font-dm font-bold text-[15px] text-[#b91c1c] active:bg-[#fee2e2] transition-colors"
                >
                  <Trash2 size={16} />
                  Remove {member.name.trim() || 'this dog'}
                </button>
              </DogCard>
            ))}

            {form.additionalDogs.length < MAX_DOGS_IN_GROUP - 1 && (
              <button
                onClick={addAdditionalDog}
                className="w-full py-3 rounded-[12px] border-2 border-dashed border-border-light flex items-center justify-center gap-1.5 font-dm font-bold text-[14px] text-text-secondary active:bg-gray-50 transition-colors"
              >
                <Plus size={16} />
                Add another dog from the same owner
              </button>
            )}
          </div>
        </section>

        {/* Care Notes */}
        <section>
          <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mb-3">
            Care Instructions
          </p>
          {/* Sticky within this section, so the tabs ride along until Care Instructions ends */}
          {isGroup && (
            <div
              className="sticky z-10 -mx-6 px-6 pt-2 pb-3 mb-1 bg-cream"
              style={{ top: headerHeight }}
            >
              <DogTabs
                dogs={groupDogs}
                value={careIndex >= 0 ? careKey : PRIMARY_DOG_KEY}
                onChange={setCareKey}
              />
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Behavior Notes</FieldLabel>
              <Textarea
                value={care.behaviorNotes}
                onChange={setCare('behaviorNotes')}
                placeholder="Temperament, fears, habits, social behavior..."
              />
            </div>
            <div>
              <FieldLabel>Food Notes</FieldLabel>
              <Textarea
                value={care.foodNotes}
                onChange={setCare('foodNotes')}
                placeholder="Food type, portion size, allergies, schedule..."
              />
            </div>
            <div>
              <FieldLabel>Allergies?</FieldLabel>
              <div className="flex gap-2">
                {yesNoUnsureOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setCare('hasAllergies')(value)}
                    className={`flex-1 py-2.5 rounded-[12px] border font-dm font-bold text-[14px] transition-colors ${
                      care.hasAllergies === value
                        ? 'bg-coral border-coral text-white'
                        : 'bg-white border-border-light text-text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {care.hasAllergies !== 'unsure' && (
                <div className="mt-2">
                  <Textarea
                    value={care.allergyNotes}
                    onChange={setCare('allergyNotes')}
                    placeholder={
                      care.hasAllergies === 'yes'
                        ? 'Which allergen(s)? e.g. chicken, beef, grain...'
                        : 'Anything to watch? e.g. sensitive stomach, avoid rich treats'
                    }
                    rows={2}
                  />
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Goes to Dog Parks?</FieldLabel>
              <div className="flex gap-2">
                {yesNoUnsureOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setCare('goesToDogParks')(value)}
                    className={`flex-1 py-2.5 rounded-[12px] border font-dm font-bold text-[14px] transition-colors ${
                      care.goesToDogParks === value
                        ? 'bg-coral border-coral text-white'
                        : 'bg-white border-border-light text-text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {care.goesToDogParks !== 'unsure' && (
                <div className="mt-2">
                  <Textarea
                    value={care.dogParkNotes}
                    onChange={setCare('dogParkNotes')}
                    placeholder={
                      care.goesToDogParks === 'yes'
                        ? 'Any conditions? e.g. fully fenced parks only, small-dog area...'
                        : 'Anything to know? e.g. reactive with big dogs'
                    }
                    rows={2}
                  />
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Medication Notes</FieldLabel>
              <Textarea
                value={care.medicationNotes}
                onChange={setCare('medicationNotes')}
                placeholder="Medication names, doses, timing..."
              />
            </div>
            <div>
              <FieldLabel>Walk Notes</FieldLabel>
              <Textarea
                value={care.walkNotes}
                onChange={setCare('walkNotes')}
                placeholder="Duration, preferred routes, leash behavior..."
              />
            </div>
            <div>
              <FieldLabel>Emergency Notes</FieldLabel>
              <Textarea
                value={care.emergencyNotes}
                onChange={setCare('emergencyNotes')}
                placeholder="Vet name & number, emergency contacts, allergies..."
                rows={4}
              />
            </div>
            <div>
              <FieldLabel>Other Notes</FieldLabel>
              <Textarea
                value={care.otherNotes}
                onChange={setCare('otherNotes')}
                placeholder="Anything else worth knowing..."
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
          <div role="tablist" className="bg-card rounded-full p-1 flex gap-1 mb-3">
            {[
              { everyXHours: false, label: 'Set times' },
              { everyXHours: true, label: 'Every X hours' },
            ].map((tab) => {
              const selected = !!form.outingRule === tab.everyXHours
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setScheduleMode(tab.everyXHours)}
                  className={`flex-1 py-2 rounded-full font-dm font-bold text-[13px] transition-colors ${
                    selected ? 'bg-coral text-white' : 'text-text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          {form.outingRule && (
            <div className="bg-card rounded-[20px] p-4 mb-4">
              <p className="flex items-center justify-center gap-1.5 font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-2">
                <Clock size={14} />
                Since last out
              </p>
              <p className="font-dm font-bold text-[17px] text-text-primary text-center mb-2">
                Out at least every
              </p>
              <div className="flex items-center justify-center gap-5">
                <button
                  type="button"
                  aria-label="Fewer hours"
                  disabled={form.outingRule.everyHours <= MIN_OUTING_HOURS}
                  onClick={() => patchOutingRule({ everyHours: form.outingRule!.everyHours - 1 })}
                  className="size-10 rounded-full bg-white border border-border-light flex items-center justify-center text-text-primary disabled:opacity-40 active:scale-[0.94] transition-transform"
                >
                  <Minus size={16} />
                </button>
                <p className="font-outfit font-bold text-[32px] text-text-primary leading-none min-w-[96px] text-center">
                  {form.outingRule.everyHours} {form.outingRule.everyHours === 1 ? 'hr' : 'hrs'}
                </p>
                <button
                  type="button"
                  aria-label="More hours"
                  disabled={form.outingRule.everyHours >= MAX_OUTING_HOURS}
                  onClick={() => patchOutingRule({ everyHours: form.outingRule!.everyHours + 1 })}
                  className="size-10 rounded-full bg-white border border-border-light flex items-center justify-center text-text-primary disabled:opacity-40 active:scale-[0.94] transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="font-dm text-[12px] text-text-secondary text-center mt-2">
                Any walk or potty break resets the clock.
              </p>
              <div className="border-t border-border-light mt-4 pt-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-dm font-bold text-[14px] text-text-primary">Overnight</p>
                  <p className="font-dm text-[12px] text-text-secondary">No breaks between these times</p>
                </div>
                <TimePickerButton
                  value={form.outingRule.overnightStart}
                  onChange={(v) => patchOutingRule({ overnightStart: v })}
                  className="w-[104px] shrink-0 bg-white border border-border-light rounded-[10px] pl-3 pr-7 py-2 font-dm font-bold text-[13px] text-text-primary"
                />
                <span className="font-dm text-[13px] text-text-muted">–</span>
                <TimePickerButton
                  value={form.outingRule.overnightEnd}
                  onChange={(v) => patchOutingRule({ overnightEnd: v })}
                  className="w-[104px] shrink-0 bg-white border border-border-light rounded-[10px] pl-3 pr-7 py-2 font-dm font-bold text-[13px] text-text-primary"
                />
              </div>
            </div>
          )}
          {form.outingRule ? (
            <p className="font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-1 px-1">
              Set-time tasks (optional)
            </p>
          ) : (
          <label className="flex items-center gap-2 px-1 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.walkTimeFlexible}
              onChange={(e) => set('walkTimeFlexible')(e.target.checked)}
              className="accent-coral size-4 shrink-0"
            />
            <span className="font-dm text-[13px] text-text-secondary">
              Walk time is flexible
            </span>
          </label>
          )}
          {form.outingRule && (
            <p className="font-dm text-[12px] text-text-secondary mb-3 px-1">
              Long walks, meals and meds that happen at a set time. A walk here resets the clock too.
            </p>
          )}
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
                {isGroup && (
                  <div className="flex items-center gap-2">
                    <span className="font-dm text-[12px] text-text-secondary shrink-0">For</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: undefined, name: groupDogs.length === 2 ? 'Both' : 'All dogs' },
                        ...groupDogs,
                      ].map((d) => (
                        <button
                          key={d.key ?? 'all'}
                          type="button"
                          onClick={() =>
                            setSchedule((prev) =>
                              prev.map((en, j) => (j === i ? { ...en, forDog: d.key } : en)),
                            )
                          }
                          className={`px-3 py-1 rounded-full border font-dm font-bold text-[12px] transition-colors ${
                            entry.forDog === d.key
                              ? 'bg-coral border-coral text-white'
                              : 'bg-white border-border-light text-text-secondary'
                          }`}
                        >
                          {d.name || 'Unnamed'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {entry.taskType === 'other' && (
                  <div>
                    <input
                      type="text"
                      value={entry.customTitle ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, 30)
                        setSchedule((prev) =>
                          prev.map((en, j) => (j === i ? { ...en, customTitle: v } : en)),
                        )
                      }}
                      maxLength={30}
                      placeholder="Task title — e.g. Nail trim"
                      className={`w-full bg-white border rounded-[10px] px-3 py-2 font-dm font-bold text-[13px] text-text-primary placeholder:text-[#c4c4c4] placeholder:font-normal focus:outline-none focus:border-coral transition-colors ${
                        otherTitleTouched && !entry.customTitle?.trim()
                          ? 'border-red-400'
                          : 'border-border-light'
                      }`}
                    />
                    {otherTitleTouched && !entry.customTitle?.trim() && (
                      <p className="font-dm text-[12px] text-red-500 mt-1 px-1">
                        Give this task a short title
                      </p>
                    )}
                  </div>
                )}
                <textarea
                  value={entry.note ?? ''}
                  onChange={(e) => {
                    setSchedule((prev) =>
                      prev.map((en, j) => (j === i ? { ...en, note: e.target.value } : en)),
                    )
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  ref={(el) => {
                    if (!el) return
                    el.style.height = 'auto'
                    el.style.height = `${el.scrollHeight}px`
                  }}
                  rows={1}
                  placeholder={scheduleNotePlaceholder[entry.taskType]}
                  className="w-full bg-white border border-border-faint rounded-[10px] px-3 py-2 font-dm text-[13px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors resize-none overflow-hidden"
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

        {/* Save stays pinned to the bottom so it's reachable from any section */}
        <div className="sticky bottom-0 z-10 -mx-6 px-6 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] bg-cream">
          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            // Editing: nothing to save until something changed.
            disabled={!form.name.trim() || saving || (isEdit && !hasUnsavedChanges)}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Dog'}
          </Button>
        </div>
      </div>

      {/* Unsaved-changes confirmation when tapping back */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <div className="relative w-full max-w-[380px] bg-cream rounded-[22px] p-6">
            <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight mb-2">
              Save your changes?
            </p>
            <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
              {isEdit
                ? `You've edited ${existingName}. Save before leaving, or your changes will be lost.`
                : "This dog hasn't been added yet. Add it before leaving, or what you've entered will be lost."}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                disabled={saving}
                onClick={() => {
                  setShowLeaveConfirm(false)
                  handleSubmit()
                }}
              >
                {isEdit ? 'Save Changes' : 'Add Dog'}
              </Button>
              <Button fullWidth variant="danger" onClick={() => navigate(-1)}>
                Discard changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove-dog confirmation — removing drops that dog's photo, notes, and own schedule entries */}
      {confirmRemoveIndex !== null && (() => {
        const dogName = form.additionalDogs[confirmRemoveIndex]?.name.trim() || `Dog ${confirmRemoveIndex + 2}`
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setConfirmRemoveIndex(null)}
            />
            <div className="relative w-full max-w-[380px] bg-cream rounded-[22px] p-6">
              <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight mb-2">
                Remove {dogName}?
              </p>
              <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
                {dogName}'s photo, care notes, and any schedule times just for {dogName} will be
                removed from this profile.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  fullWidth
                  variant="danger"
                  onClick={() => {
                    removeAdditionalDog(confirmRemoveIndex)
                    setConfirmRemoveIndex(null)
                  }}
                >
                  Remove {dogName}
                </Button>
                <Button fullWidth variant="ghost" onClick={() => setConfirmRemoveIndex(null)}>
                  Keep {dogName}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

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
                  if (scheduleWarning === 'no-walk') set('walkTimeFlexible')(true)
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
