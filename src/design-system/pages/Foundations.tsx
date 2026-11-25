import { useState } from 'react'
import { icons as lucide } from 'lucide-react'
import {
  fontFamilyUsage,
  fontSizes,
  fontTokens,
  fontWeights,
  keyframes,
  lucideIcons,
  radii,
} from '../codebase'
import { CodeBlock, CopyButton, DocHeader, DoDont, Prose, Rule, Section, UsageList } from '../ui'
import Button from '../../components/Button'
import DogIcon from '../../components/icons/DogIcon'
import DogBowlIcon from '../../components/icons/DogBowlIcon'
import PawPrintFilled from '../../components/icons/PawPrintFilled'

// ─── Typography ─────────────────────────────────────────────────────────────

const TYPE_ROLES = [
  { name: 'Display', cls: 'font-outfit font-bold text-[56px] leading-none tracking-[-0.02em] text-cobalt', sample: 'Today', use: 'The one “Today” heading. One per app.' },
  { name: 'Headline', cls: 'font-outfit font-bold text-[40px] leading-none text-cobalt', sample: 'Dogs', use: 'PageHeader title on secondary screens, always over an Ember eyebrow.' },
  { name: 'Title', cls: 'font-outfit font-semibold text-[18px] leading-tight text-text-primary', sample: 'Barkley & Momo', use: 'Dog card names, card and empty-state titles (18–22px).' },
  { name: 'Body strong', cls: 'font-dm font-bold text-[16px] leading-tight text-text-primary', sample: 'When was Luna last out?', use: 'Task titles, prompts, option labels.' },
  { name: 'Body', cls: 'font-dm text-[14px] leading-relaxed text-text-primary', sample: 'Two scoops at 7am, soaked for ten minutes. Hides kibble under the couch.', use: 'Notes and descriptive copy. Kept short — this app is scanned, not read.' },
  { name: 'Caption', cls: 'font-dm text-[12px] leading-tight text-text-secondary', sample: 'Golden Retriever · Large', use: 'Secondary lines under a title.' },
  { name: 'Label', cls: 'font-dm font-bold text-[12px] uppercase tracking-wide text-coral', sample: 'Saturday, July 4', use: 'Eyebrows and status metadata. Always bold, always uppercase.' },
]

export function TypographyPage() {
  const [sample, setSample] = useState('')
  const [family, setFamily] = useState<'outfit' | 'dm'>('outfit')
  const [size, setSize] = useState(40)
  const [weight, setWeight] = useState(700)
  const maxCount = Math.max(...fontSizes.map((f) => f.usage.count))

  return (
    <>
      <DocHeader eyebrow="Foundations" title="Typography">
        Two families: Outfit gives headings their gravity, DM Sans does the work everywhere else. Numbers that stand
        on their own (times, counts, doses) are always DM Sans.
      </DocHeader>

      <Section title="Families">
        <div className="grid sm:grid-cols-2 gap-4">
          {fontFamilyUsage.map(({ key, usage }) => (
            <div key={key} className="rounded-[22px] border border-border-light bg-white p-6">
              <p className={`font-${key} font-bold text-[64px] leading-none text-text-primary`}>Aa</p>
              <p className="font-dm font-bold text-[16px] text-text-primary mt-4">{fontTokens[key][0].replace(/"/g, '')}</p>
              <p className="font-mono text-[12px] text-text-muted">font-{key} · used {usage.count}×</p>
              <p className={`font-${key} text-[16px] text-text-secondary mt-3 leading-relaxed`}>
                ABCDEFGHIJKLM nopqrstuvwxyz 0123456789 · 7:30 AM · 2 of 5 done
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Roles">
        <div className="rounded-[22px] border border-border-light bg-white divide-y divide-border-faint">
          {TYPE_ROLES.map((r) => (
            <div key={r.name} className="p-5 grid md:grid-cols-[160px_1fr] gap-3 items-start">
              <div>
                <p className="font-dm font-bold text-[14px] text-text-primary">{r.name}</p>
                <p className="font-dm text-[12px] text-text-muted leading-snug mt-1">{r.use}</p>
              </div>
              <div className="min-w-0 space-y-2">
                <p className={`${r.cls} break-words`}>{sample || r.sample}</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[12px] text-text-muted break-all">{r.cls}</code>
                  <CopyButton text={r.cls} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <label className="block mt-4">
          <span className="block font-dm font-bold text-[12px] text-text-secondary mb-1.5">Try your own text in every role</span>
          <input
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            placeholder="e.g. Poppy’s evening meds"
            className="w-full max-w-md bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[16px] focus:outline-none focus:border-coral"
          />
        </label>
      </Section>

      <Section title="Type tester">
        <div className="rounded-[22px] border border-border-light bg-white p-5 space-y-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex gap-1.5" role="radiogroup" aria-label="Family">
              {(['outfit', 'dm'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={family === f}
                  onClick={() => setFamily(f)}
                  className={`rounded-full px-4 py-2 font-dm font-bold text-[14px] ${
                    family === f ? 'bg-coral text-white' : 'bg-white border border-border-light text-text-primary'
                  }`}
                >
                  {f === 'outfit' ? 'Outfit' : 'DM Sans'}
                </button>
              ))}
            </div>
            <label className="flex-1 min-w-[160px]">
              <span className="flex justify-between font-dm font-bold text-[12px] text-text-secondary mb-1">
                Size <span className="text-text-primary tabular-nums">{size}px</span>
              </span>
              <input type="range" min={10} max={72} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[#ff4514]" />
            </label>
            <label className="flex-1 min-w-[160px]">
              <span className="flex justify-between font-dm font-bold text-[12px] text-text-secondary mb-1">
                Weight <span className="text-text-primary tabular-nums">{weight}</span>
              </span>
              <input type="range" min={400} max={700} step={100} value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-full accent-[#ff4514]" />
            </label>
          </div>
          <p
            contentEditable
            suppressContentEditableWarning
            className="outline-none text-text-primary leading-tight break-words"
            style={{ fontFamily: family === 'outfit' ? 'Outfit' : '"DM Sans"', fontSize: size, fontWeight: weight }}
          >
            Barkley’s 8:00 AM walk
          </p>
          <code className="block font-mono text-[12px] text-text-muted">
            font-{family} text-[{size}px] font-{({ 400: 'normal', 500: 'medium', 600: 'semibold', 700: 'bold' } as Record<number, string>)[weight]}
          </code>
        </div>
      </Section>

      <Section title="Sizes actually in use" aside={<span className="font-dm text-[14px] text-text-muted">{fontSizes.length} distinct sizes</span>}>
        <Prose>
          <p>
            Every <code className="font-mono">text-[Npx]</code> in the code, largest first. Long bars are the real scale;
            one-offs are worth questioning. Odd sizes break the Even Sizes Rule and are marked in red.
          </p>
        </Prose>
        <div className="mt-4 rounded-[16px] border border-border-light bg-white p-4 space-y-1.5">
          {fontSizes.map((f) => (
            <details key={f.value}>
              <summary className="flex items-center gap-3 cursor-pointer list-none">
                <span
                  className={`w-12 font-mono text-[12px] text-right tabular-nums ${
                    Number(f.value) % 2 ? 'text-[#b91c1c] font-bold' : 'text-text-secondary'
                  }`}
                >
                  {f.value}px
                </span>
                <span className="flex-1 h-5 bg-card rounded-full overflow-hidden">
                  <span
                    className={`block h-full rounded-full ${f.usage.count <= 2 ? 'bg-[#f4c3b0]' : 'bg-coral'}`}
                    style={{ width: `${Math.max(3, (f.usage.count / maxCount) * 100)}%` }}
                  />
                </span>
                <span className="w-10 font-dm font-bold text-[12px] text-text-primary tabular-nums">{f.usage.count}</span>
              </summary>
              <div className="pl-16 pr-12 py-2">
                <UsageList usage={f.usage} />
              </div>
            </details>
          ))}
        </div>
      </Section>

      <Section title="Weights in use">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {fontWeights.map((w) => (
            <div key={w.key} className="rounded-[16px] border border-border-light bg-white p-4">
              <p className="font-dm text-[28px] leading-none text-text-primary" style={{ fontWeight: ({ normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 } as Record<string, number>)[w.key] }}>Ag</p>
              <p className="font-mono text-[12px] text-text-muted mt-2">font-{w.key}</p>
              <p className="font-dm font-bold text-[14px] text-text-primary">{w.usage.count}×</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid sm:grid-cols-2 gap-4">
        <Rule name="The Numbers Rule">
          Standalone numerals — task times, progress counts, dates in list rows — are always DM Sans. A number inside a
          heading inherits the heading’s Outfit.
        </Rule>
        <Rule name="The Eyebrow Restraint Rule">
          Uppercase tracked labels are for real section headers and status metadata, never decorative kickers above every block.
        </Rule>
      </div>
    </>
  )
}

// ─── Shape ──────────────────────────────────────────────────────────────────

export function ShapePage() {
  const [inner, setInner] = useState(12)
  const [pad, setPad] = useState(14)
  const outer = inner + pad
  const maxCount = Math.max(...radii.map((r) => r.usage.count))

  return (
    <>
      <DocHeader eyebrow="Foundations" title="Shape">
        Pills wherever a finger lands. Rounded cards whose corners nest concentrically, so a photo always looks like it
        belongs to the shape around it.
      </DocHeader>

      <div className="mb-10">
        <Rule name="The Shape Match Rule">
          A dog photo takes the shape of its container. Inside a pill, it’s a circle. Inside a card, corners are
          concentric: <strong>photo radius = container radius − padding</strong>. When the inner radius is fixed, grow the
          container: container radius = inner radius + padding.
        </Rule>
      </div>

      <Section title="Concentric radius calculator">
        <div className="rounded-[22px] border border-border-light bg-white p-5 grid md:grid-cols-[1fr_260px] gap-6 items-center">
          <div className="flex justify-center py-6 bg-cream rounded-[16px]">
            <div
              className="bg-white border border-border-light flex items-center gap-4 w-full max-w-[320px] transition-all"
              style={{ borderRadius: outer, padding: pad }}
            >
              <div className="size-16 shrink-0 bg-[#f3f4f6] flex items-center justify-center text-text-muted transition-all" style={{ borderRadius: inner }}>
                <DogIcon size={30} />
              </div>
              <div className="min-w-0">
                <p className="font-outfit font-semibold text-[18px] text-text-primary leading-tight">Barkley</p>
                <p className="font-dm text-[12px] text-text-secondary">Golden Retriever</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[
              ['Photo radius', inner, setInner, 0, 32],
              ['Padding', pad, setPad, 4, 24],
            ].map(([l, v, s, min, max]) => (
              <label key={l as string} className="block">
                <span className="flex justify-between font-dm font-bold text-[12px] text-text-secondary mb-1">
                  {l as string} <span className="text-text-primary tabular-nums">{v as number}px</span>
                </span>
                <input
                  type="range"
                  min={min as number}
                  max={max as number}
                  value={v as number}
                  onChange={(e) => (s as (n: number) => void)(+e.target.value)}
                  className="w-full accent-[#ff4514]"
                />
              </label>
            ))}
            <div className="rounded-[12px] bg-card px-4 py-3">
              <p className="font-dm text-[14px] text-text-secondary">Card radius</p>
              <p className="font-outfit font-bold text-[28px] text-coral leading-none mt-1 tabular-nums">{outer}px</p>
              <code className="block font-mono text-[12px] text-text-muted mt-2">
                rounded-[{outer}px] p-[{pad}px] → photo rounded-[{inner}px]
              </code>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Photos in pills">
        <DoDont
          good={{
            text: 'Inside a pill, the photo is a circle.',
            visual: (
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light pl-1 pr-4 py-1">
                <span className="size-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-text-muted">
                  <DogIcon size={18} />
                </span>
                <span className="font-dm font-bold text-[14px]">Luna</span>
              </span>
            ),
          }}
          bad={{
            text: 'Never a rounded-square photo inside a pill.',
            visual: (
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border-light pl-1 pr-4 py-1">
                <span className="size-8 rounded-[8px] bg-[#f3f4f6] flex items-center justify-center text-text-muted">
                  <DogIcon size={18} />
                </span>
                <span className="font-dm font-bold text-[14px]">Luna</span>
              </span>
            ),
          }}
        />
      </Section>

      <Section title="Radii in use">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {radii.slice(0, 16).map((r) => {
            const px = r.value.match(/\d+/)?.[0]
            const css = px ? `${px}px` : r.value === 'full' ? '9999px' : { none: '0', sm: '2px', md: '6px', lg: '8px', xl: '12px', '2xl': '16px', '3xl': '24px' }[r.value]
            return (
              <div key={r.value} className="rounded-[16px] border border-border-light bg-white p-4 flex flex-col items-center gap-3">
                <span className="w-20 h-14 bg-coral-soft border-2 border-coral" style={{ borderRadius: css }} />
                <span className="font-mono text-[12px] text-text-primary">rounded-{r.value}</span>
                <span className="w-full h-1.5 bg-card rounded-full overflow-hidden">
                  <span className="block h-full bg-coral rounded-full" style={{ width: `${(r.usage.count / maxCount) * 100}%` }} />
                </span>
                <span className="font-dm text-[12px] text-text-muted">{r.usage.count}× in code</span>
              </div>
            )
          })}
        </div>
      </Section>
    </>
  )
}

// ─── Layout & elevation ─────────────────────────────────────────────────────

export function LayoutPage() {
  const [pressed, setPressed] = useState(false)
  return (
    <>
      <DocHeader eyebrow="Foundations" title="Layout & depth">
        A single phone-width column, flat color-blocked surfaces, and press feedback instead of shadows.
      </DocHeader>

      <Section title="Frame">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ['430px', 'Max app width', 'The app is a mobile frame; #root caps at 430px and centers.'],
            ['24px', 'Page gutter', 'px-6 on page content and headers.'],
            ['44px', 'Minimum tap target', 'Switch and icon buttons pad out to 44px for one-handed use.'],
          ].map(([v, l, d]) => (
            <div key={l} className="rounded-[22px] bg-card p-5">
              <p className="font-outfit font-bold text-[36px] leading-none text-coral">{v}</p>
              <p className="font-dm font-bold text-[14px] text-text-primary mt-2">{l}</p>
              <p className="font-dm text-[14px] text-text-secondary mt-1 leading-snug">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div className="rounded-[22px] border border-border-light bg-white p-5 space-y-3">
          {[
            [4, 'xs', 'gap-1 · icon to label'],
            [8, 'sm', 'gap-2 · chips, inline groups'],
            [16, 'md', 'p-4 · card padding'],
            [24, 'lg', 'px-6 · page gutter'],
          ].map(([px, n, d]) => (
            <div key={n} className="flex items-center gap-4">
              <span className="w-10 font-mono text-[12px] text-text-secondary">{n}</span>
              <span className="h-5 bg-coral rounded-[4px]" style={{ width: (px as number) * 4 }} />
              <span className="font-dm font-bold text-[14px] text-text-primary tabular-nums">{px}px</span>
              <span className="font-dm text-[14px] text-text-muted hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Surfaces step, they don’t lift">
        <div className="rounded-[22px] bg-cream border border-border-light p-6">
          <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-text-secondary mb-3">Studio White · page</p>
          <div className="rounded-[22px] bg-white border border-border-light p-5">
            <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-text-secondary mb-3">White · content block</p>
            <div className="rounded-full bg-card px-5 py-3 font-dm text-[14px] text-text-secondary">Card · search pill, nav, tab track</div>
          </div>
        </div>
        <div className="mt-4">
          <Rule name="The Flat Rule">
            No element uses a drop shadow. If a layer needs more separation, step its background color, don’t lift it.
          </Rule>
        </div>
      </Section>

      <Section title="Press feedback">
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            className="w-64 rounded-[26px] border border-border-light bg-cream p-4 text-left active:scale-[0.98] transition-transform"
          >
            <span className="font-outfit font-semibold text-[18px] text-text-primary">Press and hold me</span>
            <span className="block font-dm text-[12px] text-text-secondary">active:scale-[0.98]</span>
          </button>
          <span className="font-dm text-[14px] text-text-secondary">{pressed ? 'Pressed — that’s the whole effect.' : 'No hover states: this is touch-first.'}</span>
        </div>
      </Section>
    </>
  )
}

// ─── Motion ─────────────────────────────────────────────────────────────────

const MOTION_DEMOS: Record<string, { cls: string; note: string }> = {
  'rise-in': { cls: 'rise-in', note: 'Landing hero entrance. Visible by default if motion is reduced.' },
  'pop-in': { cls: 'pop-in-target pop-in', note: 'Scroll-triggered entrance on the marketing page.' },
  'toast-in': { cls: 'toast-in', note: 'Toast arrives from above.' },
  'toast-out': { cls: 'toast-out', note: 'Toast leaves upward.' },
  'swipe-reveal': { cls: 'swipe-reveal', note: 'Marketing demo of a committed task swipe.' },
  'swipe-fill-in': { cls: 'swipe-fill', note: 'The green fill behind a committed swipe.' },
}

export function MotionPage() {
  const [run, setRun] = useState(0)
  return (
    <>
      <DocHeader eyebrow="Foundations" title="Motion">
        Motion earns its keep. The mascot and the paw-burst are the signature moments; everyday state changes are a quick
        color or transform transition. Every animation has a <code className="font-mono text-[14px]">prefers-reduced-motion</code> fallback.
      </DocHeader>

      <Section title="Signature: paw burst" aside={<Button size="sm" onClick={() => setRun((r) => r + 1)}>Replay all</Button>}>
        <div className="rounded-[22px] border border-border-light bg-cream h-48 flex items-center justify-center relative overflow-hidden">
          <span className="size-12 rounded-full bg-green-vivid flex items-center justify-center text-white relative z-10">
            <PawPrintFilled size={22} />
          </span>
          {[
            [-60, -40, -20],
            [55, -45, 25],
            [-70, 30, -35],
            [65, 35, 15],
            [0, -70, 0],
          ].map(([tx, ty, rot], i) => (
            <span
              key={`${run}-${i}`}
              className="paw-burst absolute text-green-vivid"
              style={{ ['--tx' as string]: `${tx}px`, ['--ty' as string]: `${ty}px`, ['--rot' as string]: `${rot}deg`, animationDelay: `${i * 40}ms` }}
            >
              <PawPrintFilled size={16} />
            </span>
          ))}
        </div>
        <p className="font-dm text-[14px] text-text-muted mt-2">Paws pop out of the check badge when a swipe commits a task to Done.</p>
      </Section>

      <Section title="All keyframes in index.css">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyframes
            .filter((k) => k.name !== 'paw-burst')
            .map((k) => {
              const demo = MOTION_DEMOS[k.name]
              return (
                <div key={k.name} className="rounded-[16px] border border-border-light bg-white overflow-hidden">
                  <div className="h-28 bg-cream relative overflow-hidden flex items-center justify-center">
                    {demo && (
                      <div
                        key={run}
                        className={`${demo.cls} ${k.name.startsWith('toast') ? 'absolute left-1/2 top-6' : ''} ${k.name.startsWith('swipe') ? 'absolute inset-y-6 left-6 right-6' : ''}`}
                      >
                        {k.name.startsWith('swipe') ? (
                          <div className={`size-full rounded-[10px] ${k.name === 'swipe-fill-in' ? 'bg-[#166534]' : 'bg-white border border-border-light'}`} />
                        ) : k.name.startsWith('toast') ? (
                          <div className="rounded-full bg-text-primary text-white font-dm font-bold text-[14px] px-4 py-2 whitespace-nowrap">Walk logged</div>
                        ) : (
                          <div className="rounded-[16px] bg-coral text-white font-dm font-bold text-[14px] px-5 py-3">Hello</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-mono font-bold text-[14px] text-text-primary">{k.name}</p>
                    {k.rule && <p className="font-mono text-[12px] text-text-muted mt-1 break-words">{k.rule}</p>}
                    {demo && <p className="font-dm text-[14px] text-text-secondary mt-2 leading-snug">{demo.note}</p>}
                  </div>
                </div>
              )
            })}
        </div>
      </Section>

      <Section title="Everyday transitions">
        <CodeBlock
          title="Conventions"
          code={`transition-all duration-100        // buttons
transition-transform active:scale-[0.98]  // tappable cards
transition-colors duration-200      // switches, chips
transition-all duration-300 ease-out // sliding pills (BottomNav, DogTabs)`}
        />
      </Section>
    </>
  )
}

// ─── Icons ──────────────────────────────────────────────────────────────────

export function IconsPage() {
  const [q, setQ] = useState('')
  const custom = [
    { name: 'DogIcon', C: DogIcon, note: 'Photo-less avatar glyph' },
    { name: 'DogBowlIcon', C: DogBowlIcon, note: 'Meal task' },
    { name: 'PawPrintFilled', C: PawPrintFilled, note: 'Paw burst' },
  ]
  const list = lucideIcons.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <DocHeader eyebrow="Foundations" title="Iconography">
        Lucide for the everyday set, plus three custom glyphs drawn to match its 2px rounded stroke. This list is every
        icon actually imported in the app.
      </DocHeader>

      <Section title="Custom glyphs">
        <div className="grid grid-cols-3 gap-3">
          {custom.map(({ name, C, note }) => (
            <div key={name} className="rounded-[16px] border border-border-light bg-white p-5 flex flex-col items-center gap-2">
              <C size={32} className="text-text-primary" />
              <span className="font-mono text-[12px] text-text-primary">{name}</span>
              <span className="font-dm text-[12px] text-text-muted text-center">{note}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Rule name="The Avatar Rule">
            Photo-less dog avatars are a neutral light gray block with the DogIcon face in Ink Muted — never the paw, never a color.
          </Rule>
        </div>
      </Section>

      <Section title={`Lucide in use (${lucideIcons.length})`}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search icons"
          className="w-full max-w-sm mb-4 bg-card rounded-full px-5 py-3 font-dm text-[16px] focus:outline-none focus:ring-2 focus:ring-coral"
        />
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
          {list.map(({ name, files }) => {
            const Icon = lucide[name as keyof typeof lucide]
            return (
              <button
                key={name}
                type="button"
                title={files.join('\n')}
                onClick={() => void navigator.clipboard?.writeText(`<${name} size={20} />`)}
                className="rounded-[16px] border border-border-light bg-white p-3 flex flex-col items-center gap-2 active:scale-[0.97] transition-transform"
              >
                {Icon ? <Icon size={22} className="text-text-primary" /> : <span className="size-[22px]" />}
                <span className="font-mono text-[10px] text-text-secondary truncate max-w-full">{name}</span>
                <span className="font-dm text-[10px] text-text-muted">{files.length} file{files.length > 1 ? 's' : ''}</span>
              </button>
            )
          })}
        </div>
        <p className="font-dm text-[14px] text-text-muted mt-3">Click an icon to copy its JSX. Hover to see which files use it.</p>
      </Section>
    </>
  )
}

// ─── Voice ──────────────────────────────────────────────────────────────────

export function VoicePage() {
  return (
    <>
      <DocHeader eyebrow="Foundations" title="Voice & copy">
        Warm and a little affectionate, never cutesy. Copy is read at a glance by someone holding a leash, so it’s short,
        concrete and names the dog.
      </DocHeader>

      <Section title="In the app today">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ['Splash', 'fetching your day…'],
            ['Prompt', 'When was Luna last out?'],
            ['Helper', 'Walk, potty break or drop-off — any time out counts.'],
            ['Scoped task', 'Artemis only'],
            ['Stay tag', 'Until Nov 18'],
            ['Empty field', 'No notes added.'],
          ].map(([l, t]) => (
            <div key={l} className="rounded-[16px] border border-border-light bg-white p-5">
              <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-text-secondary">{l}</p>
              <p className="font-dm font-bold text-[18px] text-text-primary mt-1">{t}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Guidelines">
        <div className="space-y-4">
          <DoDont
            good={{ text: 'Name the dog and the thing.', visual: <p className="font-dm font-bold text-[18px]">Give Poppy her evening pill</p> }}
            bad={{ text: 'Generic system speak.', visual: <p className="font-dm font-bold text-[18px]">Task #4 pending</p> }}
          />
          <DoDont
            good={{ text: 'Plain and warm.', visual: <p className="font-dm font-bold text-[18px]">All done for today</p> }}
            bad={{ text: 'Baby talk undermines trust.', visual: <p className="font-dm font-bold text-[18px]">Yay!! Pupper is a happy fluffball!! 🐶💕</p> }}
          />
          <DoDont
            good={{ text: 'An “other” task shows its own title.', visual: <p className="font-dm font-bold text-[18px]">Nail trim</p> }}
            bad={{ text: 'Never the generic label.', visual: <p className="font-dm font-bold text-[18px]">Task</p> }}
          />
        </div>
      </Section>
    </>
  )
}
