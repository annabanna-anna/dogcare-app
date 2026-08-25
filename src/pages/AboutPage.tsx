import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Pill,
  PawPrint,
  Toilet,
} from 'lucide-react'
import PublicPageShell from '../components/PublicPageShell'
import PhoneFrame from '../components/PhoneFrame'
import TaskCard from '../components/TaskCard'
import Button from '../components/Button'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import PawPrintFilled from '../components/icons/PawPrintFilled'
import type { Task } from '../types'
import { formatTodayHeading } from '../utils/dateUtils'

/** Fires once, the first time the returned ref is (almost) fully within the
 *  viewport — used to trigger the step visuals' entrance animations only
 *  once a visitor has actually scrolled to where the whole card is on
 *  screen, not the moment its top edge first peeks into view. */
function useInView<T extends HTMLElement>(threshold = 0.95) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView] as const
}

// Keeps the iPhone 15 Plus / 14 Pro Max aspect ratio (402×874), scaled down
// to ~67% so the phone reads as a mockup sitting inside its section, not a
// card that fills it — the modest phone-to-page ratio a real device photo
// gets on a hero. Content past this height is cropped by PhoneFrame's own
// height, not left to overflow; `maxWidth`/`maxHeight` keep it from
// overflowing a smaller viewport.
const HERO_PHONE_SIZE: React.CSSProperties = {
  width: 270,
  height: 587,
  maxWidth: '100%',
  maxHeight: '80vh',
}

/** Builds an ISO datetime at a fixed clock time today, so the demo schedule
 *  always reads as a plausible working day rather than a frozen date. */
function todayAt(hours: number, minutes: number): string {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

// George's photo for the hero mockup — a real stock photo of a West
// Highland Terrier, not a colored placeholder (Unsplash photo el4HY7Nx7yc).
const GEORGE_PHOTO_URL =
  'https://images.unsplash.com/photo-1725394953800-cd68713d5df6?auto=format&fit=crop&w=200&h=200&q=80'

function demoTasks(): Task[] {
  return [
    {
      id: 'demo-1',
      stayId: 'demo',
      dogId: 'demo-george',
      dogName: 'George',
      type: 'walk',
      title: 'Morning walk',
      scheduledTime: todayAt(8, 0),
      status: 'pending',
    },
    {
      id: 'demo-2',
      stayId: 'demo',
      dogId: 'demo-george',
      dogName: 'George',
      type: 'meal',
      title: 'Breakfast',
      scheduledTime: todayAt(9, 0),
      // Kept short on purpose: TaskCard is built for the app's 430px frame,
      // and long notes wrap to a ribbon inside the narrower demo mock.
      note: 'Half scoop, soaked.',
      status: 'pending',
    },
    {
      id: 'demo-4',
      stayId: 'demo',
      dogId: 'demo-george',
      dogName: 'George',
      type: 'medication',
      title: 'Ear drops',
      scheduledTime: todayAt(9, 0),
      note: 'Left ear only.',
      status: 'pending',
    },
    {
      id: 'demo-3',
      stayId: 'demo',
      dogId: 'demo-george',
      dogName: 'George',
      type: 'potty',
      title: 'Potty break',
      scheduledTime: todayAt(12, 0),
      status: 'pending',
    },
    {
      id: 'demo-5',
      stayId: 'demo',
      dogId: 'demo-george',
      dogName: 'George',
      type: 'walk',
      title: 'Evening walk',
      scheduledTime: todayAt(16, 0),
      status: 'pending',
    },
    {
      id: 'demo-6',
      stayId: 'demo',
      dogId: 'demo-george',
      dogName: 'George',
      type: 'meal',
      title: 'Dinner',
      scheduledTime: todayAt(17, 0),
      status: 'pending',
    },
  ]
}

// ── Hero mockup: a faithful small replica of the real Today page ───────────
// Header, week strip, Active Care chip, and TaskCard itself — the actual
// component, not a redrawn stand-in — so the hero reads as the real app.
// Simplified from the full page on purpose: no calendar-view toggle and no
// bottom nav (that's fixed-position and routed in the real app — pinning it
// here would break out of the phone frame). Done tasks file under a
// collapsed "Show past tasks" toggle, same as the real Today page's Past
// Tasks section (single dog here, so no per-dog grouping needed).
function HeroTodayScreen({
  tasks,
  onDone,
  onUndo,
}: {
  tasks: Task[]
  onDone: (id: string) => void
  onUndo: (id: string) => void
}) {
  const [showPastTasks, setShowPastTasks] = useState(false)
  const today = new Date()
  const untilDate = new Date(Date.now() + 6 * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const pendingTasks = tasks.filter((t) => t.status !== 'done')
  const pastTasks = tasks.filter((t) => t.status === 'done')

  return (
    <div className="pb-3">
      {/* Header */}
      <div className="px-4 pt-4 pb-4">
        <p className="font-dm font-bold text-[10px] text-coral uppercase tracking-widest mb-0.5">
          {formatTodayHeading(today)}
        </p>
        <h1 className="font-outfit font-bold text-[32px] leading-none text-cobalt tracking-tight">
          Today
        </h1>
      </div>

      {/* Active dog chip — no "Active Care" eyebrow above it */}
      <div className="px-4 mb-4">
        <span className="inline-flex items-center gap-2.5 rounded-full pl-1.5 pr-4 py-1.5 bg-cream border border-border-light">
          <img
            src={GEORGE_PHOTO_URL}
            alt="George, a West Highland Terrier"
            className="size-8 rounded-full object-cover shrink-0"
          />
          <span>
            <span className="block font-dm font-semibold text-[13px] text-text-primary leading-none">
              George
            </span>
            <span className="block font-dm text-[11px] text-text-secondary mt-0.5">
              Until {untilDate}
            </span>
          </span>
        </span>
      </div>

      {/* Tasks — the real TaskCard, single dog so no name eyebrow (matching
          how the live app hides it once only one dog is active). */}
      <div className="px-4">
        {pendingTasks.map((task) => (
          <TaskCard key={task.id} task={task} onDone={onDone} onUndo={onUndo} showDogName={false} dense />
        ))}
      </div>

      {pastTasks.length > 0 && (
        <div className="px-4">
          <button
            type="button"
            onClick={() => setShowPastTasks((v) => !v)}
            className="font-dm font-bold text-[10px] text-text-muted uppercase tracking-widest mb-2"
          >
            {showPastTasks ? 'Hide' : 'Show'} past tasks ({pastTasks.length})
          </button>
          {showPastTasks &&
            pastTasks.map((task) => (
              <TaskCard key={task.id} task={task} onDone={onDone} onUndo={onUndo} showDogName={false} dense />
            ))}
        </div>
      )}
    </div>
  )
}

// Step 1's care-note pill labels pop in top-to-bottom, one after another,
// while the dog photos underneath stay put — the photos are the fixed
// backdrop, the labels are what's "arriving." Positions are percentages of
// the 434.646×407.125 Figma frame so the whole thing scales as one block.
const DOG_PHOTO_LABELS = [
  {
    id: 'merline',
    photo: { src: '/how-it-works/step1-merline.png', left: 27.15, top: 5.9, size: 27.61 },
    label: { left: 46.71, top: 0, width: 35.58 },
    Icon: Pill,
    bg: 'bg-blue-task',
    text: 'One tablet with evening meal',
  },
  {
    id: 'nino',
    photo: { src: '/how-it-works/step1-nino-2.png', left: 51.08, top: 43.23, size: 27.61 },
    label: { left: 64.42, top: 67.31, width: 35.58 },
    Icon: PawPrint,
    bg: 'bg-green-vivid',
    text: 'Avoid the dog park on Elm St',
  },
  {
    id: 'george',
    photo: { src: '/how-it-works/step1-george.png', left: 17.74, top: 64.11, size: 27.61 },
    label: { left: -7, top: 53, width: 35.58 },
    Icon: DogBowlIcon,
    bg: 'bg-coral',
    text: 'Allergic to chicken & dairy',
  },
]

// Stagger between each label's entrance.
const ADD_DOG_STAGGER_MS = 450

function AddDogPhotoCollage() {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-[420px]"
      style={{ aspectRatio: '434.646 / 407.125' }}
    >
      {DOG_PHOTO_LABELS.map(({ id, photo }) => (
        <div
          key={id}
          className="absolute"
          style={{
            left: `${photo.left}%`,
            top: `${photo.top}%`,
            width: `${photo.size}%`,
            aspectRatio: '1 / 1',
          }}
        >
          <img src={photo.src} alt="" className="size-full object-contain" />
        </div>
      ))}
      {DOG_PHOTO_LABELS.map(({ id, label, Icon, bg, text }, i) => (
        // Outer div: position + a static 1.25x enlarge, anchored top-left.
        // Kept separate from the inner pop-in div because the entrance
        // animation sets its own `transform` (translateY/scale) via CSS —
        // putting both transforms on one element would let the animation's
        // `transform: none` end state silently override the enlarge scale.
        <div
          key={id}
          className="absolute"
          style={{
            left: `${label.left}%`,
            top: `${label.top}%`,
            width: `${label.width}%`,
            transform: 'scale(1.25)',
            transformOrigin: 'top left',
          }}
        >
          <div
            className={`pop-in-target flex items-center gap-1.5 rounded-full bg-white border-[1.5px] border-border-light pl-2 pr-3 py-2 ${inView ? 'pop-in' : ''}`}
            style={{ animationDelay: `${i * ADD_DOG_STAGGER_MS}ms` }}
          >
            <span className={`inline-flex items-center justify-center rounded-full size-7 shrink-0 ${bg}`}>
              <Icon size={14} className="text-white" />
            </span>
            <span className="font-dm font-bold text-[11px] tracking-wide text-text-primary leading-tight">
              {text}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Step 2's time wheel (matches the Figma "step 2 animation" reference,
// node 114:1528: three keyframes — static fields showing 9:00 AM, a wheel
// stopped on 8:30 am, then the same wheel stopped on 9:00 am). Both the
// hour and minute columns move, so this jumps between two known values
// rather than looping continuously — each wheel is 3 back-to-back copies
// of its value list so the current value can always sit centered with a
// row of "neighbors" above and below, and so the 8:30→9:00 move can always
// animate forward (never backward) even when it crosses a cycle boundary.
const pad = (n: number) => String(n).padStart(2, '0')
const WHEEL_HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const WHEEL_MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5))
const WHEEL_HOURS_STRIP = [...WHEEL_HOURS, ...WHEEL_HOURS, ...WHEEL_HOURS]
const WHEEL_MINUTES_STRIP = [...WHEEL_MINUTES, ...WHEEL_MINUTES, ...WHEEL_MINUTES]
const WHEEL_ROW = 32

const WHEEL_HOUR_IDX_8 = WHEEL_HOURS.length + WHEEL_HOURS.indexOf('8')
const WHEEL_HOUR_IDX_9 = WHEEL_HOURS.length + WHEEL_HOURS.indexOf('9')
const WHEEL_MINUTE_IDX_30 = WHEEL_MINUTES.length + WHEEL_MINUTES.indexOf('30')
// The next cycle's "00" (not this cycle's) so the minute column always
// scrolls forward past 55, the same way a real minute hand would.
const WHEEL_MINUTE_IDX_00 = WHEEL_MINUTES.length * 2 + WHEEL_MINUTES.indexOf('00')

function WheelColumn({ stripValues, index, width }: { stripValues: string[]; index: number; width: number }) {
  return (
    <div className="relative overflow-hidden" style={{ width, height: WHEEL_ROW * 3 }}>
      <div
        style={{
          transform: `translateY(-${(index - 1) * WHEEL_ROW}px)`,
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {stripValues.map((v, i) => (
          <div
            key={i}
            className="flex items-center justify-center font-dm font-bold text-[18px] text-text-primary"
            style={{ height: WHEEL_ROW }}
          >
            {v}
          </div>
        ))}
      </div>
    </div>
  )
}

function TimeWheelDemo({ showFinal }: { showFinal: boolean }) {
  const hourIdx = showFinal ? WHEEL_HOUR_IDX_9 : WHEEL_HOUR_IDX_8
  const minuteIdx = showFinal ? WHEEL_MINUTE_IDX_00 : WHEEL_MINUTE_IDX_30

  return (
    <div className="relative w-full rounded-[12px]" style={{ height: WHEEL_ROW * 3 + 16 }}>
      <div
        className="absolute inset-x-2 rounded-[8px] bg-card pointer-events-none"
        style={{ top: '50%', height: WHEEL_ROW + 4, transform: 'translateY(-50%)' }}
      />
      <div className="relative flex items-center justify-center h-full gap-1">
        <WheelColumn stripValues={WHEEL_HOURS_STRIP} index={hourIdx} width={32} />
        <span className="font-dm font-bold text-[18px] text-text-primary">:</span>
        <WheelColumn stripValues={WHEEL_MINUTES_STRIP} index={minuteIdx} width={36} />
        <div className="flex flex-col items-center justify-center w-[40px]" style={{ height: WHEEL_ROW * 3 }}>
          <span style={{ height: WHEEL_ROW }} />
          <span className="flex items-center justify-center font-dm font-bold text-[18px] text-text-primary" style={{ height: WHEEL_ROW }}>
            am
          </span>
          <span className="flex items-center justify-center font-dm text-[14px] text-text-muted" style={{ height: WHEEL_ROW }}>
            pm
          </span>
        </div>
      </div>
    </div>
  )
}

// Fixed height for the fields↔wheel swap area so the card never resizes
// when it switches between them, regardless of which is naturally taller.
const STAY_DATES_HEIGHT = 160
// Both layers (fields and wheel) are always mounted, stacked, and
// crossfaded via opacity — smoother and slower than an instant swap, and
// avoids the pop of mounting/unmounting the wheel outright.
const CROSSFADE_MS = 700

// Timeline (all relative to the visual scrolling into view), one-shot:
//   0                    → fields showing
//   OPEN_MS              → crossfade begins: fields out, wheel in (already on 8:30)
//   OPEN_MS+FADE         → wheel fully visible on 8:30
//   ...+HOLD_830_MS      → value flips to 9:00 (WheelColumn's own 0.7s transition scrolls it there)
//   ...+SCROLL+HOLD_900  → crossfade begins: wheel out, fields in (now showing 9:00 AM)
const START_STAY_OPEN_MS = 700
const WHEEL_SCROLL_MS = 700
const WHEEL_HOLD_830_MS = 700
const WHEEL_HOLD_900_MS = 1000
const START_STAY_SHOW_FINAL_MS = START_STAY_OPEN_MS + CROSSFADE_MS + WHEEL_HOLD_830_MS
const START_STAY_CLOSE_MS = START_STAY_SHOW_FINAL_MS + WHEEL_SCROLL_MS + WHEEL_HOLD_900_MS

function StartStayCollage() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [picking, setPicking] = useState(false)
  const [showFinal, setShowFinal] = useState(false)

  useEffect(() => {
    if (!inView) return
    const openTimer = setTimeout(() => setPicking(true), START_STAY_OPEN_MS)
    const flipTimer = setTimeout(() => setShowFinal(true), START_STAY_SHOW_FINAL_MS)
    const closeTimer = setTimeout(() => setPicking(false), START_STAY_CLOSE_MS)
    return () => {
      clearTimeout(openTimer)
      clearTimeout(flipTimer)
      clearTimeout(closeTimer)
    }
  }, [inView])

  return (
    <div ref={ref} className="mx-auto w-full max-w-[380px] rounded-[20px] bg-white border border-border-faint px-[18px] py-5">
      <div className="flex items-center gap-4">
        <div className="size-[80px] shrink-0">
          <img src="/how-it-works/step2-marjorie-2.png" alt="" className="size-full object-contain" />
        </div>
        <div>
          <p className="font-outfit font-bold text-[22px] text-text-primary leading-none">Marjorie</p>
          <p className="font-dm text-[14px] text-text-secondary mt-1">Miniature Poodle, Mixed</p>
        </div>
      </div>

      {/* Fixed height so swapping to the wheel and back never resizes the
          card; both layers stay mounted and crossfade via opacity instead
          of an instant conditional swap. */}
      <div className="mt-5 relative overflow-hidden" style={{ height: STAY_DATES_HEIGHT }}>
        <div
          className="absolute inset-0 flex flex-col justify-center gap-3 transition-opacity ease-in-out"
          style={{ transitionDuration: `${CROSSFADE_MS}ms`, opacity: picking ? 0 : 1 }}
        >
          <div>
            <p className="font-dm font-bold text-[12px] text-text-secondary tracking-[0.05em] mb-1.5">START</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center justify-between rounded-[12px] border border-border-light px-4 py-3">
                <span className="font-dm text-[15px] text-text-primary">Aug 20, 2026</span>
                <CalendarDays size={18} className="text-text-muted" />
              </div>
              <div className="shrink-0 w-[108px] rounded-[12px] border border-border-light px-4 py-3">
                <span className="font-dm text-[15px] text-text-primary">9:00 AM</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-dm font-bold text-[12px] text-text-secondary tracking-[0.05em] mb-1.5">END</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center justify-between rounded-[12px] border border-border-light px-4 py-3">
                <span className="font-dm text-[15px] text-text-primary">Aug 25, 2026</span>
                <CalendarDays size={18} className="text-text-muted" />
              </div>
              <div className="shrink-0 w-[108px] rounded-[12px] border border-border-light px-4 py-3">
                <span className="font-dm text-[15px] text-text-primary">5:00 PM</span>
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0 flex flex-col justify-center transition-opacity ease-in-out"
          style={{ transitionDuration: `${CROSSFADE_MS}ms`, opacity: picking ? 1 : 0 }}
        >
          <TimeWheelDemo showFinal={showFinal} />
        </div>
      </div>

      <Button fullWidth size="lg" className="mt-5 pointer-events-none" tabIndex={-1} aria-hidden="true">
        <CalendarDays size={16} />
        Start a Stay
      </Button>
    </div>
  )
}

const TASK_BADGE_CONFIG: Record<
  'meal' | 'medication' | 'walk' | 'potty',
  { icon: React.ComponentType<{ size?: string | number; className?: string }>; bg: string }
> = {
  meal: { icon: DogBowlIcon, bg: 'bg-coral' },
  medication: { icon: Pill, bg: 'bg-blue-task' },
  walk: { icon: PawPrint, bg: 'bg-green-vivid' },
  potty: { icon: Toilet, bg: 'bg-purple-task' },
}

function GeneratedTaskRow({
  time,
  title,
  subtitle,
  type,
  divider = true,
}: {
  time: string
  title: string
  subtitle?: string
  type: 'meal' | 'medication' | 'walk' | 'potty'
  divider?: boolean
}) {
  const { icon: Icon, bg } = TASK_BADGE_CONFIG[type]
  return (
    <div className={divider ? 'border-b border-border-faint' : ''}>
      <div className="flex items-start gap-3 p-4">
        <span className={`inline-flex items-center justify-center rounded-[16px] size-8 shrink-0 ${bg}`}>
          <Icon size={16} className="text-white" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-dm font-bold text-[15px] text-text-primary leading-tight">{title}</p>
          {subtitle && <p className="font-dm text-[13px] text-text-secondary mt-1">{subtitle}</p>}
        </div>
        <span className="font-dm font-bold text-[13px] text-text-muted shrink-0">{time}</span>
      </div>
    </div>
  )
}

// Step 3's TODAY and TOMORROW day cards pop in as a pair once the visual
// scrolls into view — same .pop-in-target/.pop-in mechanism as step 1's
// labels, just two targets instead of three.
// TODAY plays first; TOMORROW's delay (1200ms) starts only after TODAY's
// own 1000ms animation fully finishes, so they read as sequential — "today
// shows up, then tomorrow" — not two things fading in at once. Plays once,
// when the visual first scrolls into view.
const TASKS_GENERATE_SECOND_DELAY_MS = 1200

function TasksGenerateCollage() {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[380px] rounded-[20px] bg-white border border-border-faint p-5 flex flex-col gap-3"
    >
      <p className="font-dm font-bold text-[13px] uppercase tracking-[0.03em] text-coral">
        Harry・5 tasks
      </p>

      <div className={`pop-in-target flex flex-col gap-2 ${inView ? 'pop-in' : ''}`}>
        <p className="font-dm text-[13px] text-text-secondary">TODAY</p>
        <div className="rounded-[16px] border border-border-light overflow-hidden">
          <GeneratedTaskRow time="5:00 PM" title="Dinner" subtitle="One cups of dry kibble" type="meal" />
          <GeneratedTaskRow time="8:00 PM" title="Evening Walk" type="walk" divider={false} />
        </div>
      </div>

      <div
        className={`pop-in-target flex flex-col gap-2 ${inView ? 'pop-in' : ''}`}
        style={{ animationDelay: `${TASKS_GENERATE_SECOND_DELAY_MS}ms` }}
      >
        <p className="font-dm text-[13px] text-text-secondary">TOMORROW</p>
        <div className="rounded-[16px] border border-border-light overflow-hidden">
          <GeneratedTaskRow time="8:30 AM" title="Morning Walk" type="walk" />
          <GeneratedTaskRow time="9:00 AM" title="Breakfast" subtitle="One cups of dry kibble" type="meal" />
          <GeneratedTaskRow time="12:00 AM" title="Medication" subtitle="Ear drops" type="medication" divider={false} />
        </div>
      </div>

      <Button fullWidth size="lg" className="mt-2 pointer-events-none" tabIndex={-1} aria-hidden="true">
        Confirm Stay
      </Button>
    </div>
  )
}

// swipe-reveal/swipe-fill (index.css) share a 1.3s delay + 0.6s duration,
// so the row is fully off and the dark-green fill settled at 1.9s — that's
// when the paw-burst celebration (same effect and timing offsets as the
// real app's TaskCard) fires from the checkmark's position. Delay starts
// later, and the post-settle hold is longer, than the other three steps'
// loops — this one has more to read (the peek, then the full commit).
const SWIPE_DELAY_MS = 1300
const SWIPE_DURATION_MS = 600
const SWIPE_SETTLE_MS = SWIPE_DELAY_MS + SWIPE_DURATION_MS
const PAW_BURST_CONFIGS = [
  { tx: '-20px', ty: '-16px', rot: '-25deg', delay: 0 },
  { tx: '18px', ty: '-18px', rot: '20deg', delay: 70 },
  { tx: '-16px', ty: '18px', rot: '15deg', delay: 140 },
  { tx: '20px', ty: '16px', rot: '-15deg', delay: 40 },
]

// Step 4's first task row — a timeline entry with a connector line down to
// the next row, plus a reveal layer behind it that only the first row's
// swipe exposes; the other two stay put. Every row rests with a pale-green
// peek on the right (matches TaskCard.tsx's resting state for a pending
// task — the content row is inset from the full width, always exposing a
// sliver of the reveal layer and its check icon, not just during a swipe).
// The swiping row's content additionally slides fully off, uncovering a
// dark-green fill, a centered white checkmark, and a paw-print burst.
function CheckOffTaskRow({
  time,
  title,
  subtitle,
  type,
  swipe = false,
  last = false,
}: {
  time: string
  title: string
  subtitle?: string
  type: 'meal' | 'medication' | 'walk' | 'potty'
  swipe?: boolean
  last?: boolean
}) {
  const { icon: Icon, bg } = TASK_BADGE_CONFIG[type]
  return (
    <div className="relative h-[72px] rounded-[10px] overflow-hidden">
      <div className="absolute inset-0 rounded-[10px] bg-[#dcfce7] flex items-center justify-end pr-[6px]">
        <CheckCircle2 size={20} className="text-green-vivid" />
      </div>
      {swipe && (
        <div className="swipe-fill absolute inset-0 rounded-[10px] bg-[#166534] flex items-center justify-center">
          <CheckCircle2 size={20} className="text-white" />
          {PAW_BURST_CONFIGS.map((p, i) => (
            <PawPrintFilled
              key={i}
              className="paw-burst absolute text-white"
              size={16}
              style={
                {
                  '--tx': p.tx,
                  '--ty': p.ty,
                  '--rot': p.rot,
                  animationDelay: `${SWIPE_SETTLE_MS + p.delay}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div
        className={`relative bg-white flex gap-3 p-2 h-full w-[calc(100%-32px)] rounded-[10px] ${swipe ? 'swipe-reveal' : ''}`}
      >
        <span className="font-dm font-bold text-[13px] text-text-primary shrink-0 pt-1">{time}</span>
        <div className="flex flex-col items-center shrink-0">
          <span className={`inline-flex items-center justify-center rounded-[16px] size-8 shrink-0 ${bg}`}>
            <Icon size={16} className="text-white" />
          </span>
          {!last && <span className="flex-1 w-0.5 bg-border-faint rounded mt-1" />}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-dm font-bold text-[16px] text-text-primary leading-tight">{title}</p>
          {subtitle && <p className="font-dm text-[13px] text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

// The real app removes a task from the list 1100ms after the swipe commits
// (src/components/TaskCard.tsx's commitSwipe: the paw-burst celebration
// plays out, then onDone fires) — matched here so the row collapses out of
// the list at the same beat, instead of just sitting there checked off.
const TASK_REMOVE_DELAY_MS = SWIPE_SETTLE_MS + 1100

const CHECK_OFF_ROW_HEIGHT = 72
const CHECK_OFF_ROW_GAP = 12
// Only this many rows are ever visible at once — the 4th task starts
// parked in the slot just past the bottom, clipped by the card's own
// overflow-hidden, and slides up into view once the first task's spot
// opens up (same slot math handles both moves).
const CHECK_OFF_VISIBLE_ROWS = 3
const CHECK_OFF_TASKS = [
  { key: 'walk', time: '7:00 AM', title: 'Morning Walk', subtitle: 'Take him to the large dog park', type: 'walk' as const },
  {
    key: 'meal',
    time: '7:30 AM',
    title: 'Breakfast',
    subtitle: '1/2 cup kibble with 1 tsp probiotic powder',
    type: 'meal' as const,
  },
  { key: 'potty', time: '11:00 AM', title: 'Potty Break', type: 'potty' as const },
  {
    key: 'afternoon-walk',
    time: '3:00 AM',
    title: 'Afternoon Walk',
    subtitle: 'a short 10–15 minute walk',
    type: 'walk' as const,
  },
]

// Step 4: the first task row auto-swipes left once the visual scrolls into
// view, revealing the "Done" background — a one-shot demo of the app's
// real swipe-to-complete gesture (src/components/TaskCard.tsx), not the
// live drag-driven component itself. It's then removed from the list,
// same as a real completed task.
function CheckOffCollage() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [taskGone, setTaskGone] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setTaskGone(true), TASK_REMOVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <div ref={ref} className="mx-auto w-full max-w-[380px] rounded-[20px] bg-white border border-border-faint overflow-hidden">
      <div className="px-6 pt-6 pb-3">
        <p className="font-dm font-bold text-[12px] uppercase tracking-[0.05em] text-coral">
          {formatTodayHeading()}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="font-outfit font-bold text-[40px] text-blue-task leading-none">Today</p>
          <CalendarDays size={18} className="text-blue-task shrink-0" />
        </div>
      </div>
      <div className="px-6 pb-4">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-border-light pl-1.5 pr-4 py-1.5">
          <img src="/how-it-works/step5-rusty.png" alt="" className="size-9 rounded-full object-cover" />
          <div>
            <p className="font-dm font-bold text-[13px] text-text-primary leading-none">Rusty</p>
            <p className="font-dm text-[11px] text-text-secondary mt-1">Until Aug 25</p>
          </div>
        </div>
      </div>
      {/* Fixed height (3 visible rows + gaps) so the card never resizes —
          rows 2 and 3 slide up into the freed slot once the first task
          fades out, and the 4th task slides up from just below the
          card's own overflow-hidden edge into the newly-freed last slot. */}
      <div
        className="relative overflow-hidden"
        style={{
          height:
            CHECK_OFF_ROW_HEIGHT * CHECK_OFF_VISIBLE_ROWS + CHECK_OFF_ROW_GAP * (CHECK_OFF_VISIBLE_ROWS - 1) + 24,
        }}
      >
        {CHECK_OFF_TASKS.map((task, i) => {
          const isFirst = i === 0
          const slot = taskGone && !isFirst ? i - 1 : i
          return (
            <div
              key={task.key}
              className={`absolute inset-x-6 transition-all duration-500 ease-in-out ${
                isFirst && taskGone ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{ top: slot * (CHECK_OFF_ROW_HEIGHT + CHECK_OFF_ROW_GAP) }}
            >
              <CheckOffTaskRow
                time={task.time}
                title={task.title}
                subtitle={task.subtitle}
                type={task.type}
                swipe={isFirst ? inView : false}
                last={i === CHECK_OFF_TASKS.length - 1}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Step 4's notification stack (Figma "Notification" components, node-ids
// 117:1691, 117:1670, 117:1699 — the three actually stacked together in
// the file, at identical 328.04×58.99 dimensions): three push-notification
// banners that start tucked into a slightly rotated, offset stack — like a
// pile of notices — then settle into a plain vertical list once the
// visual scrolls into view. Card size is kept exactly as designed, not
// stretched to the surrounding card's width.
const NOTIFICATIONS = [
  {
    id: 'luna',
    photo: '/how-it-works/step4-luna.png',
    message: "Don't forget, it's time for Luna's walk 🐾",
    time: '3m ago',
  },
  {
    id: 'puffin',
    photo: '/how-it-works/step4-puffin.png',
    message: "Puffin's breakfast time is coming up 🥣",
    time: '12m ago',
  },
  {
    id: 'poppy',
    photo: '/how-it-works/step4-poppy.png',
    message: 'Poppy might need a potty break soon 🚽',
    time: '25m ago',
  },
]
const NOTIFICATION_CARD_WIDTH = 306
// Height isn't fixed — the card sizes to its content (image + padding).
// This is that natural height (2.5rem/40px image + 12px vertical padding
// on each side), reused only for spacing the stack, not applied directly.
const NOTIFICATION_CARD_HEIGHT = 64
const NOTIFICATION_GAP = 10
const NOTIFICATION_SETTLE_DELAY_MS = 600

function NotificationCard({ n }: { n: (typeof NOTIFICATIONS)[number] }) {
  return (
    <div
      className="flex items-start gap-3 rounded-[14px] border border-border-light bg-white p-3"
      style={{ width: NOTIFICATION_CARD_WIDTH }}
    >
      <img src={n.photo} alt="" className="w-10 h-10 rounded-[8px] object-cover shrink-0" />
      <p className="flex-1 min-w-0 font-dm font-medium text-[13px] text-text-primary leading-snug">{n.message}</p>
      <span className="shrink-0 font-dm text-[11px] text-text-muted">{n.time}</span>
    </div>
  )
}

// Scales the whole stack up uniformly (text, image, padding, radius, gaps
// included) via a CSS transform on an unscaled inner wrapper, rather than
// recalculating every pixel value — guarantees the enlarged version stays
// exactly proportional to the 306px-wide design.
const NOTIFICATION_SCALE = 1.5 * 0.8

function NotificationStackCollage() {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setSettled(true), NOTIFICATION_SETTLE_DELAY_MS)
    return () => clearTimeout(t)
  }, [inView])

  const baseWidth = NOTIFICATION_CARD_WIDTH
  const baseHeight = NOTIFICATION_CARD_HEIGHT * NOTIFICATIONS.length + NOTIFICATION_GAP * (NOTIFICATIONS.length - 1)

  return (
    <div
      ref={ref}
      className="relative mx-auto"
      style={{ width: baseWidth * NOTIFICATION_SCALE, height: baseHeight * NOTIFICATION_SCALE }}
    >
      <div
        className="relative"
        style={{ width: baseWidth, height: baseHeight, transform: `scale(${NOTIFICATION_SCALE})`, transformOrigin: 'top left' }}
      >
        {NOTIFICATIONS.map((n, i) => (
          <div
            key={n.id}
            className="absolute inset-x-0 transition-all ease-out"
            style={{
              top: settled ? i * (NOTIFICATION_CARD_HEIGHT + NOTIFICATION_GAP) : i * 8,
              transform: settled ? 'none' : `scale(${1 - i * 0.03}) rotate(${i % 2 === 0 ? -2 : 2}deg)`,
              transitionDuration: '700ms',
              transitionDelay: `${i * 100}ms`,
              zIndex: NOTIFICATIONS.length - i,
            }}
          >
            <NotificationCard n={n} />
          </div>
        ))}
      </div>
    </div>
  )
}

const ALT_STEPS = [
  {
    title: 'Add the dog',
    body: 'Breed, size, owner contact, and the care notes you actually need at 6am: food, meds, behaviour, emergencies.',
    Visual: AddDogPhotoCollage,
  },
  {
    title: 'Start a stay',
    body: 'Pick the dates. Their regular daily schedule comes along with them.',
    Visual: StartStayCollage,
  },
  {
    title: 'Tasks generate',
    body: 'Every meal, med, and walk for the whole stay, laid out on a timeline and grouped by dog.',
    Visual: TasksGenerateCollage,
  },
  {
    title: 'Reminders find you',
    body: "A push notification for each task, timed to the schedule. Add HeyPup to your home screen first — that's what turns notifications on your phone.",
    Visual: NotificationStackCollage,
  },
  {
    title: 'Check off as you go',
    body: 'One tap per task, one hand, mid-shift. Skip or reschedule when the day moves.',
    Visual: CheckOffCollage,
  },
]

const FEATURES = [
  {
    Icon: PawPrint,
    title: 'Grouped by dog',
    body: 'Every task lives under the dog it’s for, even with three overlapping stays, so nothing gets crossed with the wrong bowl.',
  },
  {
    Icon: Bell,
    title: 'Reminders that find you',
    body: 'A push notification for each task, timed to the schedule, so a med window doesn’t slip by while you’re heads-down at work. Add HeyPup to your home screen to get them.',
  },
  {
    Icon: CalendarDays,
    title: 'Calendar sync, optional',
    body: 'Bookings come in from Rover, care tasks go out to their own calendar. Connect it below, or skip it entirely.',
  },
  {
    Icon: CheckCircle2,
    title: 'One tap, one hand',
    body: 'Built for checking things off standing in a kitchen with a leash in one hand, not sitting down to plan.',
  },
]

const FAQS = [
  {
    q: 'Is HeyPup a mobile app I need to download?',
    a: "No. HeyPup is a web app. Open it in your phone's browser, no App Store and nothing to install. Add it to your home screen for one-tap access, and if you want reminders, that step is required, not optional.",
  },
  {
    q: 'How many dogs can I track at once?',
    a: 'As many as you’re actually sitting. Tasks are grouped by dog, so a house full of concurrent stays stays scannable instead of turning into one long list.',
  },
  {
    q: 'Does HeyPup send reminders?',
    a: 'Yes. Each task can send a push notification at its scheduled time, so a meal or a med window doesn’t slip by while you’re heads-down at work. Reminders only work once HeyPup is added to your home screen, so do that first if you want them.',
  },
  {
    q: 'Do I need to connect Google Calendar?',
    a: 'No, calendar sync is optional. HeyPup works fully with tasks generated straight from a dog’s care schedule; connecting Google just saves you from re-typing bookings.',
  },
  {
    q: 'What happens to my Google access if I disconnect?',
    a: 'Disconnecting in Settings deletes the access HeyPup was given, and you can also revoke it directly from your Google Account at any time.',
  },
  {
    q: 'Is it free?',
    a: "Free while HeyPup is finding its feet. Bring your own dogs, no card required.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border-faint last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-outfit font-bold text-[17px] text-text-primary leading-snug">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-cobalt transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="font-dm text-[15px] text-text-secondary leading-relaxed pb-5 max-w-[60ch]">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks)

  useEffect(() => {
    document.title = 'HeyPup: care tracking for dog sitters and boarders'
  }, [])

  function markDone(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'done', completedAt: new Date().toISOString() } : t,
      ),
    )
  }

  function markUndone(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'pending', completedAt: undefined } : t)),
    )
  }

  return (
    <PublicPageShell>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-6 pt-14 pb-20 sm:pt-24 sm:pb-28 grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:items-center">
        <div>
          {/* Escalating headcount building overwhelm before the resolution —
              deliberately not tied to the single-dog hero mockup beside it. */}
          <h1 className="rise-in font-outfit font-bold text-cobalt leading-[0.95] tracking-[-0.03em] text-[clamp(2.5rem,7vw,4.5rem)]">
            <span className="block">Two dogs.</span>
            <span className="block">Four meals.</span>
            <span className="block">Eight walks.</span>
            <span className="block text-coral">One list.</span>
          </h1>
          <p
            className="rise-in font-dm text-[17px] sm:text-[19px] text-text-secondary leading-relaxed mt-6 max-w-[52ch]"
            style={{ animationDelay: '90ms', textWrap: 'pretty' }}
          >
            HeyPup turns every boarding stay into a schedule of care tasks, grouped by dog. Built
            for the sitter who checks things off standing in a kitchen with a leash in one hand,
            not sitting down to plan.
          </p>
          <div className="rise-in flex flex-wrap gap-3 mt-8" style={{ animationDelay: '180ms' }}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3.5 font-dm font-bold text-[15px] text-white hover:bg-coral-deep transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
            >
              Start tracking
              <ArrowRight size={17} />
            </Link>
            <a
              href="#calendar-sync"
              className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-text-primary px-6 py-3.5 font-dm font-bold text-[15px] text-text-primary hover:bg-card transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              How calendar sync works
            </a>
          </div>
        </div>

        {/* Live product surface — the real Today page (header, week strip,
            Active Care chip, the actual TaskCard), sized as a modest mockup
            on a solid Cobalt backdrop — not a card that fills the panel —
            and cropped at the bottom edge so it reads as a phone caught
            mid-shot. */}
        <div className="rise-in justify-self-center w-full max-w-[440px]" style={{ animationDelay: '260ms' }}>
          <div className="relative overflow-hidden rounded-[36px] bg-cobalt h-[520px] sm:h-[560px]">
            {/* Decorative circles — sized and inset so nothing bleeds past
                the panel's clipped edge. */}
            <div
              aria-hidden="true"
              className="absolute -top-14 -left-12 size-48 rounded-full bg-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute top-4 -right-14 size-40 rounded-full bg-white/10"
            />

            <div className="absolute left-1/2 -translate-x-1/2 top-16" style={HERO_PHONE_SIZE}>
              <PhoneFrame>
                <HeroTodayScreen tasks={tasks} onDone={markDone} onUndo={markUndone} />
              </PhoneFrame>
            </div>
          </div>
          <p className="font-dm text-[13px] text-text-muted text-center mt-4">
            Go ahead, swipe a task to mark it <span className="font-bold text-text-secondary">Done</span>. It
            works right in your browser, nothing to download.
          </p>
        </div>
      </section>

      {/* ── Problem statement ─────────────────────────────────────────────
          The "why this exists" beat, between the hero's demo and the
          product walkthrough — a plain, centered editorial block for
          contrast against the two-column sections around it. */}
      <section className="border-t border-border-faint bg-coral">
        <div className="mx-auto max-w-[760px] px-6 py-20 text-center">
          <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-white/80">
            The problem
          </p>
          <h2
            className="font-outfit font-bold text-white text-[clamp(2rem,5vw,3.25rem)] leading-[1.1] tracking-[-0.02em] mt-3"
            style={{ textWrap: 'balance' }}
          >
            Every dog runs on its own clock, and yours doesn't stop for it.
          </h2>
          <p className="font-dm text-[18px] text-white/90 leading-relaxed mt-6 max-w-[60ch] mx-auto">
            One wants breakfast at seven. Another needs a thyroid pill at noon,{' '}
            <em className="not-italic font-bold text-white">exactly</em> at noon, not "sometime
            around lunch." You're heads-down on a work call, and by the time you look up, there's
            a very unimpressed nose parked on your knee. Now multiply that by three dogs, three
            schedules, and a sticky note that fell off the fridge.
          </p>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────
          Four steps, each with its own floating-card visual pulled from the
          Figma design system. */}
      <section id="how-it-works" className="border-t border-border-faint bg-card">
        <div className="mx-auto max-w-[1100px] px-6 py-20">
          <div className="max-w-[640px]">
            <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral">
              How it works
            </p>
            <h2 className="font-outfit font-bold text-cobalt text-[clamp(2.25rem,5.5vw,3.5rem)] leading-tight tracking-[-0.02em] mt-2">
              From “can you take him this weekend?” to a checklist
            </h2>
          </div>

          <div className="flex flex-col gap-20 sm:gap-28 mt-16">
            {ALT_STEPS.map((step, i) => (
              <div
                key={step.title}
                className={`grid gap-10 items-center lg:grid-cols-2 lg:gap-16 ${
                  i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div>
                  <span className="font-dm font-bold text-[13px] uppercase tracking-[0.1em] text-coral">
                    Step {i + 1}
                  </span>
                  <p className="font-outfit font-bold text-cobalt text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05] tracking-[-0.02em] mt-1.5">
                    {step.title}
                  </p>
                  <p className="font-dm text-[17px] leading-relaxed text-text-secondary mt-3 max-w-[40ch]">
                    {step.body}
                  </p>
                </div>
                <step.Visual />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────
          Calendar sync used to get its own section as if it were the whole
          pitch; it's one of four things worth knowing, so it's a grid entry
          here — the detailed disclosure a sitter (and a Google OAuth
          reviewer) actually needs still gets its own sub-section below,
          just not the entire spotlight. */}
      <section className="border-t border-border-faint">
        <div className="mx-auto max-w-[1100px] px-6 py-20">
          <div className="max-w-[640px]">
            <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral">
              Features
            </p>
            <h2 className="font-outfit font-bold text-cobalt text-[clamp(2.25rem,5.5vw,3.5rem)] leading-tight tracking-[-0.02em] mt-2">
              Everything a sitter actually needs, nothing they don't.
            </h2>
          </div>

          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 mt-14">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title}>
                <span className="size-11 rounded-full bg-card flex items-center justify-center">
                  <Icon size={20} className="text-cobalt" />
                </span>
                <p className="font-outfit font-bold text-[20px] text-text-primary mt-4">{title}</p>
                <p className="font-dm text-[15px] text-text-secondary leading-relaxed mt-2 max-w-[40ch]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Calendar sync detail ───────────────────────────────────────
            Deliberately concrete about what Google access is used for: this
            is the sub-section a Google OAuth reviewer reads, and the one a
            sitter reads before granting calendar permission — the hero's
            "How calendar sync works" link jumps straight here. */}
        <div id="calendar-sync" className="bg-cobalt-soft border-t border-border-faint pt-20 pb-20 scroll-mt-16">
          <div className="mx-auto max-w-[1100px] px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
              {/* Centered against the taller list beside it — top-aligning left
                  a dead quarter-screen under this column on desktop. */}
              <div className="lg:self-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light px-3 py-1.5">
                  <CalendarDays size={15} className="text-cobalt" />
                  <span className="font-dm font-bold text-[13px] text-text-primary">
                    Google Calendar
                  </span>
                </div>
                <h2 className="font-outfit font-bold text-cobalt text-[clamp(2.25rem,5.5vw,3.5rem)] leading-tight tracking-[-0.02em] mt-5">
                  Your bookings come in. Your tasks go out.
                </h2>
                <p className="font-dm text-[16px] text-text-secondary leading-relaxed mt-4 max-w-[46ch]">
                  Connecting Google Calendar is optional, and HeyPup asks for exactly what these two
                  jobs need, nothing broader.
                </p>
              </div>

              {/* One panel, hairline-separated rows — three separate cards read
                  as a template grid and said nothing the rules don't. */}
              <dl className="bg-white rounded-[18px] border border-border-faint divide-y divide-border-faint overflow-hidden">
                <div className="p-6 sm:p-7">
                  <dt className="flex items-center gap-2.5">
                    <Download size={18} className="text-green-vivid shrink-0" />
                    <span className="font-outfit font-bold text-[18px] text-text-primary">
                      Reading your bookings
                    </span>
                  </dt>
                  <dd className="font-dm text-[15px] text-text-secondary leading-relaxed mt-2.5">
                    If you use Rover's calendar sync, HeyPup finds that calendar automatically and
                    reads only its confirmed bookings, so a stay you accepted on Rover shows up here
                    without retyping it. No other calendar is read.
                  </dd>
                </div>

                <div className="p-6 sm:p-7">
                  <dt className="flex items-center gap-2.5">
                    <Upload size={18} className="text-cobalt shrink-0" />
                    <span className="font-outfit font-bold text-[18px] text-text-primary">
                      Writing your care tasks
                    </span>
                  </dt>
                  <dd className="font-dm text-[15px] text-text-secondary leading-relaxed mt-2.5">
                    Meals, meds, and walks are written as timed events to a separate calendar called
                    “HeyPup” that the app creates for you. Your personal calendar is never written
                    to, and you can turn pushing off while staying connected.
                  </dd>
                </div>

                <div className="p-6 sm:p-7">
                  <dt className="flex items-center gap-2.5">
                    <ShieldCheck size={18} className="text-coral shrink-0" />
                    <span className="font-outfit font-bold text-[18px] text-text-primary">
                      Ending it is one tap
                    </span>
                  </dt>
                  <dd className="font-dm text-[15px] text-text-secondary leading-relaxed mt-2.5">
                    Disconnect in Settings and HeyPup deletes the access it was given. You can also
                    revoke it from your Google Account at any time.{' '}
                    <Link
                      to="/privacy"
                      className="font-bold text-text-primary underline underline-offset-2 hover:text-coral transition-colors"
                    >
                      Read the privacy policy
                    </Link>
                    .
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-[720px] px-6 py-20">
          <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral text-center">
            Questions
          </p>
          <h2 className="font-outfit font-bold text-cobalt text-[clamp(2.25rem,5.5vw,3.5rem)] leading-tight tracking-[-0.02em] mt-2 text-center">
            Good to know
          </h2>
          <div className="mt-10">
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────────────────
          Cobalt, not coral-on-black — the brand's other committed color
          gets the big final moment, and Ember stays reserved for the one
          button that's actually an action. White on Cobalt clears AA at
          both body and display sizes. */}
      <section className="relative overflow-hidden bg-cobalt">
        <PawPrint
          aria-hidden="true"
          size={72}
          strokeWidth={1.5}
          className="absolute left-[8%] top-10 text-white/10 rotate-[-12deg] pointer-events-none"
        />
        <PawPrint
          aria-hidden="true"
          size={110}
          strokeWidth={1.5}
          className="absolute right-[6%] bottom-6 text-white/10 rotate-[16deg] pointer-events-none"
        />
        <div className="relative mx-auto max-w-[1100px] px-6 py-20 sm:py-24 text-center">
          <h2
            className="font-outfit font-bold text-white text-[clamp(2.25rem,6vw,4rem)] leading-[1.05] tracking-[-0.02em] mx-auto max-w-[18ch]"
            style={{ textWrap: 'balance' }}
          >
            Zero missed meals. Zero missed meds.
          </h2>
          <p className="font-dm text-[17px] text-white/90 leading-relaxed mt-5 mx-auto max-w-[48ch]">
            Free to use while HeyPup is finding its feet. Bring your own dogs.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-coral px-7 py-4 font-dm font-bold text-[16px] text-white mt-8 hover:bg-coral-deep transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Open HeyPup
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicPageShell>
  )
}
