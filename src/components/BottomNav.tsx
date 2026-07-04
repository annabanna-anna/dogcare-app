import { Home, PawPrint, CalendarDays, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',         label: 'Today',    Icon: Home },
  { to: '/dogs',     label: 'Dogs',     Icon: PawPrint },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-4 pt-2 z-50">
      <div className="bg-text-primary rounded-full px-2 py-2 flex items-center shadow-lg">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 rounded-full transition-colors duration-150 ${
                isActive ? 'bg-coral text-white' : 'text-white/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={`font-jakarta text-[11px] leading-none ${
                    isActive ? 'font-bold' : 'font-medium'
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
