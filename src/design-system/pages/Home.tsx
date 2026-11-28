import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { Bell, CalendarDays, Clock, Home as HomeIcon, Pill, Search, Utensils } from 'lucide-react'
import { colorTokens, fileCount, primitives } from '../codebase'
import { DocHeader, Prose, Section } from '../ui'
import { COMPONENT_PAGES, NAMES, PHOTOS, at, sampleDog, sampleStay } from './Components'
import Button from '../../components/Button'
import Switch from '../../components/Switch'
import RadioDot from '../../components/RadioDot'
import StatusChip from '../../components/StatusChip'
import TaskCard from '../../components/TaskCard'
import DogCard from '../../components/DogCard'
import DogTabs from '../../components/DogTabs'
import DogPhotoStack from '../../components/DogPhotoStack'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'
import CareNoteSection from '../../components/CareNoteSection'
import LastOutPrompt from '../../components/LastOutPrompt'
import PhoneFrame from '../../components/PhoneFrame'
import DogIcon from '../../components/icons/DogIcon'
import PawPrintFilled from '../../components/icons/PawPrintFilled'
import { LogoLockup, LogoMark, Wordmark } from '../../components/Logo'
import { AddButton, Chips, TextField } from '../../components/DogSetupWizard'
import { TASK_TYPE_STYLE } from '../../components/taskTypeStyle'
import type { TaskType } from '../../types'

// ─── Navigation model (shared with the sidebar) ─────────────────────────────

export const INTRO = [{ id: 'principles', label: 'Principles' }]

export const FOUNDATIONS = [
  { id: 'colors', label: 'Color' },
  { id: 'typography', label: 'Typography' },
  { id: 'shape', label: 'Shape' },
  { id: 'layout', label: 'Layout & depth' },
  { id: 'motion', label: 'Motion' },
  { id: 'icons', label: 'Iconography' },
  { id: 'voice', label: 'Voice & copy' },
]

// ─── Card previews ──────────────────────────────────────────────────────────

/** A real component shown as a thumbnail: scaled, and inert so its buttons
 *  don't steal focus or clicks from the card. */
function Thumb({ children, scale = 1, width }: { children: ReactNode; scale?: number; width?: number }) {
  return (
    <div
      ref={(el) => el?.setAttribute('inert', '')}
      aria-hidden
      className="pointer-events-none select-none origin-center"
      style={{ transform: `scale(${scale})`, width }}
    >
      {children}
    </div>
  )
}

const noop = () => {}

const BLURBS: Record<string, string> = {
  principles: 'Who HeyPup is for and the six ideas behind every screen.',
  colors: 'Primitive ramps, semantic tokens and contrast.',
  typography: 'Outfit for headings, DM Sans for everything else.',
  shape: 'Pills, concentric corners and the Shape Match Rule.',
  layout: 'One phone-width column, flat surfaces, press feedback.',
  motion: 'The paw burst, entrances and everyday transitions.',
  icons: 'Lucide plus three custom glyphs.',
  voice: 'Warm, short and always names the dog.',
  button: 'Ember pills for action; soft red for delete.',
  chips: 'Quick single or multi choices.',
  'add-button': 'Add another row to a list.',
  switch: 'On/off with a check in the knob.',
  radio: 'Pick one, with settings that open in place.',
  'dog-tabs': 'Switch between dogs on one profile.',
  'text-field': 'Single and multiline text.',
  'time-picker': 'A looping wheel in 5-minute steps.',
  status: 'Fixed status pairs and task-type badges.',
  photo: 'One dog or a stacked group.',
  'care-note': 'Care instructions on a profile.',
  'task-card': 'Swipe to done on Today.',
  'dog-card': 'A row on the Dogs list.',
  'last-out': 'Starts the going-out clock.',
  'page-header': 'Cobalt headline over an Ember eyebrow.',
  'bottom-nav': 'Four tabs with a sliding Cobalt pill.',
  'phone-frame': 'Device chrome for marketing mockups.',
}

function TaskThumb({ type, title, hour }: { type: TaskType; title: string; hour: number }) {
  return (
    <TaskCard
      task={{ id: title, stayId: 's', dogId: 'd', dogName: 'Luna', type, title, scheduledTime: at(hour), status: 'pending' }}
      onDone={noop}
      onUndo={noop}
    />
  )
}

const PREVIEWS: Record<string, () => ReactNode> = {
  principles: () => (
    <div className="flex flex-col items-start gap-2">
      {['Built for interruption', 'Group by dog', 'One committed accent'].map((t, i) => (
        <span
          key={t}
          className={`rounded-full px-4 py-2 font-dm font-bold text-[14px] ${i === 2 ? 'bg-coral text-white' : 'bg-white border border-border-light text-text-primary'}`}
          style={{ marginLeft: i * 16 }}
        >
          {t}
        </span>
      ))}
    </div>
  ),
  colors: () => (
    <div className="flex flex-col gap-1.5 w-[220px]">
      {(['ember', 'cobalt', 'green', 'ink'] as const).map((r) => (
        <div key={r} className="flex gap-0.5">
          {Object.values(primitives[r]).map((hex) => (
            <span key={hex} className="flex-1 h-6 first:rounded-l-[6px] last:rounded-r-[6px]" style={{ background: hex }} />
          ))}
        </div>
      ))}
    </div>
  ),
  typography: () => (
    <div className="flex items-end gap-4">
      <span className="font-outfit font-bold text-[64px] leading-none text-cobalt">Aa</span>
      <span className="font-dm font-bold text-[40px] leading-none text-text-primary">Aa</span>
      <span className="font-dm font-bold text-[14px] uppercase tracking-wide text-coral pb-1">Label</span>
    </div>
  ),
  shape: () => (
    <div className="bg-white border border-border-light rounded-[26px] p-3.5 flex items-center gap-3 w-[200px]">
      <span className="size-12 rounded-[12px] bg-[#f3f4f6] flex items-center justify-center text-text-muted">
        <DogIcon size={24} />
      </span>
      <span className="font-mono text-[12px] text-text-secondary leading-snug">26 = 12 + 14</span>
    </div>
  ),
  layout: () => (
    <div className="rounded-[18px] bg-cream border border-border-light p-3 w-[200px]">
      <div className="rounded-[12px] bg-white border border-border-light p-3">
        <div className="rounded-full bg-card px-3 py-2 flex items-center gap-2 text-text-muted">
          <Search size={14} />
          <span className="font-dm text-[12px]">Search dogs</span>
        </div>
      </div>
    </div>
  ),
  motion: () => (
    <div className="relative size-24 flex items-center justify-center">
      <span className="size-12 rounded-full bg-green-vivid text-white flex items-center justify-center">
        <PawPrintFilled size={22} />
      </span>
      {[
        [-36, -28, -20],
        [34, -30, 25],
        [-38, 26, -30],
        [36, 26, 15],
      ].map(([x, y, r], i) => (
        <span key={i} className="absolute text-green-vivid" style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)` }}>
          <PawPrintFilled size={14} />
        </span>
      ))}
    </div>
  ),
  icons: () => (
    <div className="grid grid-cols-4 gap-3 text-text-primary">
      {[HomeIcon, CalendarDays, Clock, Bell, Pill, Search, Utensils].map((I, i) => (
        <I key={i} size={24} />
      ))}
      <DogIcon size={24} />
    </div>
  ),
  voice: () => (
    <div className="max-w-[220px]">
      <p className="font-dm font-bold text-[18px] leading-tight text-text-primary">When was Luna last out?</p>
      <p className="font-dm text-[14px] text-text-secondary mt-1 leading-snug">Any time out counts.</p>
    </div>
  ),

  button: () => (
    <div className="flex gap-2">
      <Button size="sm">Save</Button>
      <Button size="sm" variant="secondary">Cancel</Button>
    </div>
  ),
  chips: () => (
    <Chips
      options={[
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Not sure' },
      ]}
      value="yes"
      onChange={noop}
    />
  ),
  'add-button': () => (
    <div className="w-[220px]">
      <AddButton onClick={noop}>Add another meal</AddButton>
    </div>
  ),
  switch: () => (
    <div className="flex gap-6">
      <Switch checked={false} onChange={noop} />
      <Switch checked onChange={noop} />
    </div>
  ),
  radio: () => (
    <div className="flex flex-col gap-3">
      {['At set times', 'Rough time of day'].map((l, i) => (
        <span key={l} className="flex items-center gap-3">
          <RadioDot selected={i === 0} />
          <span className="font-dm font-bold text-[14px] text-text-primary">{l}</span>
        </span>
      ))}
    </div>
  ),
  'dog-tabs': () => (
    <Thumb width={260}>
      <DogTabs dogs={NAMES.slice(0, 2).map((n, i) => ({ key: n, name: n, photoUrl: PHOTOS[i] }))} value="Luna" onChange={noop} />
    </Thumb>
  ),
  'text-field': () => (
    <div className="w-[220px]">
      <TextField value="" onChange={noop} placeholder="e.g. Half a pill in cheese" />
    </div>
  ),
  'time-picker': () => (
    <div className="flex items-center font-dm font-bold text-text-primary">
      {['7', '30', 'am'].map((v, i) => (
        <span key={v} className="flex items-center">
          {i === 1 && <span className="text-[22px] px-1">:</span>}
          <span className="rounded-[12px] bg-[#f3f4f6] px-3 py-2 text-[22px] tabular-nums">{v}</span>
          {i === 1 && <span className="w-2" />}
        </span>
      ))}
    </div>
  ),
  status: () => (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {(Object.keys(TASK_TYPE_STYLE) as TaskType[]).map((t) => {
          const { icon: I, bg } = TASK_TYPE_STYLE[t]
          return (
            <span key={t} className={`size-8 rounded-full flex items-center justify-center text-white ${bg}`}>
              <I size={16} />
            </span>
          )
        })}
      </div>
      <div className="flex gap-2">
        <StatusChip status="done" />
        <StatusChip status="overdue" />
      </div>
    </div>
  ),
  photo: () => (
    <div className="flex gap-4 items-center">
      <DogPhotoStack dogs={[{ name: 'Luna', photoUrl: PHOTOS[0] }]} size={64} radius={12} stackRadius={12} ringClassName="ring-cream" />
      <DogPhotoStack dogs={NAMES.map((n, i) => ({ name: n, photoUrl: PHOTOS[i] }))} size={64} radius={12} stackRadius={12} ringClassName="ring-cream" />
      <DogPhotoStack dogs={[{ name: 'Rex' }]} size={64} radius={12} stackRadius={12} ringClassName="ring-cream" />
    </div>
  ),
  'care-note': () => (
    <Thumb width={300} scale={0.8}>
      <CareNoteSection title="Food" icon={<Utensils size={16} />} content="Two scoops at 7am and 6pm." />
    </Thumb>
  ),
  'task-card': () => (
    <Thumb width={340} scale={0.76}>
      <div className="px-4 pt-5">
        <TaskThumb type="walk" title="Morning walk" hour={23} />
      </div>
    </Thumb>
  ),
  'dog-card': () => (
    <Thumb width={340} scale={0.76}>
      <MemoryRouter>
        <DogCard dog={sampleDog(1, true, 'Maya Chen')} nextStay={sampleStay('active')} />
      </MemoryRouter>
    </Thumb>
  ),
  'last-out': () => (
    <Thumb width={340} scale={0.66}>
      <LastOutPrompt dogName="Luna" onJustNow={noop} onPickTime={noop} />
    </Thumb>
  ),
  'page-header': () => (
    <Thumb width={300} scale={0.8}>
      <MemoryRouter>
        <PageHeader title="Dogs" subtitle="4 profiles" />
      </MemoryRouter>
    </Thumb>
  ),
  'bottom-nav': () => (
    <Thumb width={360} scale={0.7}>
      {/* The transform makes this box the containing block for the fixed nav. */}
      <div className="relative h-[84px]" style={{ transform: 'translateZ(0)' }}>
        <MemoryRouter initialEntries={['/dogs']}>
          <BottomNav />
        </MemoryRouter>
      </div>
    </Thumb>
  ),
  'phone-frame': () => (
    <Thumb width={200} scale={0.6}>
      <div className="h-[300px]">
        <PhoneFrame>
          <div className="px-6 pt-6">
            <p className="font-dm font-bold text-[12px] text-coral uppercase tracking-wide">Tuesday</p>
            <p className="font-outfit font-bold text-[40px] leading-none text-cobalt">Today</p>
          </div>
        </PhoneFrame>
      </div>
    </Thumb>
  ),
}

// ─── Home ───────────────────────────────────────────────────────────────────

function Card({ id, label }: { id: string; label: string }) {
  const Preview = PREVIEWS[id]
  return (
    <a
      href={`#/${id}`}
      // Concentric: 22px card = 14px preview + 8px padding.
      className="group flex flex-col rounded-[22px] border border-border-light bg-white p-2 active:scale-[0.98] transition-transform hover:border-text-primary"
    >
      <span className="h-40 rounded-[14px] bg-cream overflow-hidden flex items-center justify-center">
        {Preview && <Preview />}
      </span>
      <span className="px-3 pt-3 pb-2">
        <span className="block font-outfit font-semibold text-[18px] leading-tight text-text-primary">{label}</span>
        {BLURBS[id] && <span className="block font-dm text-[14px] text-text-secondary mt-1 leading-snug">{BLURBS[id]}</span>}
      </span>
    </a>
  )
}

function CardGrid({ items }: { items: { id: string; label: string }[] }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((i) => (
        <Card key={i.id} {...i} />
      ))}
    </div>
  )
}

export function HomePage() {
  const groups = [...new Set(COMPONENT_PAGES.map((c) => c.group))]
  return (
    <>
      <header className="mb-14 grid md:grid-cols-[1fr_220px] gap-6 items-center">
        <div>
          <p className="font-dm font-bold text-[14px] text-coral uppercase tracking-wide mb-2">HeyPup design system</p>
          <h1 className="font-outfit font-bold text-[48px] sm:text-[56px] leading-none tracking-[-0.02em] text-cobalt">
            The Good Boy Standard
          </h1>
          <p className="mt-4 max-w-[56ch] font-dm text-[16px] leading-relaxed text-text-secondary">
            Bold and playful, but never at the cost of being fast and legible for someone mid-shift, one-handed. Every
            token, count and component here is read from the app’s code, so if something looks wrong, the code is what
            to change.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              [Object.keys(primitives).length, 'color ramps'],
              [Object.keys(colorTokens).length, 'semantic tokens'],
              [COMPONENT_PAGES.length, 'components'],
              [fileCount, 'files scanned'],
            ].map(([n, l]) => (
              <span key={l} className="rounded-full bg-card px-4 py-2 font-dm text-[14px] text-text-secondary">
                <strong className="font-bold text-text-primary tabular-nums">{n}</strong> {l}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <DotLottieReact src="/splash.lottie" loop autoplay style={{ width: 220, height: 220 }} />
        </div>
      </header>

      <Section title="Introduction">
        <CardGrid items={INTRO} />
      </Section>
      <Section title="Foundations">
        <CardGrid items={FOUNDATIONS} />
      </Section>
      {groups.map((g) => (
        <Section key={g} title={g}>
          <CardGrid items={COMPONENT_PAGES.filter((c) => c.group === g)} />
        </Section>
      ))}
    </>
  )
}

// ─── Principles ─────────────────────────────────────────────────────────────

export function PrinciplesPage() {
  return (
    <>
      <DocHeader eyebrow="Introduction" title="Principles">
        HeyPup is a task tracker for dog sitters. These are the ideas every screen is checked against.
      </DocHeader>

      <Section title="Who it’s for">
        <Prose>
          <p>
            Professional and side-gig dog sitters caring for several clients’ dogs at once. They use the app in short,
            interrupted bursts — between feedings, walks and meds, standing in a yard with a leash in one hand. Success
            is zero missed feedings or meds and a status update in a couple of taps.
          </p>
        </Prose>
      </Section>

      <Section title="Six principles">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ['Built for interruption', 'Every core screen is glance-and-tap, not a sit-down session.'],
            ['Group by dog', 'The mental model is “what does Barkley need,” not “what feedings are due.”'],
            ['One committed accent', 'Ember carries action and status. If it’s coral, it’s important.'],
            ['Motion earns its keep', 'The mascot and paw burst are the signature moments. Everything else is quiet.'],
            ['Practical warmth', 'Pills and paw prints, but copy that respects a medication schedule.'],
            ['Flat by default', 'Depth comes from stepping the surface color and press feedback, never shadows.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-[16px] border border-border-light bg-white p-5">
              <p className="font-outfit font-bold text-[18px] text-text-primary">{t}</p>
              <p className="font-dm text-[14px] text-text-secondary mt-1 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Never">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ['Beige and cream', 'The original palette read as generic and AI-built. The base is Studio White.'],
            ['SaaS dashboard chrome', 'Cold blues, dense tables — wrong register for a hands-on job.'],
            ['Cartoon kitsch', 'Mascot dominating screens, baby-talk copy. The mascot is an accent.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-[16px] bg-[#fee2e2]/50 p-5">
              <p className="font-dm font-bold text-[16px] text-[#b91c1c]">{t}</p>
              <p className="font-dm text-[14px] text-text-primary mt-1 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Logo">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] bg-cream border border-border-light flex items-center justify-center px-6 py-12 md:col-span-2">
            <LogoLockup size={72} />
          </div>
          <div className="rounded-[22px] bg-text-primary flex items-center justify-center px-6 py-10">
            <LogoLockup size={48} tone="dark" />
          </div>
          <div className="rounded-[22px] bg-card flex items-end justify-center gap-6 px-6 py-10">
            {[96, 64, 40, 24, 16].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <LogoMark size={s} title={s === 96 ? 'HeyPup app icon' : undefined} />
                <span className="font-dm text-[12px] text-text-muted tabular-nums">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Lockup', 'Icon + wordmark. Public site header and footer. On dark backgrounds “Hey” turns white; “Pup” stays coral.', '<LogoLockup size={36} />'],
            ['Icon', 'The raised paw saying “hey”. App icon, favicon, design-system sidebar. Always on its coral tile.', '<LogoMark size={40} />'],
            ['Wordmark', 'Outlined lettering, no font needed. Splash screen. Never retype “HeyPup” in a font to fake it.', '<Wordmark height={48} />'],
          ].map(([t, d, c]) => (
            <div key={t} className="rounded-[16px] bg-card p-5">
              <p className="font-dm font-bold text-[16px] text-text-primary">{t}</p>
              <p className="font-dm text-[14px] text-text-secondary mt-1 leading-relaxed">{d}</p>
              <code className="block mt-3 font-mono text-[12px] text-cobalt">{c}</code>
            </div>
          ))}
        </div>
        <p className="font-dm text-[14px] text-text-muted mt-3">
          Source: Figma “HeyPup” › 🎨 Brand › ✅ FINAL. Code: src/components/Logo.tsx. Static files in public/: favicon.svg,
          logo.svg, logo-wordmark.svg, icon-192/512.png, icon-maskable-512.png, apple-touch-icon.png, badge-96.png.
        </p>
      </Section>

      <Section title="Brand moment">
        <div className="rounded-[22px] bg-cream border border-border-light flex flex-col items-center py-10 gap-4">
          <DotLottieReact src="/splash.lottie" loop autoplay style={{ width: 200, height: 200 }} />
          <Wordmark height={48} />
          <p className="font-dm font-bold text-[14px] text-coral uppercase tracking-widest">fetching your day…</p>
        </div>
        <p className="font-dm text-[14px] text-text-muted mt-3">
          The Lottie dog (public/splash.lottie) is reserved for loading and empty states: 150–260px on splash and auth,
          140px in empty states. Animation by Waris ahmed on LottieFiles.
        </p>
      </Section>
    </>
  )
}
