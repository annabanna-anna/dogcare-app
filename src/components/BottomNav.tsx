import { Home, Dog, CalendarDays, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',         label: 'Today',    Icon: Home },
  { to: '/dogs',     label: 'Dogs',     Icon: Dog },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-4 pt-2 z-50">
      <div className="bg-white border border-border-light rounded-full px-1 py-1 flex items-center shadow-sm">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 rounded-full transition-colors duration-150 ${
                isActive ? 'text-green-vivid' : 'text-nav-inactive'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`font-jakarta text-[12px] leading-none ${
                    isActive ? 'font-semibold' : 'font-medium'
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
