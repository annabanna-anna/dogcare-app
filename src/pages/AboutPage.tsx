import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Download, Upload, ShieldCheck } from 'lucide-react'
import PublicPageShell from '../components/PublicPageShell'
import TaskCard from '../components/TaskCard'
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

const STEPS = [
  {
    title: 'Add the dog',
    body: 'Breed, size, owner contact, and the care notes you actually need at 6am — food, meds, behaviour, emergencies.',
  },
  {
    title: 'Start a stay',
    body: 'Pick the dates. Their regular daily schedule comes along with them.',
  },
  {
    title: 'Tasks generate',
    body: 'Every meal, med, and walk for the whole stay, laid out on a timeline and grouped by dog.',
  },
  {
    title: 'Check off as you go',
    body: 'One tap per task, one hand, mid-shift. Skip or reschedule when the day moves.',
  },
]

export default function AboutPage() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks)

  useEffect(() => {
    document.title = 'GoodPup — care tracking for dog sitters and boarders'
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

  const remaining = tasks.filter((t) => t.status !== 'done').length

  return (
    <PublicPageShell>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-6 pt-14 pb-20 sm:pt-24 sm:pb-28 grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:items-center">
        <div>
          {/* Three deliberate short lines rather than a wrapped block — at
              hero sizes the text column is ~530px, and letting these wrap
              produced a one-word orphan on desktop. */}
          <h1 className="rise-in font-outfit font-bold text-text-primary leading-[0.95] tracking-[-0.03em] text-[clamp(2rem,5vw,3.25rem)]">
            <span className="block">Three dogs.</span>
            <span className="block">Nine meals.</span>
            <span className="block text-coral">Two meds. One list.</span>
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
            so it stays accurate and stays interactive. */}
        <div className="rise-in justify-self-center w-full max-w-[400px]" style={{ animationDelay: '260ms' }}>
          <div className="rounded-[34px] border-[3px] border-text-primary bg-cream p-3 shadow-[0_24px_60px_-24px_rgba(20,20,20,0.35)]">
            <div className="rounded-[24px] bg-cream overflow-hidden">
              <div className="px-4 pt-5 pb-4">
                <p className="font-outfit font-bold text-[28px] leading-none text-text-primary tracking-tight">
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
            </div>
          </div>
          <p className="font-dm text-[13px] text-text-muted text-center mt-4">
            Go ahead — tap a <span className="font-bold text-text-secondary">Done</span> button.
          </p>
        </div>
      </section>

      {/* ── How it works: a real sequence, echoing the app's own timeline ── */}
      <section className="border-t border-border-faint">
        <div className="mx-auto max-w-[1100px] px-6 py-20">
          <h2 className="font-outfit font-bold text-text-primary text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-[-0.02em] max-w-[20ch]">
            From “can you take him this weekend?” to a checklist
          </h2>

          <ol className="relative grid gap-9 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 sm:gap-y-10 mt-12">
            {/* The rail behind the step markers, mirroring the timeline
                connector on the app's task list. */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute left-4 right-4 top-[15px] h-0.5 bg-border-faint"
            />
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative flex gap-4 lg:block">
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    // Single-column only: from `sm` up the steps sit in a
                    // grid, where a downward connector would point at the
                    // wrong neighbour and dangle past the last row.
                    className="sm:hidden absolute left-[15px] top-9 -bottom-9 w-0.5 bg-border-faint"
                  />
                )}
                <span className="relative z-10 size-8 shrink-0 rounded-full bg-coral text-white font-outfit font-bold text-[15px] flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="lg:mt-5">
                  <h3 className="font-outfit font-bold text-[19px] text-text-primary leading-tight">
                    {step.title}
                  </h3>
                  <p className="font-dm text-[15px] text-text-secondary leading-relaxed mt-1.5 max-w-[38ch]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
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
              <h2 className="font-outfit font-bold text-text-primary text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-[-0.02em] mt-5">
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
          Ink on coral (6.1:1). White body copy on this coral only reaches
          3.4:1, which fails AA for anything that isn't large text. */}
      <section className="bg-coral">
        <div className="mx-auto max-w-[1100px] px-6 py-20 sm:py-24 text-center">
          <h2
            className="font-outfit font-bold text-text-primary text-[clamp(1.875rem,5vw,3rem)] leading-[1.05] tracking-[-0.02em] mx-auto max-w-[18ch]"
            style={{ textWrap: 'balance' }}
          >
            Zero missed meals. Zero missed meds.
          </h2>
          <p className="font-dm text-[17px] text-text-primary leading-relaxed mt-5 mx-auto max-w-[48ch]">
            Free to use while GoodPup is finding its feet. Bring your own dogs.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-text-primary px-7 py-4 font-dm font-bold text-[16px] text-white mt-8 hover:bg-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            Open GoodPup
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicPageShell>
  )
}
