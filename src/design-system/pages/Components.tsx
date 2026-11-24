import { useState, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Utensils, AlertTriangle, Plus } from 'lucide-react'
import { DocHeader, Playground, PropsTable, Rule, Section, SourceFile, Specimen } from '../ui'
import Button from '../../components/Button'
import Switch from '../../components/Switch'
import RadioDot from '../../components/RadioDot'
import StatusChip from '../../components/StatusChip'
import TaskCard from '../../components/TaskCard'
import DogCard from '../../components/DogCard'
import DogTabs from '../../components/DogTabs'
import DogPhotoStack from '../../components/DogPhotoStack'
import PageHeader from '../../components/PageHeader'
import BottomNav from '../../components/BottomNav'
import CareNoteSection from '../../components/CareNoteSection'
import LastOutPrompt from '../../components/LastOutPrompt'
import PhoneFrame from '../../components/PhoneFrame'
import { RadioCard } from '../../components/GoingOutFields'
import { TimePickerButton, TimeWheel } from '../../components/TimePicker'
import { AddButton, Chips, TextField } from '../../components/DogSetupWizard'
import { TASK_TYPE_STYLE } from '../../components/taskTypeStyle'
import type { Dog, Stay, Task, TaskStatus, TaskType } from '../../types'

// ─── Sample data ────────────────────────────────────────────────────────────

const PHOTOS = ['/how-it-works/step4-luna.png', '/how-it-works/step4-poppy.png', '/how-it-works/step4-puffin.png']
const NAMES = ['Luna', 'Poppy', 'Puffin']
const BREEDS = ['Shiba Inu', 'Cavalier', 'Corgi']

const notes = {
  behaviorNotes: '', foodNotes: '', medicationNotes: '', walkNotes: '', emergencyNotes: '', otherNotes: '',
  hasAllergies: 'unsure', allergyNotes: '', goesToDogParks: 'unsure', dogParkNotes: '',
} as const

function sampleDog(count: number, photos: boolean, owner: string): Dog {
  return {
    ...notes,
    id: 'demo',
    name: NAMES[0],
    breed: BREEDS[0],
    size: 'medium',
    photoUrl: photos ? PHOTOS[0] : undefined,
    additionalDogs: Array.from({ length: count - 1 }, (_, i) => ({
      ...notes,
      id: `m${i}`,
      name: NAMES[i + 1],
      breed: BREEDS[i + 1],
      size: 'small' as const,
      photoUrl: photos ? PHOTOS[i + 1] : undefined,
    })),
    ownerName: owner,
    ownerContact: '',
    walkTimeFlexible: false,
    careSchedule: [],
    outingRule: null,
    createdAt: '',
    updatedAt: '',
  }
}

function sampleStay(kind: string): Stay | undefined {
  const day = 86_400_000
  const now = Date.now()
  if (kind === 'none') return undefined
  const [s, e] = kind === 'active' ? [now - day, now + 3 * day] : [now + 4 * day, now + 7 * day]
  return { id: 's', dogId: 'demo', startDate: new Date(s).toISOString(), endDate: new Date(e).toISOString(), createdAt: '' }
}

function at(h: number, m = 0) {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

/** Wraps components that call useNavigate/useLocation. Each preview gets its
 *  own in-memory router so clicks never leave the design system. */
function Routed({ children, path = '/dogs' }: { children: ReactNode; path?: string }) {
  return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
}

// ─── Doc page template ──────────────────────────────────────────────────────

function ComponentDoc({
  group,
  name,
  description,
  source,
  playground,
  variants,
  rules,
  props,
}: {
  group: string
  name: string
  description: ReactNode
  source: string
  playground: ReactNode
  variants?: ReactNode
  rules?: ReactNode
  props?: Parameters<typeof PropsTable>[0]['rows']
}) {
  return (
    <>
      <DocHeader eyebrow={group} title={name}>
        {description}
      </DocHeader>
      <Section title="Playground">{playground}</Section>
      {variants && <Section title="Variants">{variants}</Section>}
      {rules && <Section title="Rules">{rules}</Section>}
      {props && <Section title="Props"><PropsTable rows={props} /></Section>}
      <Section title="Source">
        <SourceFile path={source} />
      </Section>
    </>
  )
}

// ─── Stories ────────────────────────────────────────────────────────────────

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger', 'danger-ghost'] as const
const SIZES = ['sm', 'md', 'lg'] as const

function ButtonDoc() {
  return (
    <ComponentDoc
      group="Actions"
      name="Button"
      source="src/components/Button.tsx"
      description="Full pills with bold DM Sans. Primary is Ember. Danger is a soft red so deleting never looks like brand emphasis."
      playground={
        <Playground
          initial={{ label: 'Start stay', variant: 'primary', size: 'md', disabled: false, fullWidth: false }}
          controls={{
            label: { type: 'text' },
            variant: { type: 'radio', options: VARIANTS },
            size: { type: 'radio', options: SIZES },
            disabled: { type: 'boolean' },
            fullWidth: { type: 'boolean' },
          }}
          render={(a) => (
            <div className="flex justify-center">
              <Button variant={a.variant as (typeof VARIANTS)[number]} size={a.size as (typeof SIZES)[number]} disabled={a.disabled} fullWidth={a.fullWidth}>
                {a.label}
              </Button>
            </div>
          )}
          code={(a) =>
            `<Button${a.variant !== 'primary' ? ` variant="${a.variant}"` : ''}${a.size !== 'md' ? ` size="${a.size}"` : ''}${a.disabled ? ' disabled' : ''}${a.fullWidth ? ' fullWidth' : ''}>\n  ${a.label}\n</Button>`
          }
        />
      }
      variants={
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {VARIANTS.map((v) => (
            <Specimen key={v} label={v}>
              <Button variant={v} size="sm">{v === 'primary' ? 'Save' : v.startsWith('danger') ? 'Delete' : 'Cancel'}</Button>
            </Specimen>
          ))}
        </div>
      }
      rules={
        <Rule name="Edit screens">
          Save stays disabled until the form differs from what was loaded. Compare against a snapshot taken on load, so
          changing a value and changing it back disables Save again. Delete stays enabled.
        </Rule>
      }
      props={[
        ['variant', "'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'", "'primary'", 'Visual weight.'],
        ['size', "'sm' | 'md' | 'lg'", "'md'", 'Padding and text size.'],
        ['fullWidth', 'boolean', 'false', 'Stretch to the container.'],
        ['…rest', 'ButtonHTMLAttributes', '', 'onClick, disabled, type, etc.'],
      ]}
    />
  )
}

const CHIP_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
]

function ChipsDoc() {
  const [multi, setMulti] = useState<string[]>(['luna'])
  return (
    <ComponentDoc
      group="Actions"
      name="Chips"
      source="src/components/DogSetupWizard.tsx"
      description="Pill choices for short, quick answers. Selected chips fill with Ember. Pass an array as the value for multi-select."
      playground={
        <Playground
          initial={{ value: 'yes' }}
          controls={{}}
          render={(a, set) => (
            <div className="space-y-6">
              <Chips options={CHIP_OPTIONS} value={a.value} onChange={(v) => set({ value: v ?? '' })} />
              <div>
                <p className="font-dm font-bold text-[12px] text-text-secondary mb-2">Multi-select (Who’s staying?)</p>
                <Chips
                  options={NAMES.map((n) => ({ value: n.toLowerCase(), label: n }))}
                  value={multi}
                  onChange={(v) => setMulti((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]))}
                />
              </div>
            </div>
          )}
          code={(a) => `<Chips\n  options={[{ value: 'yes', label: 'Yes' }, …]}\n  value="${a.value}"\n  onChange={setValue}\n/>`}
        />
      }
      props={[
        ['options', '{ value: T; label: string }[]', '', 'Choices in order.'],
        ['value', 'T | T[] | null', '', 'One value, or an array for multi-select.'],
        ['onChange', '(v: T) => void', '', 'Called with the tapped value.'],
      ]}
    />
  )
}

function AddButtonDoc() {
  const [items, setItems] = useState(1)
  return (
    <ComponentDoc
      group="Actions"
      name="AddButton"
      source="src/components/DogSetupWizard.tsx"
      description="A dashed, full-width button that adds another row to a list: a meal, a medicine, another dog."
      playground={
        <Playground
          initial={{ label: 'Add another meal' }}
          controls={{ label: { type: 'text' } }}
          render={(a) => (
            <div className="space-y-3">
              {Array.from({ length: items }, (_, i) => (
                <div key={i} className="rounded-[16px] bg-white border border-border-light px-4 py-3 font-dm text-[14px]">
                  Meal {i + 1}
                </div>
              ))}
              <AddButton onClick={() => setItems((n) => (n >= 4 ? 1 : n + 1))}>{a.label}</AddButton>
            </div>
          )}
          code={(a) => `<AddButton onClick={addMeal}>${a.label}</AddButton>`}
        />
      }
    />
  )
}

function SwitchDoc() {
  return (
    <ComponentDoc
      group="Selection"
      name="Switch"
      source="src/components/Switch.tsx"
      description="A thin track with an oversized knob. When on, the knob carries a check so the state reads without relying on color. 44px tall tap target that adds no row height."
      playground={
        <Playground
          initial={{ checked: true as boolean, disabled: false, label: 'Ask when it happened' }}
          controls={{ checked: { type: 'boolean' }, disabled: { type: 'boolean' }, label: { type: 'text' } }}
          render={(a, set) => (
            <div className="flex items-center justify-between rounded-[16px] bg-white border border-border-light px-4 py-4">
              <span className="font-dm font-bold text-[16px] text-text-primary">{a.label}</span>
              <Switch checked={a.checked} disabled={a.disabled} onChange={(v) => set({ checked: v })} label={a.label} />
            </div>
          )}
          code={(a) => `<Switch\n  checked={${a.checked}}\n  onChange={setChecked}${a.disabled ? '\n  disabled' : ''}\n  label="${a.label}"\n/>`}
        />
      }
      variants={
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Specimen label="Off"><Switch checked={false} onChange={() => {}} /></Specimen>
          <Specimen label="On"><Switch checked onChange={() => {}} /></Specimen>
          <Specimen label="Off · disabled"><Switch checked={false} disabled onChange={() => {}} /></Specimen>
          <Specimen label="On · disabled"><Switch checked disabled onChange={() => {}} /></Specimen>
        </div>
      }
      props={[
        ['checked', 'boolean', '', 'Current state.'],
        ['onChange', '(next: boolean) => void', '', 'Called with the new state.'],
        ['disabled', 'boolean', 'false', 'Dims and blocks input.'],
        ['label', 'string', '', 'Accessible name when no visible label is linked.'],
      ]}
    />
  )
}

function RadioDoc() {
  const [pick, setPick] = useState('set-times')
  const opts = [
    ['set-times', 'At set times', 'e.g. 8 AM and 5 PM'],
    ['time-of-day', 'Rough time of day', 'Morning, midday, afternoon or evening'],
    ['unsure', 'Not sure yet', 'Log walks on Today as they happen'],
  ]
  return (
    <ComponentDoc
      group="Selection"
      name="RadioDot & RadioCard"
      source="src/components/RadioDot.tsx"
      description="RadioDot is the visual circle: a thick ring when selected. RadioCard wraps it in a selectable card that reveals its own settings when chosen."
      playground={
        <Playground
          initial={{ selected: true as boolean, size: 'md', tone: 'coral' }}
          controls={{ selected: { type: 'boolean' }, size: { type: 'radio', options: ['sm', 'md'] }, tone: { type: 'radio', options: ['coral', 'ink'] } }}
          render={(a, set) => (
            <button type="button" role="radio" aria-checked={a.selected} onClick={() => set({ selected: !a.selected })} className="flex items-center gap-3 mx-auto">
              <RadioDot selected={a.selected} size={a.size as 'sm' | 'md'} tone={a.tone as 'coral' | 'ink'} />
              <span className="font-dm font-bold text-[16px]">Move the rest too</span>
            </button>
          )}
          code={(a) => `<RadioDot selected={${a.selected}}${a.size !== 'md' ? ` size="${a.size}"` : ''}${a.tone !== 'coral' ? ` tone="${a.tone}"` : ''} />`}
        />
      }
      variants={
        <div className="space-y-3 max-w-[390px]" role="radiogroup">
          {opts.map(([v, l, h]) => (
            <RadioCard key={v} selected={pick === v} label={l} hint={h} onSelect={() => setPick(v)}>
              <p className="font-dm text-[14px] text-text-secondary">Settings for “{l}” appear here.</p>
            </RadioCard>
          ))}
        </div>
      }
      rules={<Rule name="Accessibility">RadioDot is aria-hidden. The parent button carries role="radio" and aria-checked.</Rule>}
    />
  )
}

function DogTabsDoc() {
  return (
    <ComponentDoc
      group="Selection"
      name="DogTabs"
      source="src/components/DogTabs.tsx"
      description="Segmented switcher between the dogs on one profile. A white pill slides behind the active tab; photos are circles because they sit in a pill."
      playground={
        <Playground
          initial={{ count: 2, photos: true, value: 'luna' }}
          controls={{ count: { type: 'number', min: 2, max: 3 }, photos: { type: 'boolean' } }}
          render={(a, set) => (
            <DogTabs
              dogs={NAMES.slice(0, a.count).map((n, i) => ({ key: n.toLowerCase(), name: n, photoUrl: a.photos ? PHOTOS[i] : undefined }))}
              value={a.value}
              onChange={(k) => set({ value: k })}
            />
          )}
          code={(a) => `<DogTabs\n  dogs={[${NAMES.slice(0, a.count).map((n) => `{ key: '${n.toLowerCase()}', name: '${n}' }`).join(', ')}]}\n  value="${a.value}"\n  onChange={setDog}\n/>`}
        />
      }
    />
  )
}

function StatusDoc() {
  const statuses: TaskStatus[] = ['pending', 'done', 'overdue']
  const types = Object.keys(TASK_TYPE_STYLE) as TaskType[]
  return (
    <ComponentDoc
      group="Display"
      name="StatusChip & task badges"
      source="src/components/StatusChip.tsx"
      description="Each status owns a fixed background and text pair. Each task type owns one icon and one color. Neither is ever recolored locally."
      playground={
        <Playground
          initial={{ status: 'done' }}
          controls={{ status: { type: 'radio', options: statuses } }}
          render={(a) => (
            <div className="flex justify-center">
              <StatusChip status={a.status as TaskStatus} />
            </div>
          )}
          code={(a) => `<StatusChip status="${a.status}" />`}
        />
      }
      variants={
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {types.map((t) => {
            const { icon: Icon, bg } = TASK_TYPE_STYLE[t]
            return (
              <Specimen key={t} label={t}>
                <span className={`size-8 rounded-full flex items-center justify-center text-white ${bg}`}>
                  <Icon size={16} />
                </span>
              </Specimen>
            )
          })}
        </div>
      }
      rules={
        <Rule name="The Task Icon Rule">
          Import <code className="font-mono">TASK_TYPE_STYLE</code> from src/components/taskTypeStyle.ts. Icons are white on the colored circle.
        </Rule>
      }
    />
  )
}

function PhotoDoc() {
  return (
    <ComponentDoc
      group="Display"
      name="DogPhotoStack"
      source="src/components/DogPhotoStack.tsx"
      description="One dog’s photo, or a group’s photos stacked diagonally with the first dog in front. Falls back to the neutral DogIcon avatar."
      playground={
        <Playground
          initial={{ count: 1, photos: true, size: 64, radius: 12 }}
          controls={{
            count: { type: 'number', min: 1, max: 3 },
            photos: { type: 'boolean' },
            size: { type: 'number', min: 32, max: 120, step: 4 },
            radius: { type: 'number', min: 0, max: 60 },
          }}
          render={(a) => (
            <div className="flex justify-center">
              <DogPhotoStack
                dogs={NAMES.slice(0, a.count).map((n, i) => ({ name: n, photoUrl: a.photos ? PHOTOS[i] : undefined }))}
                size={a.size}
                radius={a.radius}
                stackRadius={a.radius}
                ringClassName="ring-cream"
              />
            </div>
          )}
          code={(a) => `<DogPhotoStack\n  dogs={dogs}\n  size={${a.size}}\n  radius={${a.radius}}\n  stackRadius={${a.radius}}\n  ringClassName="ring-cream"\n/>`}
        />
      }
      rules={<Rule name="The Shape Match Rule">Set radius to container radius − padding. In a pill, use size / 2 for a circle.</Rule>}
    />
  )
}

function CareNoteDoc() {
  return (
    <ComponentDoc
      group="Display"
      name="CareNoteSection"
      source="src/components/CareNoteSection.tsx"
      description="A white content block with an Ember icon and an uppercase label. Used for the care instructions on a dog’s profile."
      playground={
        <Playground
          initial={{ title: 'Food', content: 'Two scoops at 7am and 6pm. Soak for ten minutes first.', emergency: false }}
          controls={{ title: { type: 'text' }, content: { type: 'text' }, emergency: { type: 'boolean', label: 'Emergency icon' } }}
          render={(a) => (
            <CareNoteSection
              title={a.title}
              content={a.content}
              icon={a.emergency ? <AlertTriangle size={16} /> : <Utensils size={16} />}
            />
          )}
          code={(a) => `<CareNoteSection\n  title="${a.title}"\n  icon={<${a.emergency ? 'AlertTriangle' : 'Utensils'} size={16} />}\n  content={dog.foodNotes}\n/>`}
        />
      }
    />
  )
}

function TextFieldDoc() {
  return (
    <ComponentDoc
      group="Inputs"
      name="TextField"
      source="src/components/DogSetupWizard.tsx"
      description="White field with a hairline border that turns Ember on focus. Multiline grows with its content. On touch devices the font floors at 16px so iOS never zooms."
      playground={
        <Playground
          initial={{ value: '', placeholder: 'e.g. Half a pill wrapped in cheese', multiline: false }}
          controls={{ placeholder: { type: 'text' }, multiline: { type: 'boolean' } }}
          render={(a, set) => (
            <TextField value={a.value} onChange={(v) => set({ value: v })} placeholder={a.placeholder} multiline={a.multiline} />
          )}
          code={(a) => `<TextField\n  value={value}\n  onChange={setValue}\n  placeholder="${a.placeholder}"${a.multiline ? '\n  multiline' : ''}\n/>`}
        />
      }
    />
  )
}

function TimeDoc() {
  return (
    <ComponentDoc
      group="Inputs"
      name="TimePicker"
      source="src/components/TimePicker.tsx"
      description="A looping wheel in 5-minute steps. TimePickerButton is the field-style trigger that opens the wheel in a bottom sheet."
      playground={
        <Playground
          initial={{ value: '08:00' }}
          controls={{}}
          contain
          minHeight={460}
          render={(a, set) => (
            <div className="space-y-6">
              <TimePickerButton
                value={a.value}
                onChange={(v) => set({ value: v })}
                className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm font-bold text-[16px] text-text-primary"
              />
              <p className="font-dm text-[12px] text-text-muted text-center">Tap the field to open the sheet, or scroll the wheel below.</p>
              <TimeWheel value={a.value} onChange={(v) => set({ value: v })} />
            </div>
          )}
          code={(a) => `<TimePickerButton value="${a.value}" onChange={setTime} />`}
        />
      }
    />
  )
}

function TaskCardDoc() {
  const [key, setKey] = useState(0)
  return (
    <ComponentDoc
      group="Patterns"
      name="TaskCard"
      source="src/components/TaskCard.tsx"
      description="One task row on Today. Swipe left to mark it done, right to undo. There is no tap fallback: the row is the control. Try it on the canvas."
      playground={
        <Playground
          initial={{ type: 'walk', status: 'pending', title: 'Morning walk', note: 'Loop around the park', dogName: 'Luna', hour: 23, showDogName: true, onlyFor: '', dense: false }}
          controls={{
            type: { type: 'radio', options: Object.keys(TASK_TYPE_STYLE) },
            status: { type: 'radio', options: ['pending', 'done'] },
            title: { type: 'text' },
            note: { type: 'text' },
            hour: { type: 'number', min: 0, max: 23, label: 'Time (hour) — past hours read as overdue' },
            onlyFor: { type: 'text', label: 'onlyFor (e.g. Poppy)' },
            showDogName: { type: 'boolean' },
            dense: { type: 'boolean' },
          }}
          render={(a, set) => {
            const task: Task = {
              id: 't1', stayId: 's', dogId: 'd', dogName: a.dogName, type: a.type as TaskType, title: a.title,
              note: a.note || undefined, scheduledTime: at(a.hour), status: a.status as TaskStatus,
            }
            return (
              <div key={`${key}-${a.status}`} className="px-4">
                <TaskCard
                  task={task}
                  showDogName={a.showDogName}
                  onlyFor={a.onlyFor || undefined}
                  dense={a.dense}
                  onDone={() => { set({ status: 'done' }); setKey((k) => k + 1) }}
                  onUndo={() => { set({ status: 'pending' }); setKey((k) => k + 1) }}
                />
              </div>
            )
          }}
          code={(a) => `<TaskCard\n  task={task} // type: '${a.type}', status: '${a.status}'\n  onDone={markDone}\n  onUndo={undo}${a.onlyFor ? `\n  onlyFor="${a.onlyFor}"` : ''}${!a.showDogName ? '\n  showDogName={false}' : ''}${a.dense ? '\n  dense' : ''}\n/>`}
        />
      }
      props={[
        ['task', 'Task', '', 'The task to show.'],
        ['onDone / onUndo', '(id: string) => void', '', 'Fired by a committed swipe.'],
        ['showDogName', 'boolean', 'true', 'Hide when the list is already scoped to one dog.'],
        ['onlyFor', 'string', '', '“Artemis only” for a task covering some of a stay’s dogs.'],
        ['dense', 'boolean', 'false', 'Compact sizing for marketing mockups.'],
        ['plan', '{ at; reason; next }', '', 'A long walk placed by the going-out clock.'],
        ['passed', 'boolean', '', 'A walk window that closed before the clock started.'],
        ['onEdit', '() => void', '', 'Makes the time tappable.'],
      ]}
    />
  )
}

function DogCardDoc() {
  return (
    <ComponentDoc
      group="Patterns"
      name="DogCard"
      source="src/components/DogCard.tsx"
      description="A row on the Dogs list. Concentric corners: 26px card = 12px photo + 14px padding. The stay tag is filled while staying and outlined when upcoming."
      playground={
        <Playground
          initial={{ count: 1, photos: true, owner: 'Maya Chen', stay: 'active' }}
          controls={{
            count: { type: 'number', min: 1, max: 3, label: 'Dogs on profile' },
            photos: { type: 'boolean' },
            owner: { type: 'text' },
            stay: { type: 'radio', options: ['none', 'upcoming', 'active'] },
          }}
          render={(a) => (
            <Routed>
              <DogCard dog={sampleDog(a.count, a.photos, a.owner)} nextStay={sampleStay(a.stay)} />
            </Routed>
          )}
          code={() => `<DogCard dog={dog} nextStay={nextStay} />`}
        />
      }
    />
  )
}

function LastOutDoc() {
  return (
    <ComponentDoc
      group="Patterns"
      name="LastOutPrompt"
      source="src/components/LastOutPrompt.tsx"
      description="A dashed Ember card asking when the dog was last out, so the going-out clock has a starting point."
      playground={
        <Playground
          initial={{ dogName: 'Luna' }}
          controls={{ dogName: { type: 'text' } }}
          render={(a) => <LastOutPrompt dogName={a.dogName} onJustNow={() => {}} onPickTime={() => {}} />}
          code={(a) => `<LastOutPrompt dogName="${a.dogName}" onJustNow={logNow} onPickTime={openSheet} />`}
        />
      }
    />
  )
}

function HeaderDoc() {
  return (
    <ComponentDoc
      group="Navigation"
      name="PageHeader"
      source="src/components/PageHeader.tsx"
      description="Cobalt headline over an Ember eyebrow, the system’s signature pairing. Used on every secondary screen."
      playground={
        <Playground
          initial={{ title: 'Dogs', subtitle: '4 profiles', back: false, action: true }}
          controls={{ title: { type: 'text' }, subtitle: { type: 'text' }, back: { type: 'boolean' }, action: { type: 'boolean', label: 'Right action' } }}
          render={(a) => (
            <Routed>
              <PageHeader
                title={a.title}
                subtitle={a.subtitle || undefined}
                back={a.back}
                onBack={() => {}}
                right={a.action ? <Button size="sm"><Plus size={14} />Add</Button> : undefined}
              />
            </Routed>
          )}
          code={(a) => `<PageHeader\n  title="${a.title}"${a.subtitle ? `\n  subtitle="${a.subtitle}"` : ''}${a.back ? '\n  back' : ''}${a.action ? '\n  right={<Button size="sm">Add</Button>}' : ''}\n/>`}
        />
      }
    />
  )
}

function NavDoc() {
  const tabs = ['/today', '/dogs', '/calendar', '/settings']
  return (
    <ComponentDoc
      group="Navigation"
      name="BottomNav"
      source="src/components/BottomNav.tsx"
      description="One flat Card-colored pill fixed to the bottom. The Cobalt pill marks where you are and slides between tabs. Tap the tabs."
      playground={
        <Playground
          initial={{ path: '/today' }}
          controls={{ path: { type: 'radio', options: tabs, label: 'Start on' } }}
          contain
          minHeight={120}
          render={(a) => (
            <Routed key={a.path} path={a.path}>
              <BottomNav />
            </Routed>
          )}
          code={() => `// Rendered once by AppLayout in App.tsx\n<BottomNav />`}
        />
      }
    />
  )
}

function PhoneDoc() {
  return (
    <ComponentDoc
      group="Marketing"
      name="PhoneFrame"
      source="src/components/PhoneFrame.tsx"
      description="Device chrome for product mockups on the marketing site, so a screenshot always reads as the app on a phone."
      playground={
        <Playground
          initial={{}}
          controls={{}}
          defaultWidth="full"
          render={() => (
            // A real phone width (390pt), not a squeezed thumbnail — the
            // screen inside lays out exactly as it does in the app.
            <div className="mx-auto w-[410px] max-w-full h-[760px]">
              <PhoneFrame>
                <Routed>
                  <PageHeader title="Today" subtitle="Tuesday, Nov 24" />
                  <div className="px-6 pt-4">
                    <LastOutPrompt dogName="Luna" onJustNow={() => {}} onPickTime={() => {}} />
                    {(
                      [
                        ['meal', 'Breakfast', 'Two scoops, soaked', 8],
                        ['walk', 'Morning walk', 'Loop around the park', 9],
                        ['medication', 'Joint supplement', 'Half a tablet in cheese', 18],
                      ] as const
                    ).map(([type, title, note, h]) => (
                      <TaskCard
                        key={title}
                        task={{ id: title, stayId: 's', dogId: 'd', dogName: 'Luna', type, title, note, scheduledTime: at(h), status: 'pending' }}
                        onDone={() => {}}
                        onUndo={() => {}}
                      />
                    ))}
                  </div>
                </Routed>
              </PhoneFrame>
            </div>
          )}
          code={() => `<PhoneFrame>\n  {screen}\n</PhoneFrame>`}
        />
      }
    />
  )
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const COMPONENT_PAGES: { id: string; label: string; group: string; Page: () => JSX.Element }[] = [
  { id: 'button', label: 'Button', group: 'Actions', Page: ButtonDoc },
  { id: 'chips', label: 'Chips', group: 'Actions', Page: ChipsDoc },
  { id: 'add-button', label: 'AddButton', group: 'Actions', Page: AddButtonDoc },
  { id: 'switch', label: 'Switch', group: 'Selection', Page: SwitchDoc },
  { id: 'radio', label: 'Radio', group: 'Selection', Page: RadioDoc },
  { id: 'dog-tabs', label: 'DogTabs', group: 'Selection', Page: DogTabsDoc },
  { id: 'text-field', label: 'TextField', group: 'Inputs', Page: TextFieldDoc },
  { id: 'time-picker', label: 'TimePicker', group: 'Inputs', Page: TimeDoc },
  { id: 'status', label: 'Status & badges', group: 'Display', Page: StatusDoc },
  { id: 'photo', label: 'DogPhotoStack', group: 'Display', Page: PhotoDoc },
  { id: 'care-note', label: 'CareNoteSection', group: 'Display', Page: CareNoteDoc },
  { id: 'task-card', label: 'TaskCard', group: 'Patterns', Page: TaskCardDoc },
  { id: 'dog-card', label: 'DogCard', group: 'Patterns', Page: DogCardDoc },
  { id: 'last-out', label: 'LastOutPrompt', group: 'Patterns', Page: LastOutDoc },
  { id: 'page-header', label: 'PageHeader', group: 'Navigation', Page: HeaderDoc },
  { id: 'bottom-nav', label: 'BottomNav', group: 'Navigation', Page: NavDoc },
  { id: 'phone-frame', label: 'PhoneFrame', group: 'Marketing', Page: PhoneDoc },
]
