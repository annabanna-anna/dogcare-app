/**
 * Everything the design system shows is read from the code at build time:
 * the Tailwind config is the token source, and the app's own source files
 * are scanned for how those tokens (and off-token values) are actually used.
 * Nothing here is hand-maintained — change the code and this page follows.
 */

// The Tailwind config is plain JS outside src/, so it's pulled in through a
// glob rather than a typed import.
const twModules = import.meta.glob('/tailwind.config.js', { eager: true, import: 'default' })
const tw = Object.values(twModules)[0] as {
  theme: { extend: { colors: Record<string, string>; fontFamily: Record<string, string[]> } }
}

export const colorTokens: Record<string, string> = tw.theme.extend.colors
export const fontTokens: Record<string, string[]> = tw.theme.extend.fontFamily

/** Every app source file (the design system itself excluded), as text. */
export const sources: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/design-system/**'], {
      eager: true,
      query: '?raw',
      import: 'default',
    }) as Record<string, string>,
  ).map(([path, text]) => [path.replace(/^\//, ''), text]),
)

export const indexCss = Object.values(
  import.meta.glob('/src/index.css', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>,
)[0]

/** All app source counts toward usage — .ts files like taskTypeStyle.ts hold class names too. */
const uiFiles = Object.entries(sources)

export interface Usage {
  count: number
  files: { path: string; count: number }[]
}

function tally(re: RegExp): Usage {
  const files: Usage['files'] = []
  let count = 0
  for (const [path, text] of uiFiles) {
    const n = text.match(re)?.length ?? 0
    if (n) {
      files.push({ path, count: n })
      count += n
    }
  }
  files.sort((a, b) => b.count - a.count)
  return { count, files }
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const UTILS = 'bg|text|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|accent|decoration|shadow|caret'

/** How often a color token is used as a utility (bg-coral, text-coral/60, …). */
export function colorUsage(token: string): Usage {
  return tally(new RegExp(`(?<![\\w-])(?:${UTILS})-${esc(token)}(?![\\w-])`, 'g'))
}

/** Groups matches of a pattern across the UI files by their first capture. */
function histogram(re: RegExp): { value: string; usage: Usage }[] {
  const map = new Map<string, Usage>()
  for (const [path, text] of uiFiles) {
    const local = new Map<string, number>()
    for (const m of text.matchAll(re)) local.set(m[1], (local.get(m[1]) ?? 0) + 1)
    for (const [value, n] of local) {
      const u = map.get(value) ?? { count: 0, files: [] }
      u.count += n
      u.files.push({ path, count: n })
      map.set(value, u)
    }
  }
  return [...map.entries()]
    .map(([value, usage]) => {
      usage.files.sort((a, b) => b.count - a.count)
      return { value, usage }
    })
    .sort((a, b) => b.usage.count - a.usage.count)
}

/** Hex colors written straight into class names (`bg-[#fee2e2]`) — values
 *  that bypass the token set. */
export const hardcodedColors = histogram(/\[(#[0-9a-fA-F]{3,8})\]/g).map((h) => ({
  ...h,
  value: h.value.toLowerCase(),
}))

/** Font sizes in use, e.g. text-[14px]. */
export const fontSizes = histogram(/(?<![\w-])text-\[(\d+(?:\.\d+)?)px\]/g).sort(
  (a, b) => Number(b.value) - Number(a.value),
)

/** Corner radii in use: rounded-[16px] plus the named Tailwind steps. */
export const radii = histogram(/(?<![\w-])rounded(?:-[trbl]{1,2})?-(\[\d+px\]|full|none|sm|md|lg|xl|2xl|3xl)(?![\w-])/g)

export const fontFamilyUsage = Object.keys(fontTokens).map((key) => ({
  key,
  usage: tally(new RegExp(`(?<![\\w-])font-${esc(key)}(?![\\w-])`, 'g')),
}))

export const fontWeights = ['normal', 'medium', 'semibold', 'bold', 'extrabold'].map((w) => ({
  key: w,
  usage: tally(new RegExp(`(?<![\\w-])font-${w}(?![\\w-])`, 'g')),
}))

/** lucide-react icons imported anywhere in the app, with how many files use each. */
export const lucideIcons: { name: string; files: string[] }[] = (() => {
  const map = new Map<string, string[]>()
  for (const [path, text] of Object.entries(sources)) {
    for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*'lucide-react'/g)) {
      for (const raw of m[1].split(',')) {
        const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]
        if (!name || /^[a-z]/.test(name)) continue
        map.set(name, [...(map.get(name) ?? []), path])
      }
    }
  }
  return [...map.entries()].map(([name, files]) => ({ name, files })).sort((a, b) => b.files.length - a.files.length)
})()

/** @keyframes declared in src/index.css, with the class that plays each. */
export const keyframes: { name: string; rule?: string }[] = [...indexCss.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => {
  const name = m[1]
  const rule = indexCss.match(new RegExp(`animation:\\s*${esc(name)}\\s+([^;]+);`))?.[1]
  return { name, rule }
})

export const fileCount = uiFiles.length
