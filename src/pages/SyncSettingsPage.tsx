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
  Pencil,
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
  getPushFormats,
  setPushFormat,
  getLastPushError,
  type PushFormat,
} from '../lib/googleCalendar'
import type { TaskType } from '../types'

const taskTypeLabels: { value: TaskType; label: string }[] = [
  { value: 'walk', label: 'Walks' },
  { value: 'meal', label: 'Meals' },
  { value: 'medication', label: 'Medication' },
  { value: 'potty', label: 'Potty breaks' },
  { value: 'other', label: 'Other' },
]

function PurposeRow({ done, label, soon }: { done: boolean; label: string; soon?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <CheckCircle2 size={16} className="text-[#15803d] shrink-0" />
      ) : (
        <Circle size={16} className="text-[#d1d5db] shrink-0" />
      )}
      <p className="font-dm text-[13px] text-text-secondary">
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
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        disabled ? 'bg-[#e5e7eb] cursor-not-allowed' : value ? 'bg-green-vivid' : 'bg-[#d1d5db]'
      }`}
    >
      <div
        className={`absolute top-1 size-4 rounded-full transition-transform duration-200 ${
          disabled ? 'bg-[#f9fafb]' : 'bg-white'
        } ${value ? 'translate-x-7' : 'translate-x-1'}`}
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
  const [pushFormats, setPushFormatsState] = useState<Record<TaskType, PushFormat>>(() => getPushFormats())
  const [editingFormats, setEditingFormats] = useState(false)
  const [draftFormats, setDraftFormats] = useState<Record<TaskType, PushFormat>>(() => getPushFormats())
  const [pushError, setPushError] = useState<string | null>(null)
  const [reminders, setReminders] = useState(true)
  const [reminderMinutes, setReminderMinutes] = useState(15)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    setCalendarConnected(isGoogleCalendarConnected())
    setPushEnabledState(isPushEnabled())
    setPushError(getLastPushError())
  }, [])

  function togglePush(on: boolean) {
    setPushEnabled(on)
    setPushEnabledState(on)
  }

  function startEditingFormats() {
    setDraftFormats(pushFormats)
    setEditingFormats(true)
  }

  function cancelEditingFormats() {
    setEditingFormats(false)
  }

  function saveFormats() {
    for (const type of Object.keys(draftFormats) as TaskType[]) {
      if (draftFormats[type] !== pushFormats[type]) setPushFormat(type, draftFormats[type])
    }
    setPushFormatsState(draftFormats)
    setEditingFormats(false)
  }

  const reminderOptions = [5, 10, 15, 30, 60]

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
    disconnectGoogleCalendar()
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
              <div className="flex items-center justify-between gap-3">
                <PurposeRow done={calendarConnected && pushEnabled} label="Adds tasks to your Google calendar" />
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

              {calendarConnected && pushEnabled && (
                <div className="pt-3 border-t border-border-faint flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-dm font-bold text-[11px] text-text-muted uppercase tracking-wide">
                      Add As
                    </p>
                    {!editingFormats && (
                      <button
                        onClick={startEditingFormats}
                        className="flex items-center gap-1 font-dm font-bold text-[12px] text-coral"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                    )}
                  </div>

                  <p className="font-dm text-[11px] text-text-muted leading-relaxed">
                    Events show as timed blocks on your calendar. Tasks show as checkable to-dos
                    in Google Tasks.
                  </p>

                  {taskTypeLabels.map(({ value, label }) => {
                    const selected = editingFormats ? draftFormats[value] : pushFormats[value]
                    return (
                      <div key={value} className="flex items-center justify-between gap-3">
                        <p className="font-dm text-[13px] text-text-primary">{label}</p>
                        <div
                          className={`relative flex w-[92px] rounded-full border border-border-light bg-white p-0.5 ${
                            editingFormats ? '' : 'opacity-60'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 bottom-0.5 left-0.5 w-[44px] rounded-full bg-coral transition-transform duration-200 ease-out ${
                              selected === 'task' ? 'translate-x-[44px]' : 'translate-x-0'
                            }`}
                          />
                          {(['event', 'task'] as const).map((format) => (
                            <button
                              key={format}
                              onClick={() =>
                                editingFormats &&
                                setDraftFormats((prev) => ({ ...prev, [value]: format }))
                              }
                              className={`relative z-10 w-[44px] py-1 rounded-full font-dm font-bold text-[10px] transition-colors duration-200 ${
                                selected === format ? 'text-white' : 'text-text-primary'
                              } ${editingFormats ? '' : 'cursor-default'}`}
                            >
                              {format === 'event' ? 'Event' : 'Task'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {editingFormats && (
                    <div className="flex gap-2 mt-1">
                      <Button size="sm" onClick={saveFormats}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditingFormats}>
                        Cancel
                      </Button>
                    </div>
                  )}
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
              description="Get reminded before each task"
              right={<Toggle value={reminders} onChange={setReminders} />}
            />
            {reminders && (
              <div className="py-4">
                <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
                  Remind me before
                </p>
                <div className="flex gap-2 flex-wrap">
                  {reminderOptions.map((min) => (
                    <button
                      key={min}
                      onClick={() => setReminderMinutes(min)}
                      className={`px-4 py-2 rounded-full font-dm font-bold text-[13px] border transition-colors ${
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
