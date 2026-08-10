import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_EMAIL } from '../lib/siteConfig'

interface Props {
  children: ReactNode
}

/**
 * Chrome for the logged-out public pages (/about, /privacy).
 *
 * `data-public-page` is what releases these pages from the 430px phone
 * frame `#root` imposes on the app — see the `:has()` rule in index.css.
 * Without it a landing page would render inside a narrow column on desktop.
 */
export default function PublicPageShell({ children }: Props) {
  return (
    <div data-public-page className="min-h-svh bg-cream flex flex-col">
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-sm border-b border-border-faint">
        <div className="mx-auto max-w-[1100px] px-6 h-16 flex items-center justify-between gap-4">
          <Link
            to="/about"
            className="font-outfit font-bold text-[22px] tracking-tight text-text-primary rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
          >
            GoodPup
          </Link>
          <nav className="flex items-center gap-5" aria-label="Site">
            <Link
              to="/privacy"
              className="font-dm font-bold text-[14px] text-text-secondary hover:text-text-primary transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
            >
              Privacy
            </Link>
            <Link
              to="/"
              className="font-dm font-bold text-[14px] px-4 py-2 rounded-full bg-text-primary text-white hover:bg-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              Open app
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-text-primary text-white">
        <div className="mx-auto max-w-[1100px] px-6 py-12 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-outfit font-bold text-[26px] tracking-tight leading-none">GoodPup</p>
            <p className="font-dm text-[14px] text-[#a1a1a1] mt-2 max-w-[38ch] leading-relaxed">
              A task-tracking companion for dog sitters and boarders.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              to="/privacy"
              className="font-dm font-bold text-[14px] text-white hover:text-coral transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
            >
              Privacy Policy
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-dm text-[14px] text-[#a1a1a1] hover:text-white transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="font-dm text-[13px] text-[#a1a1a1] mt-2">
              © {new Date().getFullYear()} GoodPup
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
