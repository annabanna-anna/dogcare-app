import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronDown,
  Download,
  Upload,
  ShieldCheck,
  Pill,
  Circle,
  CheckCircle2,
  PawPrint,
} from 'lucide-react'
import PublicPageShell from '../components/PublicPageShell'
import PhoneFrame from '../components/PhoneFrame'
import TaskCard from '../components/TaskCard'
import DogIcon from '../components/icons/DogIcon'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import type { Task } from '../types'
import { formatTodayHeading } from '../utils/dateUtils'

// Both keep the iPhone 15 Plus / 14 Pro Max aspect ratio (402×874). The
// hero's is scaled down to ~67% so the phone reads as a mockup sitting
// inside its section, not a card that fills it — the modest phone-to-page
// ratio a real device photo gets on a hero. "How it works" runs larger
// (~90%) since that section is a sticky, vertically-centered stage built
// around the mockup — it should fill the viewport, not sit small inside
// it. Content past each height is cropped by PhoneFrame's own height, not
// left to overflow; `maxWidth`/`maxHeight` keep either from overflowing a
// smaller viewport.
const HERO_PHONE_SIZE: React.CSSProperties = {
  width: 270,
  height: 587,
  maxWidth: '100%',
  maxHeight: '80vh',
}
const STEPS_PHONE_SIZE: React.CSSProperties = {
  width: 360,
  height: 783,
  maxWidth: '100%',
  maxHeight: '85vh',
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

// ── Tiny, static preview row used inside the "how it works" mockups ────────
// A hand-built stand-in for TaskCard: those two mockups are frozen snapshots
// (one dog mid-tap, one dog before any taps), not the live interactive card.
const MOCK_TYPE_CONFIG: Record<
  'meal' | 'medication' | 'walk',
  { icon: React.ComponentType<{ size?: string | number; className?: string }>; bg: string }
> = {
  meal: { icon: DogBowlIcon, bg: 'bg-coral' },
  medication: { icon: Pill, bg: 'bg-blue-task' },
  walk: { icon: PawPrint, bg: 'bg-green-vivid' },
}

function MockTaskRow({
  time,
  title,
  dog,
  type,
  done,
}: {
  time: string
  title: string
  dog: string
  type: 'meal' | 'medication' | 'walk'
  done?: boolean
}) {
  const { icon: Icon, bg } = MOCK_TYPE_CONFIG[type]
  return (
    <div className={`flex items-center gap-3 py-2.5 ${done ? 'opacity-45' : ''}`}>
      <span className="w-9 shrink-0 font-dm font-bold text-[12px] text-text-primary">{time}</span>
      <span className={`size-7 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={14} className="text-white" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-dm text-[10px] text-text-muted leading-none">{dog}</span>
        <span className="block font-dm font-bold text-[14px] text-text-primary leading-tight mt-0.5 truncate">
          {title}
        </span>
      </span>
      {done ? (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#dcfce7] text-[#15803d] px-2 py-1 text-[10px] font-dm font-bold">
          <CheckCircle2 size={11} />
          Done
        </span>
      ) : (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border-light text-text-muted px-2 py-1 text-[10px] font-dm font-bold">
          <Circle size={11} />
          Done
        </span>
      )}
    </div>
  )
}

// ── The four "how it works" mockup screens ──────────────────────────────
function AddDogMock() {
  return (
    <div className="px-5 pt-4 pb-5 flex flex-col gap-4">
      <div>
        <p className="font-dm font-bold text-[11px] uppercase tracking-wide text-coral">New dog</p>
        <p className="font-outfit font-bold text-[22px] text-cobalt leading-tight mt-0.5">Barkley</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="size-14 rounded-[16px] bg-[#f3f4f6] flex items-center justify-center shrink-0">
          <DogIcon size={26} className="text-text-muted" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-dm font-bold text-text-secondary">
            Golden Retriever
          </span>
          <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-dm font-bold text-text-secondary">
            Large
          </span>
        </div>
      </div>
      <div className="rounded-[16px] border border-border-faint bg-white p-3.5">
        <p className="font-dm font-bold text-[11px] uppercase tracking-wide text-text-muted">
          Care notes
        </p>
        <div className="mt-2.5 space-y-1.5">
          <div className="h-2 rounded-full bg-border-faint w-full" />
          <div className="h-2 rounded-full bg-border-faint w-4/5" />
          <div className="h-2 rounded-full bg-border-faint w-3/5" />
        </div>
      </div>
      <span className="mt-auto inline-flex items-center justify-center rounded-full bg-coral py-2.5 font-dm font-bold text-[13px] text-white">
        Save dog
      </span>
    </div>
  )
}

// A faithful small replica of the real Start Stay page — same back-arrow
// header, dog selector, Start/End date+time fields, notes, and CTA — not a
// redrawn calendar-grid stand-in.
function StartStayMock() {
  return (
    <div className="px-4 pt-4 pb-4 flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <ArrowLeft size={15} className="text-text-secondary" />
        <p className="font-outfit font-bold text-[19px] text-cobalt leading-none">Start Stay</p>
      </div>

      <div>
        <p className="font-dm font-bold text-[9px] text-text-secondary uppercase tracking-widest mb-1.5">
          Which dog?
        </p>
        <div className="flex items-center gap-2.5 rounded-[12px] border border-coral bg-[#fff5f3] p-2">
          <img
            src={GEORGE_PHOTO_URL}
            alt="George, a West Highland Terrier"
            className="size-9 rounded-[8px] object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="font-dm font-semibold text-[13px] text-text-primary leading-none">George</p>
            <p className="font-dm text-[11px] text-text-secondary mt-0.5 truncate">
              West Highland Terrier
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="font-dm font-bold text-[9px] text-text-secondary uppercase tracking-widest mb-1.5">
          Stay Dates
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Start', date: 'Fri, Aug 14' },
            { label: 'End', date: 'Wed, Aug 20' },
          ].map(({ label, date }) => (
            <div key={label}>
              <p className="font-dm font-bold text-[8px] text-text-muted uppercase tracking-widest mb-1">
                {label}
              </p>
              <div className="flex items-center justify-between rounded-[10px] border border-border-light bg-white px-2.5 py-2">
                <span className="font-dm text-[11px] text-text-primary">{date}</span>
                <CalendarDays size={12} className="text-text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="mt-auto inline-flex items-center justify-center rounded-full bg-coral py-2.5 font-dm font-bold text-[12px] text-white">
        Generate Care Tasks
      </span>
    </div>
  )
}

function TasksGenerateMock() {
  return (
    <div className="px-5 pt-4 pb-5">
      <p className="font-dm font-bold text-[11px] uppercase tracking-wide text-coral">This stay</p>
      <p className="font-outfit font-bold text-[22px] text-cobalt leading-tight mt-0.5">
        9 tasks, 2 dogs
      </p>
      <div className="mt-3 divide-y divide-border-faint">
        <MockTaskRow time="8:00" title="Breakfast" dog="Barkley" type="meal" />
        <MockTaskRow time="8:30" title="Ear drops" dog="Mochi" type="medication" />
        <MockTaskRow time="9:15" title="Morning walk" dog="Barkley" type="walk" />
      </div>
    </div>
  )
}

function CheckOffMock() {
  return (
    <div className="px-5 pt-4 pb-5">
      <p className="font-outfit font-bold text-[26px] text-cobalt leading-none">Today</p>
      <p className="font-dm text-[12px] text-text-secondary mt-1.5">2 left across 2 dogs</p>
      <div className="mt-3 divide-y divide-border-faint">
        <MockTaskRow time="8:00" title="Breakfast" dog="Barkley" type="meal" done />
        <MockTaskRow time="8:30" title="Ear drops" dog="Mochi" type="medication" />
        <MockTaskRow time="9:15" title="Morning walk" dog="Barkley" type="walk" />
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'Add the dog',
    body: 'Breed, size, owner contact, and the care notes you actually need at 6am — food, meds, behaviour, emergencies.',
    Mock: AddDogMock,
  },
  {
    title: 'Start a stay',
    body: 'Pick the dates. Their regular daily schedule comes along with them.',
    Mock: StartStayMock,
  },
  {
    title: 'Tasks generate',
    body: 'Every meal, med, and walk for the whole stay, laid out on a timeline and grouped by dog.',
    Mock: TasksGenerateMock,
  },
  {
    title: 'Check off as you go',
    body: 'One tap per task, one hand, mid-shift. Skip or reschedule when the day moves.',
    Mock: CheckOffMock,
  },
]

const FEATURES = [
  {
    Icon: PawPrint,
    title: 'Grouped by dog',
    body: 'Every task lives under the dog it’s for — even with three overlapping stays, nothing gets crossed with the wrong bowl.',
  },
  {
    Icon: Bell,
    title: 'Reminders that find you',
    body: 'A push notification for each task, timed to the schedule — so a med window doesn’t slip by while you’re heads-down at work. Add HeyPup to your home screen to get them.',
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
    a: "No — HeyPup is a web app. Open it in your phone's browser, no App Store and nothing to install. Add it to your home screen for one-tap access — and if you want reminders, that step is required, not optional.",
  },
  {
    q: 'How many dogs can I track at once?',
    a: 'As many as you’re actually sitting — tasks are grouped by dog, so a house full of concurrent stays stays scannable instead of turning into one long list.',
  },
  {
    q: 'Does HeyPup send reminders?',
    a: 'Yes — each task can send a push notification at its scheduled time, so a meal or a med window doesn’t slip by while you’re heads-down at work. Reminders only work once HeyPup is added to your home screen, so do that first if you want them.',
  },
  {
    q: 'Do I need to connect Google Calendar?',
    a: 'No — calendar sync is optional. HeyPup works fully with tasks generated straight from a dog’s care schedule; connecting Google just saves you from re-typing bookings.',
  },
  {
    q: 'What happens to my Google access if I disconnect?',
    a: 'Disconnecting in Settings deletes the access HeyPup was given, and you can also revoke it directly from your Google Account at any time.',
  },
  {
    q: 'Is it free?',
    a: "Free while HeyPup is finding its feet — bring your own dogs, no card required.",
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
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    document.title = 'HeyPup — care tracking for dog sitters and boarders'
  }, [])

  // Scroll-driven, not timer-driven: whichever step block crosses the
  // vertical middle of the viewport becomes active, so the mockup advances
  // in step with scrolling instead of on its own clock.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const idx = Number((entry.target as HTMLElement).dataset.stepIndex)
          setActiveStep(idx)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    for (const el of stepRefs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function scrollToStep(i: number) {
    stepRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

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
          {/* Grounded in the mockup beside it: one dog (George), his four
              tasks today — not an abstract multi-dog tally. */}
          <h1 className="rise-in font-outfit font-bold text-cobalt leading-[0.95] tracking-[-0.03em] text-[clamp(2.5rem,7vw,4.5rem)]">
            <span className="block">One dog.</span>
            <span className="block">Four tasks.</span>
            <span className="block text-coral">One list.</span>
          </h1>
          <p
            className="rise-in font-dm text-[17px] sm:text-[19px] text-text-secondary leading-relaxed mt-6 max-w-[52ch]"
            style={{ animationDelay: '90ms', textWrap: 'pretty' }}
          >
            HeyPup turns every boarding stay into a schedule of care tasks, grouped by dog. Built
            for the sitter who checks things off standing in a kitchen with a leash in one hand —
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
            Go ahead — tap a <span className="font-bold text-text-secondary">Done</span> button. It
            works right in your browser — nothing to download.
          </p>
        </div>
      </section>

      {/* ── Problem statement ─────────────────────────────────────────────
          The "why this exists" beat, between the hero's demo and the
          product walkthrough — a plain, centered editorial block for
          contrast against the two-column sections around it. */}
      <section className="border-t border-border-faint bg-card">
        <div className="mx-auto max-w-[760px] px-6 py-20 text-center">
          <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral">
            The problem
          </p>
          <h2
            className="font-outfit font-bold text-text-primary text-[clamp(2rem,5vw,3.25rem)] leading-[1.1] tracking-[-0.02em] mt-3"
            style={{ textWrap: 'balance' }}
          >
            Every dog runs on its own clock — and yours doesn't stop for it.
          </h2>
          <p className="font-dm text-[18px] text-text-secondary leading-relaxed mt-6 max-w-[60ch] mx-auto">
            One wants breakfast at seven. Another needs a thyroid pill at noon —{' '}
            <em className="not-italic font-bold text-text-primary">exactly</em> at noon, not
            "sometime around lunch." You're heads-down on a work call, and by the time you look
            up, there's a very unimpressed nose parked on your knee. Now multiply that by three
            dogs, three schedules, and a sticky note that fell off the fridge.
          </p>
        </div>
      </section>

      {/* ── How it works: scroll pins the mockup, each step block scrolling
          past drives which one is showing — Structured's scrollytelling
          pattern, an interactive mockup in place of their video. Steps are
          still clickable and jump straight there. ──────────────────────── */}
      <section className="border-t border-border-faint">
        <div className="mx-auto max-w-[1100px] px-6 pt-20">
          <div className="max-w-[640px]">
            <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral">
              How it works
            </p>
            <h2 className="font-outfit font-bold text-cobalt text-[clamp(2.25rem,5.5vw,3.5rem)] leading-tight tracking-[-0.02em] mt-2">
              From “can you take him this weekend?” to a checklist
            </h2>
          </div>

          <div className="grid lg:grid-cols-[1fr_420px] lg:gap-16 mt-8">
            {/* Text column. Mobile: a normal stacked list, each step with its
                own inline mockup. Desktop: the visible text is a single
                sticky, crossfading panel — like Structured's "split your day
                into tasks" section — driven by four invisible scroll markers
                spread across a tall relative track underneath it. */}
            <div className="relative lg:min-h-[280vh]">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    stepRefs.current[i] = el
                  }}
                  data-step-index={i}
                  aria-hidden="true"
                  className="hidden lg:block absolute inset-x-0 h-px"
                  style={{ top: `${(i / STEPS.length) * 100}%` }}
                />
              ))}

              <div className="lg:hidden flex flex-col gap-14 py-8">
                {STEPS.map((step, i) => (
                  <div key={step.title}>
                    <button
                      type="button"
                      onClick={() => scrollToStep(i)}
                      className="w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral rounded-sm"
                    >
                      <span className="block font-dm font-bold text-[13px] uppercase tracking-[0.1em] text-coral">
                        Step {i + 1}
                      </span>
                      <span className="block font-outfit font-bold text-cobalt text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05] tracking-[-0.02em] mt-1.5">
                        {step.title}
                      </span>
                      <span className="block font-dm text-[17px] leading-relaxed text-text-secondary mt-3 max-w-[40ch]">
                        {step.body}
                      </span>
                    </button>
                    <div className="mt-6" style={STEPS_PHONE_SIZE}>
                      <PhoneFrame>
                        <step.Mock />
                      </PhoneFrame>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: vertically centered in the viewport while pinned,
                  like Structured's own switching text — not stuck near the
                  top of the fold. */}
              <div className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:items-center">
                <div className="grid w-full">
                  {STEPS.map((step, i) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => scrollToStep(i)}
                      aria-current={i === activeStep}
                      aria-hidden={i !== activeStep}
                      className={`[grid-area:1/1] w-full text-left transition-all duration-500 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral rounded-sm ${
                        i === activeStep
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-3 pointer-events-none'
                      }`}
                    >
                      {/* Cobalt marks "which step you're on," the same job it
                          does for the active bottom-nav tab in the app —
                          wayfinding, not action, so it stays off-limits to
                          Ember. No card behind it — weight and the crossfade
                          alone carry the switch, bare on the page. */}
                      <span className="block font-dm font-bold text-[13px] uppercase tracking-[0.1em] text-coral">
                        Step {i + 1}
                      </span>
                      <span className="block font-outfit font-bold text-cobalt text-[clamp(2rem,3.5vw,2.75rem)] leading-[1.05] tracking-[-0.02em] mt-2">
                        {step.title}
                      </span>
                      <span className="block font-dm text-[18px] leading-relaxed text-text-secondary mt-3 max-w-[40ch]">
                        {step.body}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mockup column: pinned and vertically centered, crossfading
                as scroll crosses steps — sized to fill the viewport rather
                than sit small inside it. */}
            <div className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:items-center">
              <div className="grid" style={STEPS_PHONE_SIZE}>
                {STEPS.map((step, i) => (
                  <div
                    key={step.title}
                    aria-hidden={i !== activeStep}
                    className={`[grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none ${
                      i === activeStep ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <PhoneFrame>
                      <step.Mock />
                    </PhoneFrame>
                  </div>
                ))}
              </div>
            </div>
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
        <div id="calendar-sync" className="bg-card border-t border-border-faint pt-20 pb-20 scroll-mt-16">
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
                  jobs need — nothing broader.
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
                    reads only its confirmed bookings — so a stay you accepted on Rover shows up here
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
