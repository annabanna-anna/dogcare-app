import { useState } from 'react'
import {
  CalendarDays,
  Bell,
  ChevronRight,
  Check,
  RefreshCw,
  Shield,
  PawPrint,
  Pill,
  X,
} from 'lucide-react'
import DogBowlIcon from '../components/icons/DogBowlIcon'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import type { TaskType } from '../types'

type SyncStyle = 'event' | 'reminder'
type SyncMode = 'events' | 'reminders' | 'custom'

const SYNC_TYPES: { type: TaskType; label: string; Icon: React.ComponentType<{ size?: string | number; className?: string }> }[] = [
  { type: 'walk', label: 'Walks', Icon: PawPrint },
  { type: 'meal', label: 'Meals', Icon: DogBowlIcon },
  { type: 'medication', label: 'Medication', Icon: Pill },
  { type: 'potty', label: 'Potty breaks', Icon: PawPrint },
]

const DEFAULT_TYPE_MAP: Record<TaskType, SyncStyle> = {
  walk: 'event',
  meal: 'reminder',
  medication: 'reminder',
  potty: 'event',
  other: 'event',
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        value ? 'bg-green-vivid' : 'bg-[#d1d5db]'
      }`}
    >
      <div
        className={`absolute top-1 size-4 rounded-full bg-white transition-transform duration-200 ${
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

function ModeCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean
  title: string
  description: string
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-[12px] border p-3.5 flex items-start gap-3 transition-colors ${
        selected ? 'border-coral bg-[#fff5f3]' : 'border-border-light bg-white'
      }`}
    >
      <div
        className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
          selected ? 'border-coral bg-coral' : 'border-[#d1d5db] bg-white'
        }`}
      >
        {selected && <Check size={12} strokeWidth={3} className="text-white" />}
      </div>
      <div>
        <p className="font-dm font-bold text-[14px] text-text-primary leading-none">
          {title}
        </p>
        <p className="font-dm text-[12px] text-text-secondary mt-1 leading-snug">
          {description}
        </p>
      </div>
    </button>
  )
}

function StylePills({
  value,
  onChange,
}: {
  value: SyncStyle
  onChange: (v: SyncStyle) => void
}) {
  return (
    <div className="flex gap-1.5 shrink-0">
      {(['event', 'reminder'] as SyncStyle[]).map((style) => (
        <button
          key={style}
          onClick={() => onChange(style)}
          className={`px-3 py-1.5 rounded-full font-dm font-bold text-[12px] border transition-colors ${
            value === style
              ? 'bg-coral border-coral text-white'
              : 'bg-white border-border-light text-text-secondary'
          }`}
        >
          {style === 'event' ? 'Event' : 'Reminder'}
        </button>
      ))}
    </div>
  )
}

function SyncAsChooser({
  mode,
  onModeChange,
  typeMap,
  onTypeMapChange,
}: {
  mode: SyncMode
  onModeChange: (m: SyncMode) => void
  typeMap: Record<TaskType, SyncStyle>
  onTypeMapChange: (m: Record<TaskType, SyncStyle>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <ModeCard
        selected={mode === 'events'}
        title="Calendar events"
        description="Every task blocks time on your Google / iOS calendar."
        onSelect={() => onModeChange('events')}
      />
      <ModeCard
        selected={mode === 'reminders'}
        title="Reminders"
        description="Every task goes to Google Tasks / iOS Reminders with an alert."
        onSelect={() => onModeChange('reminders')}
      />
      <ModeCard
        selected={mode === 'custom'}
        title="Choose per task type"
        description="Mix both — e.g. walks as events, meals as reminders."
        onSelect={() => onModeChange('custom')}
      />
      {mode === 'custom' && (
        <div className="bg-white border border-border-light rounded-[12px] px-4 divide-y divide-border-faint mt-1">
          {SYNC_TYPES.map(({ type, label, Icon }) => (
            <div key={type} className="flex items-center gap-3 py-3">
              <div className="size-8 rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0 text-text-secondary">
                <Icon size={15} />
              </div>
              <p className="flex-1 font-dm font-bold text-[14px] text-text-primary">
                {label}
              </p>
              <StylePills
                value={typeMap[type]}
                onChange={(style) => onTypeMapChange({ ...typeMap, [type]: style })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SyncPromptSheet({
  mode,
  onModeChange,
  typeMap,
  onTypeMapChange,
  onConfirm,
  onCancel,
}: {
  mode: SyncMode
  onModeChange: (m: SyncMode) => void
  typeMap: Record<TaskType, SyncStyle>
  onTypeMapChange: (m: Record<TaskType, SyncStyle>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-[430px] bg-cream rounded-t-[22px] px-6 pt-5 pb-8 max-h-[85svh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <p className="font-outfit font-bold text-[22px] text-text-primary leading-tight">
            How should tasks sync?
          </p>
          <button
            onClick={onCancel}
            className="size-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-text-secondary shrink-0"
          >
            <X size={16} />
          </button>
        </div>
        <p className="font-dm text-[13px] text-text-secondary mb-4">
          Pick how care tasks appear in your calendar app. You can change this anytime in
          Settings.
        </p>
        <SyncAsChooser
          mode={mode}
          onModeChange={onModeChange}
          typeMap={typeMap}
          onTypeMapChange={onTypeMapChange}
        />
        <div className="mt-5">
          <Button fullWidth onClick={onConfirm}>
            Save & Sync
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SyncSettingsPage() {
  const [calendarSync, setCalendarSync] = useState(true)
  const [reminders, setReminders] = useState(true)
  const [reminderMinutes, setReminderMinutes] = useState(15)
  const [syncMode, setSyncMode] = useState<SyncMode>('events')
  const [typeMap, setTypeMap] = useState<Record<TaskType, SyncStyle>>(DEFAULT_TYPE_MAP)
  const [showSyncPrompt, setShowSyncPrompt] = useState(false)

  const reminderOptions = [5, 10, 15, 30, 60]

  const syncSummary =
    syncMode === 'events'
      ? 'All tasks as calendar events'
      : syncMode === 'reminders'
        ? 'All tasks as reminders'
        : 'Custom per task type'

  function requestConnect() {
    setShowSyncPrompt(true)
  }

  function handleCalendarToggle(on: boolean) {
    if (on) {
      requestConnect()
    } else {
      setCalendarSync(false)
    }
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
          <div className="bg-white border border-border-light rounded-[16px] px-4 divide-y divide-border-faint">
            <SettingRow
              icon={<CalendarDays size={18} />}
              label="Google Calendar"
              description={calendarSync ? `Synced · ${syncSummary}` : 'Not connected'}
              right={<Toggle value={calendarSync} onChange={handleCalendarToggle} />}
            />
            {calendarSync && (
              <div className="py-4 flex items-center gap-3">
                <div className="size-9 rounded-[10px] bg-[#dcfce7] flex items-center justify-center shrink-0">
                  <Check size={16} className="text-[#15803d]" />
                </div>
                <div className="flex-1">
                  <p className="font-dm font-bold text-[15px] text-[#15803d] leading-none">
                    Connected
                  </p>
                  <p className="font-dm text-[13px] text-text-secondary mt-0.5">
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

        {/* Sync style section */}
        {calendarSync && (
          <section>
            <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
              Sync Tasks As
            </p>
            <SyncAsChooser
              mode={syncMode}
              onModeChange={setSyncMode}
              typeMap={typeMap}
              onTypeMapChange={setTypeMap}
            />
          </section>
        )}

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
          </div>
        </section>

        {/* Placeholder CTA */}
        <div className="bg-[#fff5f3] border border-[#fcd5cc] rounded-[16px] p-4">
          <p className="font-dm font-bold text-[14px] text-coral mb-1">
            Coming soon
          </p>
          <p className="font-dm text-[13px] text-text-secondary">
            Live calendar sync and push notifications will be available once you connect a
            backend.
          </p>
        </div>

        {!calendarSync && (
          <Button fullWidth variant="secondary" onClick={requestConnect}>
            Connect Google Calendar
          </Button>
        )}
      </div>

      {showSyncPrompt && (
        <SyncPromptSheet
          mode={syncMode}
          onModeChange={setSyncMode}
          typeMap={typeMap}
          onTypeMapChange={setTypeMap}
          onConfirm={() => {
            setCalendarSync(true)
            setShowSyncPrompt(false)
          }}
          onCancel={() => setShowSyncPrompt(false)}
        />
      )}

      <BottomNav />
    </div>
  )
}
