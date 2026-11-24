import { useState, type ReactNode } from 'react'
import { Check, Copy, ChevronDown, X, Smartphone, Maximize2 } from 'lucide-react'
import { sources, type Usage } from './codebase'
import Switch from '../components/Switch'

// ─── Page scaffolding ───────────────────────────────────────────────────────

/** Ember eyebrow over a Cobalt headline — the system's own signature pairing. */
export function DocHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-10">
      <p className="font-dm font-bold text-[14px] text-coral uppercase tracking-wide mb-2">{eyebrow}</p>
      <h1 className="font-outfit font-bold text-[40px] sm:text-[48px] leading-none text-cobalt">{title}</h1>
      {children && <div className="mt-4 max-w-[62ch] font-dm text-[16px] leading-relaxed text-text-secondary">{children}</div>}
    </header>
  )
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mb-14">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="font-outfit font-bold text-[24px] leading-tight text-text-primary">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-[62ch] font-dm text-[16px] leading-relaxed text-text-secondary space-y-3">{children}</div>
}

/** A named rule from DESIGN.md, set apart so it reads as law, not commentary. */
export function Rule({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="rounded-[16px] bg-white border border-border-light p-5">
      <p className="font-dm font-bold text-[12px] uppercase tracking-wide text-coral mb-1.5">{name}</p>
      <div className="font-dm text-[14px] leading-relaxed text-text-primary">{children}</div>
    </div>
  )
}

export function DoDont({ good, bad }: { good: { visual: ReactNode; text: string }; bad: { visual: ReactNode; text: string } }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[
        { ...good, ok: true },
        { ...bad, ok: false },
      ].map((d) => (
        <figure key={String(d.ok)} className="rounded-[16px] border border-border-light overflow-hidden bg-white">
          <div className="h-40 bg-cream flex items-center justify-center p-6">{d.visual}</div>
          <figcaption className={`px-4 py-3 border-t-4 ${d.ok ? 'border-green-vivid' : 'border-[#b91c1c]'}`}>
            <span className={`flex items-center gap-1.5 font-dm font-bold text-[14px] ${d.ok ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
              {d.ok ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
              {d.ok ? 'Do' : 'Don’t'}
            </span>
            <span className="block font-dm text-[14px] text-text-primary mt-1 leading-snug">{d.text}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

// ─── Code ───────────────────────────────────────────────────────────────────

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1200)
        })
      }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-dm font-bold text-[12px] text-text-secondary bg-white border border-border-light active:scale-[0.97] transition-transform"
    >
      {copied ? <Check size={14} strokeWidth={3} className="text-green-vivid" /> : <Copy size={14} />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="rounded-[16px] bg-text-primary text-[#e8e8e3] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="font-dm text-[12px] text-white/60 truncate">{title ?? 'JSX'}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-[14px] leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/** The component's real file, collapsed — the final word on how it works. */
export function SourceFile({ path }: { path: string }) {
  const [open, setOpen] = useState(false)
  const text = sources[path]
  if (!text) return null
  const lines = text.split('\n').length
  return (
    <div className="rounded-[16px] border border-border-light bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block font-dm font-bold text-[14px] text-text-primary truncate">{path}</span>
          <span className="block font-dm text-[12px] text-text-muted">{lines} lines · source of truth</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <pre className="max-h-[480px] overflow-auto border-t border-border-light bg-cream p-4 text-[12px] leading-relaxed font-mono text-text-primary">
          <code>{text}</code>
        </pre>
      )}
    </div>
  )
}

// ─── Usage ──────────────────────────────────────────────────────────────────

export function UsageList({ usage, max = 6 }: { usage: Usage; max?: number }) {
  if (!usage.count) return <p className="font-dm text-[14px] text-text-muted">Not used in any component or page.</p>
  return (
    <ul className="space-y-1">
      {usage.files.slice(0, max).map((f) => (
        <li key={f.path} className="flex justify-between gap-3 font-dm text-[14px]">
          <span className="truncate text-text-secondary">{f.path.replace(/^src\//, '')}</span>
          <span className="shrink-0 font-bold text-text-primary tabular-nums">{f.count}</span>
        </li>
      ))}
      {usage.files.length > max && (
        <li className="font-dm text-[12px] text-text-muted">+ {usage.files.length - max} more files</li>
      )}
    </ul>
  )
}

// ─── Playground ─────────────────────────────────────────────────────────────

export type Control =
  | { type: 'select'; options: readonly string[]; label?: string }
  | { type: 'radio'; options: readonly string[]; label?: string }
  | { type: 'boolean'; label?: string }
  | { type: 'text'; label?: string }
  | { type: 'number'; min: number; max: number; step?: number; label?: string }

type Args = Record<string, string | number | boolean>

type Surface = 'app' | 'white' | 'card'
const surfaceClass: Record<Surface, string> = { app: 'bg-cream', white: 'bg-white', card: 'bg-card' }

/**
 * Storybook-style story: a live canvas of the real component, controls that
 * drive its props, and the JSX those props produce.
 */
export function Playground<A extends Args>({
  initial,
  controls,
  render,
  code,
  minHeight = 200,
  contain = false,
  defaultWidth = 'phone',
}: {
  initial: A
  controls: { [K in keyof A]?: Control }
  render: (args: A, set: (patch: Partial<A>) => void) => ReactNode
  code: (args: A) => string
  minHeight?: number
  /** Traps position:fixed children (sheets, the bottom nav) inside the canvas. */
  contain?: boolean
  defaultWidth?: 'phone' | 'full'
}) {
  const [args, setArgs] = useState<A>(initial)
  const [surface, setSurface] = useState<Surface>('app')
  const [width, setWidth] = useState<'phone' | 'full'>(defaultWidth)
  const set = (patch: Partial<A>) => setArgs((a) => ({ ...a, ...patch }))
  const keys = Object.keys(controls) as (keyof A & string)[]

  return (
    <div className="rounded-[22px] border border-border-light bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border-light">
        <div className="flex items-center gap-1" role="group" aria-label="Canvas surface">
          {(Object.keys(surfaceClass) as Surface[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={surface === s}
              onClick={() => setSurface(s)}
              className={`rounded-full px-3 py-1 font-dm font-bold text-[12px] capitalize transition-colors ${
                surface === s ? 'bg-text-primary text-white' : 'text-text-secondary'
              }`}
            >
              {s === 'app' ? 'App bg' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Canvas width">
          {(
            [
              ['phone', Smartphone, '390'],
              ['full', Maximize2, 'Full'],
            ] as const
          ).map(([w, Icon, label]) => (
            <button
              key={w}
              type="button"
              aria-pressed={width === w}
              onClick={() => setWidth(w)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-dm font-bold text-[12px] transition-colors ${
                width === w ? 'bg-cobalt text-white' : 'text-text-secondary'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className={`${surfaceClass[surface]} transition-colors px-4 py-8 flex justify-center`}>
        <div
          className={`relative w-full ${width === 'phone' ? 'max-w-[390px]' : ''} flex flex-col justify-center ${
            contain ? 'overflow-hidden rounded-[16px]' : ''
          }`}
          // A transform makes this box the containing block for fixed children.
          style={{ minHeight, transform: contain ? 'translateZ(0)' : undefined }}
        >
          {render(args, set)}
        </div>
      </div>

      {/* Controls */}
      {keys.length > 0 && (
        <div className="border-t border-border-light px-4 py-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {keys.map((k) => (
            <ControlField key={k} name={k} control={controls[k]!} value={args[k]} onChange={(v) => set({ [k]: v } as Partial<A>)} />
          ))}
        </div>
      )}

      <div className="border-t border-border-light p-3 bg-cream">
        <CodeBlock code={code(args)} />
      </div>
    </div>
  )
}

function ControlField({
  name,
  control,
  value,
  onChange,
}: {
  name: string
  control: Control
  value: string | number | boolean
  onChange: (v: string | number | boolean) => void
}) {
  const label = control.label ?? name
  const id = `ctl-${name}`
  const labelEl = (
    <label htmlFor={id} className="block font-dm font-bold text-[12px] text-text-secondary mb-1.5">
      {label}
    </label>
  )
  switch (control.type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
          <span className="font-dm font-bold text-[12px] text-text-secondary">{label}</span>
          <Switch checked={!!value} onChange={onChange} label={label} />
        </div>
      )
    case 'radio':
      return (
        <div>
          <span className="block font-dm font-bold text-[12px] text-text-secondary mb-1.5">{label}</span>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
            {control.options.map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={value === o}
                onClick={() => onChange(o)}
                className={`rounded-full px-3 py-1.5 font-dm font-bold text-[12px] transition-colors ${
                  value === o ? 'bg-coral text-white' : 'bg-white border border-border-light text-text-primary'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )
    case 'select':
      return (
        <div>
          {labelEl}
          <select
            id={id}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-border-light rounded-[12px] px-3 py-2 font-dm text-[14px] text-text-primary focus:outline-none focus:border-coral"
          >
            {control.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      )
    case 'number':
      return (
        <div>
          <div className="flex justify-between">
            {labelEl}
            <span className="font-dm font-bold text-[12px] text-text-primary tabular-nums">{value}</span>
          </div>
          <input
            id={id}
            type="range"
            min={control.min}
            max={control.max}
            step={control.step ?? 1}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[#ff4514]"
          />
        </div>
      )
    default:
      return (
        <div>
          {labelEl}
          <input
            id={id}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-border-light rounded-[12px] px-3 py-2 font-dm text-[14px] text-text-primary focus:outline-none focus:border-coral"
          />
        </div>
      )
  }
}

/** A labeled grid cell for "all variants" galleries. */
export function Specimen({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] border border-border-light bg-cream p-4 flex flex-col gap-3 ${className}`}>
      <div className="flex-1 flex items-center justify-center min-h-[64px]">{children}</div>
      <p className="font-dm font-bold text-[12px] text-text-secondary text-center">{label}</p>
    </div>
  )
}

export function PropsTable({ rows }: { rows: [name: string, type: string, def: string, desc: string][] }) {
  return (
    <div className="rounded-[16px] border border-border-light bg-white overflow-x-auto">
      <table className="w-full text-left font-dm text-[14px]">
        <thead>
          <tr className="border-b border-border-light text-text-secondary">
            <th className="px-4 py-2.5 font-bold">Prop</th>
            <th className="px-4 py-2.5 font-bold">Type</th>
            <th className="px-4 py-2.5 font-bold">Default</th>
            <th className="px-4 py-2.5 font-bold">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([n, t, d, desc]) => (
            <tr key={n} className="border-b border-border-faint last:border-0 align-top">
              <td className="px-4 py-2.5 font-mono font-bold text-text-primary whitespace-nowrap">{n}</td>
              <td className="px-4 py-2.5 font-mono text-cobalt">{t}</td>
              <td className="px-4 py-2.5 font-mono text-text-muted whitespace-nowrap">{d}</td>
              <td className="px-4 py-2.5 text-text-secondary min-w-[200px]">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
