import { Home, PawPrint, CalendarDays, Settings } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/',         label: 'Today',    Icon: Home },
  { to: '/dogs',     label: 'Dogs',     Icon: PawPrint },
  { to: '/calendar', label: 'Upcoming', Icon: CalendarDays },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const activeIndex = Math.max(
    0,
    navItems.findIndex(({ to }) =>
      to === '/' ? pathname === '/' : pathname.startsWith(to)
    )
  )

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-4 pt-2 z-50">
      <div className="relative bg-card rounded-full px-2 py-2 grid grid-cols-4">
        <div
          className="absolute inset-y-2 left-2 w-[calc(25%-4px)] rounded-full bg-cobalt transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
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
