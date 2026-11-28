import { useEffect, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { LogoMark, Wordmark } from '../components/Logo'
import { IconsPage, LayoutPage, MotionPage, ShapePage, TypographyPage, VoicePage } from './pages/Foundations'
import { ColorsPage } from './pages/Colors'
import { FOUNDATIONS, HomePage, INTRO, PrinciplesPage } from './pages/Home'
import { COMPONENT_PAGES } from './pages/Components'

const readHash = () => window.location.hash.replace(/^#\/?/, '') || 'overview'

// Which sidebar groups are collapsed — a per-viewer convenience, so plain
// localStorage (wrapped: it can throw in private windows).
const COLLAPSED_KEY = 'ds-collapsed-groups'
function loadCollapsed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}
function saveCollapsed(set: Set<string>) {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set]))
  } catch {
    /* not persisted — fine */
  }
}

export default function DesignSystemApp() {
  const [page, setPage] = useState(readHash)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onHash = () => {
      setPage(readHash())
      setMenuOpen(false)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const comp = COMPONENT_PAGES.find((c) => c.id === page)
  const sections: { title: string; items: readonly { id: string; label: string }[] }[] = [
    { title: 'Introduction', items: INTRO },
    { title: 'Foundations', items: FOUNDATIONS },
    ...[...new Set(COMPONENT_PAGES.map((c) => c.group))].map((g) => ({
      title: g,
      items: COMPONENT_PAGES.filter((c) => c.group === g),
    })),
  ]

  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const toggle = (title: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      saveCollapsed(next)
      return next
    })

  // The group holding the current page always opens, so you never lose your place.
  const currentGroup = sections.find((s) => s.items.some((i) => i.id === page))?.title
  useEffect(() => {
    if (!currentGroup) return
    setCollapsed((prev) => {
      if (!prev.has(currentGroup)) return prev
      const next = new Set(prev)
      next.delete(currentGroup)
      saveCollapsed(next)
      return next
    })
  }, [currentGroup])

  let content
  switch (page) {
    case 'principles': content = <PrinciplesPage />; break
    case 'colors': content = <ColorsPage />; break
    case 'typography': content = <TypographyPage />; break
    case 'shape': content = <ShapePage />; break
    case 'layout': content = <LayoutPage />; break
    case 'motion': content = <MotionPage />; break
    case 'icons': content = <IconsPage />; break
    case 'voice': content = <VoicePage />; break
    default: content = comp ? <comp.Page key={comp.id} /> : <HomePage />
  }

  const link = (id: string, label: string) => (
    <li key={id}>
      <a
        href={`#/${id}`}
        aria-current={page === id ? 'page' : undefined}
        className={`block rounded-full px-4 py-2 font-dm text-[14px] transition-colors ${
          page === id ? 'bg-cobalt text-white font-bold' : 'text-text-secondary font-medium hover:text-text-primary'
        }`}
      >
        {label}
      </a>
    </li>
  )

  const nav = (
    <nav aria-label="Design system" className="space-y-4">
      <ul className="space-y-0.5">{link('overview', 'Home')}</ul>
      {sections.map(({ title, items }) => {
        const open = !collapsed.has(title)
        const listId = `nav-${title.replace(/\W+/g, '-').toLowerCase()}`
        return (
          <div key={title}>
            <button
              type="button"
              onClick={() => toggle(title)}
              aria-expanded={open}
              aria-controls={listId}
              className="w-full flex items-center justify-between gap-2 rounded-full px-4 py-1.5 mb-0.5 font-dm font-bold text-[12px] uppercase tracking-wide text-coral hover:bg-card transition-colors"
            >
              <span>{title}</span>
              <span className="flex items-center gap-1.5 text-text-muted">
                {!open && <span className="font-dm text-[12px] normal-case tracking-normal tabular-nums">{items.length}</span>}
                <ChevronDown size={16} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
              </span>
            </button>
            {open && (
              <ul id={listId} className="space-y-0.5">
                {items.map((f) => link(f.id, f.label))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )

  const brand = (
    <a href="#/overview" className="flex items-center gap-3">
      <LogoMark size={40} />
      <span>
        <Wordmark height={20} className="block" />
        <span className="block font-dm font-bold text-[12px] text-text-muted mt-1">Design system</span>
      </span>
    </a>
  )

  return (
    <div className="min-h-svh bg-cream text-text-primary">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-border-light px-4 h-16 flex items-center justify-between">
        {brand}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Menu"
          className="size-11 rounded-full bg-card flex items-center justify-center"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {menuOpen && <div className="lg:hidden fixed inset-0 top-16 z-30 bg-cream overflow-y-auto px-2 py-6">{nav}</div>}

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block sticky top-0 h-svh overflow-y-auto border-r border-border-light px-3 py-8">
          <div className="px-4 mb-8">{brand}</div>
          {nav}
        </aside>
        <main className="min-w-0 px-4 sm:px-8 lg:px-14 py-10 lg:py-14">
          <div className="max-w-[1040px]">{content}</div>
        </main>
      </div>
    </div>
  )
}
