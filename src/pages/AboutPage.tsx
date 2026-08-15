import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
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

/** Builds an ISO datetime at a fixed clock time today, so the demo schedule
 *  always reads as a plausible working day rather than a frozen date. */
function todayAt(hours: number, minutes: number): string {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

function demoTasks(): Task[] {
  return [
    {
      id: 'demo-1',
      stayId: 'demo',
      dogId: 'demo-barkley',
      dogName: 'Barkley',
      type: 'meal',
      title: 'Breakfast',
      scheduledTime: todayAt(8, 0),
      // Kept short on purpose: TaskCard is built for the app's 430px frame,
      // and long notes wrap to a ribbon inside the narrower demo mock.
      note: 'Half scoop, soaked.',
      status: 'done',
    },
    {
      id: 'demo-2',
      stayId: 'demo',
      dogId: 'demo-mochi',
      dogName: 'Mochi',
      type: 'medication',
      title: 'Ear drops',
      scheduledTime: todayAt(8, 30),
      note: 'Left ear only.',
      status: 'pending',
    },
    {
      id: 'demo-3',
      stayId: 'demo',
      dogId: 'demo-barkley',
      dogName: 'Barkley',
      type: 'walk',
      title: 'Morning walk',
      scheduledTime: todayAt(9, 15),
      status: 'pending',
    },
  ]
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

function StartStayMock() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  const rangeStart = 17
  const rangeEnd = 23
  return (
    <div className="px-5 pt-4 pb-5 flex flex-col gap-3.5">
      <div>
        <p className="font-dm font-bold text-[11px] uppercase tracking-wide text-coral">New stay</p>
        <p className="font-outfit font-bold text-[22px] text-cobalt leading-tight mt-0.5">
          Barkley&rsquo;s dates
        </p>
      </div>
      <div className="rounded-[16px] border border-border-faint bg-white p-3">
        <div className="grid grid-cols-7 gap-y-1.5 place-items-center">
          {days.map((d) => {
            const edge = d === rangeStart || d === rangeEnd
            const inRange = d > rangeStart && d < rangeEnd
            return (
              <span
                key={d}
                className={`size-6 flex items-center justify-center rounded-full text-[10.5px] font-dm font-bold ${
                  edge
                    ? 'bg-coral text-white'
                    : inRange
                      ? 'bg-coral-soft text-coral'
                      : 'text-text-secondary'
                }`}
              >
                {d}
              </span>
            )
          })}
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[12px] font-dm font-bold text-text-primary self-start">
        <CalendarDays size={13} className="text-cobalt" />
        Jul 17 – Jul 23
      </span>
      <p className="font-dm text-[13px] text-text-secondary leading-relaxed">
        Their daily schedule comes along — meals, meds, and walks are already set.
      </p>
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

const STEP_INTERVAL_MS = 4200

export default function AboutPage() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    document.title = 'GoodPup — care tracking for dog sitters and boarders'
  }, [])

  // Auto-advances the "how it works" mockup, resetting the clock on every
  // manual click too — so a click doesn't get immediately overridden.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length)
    }, STEP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [activeStep])

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

  const remaining = tasks.filter((t) => t.status !== 'done').length

  return (
    <PublicPageShell>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden mx-auto max-w-[1100px] px-6 pt-14 pb-20 sm:pt-24 sm:pb-28 grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:items-center">
        <PawPrint
          aria-hidden="true"
          size={220}
          strokeWidth={1.5}
          className="hidden lg:block absolute -left-16 -top-10 text-coral-soft -rotate-[18deg] pointer-events-none"
        />
        <div className="relative">
          {/* Three short, specific lines — the demo dogs below, not an
              abstract "3 dogs, 9 meals" tally — read as voice, not a stat. */}
          <h1 className="rise-in font-outfit font-bold text-text-primary leading-[0.95] tracking-[-0.03em] text-[clamp(2rem,5vw,3.25rem)]">
            <span className="block">Barkley&rsquo;s breakfast.</span>
            <span className="block">Mochi&rsquo;s meds.</span>
            <span className="block text-coral">Nobody&rsquo;s stress.</span>
          </h1>
          <p
            className="rise-in font-dm text-[17px] sm:text-[19px] text-text-secondary leading-relaxed mt-6 max-w-[52ch]"
            style={{ animationDelay: '90ms', textWrap: 'pretty' }}
          >
            GoodPup turns every boarding stay into a schedule of care tasks, grouped by dog. Built
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

        {/* Live product surface — the app's real TaskCard, not a screenshot,
            so it stays accurate and stays interactive — inside a phone
            mockup so it reads as "the app," not a floating card. */}
        <div className="rise-in justify-self-center w-full max-w-[360px]" style={{ animationDelay: '260ms' }}>
          <PhoneFrame>
            <div className="px-4 pt-4 pb-4">
              <p className="font-outfit font-bold text-[28px] leading-none text-cobalt tracking-tight">
                Today
              </p>
              <p className="font-dm text-[13px] text-text-secondary mt-1.5">
                {remaining === 0 ? 'All caught up — good work.' : `${remaining} left across 2 dogs`}
              </p>
            </div>
            <div className="px-4 pb-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onDone={markDone} onUndo={markUndone} />
              ))}
            </div>
          </PhoneFrame>
          <p className="font-dm text-[13px] text-text-muted text-center mt-4">
            Go ahead — tap a <span className="font-bold text-text-secondary">Done</span> button.
          </p>
        </div>
      </section>

      {/* ── How it works: a real sequence, with a mockup that walks it ──── */}
      <section className="border-t border-border-faint">
        <div className="mx-auto max-w-[1100px] px-6 py-20">
          <div className="max-w-[640px]">
            <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral">
              How it works
            </p>
            <h2 className="font-outfit font-bold text-cobalt text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-[-0.02em] mt-2">
              From “can you take him this weekend?” to a checklist
            </h2>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-16 mt-12 items-center">
            <ol className="flex flex-col gap-1.5">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(i)}
                    aria-current={i === activeStep}
                    className={`w-full flex items-start gap-4 text-left rounded-[18px] px-4 py-4 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral ${
                      i === activeStep ? 'bg-card' : 'hover:bg-card/60'
                    }`}
                  >
                    {/* Cobalt marks "which step you're on," the same job it
                        does for the active bottom-nav tab in the app —
                        wayfinding, not action, so it stays off-limits to Ember. */}
                    <span
                      className={`relative shrink-0 size-8 rounded-full font-outfit font-bold text-[14px] flex items-center justify-center transition-colors duration-300 ${
                        i === activeStep
                          ? 'bg-cobalt text-white'
                          : 'bg-white border border-border-light text-text-muted'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span
                        className={`block font-outfit font-bold text-[19px] leading-tight transition-colors duration-300 ${
                          i === activeStep ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {step.title}
                      </span>
                      <span
                        className={`block font-dm text-[15px] leading-relaxed mt-1.5 max-w-[40ch] transition-colors duration-300 ${
                          i === activeStep ? 'text-text-secondary' : 'text-text-muted'
                        }`}
                      >
                        {step.body}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="grid justify-self-center w-full max-w-[300px]">
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
      </section>

      {/* ── Calendar sync ─────────────────────────────────────────────────
          Deliberately concrete about what Google access is used for: this
          is the section a Google OAuth reviewer reads, and the one a sitter
          reads before granting calendar permission. */}
      <section id="calendar-sync" className="bg-card border-y border-border-faint scroll-mt-16">
        <div className="mx-auto max-w-[1100px] px-6 py-20">
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
              <h2 className="font-outfit font-bold text-cobalt text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-[-0.02em] mt-5">
                Your bookings come in. Your tasks go out.
              </h2>
              <p className="font-dm text-[16px] text-text-secondary leading-relaxed mt-4 max-w-[46ch]">
                Connecting Google Calendar is optional, and GoodPup asks for exactly what these two
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
                  If you use Rover's calendar sync, GoodPup finds that calendar automatically and
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
                  “GoodPup” that the app creates for you. Your personal calendar is never written
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
                  Disconnect in Settings and GoodPup deletes the access it was given. You can also
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
            className="font-outfit font-bold text-white text-[clamp(1.875rem,5vw,3rem)] leading-[1.05] tracking-[-0.02em] mx-auto max-w-[18ch]"
            style={{ textWrap: 'balance' }}
          >
            Zero missed meals. Zero missed meds.
          </h2>
          <p className="font-dm text-[17px] text-white/90 leading-relaxed mt-5 mx-auto max-w-[48ch]">
            Free to use while GoodPup is finding its feet. Bring your own dogs.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-coral px-7 py-4 font-dm font-bold text-[16px] text-white mt-8 hover:bg-coral-deep transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Open GoodPup
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicPageShell>
  )
}
