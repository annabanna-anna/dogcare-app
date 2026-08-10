import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  CalendarDays,
  Bell,
  ChevronRight,
  CheckCircle2,
  Circle,
  Shield,
  LogOut,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  isGoogleCalendarConnected,
  isPushEnabled,
  setPushEnabled,
  getLastPushError,
} from '../lib/googleCalendar'
import {
  enablePushReminders,
  disablePushReminders,
  isPushReminderEnabled,
  getReminderMinutes,
  setReminderMinutes as savePushReminderMinutes,
} from '../lib/pushNotifications'

function PurposeRow({ done, label, soon }: { done: boolean; label: string; soon?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <CheckCircle2 size={16} className="text-[#15803d] shrink-0" />
      ) : (
        <Circle size={16} className="text-[#d1d5db] shrink-0" />
      )}
      <p className="font-dm text-[13px] text-text-secondary min-w-0">
        {label}
        {soon && <span className="text-text-muted"> (soon)</span>}
      </p>
    </div>
  )
}

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full shrink-0 transition-colors duration-200 ${
        disabled ? 'bg-[#e5e7eb] cursor-not-allowed' : value ? 'bg-green-vivid' : 'bg-[#d1d5db]'
      }`}
    >
      <div
        className={`absolute top-1 size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ${
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
        <p className="font-dm font-bold text-[15px] text-text-primary leading-none">
          {label}
        </p>
        {description && (
          <p className="font-dm text-[13px] text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      {right}
    </div>
  )
}

export default function SyncSettingsPage() {
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [pushEnabled, setPushEnabledState] = useState(true)
  const [pushError, setPushError] = useState<string | null>(null)
  const [reminders, setReminders] = useState(false)
  const [reminderMinutes, setReminderMinutes] = useState(15)
  const [reminderBusy, setReminderBusy] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    setCalendarConnected(isGoogleCalendarConnected())
    setPushEnabledState(isPushEnabled())
    setPushError(getLastPushError())
    isPushReminderEnabled().then((on) => {
      setReminders(on)
      if (on) getReminderMinutes().then(setReminderMinutes)
    })
  }, [])

  function togglePush(on: boolean) {
    setPushEnabled(on)
    setPushEnabledState(on)
  }

  async function toggleReminders(on: boolean) {
    setReminderBusy(true)
    setReminderError(null)
    try {
      if (on) {
        await enablePushReminders(reminderMinutes)
      } else {
        await disablePushReminders()
      }
      setReminders(on)
    } catch (e) {
      setReminderError(e instanceof Error ? e.message : 'Could not update reminders.')
    } finally {
      setReminderBusy(false)
    }
  }

  function pickReminderMinutes(min: number) {
    setReminderMinutes(min)
    if (reminders) void savePushReminderMinutes(min).catch(() => {})
  }

  const reminderOptions = [0, 5, 10, 15, 30, 60]

  async function handleCalendarToggle(on: boolean) {
    if (!on) {
      setShowDisconnectConfirm(true)
      return
    }
    setConnecting(true)
    setConnectError(null)
    try {
      await connectGoogleCalendar()
      // Browser navigates away to Google here; nothing after this runs
      // unless the request itself failed before redirecting.
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Could not connect Google Calendar.')
      setConnecting(false)
    }
  }

  function confirmDisconnect() {
    // Local state is cleared synchronously inside disconnectGoogleCalendar,
    // so the UI can flip immediately while the stored refresh token is
    // dropped server-side in the background.
    void disconnectGoogleCalendar()
    setCalendarConnected(false)
    setShowDisconnectConfirm(false)
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader title="Settings" />

      <div className="px-6 mt-4 flex flex-col gap-4">
        {/* Sync section */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Calendar Sync
          </p>
          {connectError && (
            <div className="flex items-start gap-2 bg-[#fee2e2] rounded-[12px] px-4 py-3 mb-3">
              <AlertCircle size={16} className="text-[#b91c1c] shrink-0 mt-0.5" />
              <p className="font-dm text-[13px] text-[#b91c1c]">{connectError}</p>
            </div>
          )}
          <div className="bg-white border border-border-light rounded-[16px] px-4">
            <SettingRow
              icon={<CalendarDays size={18} />}
              label="Google Calendar"
              description={
                connecting ? 'Connecting…' : calendarConnected ? userEmail ?? 'Connected' : 'Not connected'
              }
              right={
                <Toggle
                  value={calendarConnected}
                  onChange={(on) => void handleCalendarToggle(on)}
                />
              }
            />
            <div className="pb-4 flex flex-col gap-3">
              <PurposeRow done={calendarConnected} label="Shows your Rover bookings" />
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0 flex items-center gap-2.5">
                  {calendarConnected && pushEnabled ? (
                    <CheckCircle2 size={16} className="text-[#15803d] shrink-0" />
                  ) : (
                    <Circle size={16} className="text-[#d1d5db] shrink-0" />
                  )}
                  <p className="font-dm text-[13px] text-text-secondary">
                    Adds tasks as events on your Google calendar
                  </p>
                </div>
                <Toggle
                  value={pushEnabled}
                  onChange={togglePush}
                  disabled={!calendarConnected}
                />
              </div>

              {calendarConnected && pushEnabled && pushError && (
                <div className="flex items-start gap-2 bg-[#fee2e2] rounded-[12px] px-3 py-2.5">
                  <AlertCircle size={15} className="text-[#b91c1c] shrink-0 mt-0.5" />
                  <p className="font-dm text-[12px] text-[#b91c1c] leading-snug">
                    Last push didn't go through: {pushError}
                  </p>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* Reminders section */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Reminders
          </p>
          <div className="bg-white border border-border-light rounded-[16px] px-4 divide-y divide-border-faint">
            <SettingRow
              icon={<Bell size={18} />}
              label="Push Notifications"
              description={reminderBusy ? 'Updating…' : 'Get reminded before each task'}
              right={
                <Toggle
                  value={reminders}
                  onChange={(on) => void toggleReminders(on)}
                  disabled={reminderBusy}
                />
              }
            />
            {reminderError && (
              <div className="py-3">
                <div className="flex items-start gap-2 bg-[#fee2e2] rounded-[12px] px-3 py-2.5">
                  <AlertCircle size={15} className="text-[#b91c1c] shrink-0 mt-0.5" />
                  <p className="font-dm text-[12px] text-[#b91c1c] leading-snug">{reminderError}</p>
                </div>
              </div>
            )}
            {reminders && (
              <div className="py-4">
                <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
                  Remind me before
                </p>
                <div className="flex gap-2 flex-wrap">
                  {reminderOptions.map((min) => (
                    <button
                      key={min}
                      onClick={() => pickReminderMinutes(min)}
                      className={`px-4 py-2 rounded-full font-dm font-bold text-[13px] border transition-colors ${
                        reminderMinutes === min
                          ? 'bg-coral border-coral text-white'
                          : 'bg-white border-border-light text-text-secondary'
                      }`}
                    >
                      {min === 0 ? 'On time' : min < 60 ? `${min}m` : '1h'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Privacy */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            About
          </p>
          <div className="bg-white border border-border-light rounded-[16px] px-4 divide-y divide-border-faint">
            <SettingRow
              icon={<Shield size={18} />}
              label="Privacy Policy"
              right={<ChevronRight size={18} className="text-[#d1d1d1]" />}
            />
            <button
              className="w-full text-left"
              onClick={() => void supabase.auth.signOut()}
            >
              <SettingRow
                icon={<LogOut size={18} />}
                label="Log Out"
                description={userEmail ?? undefined}
                right={<ChevronRight size={18} className="text-[#d1d1d1]" />}
              />
            </button>
          </div>
        </section>

        {!calendarConnected && (
          <Button
            fullWidth
            variant="secondary"
            disabled={connecting}
            onClick={() => void handleCalendarToggle(true)}
          >
            {connecting ? 'Connecting…' : 'Connect Google Calendar'}
          </Button>
        )}
      </div>

      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDisconnectConfirm(false)}
          />
          <div className="relative w-full max-w-[380px] bg-cream rounded-[22px] p-6">
            <p className="font-outfit font-bold text-[20px] text-text-primary leading-tight mb-2">
              Disconnect Google Calendar?
            </p>
            <p className="font-dm text-[14px] text-text-secondary leading-relaxed mb-5">
              You'll stop seeing Rover bookings and Google Calendar events in the Calendar
              tab until you reconnect.
            </p>
            <div className="flex flex-col gap-2">
              <Button fullWidth variant="danger" onClick={confirmDisconnect}>
                Disconnect
              </Button>
              <Button fullWidth variant="ghost" onClick={() => setShowDisconnectConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
