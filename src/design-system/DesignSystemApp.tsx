import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import PawPrintFilled from '../components/icons/PawPrintFilled'
import { ColorsPage, IconsPage, LayoutPage, MotionPage, OverviewPage, ShapePage, TypographyPage, VoicePage } from './pages/Foundations'
import { COMPONENT_PAGES } from './pages/Components'

const FOUNDATIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'colors', label: 'Color' },
  { id: 'typography', label: 'Typography' },
  { id: 'shape', label: 'Shape' },
  { id: 'layout', label: 'Layout & depth' },
  { id: 'motion', label: 'Motion' },
  { id: 'icons', label: 'Iconography' },
  { id: 'voice', label: 'Voice & copy' },
]

const readHash = () => window.location.hash.replace(/^#\/?/, '') || 'overview'

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

  const go = (id: string) => {
    window.location.hash = `/${id}`
  }

  const comp = COMPONENT_PAGES.find((c) => c.id === page)
  const groups = [...new Set(COMPONENT_PAGES.map((c) => c.group))]

  let content
  switch (page) {
    case 'colors': content = <ColorsPage />; break
    case 'typography': content = <TypographyPage />; break
    case 'shape': content = <ShapePage />; break
    case 'layout': content = <LayoutPage />; break
    case 'motion': content = <MotionPage />; break
    case 'icons': content = <IconsPage />; break
    case 'voice': content = <VoicePage />; break
    default: content = comp ? <comp.Page key={comp.id} /> : <OverviewPage go={go} />
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
    <nav aria-label="Design system" className="space-y-6">
      <div>
        <p className="px-4 mb-1.5 font-dm font-bold text-[12px] uppercase tracking-wide text-coral">Foundations</p>
        <ul className="space-y-0.5">{FOUNDATIONS.map((f) => link(f.id, f.label))}</ul>
      </div>
      {groups.map((g) => (
        <div key={g}>
          <p className="px-4 mb-1.5 font-dm font-bold text-[12px] uppercase tracking-wide text-coral">{g}</p>
          <ul className="space-y-0.5">{COMPONENT_PAGES.filter((c) => c.group === g).map((c) => link(c.id, c.label))}</ul>
        </div>
      ))}
    </nav>
  )

  const brand = (
    <a href="#/overview" className="flex items-center gap-2.5">
      <span className="size-9 rounded-full bg-coral text-white flex items-center justify-center">
        <PawPrintFilled size={18} />
      </span>
      <span>
        <span className="block font-outfit font-bold text-[20px] leading-none text-text-primary">HeyPup</span>
        <span className="block font-dm font-bold text-[12px] text-text-muted mt-0.5">Design system</span>
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
