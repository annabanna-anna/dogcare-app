import { useState } from 'react'
import { CalendarDays, Bell, ChevronRight, Check, RefreshCw, Shield } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        value ? 'bg-green-vivid' : 'bg-[#d1d5db]'
      }`}
    >
      <div
        className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform duration-200 ${
          value ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function SettingRow({
  icon,
  label,
  description,
  right,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="size-9 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center shrink-0 text-text-secondary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-gabarito font-bold text-[15px] text-text-primary leading-none">
          {label}
        </p>
        {description && (
          <p className="font-gabarito text-[13px] text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      {right}
    </div>
  )
}

export default function SyncSettingsPage() {
  const [calendarSync, setCalendarSync] = useState(true)
  const [reminders, setReminders] = useState(true)
  const [reminderMinutes, setReminderMinutes] = useState(15)

  const reminderOptions = [5, 10, 15, 30, 60]

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader title="Settings" />

      <div className="px-6 mt-4 flex flex-col gap-4">
        {/* Sync section */}
        <section>
          <p className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Calendar Sync
          </p>
          <div className="bg-white border border-border-light rounded-[16px] px-4 divide-y divide-border-faint">
            <SettingRow
              icon={<CalendarDays size={18} />}
              label="Google Calendar"
              description={calendarSync ? 'Synced · Tasks added to your calendar' : 'Not connected'}
              right={<Toggle value={calendarSync} onChange={setCalendarSync} />}
            />
            {calendarSync && (
              <div className="py-4 flex items-center gap-3">
                <div className="size-9 rounded-[10px] bg-[#dcfce7] flex items-center justify-center shrink-0">
                  <Check size={16} className="text-[#15803d]" />
                </div>
                <div className="flex-1">
                  <p className="font-gabarito font-bold text-[15px] text-[#15803d] leading-none">
                    Connected
                  </p>
                  <p className="font-gabarito text-[13px] text-text-secondary mt-0.5">
                    anna@example.com
                  </p>
                </div>
                <button className="text-text-muted">
                  <RefreshCw size={16} />
                </button>
              </div>
            )}
            <SettingRow
              icon={<ChevronRight size={18} />}
              label="Apple Calendar"
              description="Not connected"
              right={<ChevronRight size={18} className="text-[#d1d1d1]" />}
            />
          </div>
        </section>

        {/* Reminders section */}
        <section>
          <p className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Reminders
          </p>
          <div className="bg-white border border-border-light rounded-[16px] px-4 divide-y divide-border-faint">
            <SettingRow
              icon={<Bell size={18} />}
              label="Push Notifications"
              description="Get reminded before each task"
              right={<Toggle value={reminders} onChange={setReminders} />}
            />
            {reminders && (
              <div className="py-4">
                <p className="font-gabarito font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
                  Remind me before
                </p>
                <div className="flex gap-2 flex-wrap">
                  {reminderOptions.map((min) => (
                    <button
                      key={min}
                      onClick={() => setReminderMinutes(min)}
                      className={`px-4 py-2 rounded-full font-gabarito font-bold text-[13px] border transition-colors ${
                        reminderMinutes === min
                          ? 'bg-coral border-coral text-white'
                          : 'bg-white border-border-light text-text-secondary'
                      }`}
                    >
                      {min < 60 ? `${min}m` : '1h'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Privacy */}
        <section>
          <p className="font-gabarito font-extrabold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            About
          </p>
          <div className="bg-white border border-border-light rounded-[16px] px-4 divide-y divide-border-faint">
            <SettingRow
              icon={<Shield size={18} />}
              label="Privacy Policy"
              right={<ChevronRight size={18} className="text-[#d1d1d1]" />}
            />
          </div>
        </section>

        {/* Placeholder CTA */}
        <div className="bg-[#fff5f3] border border-[#fcd5cc] rounded-[16px] p-4">
          <p className="font-gabarito font-bold text-[14px] text-coral mb-1">
            Coming soon
          </p>
          <p className="font-gabarito text-[13px] text-text-secondary">
            Live calendar sync and push notifications will be available once you connect a backend.
          </p>
        </div>

        <Button fullWidth variant="secondary" onClick={() => {}}>
          Connect Google Calendar
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
