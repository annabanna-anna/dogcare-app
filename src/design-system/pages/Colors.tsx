import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import {
  colorTokens,
  colorUsage,
  hardcodedColors,
  primitiveBlack,
  primitiveName,
  primitives,
  primitiveWhite,
  rampRoles,
} from '../codebase'
import { DocHeader, Prose, Rule, Section, UsageList } from '../ui'
import { TASK_TYPE_STYLE } from '../../components/taskTypeStyle'
import type { TaskType } from '../../types'

// ─── Contrast math ──────────────────────────────────────────────────────────

function luminance(hex: string) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

/** White or Ink — whichever reads better on the given background. */
const onColor = (bg: string) => (contrast('#ffffff', bg) >= contrast('#141414', bg) ? '#ffffff' : '#141414')

function Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex size-5 rounded-full bg-[#dcfce7] text-[#15803d] items-center justify-center" aria-label="Pass">
      <Check size={12} strokeWidth={3} />
    </span>
  ) : (
    <span className="inline-flex h-5 px-2 rounded-full bg-[#fee2e2] text-[#b91c1c] items-center font-dm font-bold text-[10px]" aria-label="Fail">
      Fail
    </span>
  )
}

// ─── Semantic metadata ──────────────────────────────────────────────────────

const GROUPS = ['Brand', 'Accent', 'Surface', 'Text', 'Border', 'Task type'] as const
const META: Record<string, { name: string; group: (typeof GROUPS)[number]; role: string }> = {
  coral: { name: 'Ember', group: 'Brand', role: 'Action, status, emphasis, eyebrows. If it’s coral, it’s important.' },
  'coral-deep': { name: 'Ember Deep', group: 'Brand', role: 'Pressed state of Ember.' },
  'coral-soft': { name: 'Ember Soft', group: 'Brand', role: 'Tint behind Ember icons and highlights.' },
  cobalt: { name: 'Cobalt', group: 'Accent', role: 'Page headings and wayfinding. Never action or status.' },
  'cobalt-soft': { name: 'Cobalt Soft', group: 'Accent', role: 'Faint Cobalt tint.' },
  cream: { name: 'Studio White', group: 'Surface', role: 'Base of every screen. Not cream, despite the token name.' },
  card: { name: 'Card', group: 'Surface', role: 'Utility surfaces: search pill, bottom nav, tab tracks.' },
  'text-primary': { name: 'Ink', group: 'Text', role: 'Headings and primary text.' },
  'text-secondary': { name: 'Ink Secondary', group: 'Text', role: 'Body copy and secondary lines.' },
  'text-muted': { name: 'Ink Muted', group: 'Text', role: 'De-emphasized labels.' },
  'nav-inactive': { name: 'Nav Inactive', group: 'Text', role: 'Inactive bottom-nav items.' },
  'border-light': { name: 'Border Light', group: 'Border', role: 'Card and field hairlines.' },
  'border-faint': { name: 'Border Faint', group: 'Border', role: 'Dividers, timeline connectors.' },
  'blue-task': { name: 'Walk Blue', group: 'Task type', role: 'Walk badge. Same value as Cobalt.' },
  'green-vivid': { name: 'Potty Green', group: 'Task type', role: 'Potty badge, done states.' },
  'purple-task': { name: 'Medication Purple', group: 'Task type', role: 'Medication badge.' },
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function ColorsPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(text)
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1000)
    })
  }

  const tokens = useMemo(
    () =>
      Object.entries(colorTokens).map(([key, hex]) => ({
        key,
        hex,
        ref: primitiveName(hex),
        meta: META[key] ?? { name: key, group: 'Brand' as const, role: 'Not documented yet.' },
        usage: colorUsage(key),
      })),
    [],
  )
  // Which semantic tokens point at each primitive step — marked on the ramps.
  const usedBy = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const t of tokens) if (t.ref) m.set(t.ref, [...(m.get(t.ref) ?? []), t.key])
    return m
  }, [tokens])

  const steps = Object.keys(primitives.ember)
  const textTokens = ['text-primary', 'text-secondary', 'text-muted', 'nav-inactive', 'coral', 'cobalt']

  return (
    <>
      <DocHeader eyebrow="Foundations" title="Color">
        Two layers. <strong className="text-text-primary">Primitives</strong> are the raw ramps in{' '}
        <code className="font-mono text-[14px]">src/theme/primitives.js</code>.{' '}
        <strong className="text-text-primary">Semantic tokens</strong> in{' '}
        <code className="font-mono text-[14px]">tailwind.config.js</code> point at primitive steps and are the only colors
        components use.
      </DocHeader>

      <div className="mb-12">
        <Rule name="The One Voice Rule">
          Ember is the only color that means something — status, action, active state — outside the fixed task-type set.
          If another color starts meaning “done” or “urgent” on its own, that’s a bug.
        </Rule>
      </div>

      {/* ── Primitives ── */}
      <Section
        title="Primitive colors"
        aside={<span className="font-dm text-[14px] text-text-muted">{Object.keys(primitives).length} ramps × {steps.length} steps + white / black</span>}
      >
        <Prose>
          <p>
            The ingredients, not the recipe — never use a primitive directly in a component. A dot marks a step that a
            semantic token points at. Click any swatch to copy its hex.
          </p>
        </Prose>

        <div className="mt-5 rounded-[22px] border border-border-light bg-white p-4 sm:p-5 overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Step header */}
            <div className="grid grid-cols-[148px_repeat(11,1fr)] gap-1.5 mb-2">
              <span className="font-dm font-bold text-[12px] text-text-muted">ramp / step</span>
              {steps.map((s) => (
                <span key={s} className="font-dm font-bold text-[12px] text-text-muted text-center tabular-nums">
                  {s}
                </span>
              ))}
            </div>

            {Object.entries(primitives).map(([ramp, ramps]) => (
              <div key={ramp} className="grid grid-cols-[148px_repeat(11,1fr)] gap-1.5 mb-3 items-start">
                <div className="pr-2 pt-1">
                  <p className="font-dm font-bold text-[14px] text-text-primary capitalize">{ramp}</p>
                  <p className="font-dm text-[12px] text-text-muted leading-snug">{rampRoles[ramp]}</p>
                </div>
                {steps.map((s) => {
                  const hex = ramps[s]
                  const refs = usedBy.get(`${ramp}/${s}`)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => copy(hex)}
                      title={refs ? `${hex} — used by ${refs.join(', ')}` : hex}
                      className="group text-left active:scale-[0.96] transition-transform"
                    >
                      <span
                        className="relative block h-14 rounded-[10px] border border-black/5"
                        style={{ background: hex }}
                      >
                        {refs && (
                          <span
                            className="absolute top-1.5 right-1.5 size-2 rounded-full"
                            style={{ background: onColor(hex) }}
                            aria-label={`Used by ${refs.join(', ')}`}
                          />
                        )}
                        {copied === hex && (
                          <span className="absolute inset-0 flex items-center justify-center" style={{ color: onColor(hex) }}>
                            <Check size={16} strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className="block mt-1 font-mono text-[10px] text-text-secondary uppercase text-center">{hex.slice(1)}</span>
                    </button>
                  )
                })}
              </div>
            ))}

            <div className="flex gap-3 mt-4 pt-4 border-t border-border-faint">
              {[
                ['white', primitiveWhite],
                ['black', primitiveBlack],
              ].map(([n, hex]) => (
                <button key={n} type="button" onClick={() => copy(hex)} className="flex items-center gap-2.5 active:scale-[0.97] transition-transform">
                  <span className="size-10 rounded-[10px] border border-border-light" style={{ background: hex }} />
                  <span className="text-left">
                    <span className="block font-dm font-bold text-[14px] text-text-primary">{n}</span>
                    <span className="block font-mono text-[12px] text-text-muted uppercase">{hex}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Semantic ── */}
      <Section title="Semantic tokens" aside={<span className="font-dm text-[14px] text-text-muted">{tokens.length} tokens</span>}>
        <Prose>
          <p>
            Pick colors by job, not by look. Each token’s primitive and usage count are read from the code. Open a row to
            see which files use it.
          </p>
        </Prose>

        <div className="mt-5 space-y-6">
          {GROUPS.map((g) => {
            const list = tokens.filter((t) => t.meta.group === g)
            if (!list.length) return null
            return (
              <div key={g}>
                <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral mb-2">{g}</p>
                <div className="rounded-[16px] border border-border-light bg-white divide-y divide-border-faint">
                  {list.map((t) => (
                    <details key={t.key} className="group">
                      <summary className="list-none cursor-pointer px-4 py-3 grid grid-cols-[40px_1fr_auto] sm:grid-cols-[40px_180px_1fr_auto] gap-x-4 gap-y-1 items-center">
                        <span className="size-10 rounded-[10px] border border-black/5 row-span-2 sm:row-span-1" style={{ background: t.hex }} />
                        <span className="min-w-0">
                          <span className="block font-dm font-bold text-[14px] text-text-primary">{t.meta.name}</span>
                          <span className="block font-mono text-[12px] text-text-muted">{t.key}</span>
                        </span>
                        <span className="hidden sm:block font-dm text-[14px] text-text-secondary leading-snug">{t.meta.role}</span>
                        <span className="flex flex-col items-end gap-1">
                          {t.ref ? (
                            <span className="rounded-full bg-card px-2.5 h-6 inline-flex items-center font-mono text-[12px] text-text-primary">
                              → {t.ref}
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#fef9c3] text-[#a16207] px-2.5 h-6 inline-flex items-center font-dm font-bold text-[12px]">
                              off-ramp
                            </span>
                          )}
                          <span className={`font-dm text-[12px] tabular-nums ${t.usage.count ? 'text-text-muted' : 'text-[#b91c1c] font-bold'}`}>
                            {t.usage.count ? `${t.usage.count}× in code` : 'unused'}
                          </span>
                        </span>
                      </summary>
                      <div className="px-4 pb-4 sm:pl-[72px] grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="sm:hidden font-dm text-[14px] text-text-secondary mb-3">{t.meta.role}</p>
                          <p className="font-mono text-[12px] text-text-secondary">
                            bg-{t.key} · text-{t.key} · {t.hex}
                          </p>
                        </div>
                        <UsageList usage={t.usage} />
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Text contrast ── */}
      <Section title="Text contrast">
        <Prose>
          <p>
            Every text color against Studio White. WCAG asks for 4.5:1 for normal text and 3:1 for large text (24px, or
            18.66px bold). Eyebrows and labels are 12–14px bold, so they count as normal text.
          </p>
        </Prose>
        <ContrastTable rows={textTokens.map((k) => ({ label: META[k]?.name ?? k, token: k, fg: colorTokens[k], bg: colorTokens.cream }))} />
      </Section>

      <Section title="Ember as text">
        <Prose>
          <p>
            Ember 500 is the brand, but it’s light for small text on white. When Ember carries meaning in small type,
            check its step here.
          </p>
        </Prose>
        <ContrastTable
          sample
          rows={['400', '500', '600', '700', '800'].map((s) => ({
            label: `ember/${s}`,
            token: usedBy.get(`ember/${s}`)?.join(', ') ?? '',
            fg: primitives.ember[s],
            bg: primitiveWhite,
          }))}
        />
      </Section>

      {/* ── Task types ── */}
      <Section title="Task-type colors">
        <Prose>
          <p>
            Every task type owns exactly one icon and one color, imported from <code className="font-mono">TASK_TYPE_STYLE</code>.
            Never pick a task color locally.
          </p>
        </Prose>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {(Object.keys(TASK_TYPE_STYLE) as TaskType[]).map((t) => {
            const { icon: Icon, bg } = TASK_TYPE_STYLE[t]
            const token = bg.replace(/^bg-/, '')
            return (
              <div key={t} className="rounded-[16px] border border-border-light bg-white p-4 flex flex-col items-center gap-2">
                <span className={`size-10 rounded-full flex items-center justify-center text-white ${bg}`}>
                  <Icon size={20} />
                </span>
                <span className="font-dm font-bold text-[14px] text-text-primary capitalize">{t}</span>
                <span className="font-mono text-[12px] text-text-muted">{token}</span>
                <span className="font-mono text-[12px] text-text-muted">{primitiveName(colorTokens[token] ?? '') ?? ''}</span>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Hard-coded ── */}
      <Section
        title="Hard-coded colors"
        aside={<span className="font-dm text-[14px] text-text-muted">{hardcodedColors.length} values bypass the tokens</span>}
      >
        <Prose>
          <p>
            Hex values written straight into class names, like <code className="font-mono">bg-[#fee2e2]</code>. Values
            that land on a primitive step are easy to promote to a semantic token; off-ramp values are worth a second look.
          </p>
        </Prose>
        <div className="mt-4 rounded-[16px] border border-border-light bg-white divide-y divide-border-faint">
          {hardcodedColors.map((h) => {
            const token = Object.entries(colorTokens).find(([, v]) => v.toLowerCase() === h.value)
            const prim = primitiveName(h.value)
            return (
              <details key={h.value}>
                <summary className="flex items-center gap-3 px-4 py-2.5 cursor-pointer list-none">
                  <span className="size-8 rounded-[8px] border border-border-light shrink-0" style={{ background: h.value }} />
                  <span className="font-mono text-[14px] text-text-primary uppercase w-20">{h.value}</span>
                  {token ? (
                    <span className="rounded-full bg-[#fef9c3] text-[#a16207] px-2 font-dm font-bold text-[12px]">= {token[0]} token</span>
                  ) : prim ? (
                    <span className="rounded-full bg-card px-2 font-mono text-[12px] text-text-primary">{prim}</span>
                  ) : (
                    <span className="font-dm text-[12px] text-text-muted">off-ramp</span>
                  )}
                  <span className="ml-auto font-dm font-bold text-[14px] text-text-primary tabular-nums">{h.usage.count}×</span>
                </summary>
                <div className="px-4 pb-3 pl-16">
                  <UsageList usage={h.usage} max={10} />
                </div>
              </details>
            )
          })}
        </div>
      </Section>
    </>
  )
}

function ContrastTable({
  rows,
  sample = false,
}: {
  rows: { label: string; token: string; fg: string; bg: string }[]
  sample?: boolean
}) {
  return (
    <div className="mt-4 rounded-[16px] border border-border-light bg-white overflow-x-auto">
      <table className="w-full min-w-[620px] font-dm text-[14px]">
        <thead>
          <tr className="border-b border-border-light text-text-secondary text-[12px]">
            <th className="text-left font-bold px-4 py-2.5">Color</th>
            <th className="text-right font-bold px-3 py-2.5">Ratio</th>
            <th className="font-bold px-3 py-2.5">AA</th>
            <th className="font-bold px-3 py-2.5">AAA</th>
            <th className="font-bold px-3 py-2.5">AA large</th>
            <th className="font-bold px-3 py-2.5">AAA large</th>
            <th className="text-left font-bold px-4 py-2.5">{sample ? 'Sample' : 'Preview'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const c = contrast(r.fg, r.bg)
            return (
              <tr key={r.label} className="border-b border-border-faint last:border-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="size-6 rounded-full border border-black/5 shrink-0" style={{ background: r.fg }} />
                    <span>
                      <span className="block font-bold text-text-primary">{r.label}</span>
                      {r.token && <span className="block font-mono text-[12px] text-text-muted">{r.token}</span>}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-bold tabular-nums text-text-primary">{c.toFixed(1)}:1</td>
                <td className="px-3 py-3 text-center"><Mark ok={c >= 4.5} /></td>
                <td className="px-3 py-3 text-center"><Mark ok={c >= 7} /></td>
                <td className="px-3 py-3 text-center"><Mark ok={c >= 3} /></td>
                <td className="px-3 py-3 text-center"><Mark ok={c >= 4.5} /></td>
                <td className="px-4 py-3">
                  {sample ? (
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-[12px] uppercase tracking-wide" style={{ color: r.fg }}>Saturday, July 4</span>
                      <span className="rounded-full px-3 py-1 font-bold text-[12px]" style={{ background: r.fg, color: '#ffffff' }}>Save</span>
                    </span>
                  ) : (
                    <span className="font-bold" style={{ color: r.fg }}>Barkley’s 8:00 AM walk</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
