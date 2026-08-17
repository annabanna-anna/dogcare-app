import { useLayoutEffect, useRef, useState } from 'react'
import { Home, PawPrint, CalendarDays, Settings } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/',         label: 'Today',    Icon: Home },
  { to: '/dogs',     label: 'Dogs',     Icon: PawPrint },
  { to: '/calendar', label: 'Upcoming', Icon: CalendarDays },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

// Horizontal inset (px) between the sliding pill and the bounds of the
// active tab it sits behind, so it reads as a chip rather than filling the
// whole cell. Vertical fills the cell exactly, matching the track's padding.
const PILL_INSET_X = 6

export default function BottomNav() {
  const { pathname } = useLocation()
  const activeIndex = Math.max(
    0,
    navItems.findIndex(({ to }) =>
      to === '/' ? pathname === '/' : pathname.startsWith(to)
    )
  )

  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pillRect, setPillRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    const activeItem = itemRefs.current[activeIndex]
    if (!track || !activeItem) return

    const measure = () => {
      const trackBox = track.getBoundingClientRect()
      const itemBox = activeItem.getBoundingClientRect()
      setPillRect({
        left: itemBox.left - trackBox.left + PILL_INSET_X,
        top: itemBox.top - trackBox.top,
        width: itemBox.width - PILL_INSET_X * 2,
        height: itemBox.height,
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeIndex])

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-4 pt-2 z-50">
      <div ref={trackRef} className="relative bg-card rounded-full px-2 py-2 grid grid-cols-4">
        {pillRect && (
          <div
            className="absolute rounded-full bg-cobalt transition-all duration-300 ease-out"
            style={{
              left: pillRect.left,
              top: pillRect.top,
              width: pillRect.width,
              height: pillRect.height,
            }}
          />
        )}
        {navItems.map(({ to, label, Icon }, i) => (
          <NavLink
            key={to}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            to={to}
            end={to === '/'}
            className="relative z-10 flex flex-col items-center gap-1 py-2.5 rounded-full text-nav-inactive"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors duration-300 ${isActive ? 'text-white' : ''}`}
                />
                <span
                  className={`font-dm text-[11px] leading-none transition-colors duration-300 ${
                    isActive ? 'font-bold text-white' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
