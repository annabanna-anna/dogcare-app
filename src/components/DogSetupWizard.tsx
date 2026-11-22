import { Fragment, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowLeft, Check, Plus, X } from 'lucide-react'
import Button from './Button'
import DogTabs from './DogTabs'
import GoingOutBlock from './GoingOutBlock'
import { LongWalkChoice, OutingSettingsCard, RadioCard, TypicalDay, hrsLabel, type TypicalWalk } from './GoingOutFields'
import { TimePickerButton, formatTimeValue } from './TimePicker'
import { TASK_TYPE_STYLE } from './taskTypeStyle'
import {
  PRIMARY_DOG_KEY,
  type CareScheduleEntry,
  type DogCareNotes,
  type DogGroupMember,
  type OutingRule,
  type TaskType,
  type YesNoUnsure,
} from '../types'
import { DAY_PARTS, DEFAULT_OUTING_RULE } from '../utils/outingClock'
import { autosize } from '../utils/autosize'

// ─── Answers ─────────────────────────────────────────────────────────────────

export type SetupStep = 'meals' | 'long-walks' | 'going-out' | 'medicine' | 'anything' | 'review'

export const SETUP_STEPS: SetupStep[] = ['meals', 'long-walks', 'going-out', 'medicine', 'anything', 'review']

/** Which question each step is (the step bar). */
const QUESTION_OF: Record<SetupStep, number> = {
  meals: 1,
  'long-walks': 2,
  'going-out': 3,
  medicine: 4,
  anything: 5,
  review: 6,
}
const QUESTION_COUNT = 5

export interface MedicineDraft {
  id: string
  name: string
  amount: string
  when: 'meal' | 'time' | 'as-needed'
  mealTimes: string[]   // the meal times it's given with, when 'meal'
  time: string          // when 'time'
  note: string
  forDog?: string
}

/** What the wizard knows beyond the form and schedule: which questions were
 *  answered "not sure", and the medicines before they become schedule entries. */
export interface SetupAnswers {
  meals: 'known' | 'unsure' | null
  outing: 'known' | 'unsure'
  medicine: YesNoUnsure | null
  medicines: MedicineDraft[]
}

export const emptySetupAnswers: SetupAnswers = { meals: null, outing: 'known', medicine: null, medicines: [] }

function newMedicine(): MedicineDraft {
  return { id: crypto.randomUUID(), name: '', amount: '', when: 'meal', mealTimes: [], time: '08:00', note: '' }
}

/** A meal from the meals question — snacks and the like carry a title. */
const isPlainMeal = (e: CareScheduleEntry) => e.taskType === 'meal' && e.customTitle === undefined

/** Everything picked on "Anything else". */
const isExtra = (e: CareScheduleEntry) => e.taskType !== 'walk' && !isPlainMeal(e)

const EXTRAS: { label: string; taskType: TaskType; time: string }[] = [
  { label: 'Brushing', taskType: 'other', time: '20:00' },
  { label: 'Snack time', taskType: 'meal', time: '15:00' },
  { label: 'Play time', taskType: 'other', time: '16:00' },
  { label: 'Nail trim', taskType: 'other', time: '10:00' },
  { label: 'Eye / ear drops', taskType: 'medication', time: '08:00' },
]

const joinNotes = (...parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(' · ')

/** A medicine with no time to schedule — kept in the medication notes. */
export interface AsNeededMedicine {
  forDog?: string
  name: string
  detail: string
}

type SetupForm = DogCareNotes & { additionalDogs: DogGroupMember[]; outingRule: OutingRule | null }

/** Turns the answers into what's saved: medicines become schedule entries (or
 *  medication notes when given as needed), and "not sure" meals are dropped. */
export function applySetupAnswers<F extends SetupForm>(
  form: F,
  schedule: CareScheduleEntry[],
  answers: SetupAnswers,
): { form: F; schedule: CareScheduleEntry[]; asNeeded: AsNeededMedicine[] } {
  const next = schedule.filter(
    (e) =>
      !(isPlainMeal(e) && answers.meals !== 'known') &&
      !(e.taskType === 'other' && !e.customTitle?.trim()),
  )
  const mealTimes = new Set(next.filter(isPlainMeal).map((e) => e.time))
  const asNeeded: AsNeededMedicine[] = []
  if (answers.medicine === 'yes') {
    for (const m of answers.medicines) {
      const name = m.name.trim()
      if (!name) continue
      const times =
        m.when === 'meal' ? m.mealTimes.filter((t) => mealTimes.has(t)) : m.when === 'time' ? [m.time] : []
      if (times.length === 0) {
        asNeeded.push({ forDog: m.forDog, name, detail: joinNotes(m.amount, m.note) })
        continue
      }
      for (const time of times) {
        next.push({
          time,
          taskType: 'medication',
          customTitle: name,
          note: joinNotes(m.amount, m.when === 'meal' ? 'with a meal' : '', m.note),
          forDog: m.forDog,
        })
      }
    }
  }
  const notesFor = (key: string, existing: string) =>
    [
      existing.trim(),
      ...asNeeded
        .filter((a) => (a.forDog ?? PRIMARY_DOG_KEY) === key)
        .map((a) => joinNotes(a.name, 'as needed', a.detail)),
    ]
      .filter(Boolean)
      .join('\n')
  return {
    form: {
      ...form,
      medicationNotes: notesFor(PRIMARY_DOG_KEY, form.medicationNotes),
      additionalDogs: form.additionalDogs.map((m) => ({ ...m, medicationNotes: notesFor(m.id, m.medicationNotes) })),
    },
    schedule: next.sort((a, b) => a.time.localeCompare(b.time)),
    asNeeded,
  }
}

// ─── Small pieces ────────────────────────────────────────────────────────────

const fieldClass =
  'w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors'

function Label({ children }: { children: ReactNode }) {
  return <p className="font-dm font-bold text-[14px] text-text-primary mb-1.5">{children}</p>
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mt-3">{children}</p>
  )
}

function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 2,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  /** Starting height in lines for a multiline field — it grows from there. */
  rows?: number
}) {
  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        autosize(e.target)
      }}
      ref={(el) => {
        if (el) autosize(el)
      }}
      rows={rows}
      placeholder={placeholder}
      className={`${fieldClass} resize-none overscroll-contain`}
    />
  ) : (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldClass} />
  )
}

function Chips<T extends string | undefined>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T | T[] | null
  onChange: (v: T) => void
}) {
  const on = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value ?? 'all'}
          type="button"
          aria-pressed={on(o.value)}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full font-dm font-bold text-[13px] transition-colors ${
            on(o.value) ? 'bg-coral text-white' : 'bg-white border border-border-light text-text-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 rounded-[12px] border-2 border-dashed border-border-light flex items-center justify-center gap-1.5 font-dm font-bold text-[14px] text-text-secondary active:bg-gray-50 transition-colors"
    >
      <Plus size={16} />
      {children}
    </button>
  )
}

const yesNoUnsure: { value: YesNoUnsure; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
]

// ─── Wizard ──────────────────────────────────────────────────────────────────

interface TabDog {
  key: string
  name: string
  photoUrl?: string
}

interface Props {
  step: SetupStep
  goTo: (step: SetupStep) => void
  onBack: () => void
  /** e.g. "Barkley" or "Barkley & Max" */
  dogName: string
  groupDogs: TabDog[]
  careKey: string
  onCareKey: (key: string) => void
  care: DogCareNotes
  setCare: <K extends keyof DogCareNotes>(key: K) => (value: DogCareNotes[K]) => void
  schedule: CareScheduleEntry[]
  setSchedule: React.Dispatch<React.SetStateAction<CareScheduleEntry[]>>
  rule: OutingRule
  onRuleChange: (rule: OutingRule) => void
  answers: SetupAnswers
  setAnswers: React.Dispatch<React.SetStateAction<SetupAnswers>>
  /** The schedule as it'll be saved, for the review. */
  result: { schedule: CareScheduleEntry[]; asNeeded: AsNeededMedicine[] }
  renderEntry: (
    entry: CareScheduleEntry,
    i: number,
    typeOptions?: { value: TaskType; label: string }[],
    opts?: { hideTitle?: boolean },
  ) => ReactNode
  missingOtherTitle: boolean
  onOtherTitleTouched: () => void
  onSave: () => void
  saving: boolean
  error: string | null
}

/** Add Dog, after basic info: four questions about the dog's day (meals,
 *  going out, medicine, anything else), each skippable, then a review. */
export default function DogSetupWizard(props: Props) {
  const { step, goTo, onBack, dogName, saving, error } = props
  const question = QUESTION_OF[step]

  // Long walks come first, so the typical day on the how-often question
  // already shows them.
  const nextStep: Record<Exclude<SetupStep, 'review'>, SetupStep> = {
    meals: 'long-walks',
    'long-walks': 'going-out',
    'going-out': 'medicine',
    medicine: 'anything',
    anything: 'review',
  }

  // A question with nothing picked yet can't move on with Next — Skip is
  // the way past it. (The other questions always start with an answer.)
  const unanswered =
    (step === 'meals' && props.answers.meals === null) ||
    (step === 'medicine' && props.answers.medicine === null)

  function handleNext() {
    if (unanswered) return
    if (step === 'review') return props.onSave()
    if (step === 'anything' && props.missingOtherTitle) return props.onOtherTitleTouched()
    goTo(nextStep[step])
  }

  const heading: Record<SetupStep, { eyebrow: string; title: string; sub?: string }> = {
    meals: { eyebrow: `Meals · 1 of ${QUESTION_COUNT}`, title: `When does ${dogName} eat?` },
    'long-walks': {
      eyebrow: `Walks · 2 of ${QUESTION_COUNT}`,
      title: `When are ${dogName}’s walks?`,
      sub: 'Potty breaks fill the gaps in between.',
    },
    'going-out': {
      eyebrow: `Going out · 3 of ${QUESTION_COUNT}`,
      title: `How often does ${dogName} need to go out?`,
      sub: 'Walks and potty breaks both count — any time out resets the clock.',
    },
    medicine: { eyebrow: `Medicine · 4 of ${QUESTION_COUNT}`, title: `Does ${dogName} take any medicine?` },
    anything: {
      eyebrow: `Anything else · 5 of ${QUESTION_COUNT}`,
      title: `Anything else ${dogName} needs?`,
      sub: 'Tap what applies. Walks and potty breaks are already covered.',
    },
    review: { eyebrow: 'All set', title: `${dogName}’s day`, sub: 'Tap anything to change it.' },
  }

  // Moving on only counts when the finger came down on the button itself. When
  // a tap elsewhere closes the keyboard, the page jumps and the lifted finger
  // can land on Next/Skip — that stray click is ignored. (detail 0 = keyboard.)
  const pressedOn = useRef<EventTarget | null>(null)
  function deliberate(action: () => void) {
    return {
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        pressedOn.current = e.currentTarget
      },
      onClick: (e: MouseEvent<HTMLButtonElement>) => {
        const ok = e.detail === 0 || pressedOn.current === e.currentTarget
        pressedOn.current = null
        if (ok) action()
      },
    }
  }

  // The sticky header gets a hairline once content scrolls under it.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-svh bg-cream flex flex-col">
      <div
        className={`sticky top-0 z-20 bg-cream px-6 pt-5 pb-3 border-b transition-colors ${
          scrolled ? 'border-border-light' : 'border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="shrink-0 size-8 -ml-1 flex items-center justify-center rounded-full text-text-secondary active:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <p className="flex-1 min-w-0 text-center font-dm font-bold text-[14px] text-text-secondary truncate">
            {dogName}’s day
          </p>
          <button
            type="button"
            {...deliberate(() => goTo(step === 'review' ? 'review' : nextStep[step]))}
            className={`shrink-0 w-8 font-dm font-bold text-[14px] text-text-secondary text-right ${
              step === 'review' ? 'invisible' : ''
            }`}
          >
            Skip
          </button>
        </div>
        <div
          className="flex gap-1.5 mt-3"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={QUESTION_COUNT}
          aria-valuenow={Math.min(question, QUESTION_COUNT)}
        >
          {Array.from({ length: QUESTION_COUNT }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors ${n <= question ? 'bg-coral' : 'bg-border-light'}`}
            />
          ))}
        </div>
        <p className="font-dm font-bold text-[13px] text-coral uppercase tracking-widest mt-4">
          {heading[step].eyebrow}
        </p>
        <h1 className="font-outfit font-bold text-[26px] leading-[1.15] text-text-primary mt-1.5">
          {heading[step].title}
        </h1>
      </div>

      <div className="flex-1 px-6 pt-1 pb-4 flex flex-col gap-3">
        {heading[step].sub && (
          <p className="font-dm text-[14px] text-text-secondary mb-1">{heading[step].sub}</p>
        )}
        {step === 'meals' && <MealsStep {...props} />}
        {step === 'going-out' && <GoingOutStep {...props} />}
        {step === 'long-walks' && <LongWalksStep {...props} />}
        {step === 'medicine' && <MedicineStep {...props} />}
        {step === 'anything' && <AnythingElseStep {...props} />}
        {step === 'review' && <ReviewStep {...props} />}
      </div>

      <div className="sticky bottom-0 z-10 px-6 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] bg-cream">
        {error && (
          <div className="mb-2 bg-[#fee2e2] rounded-[12px] px-4 py-3">
            <p className="font-dm text-[13px] text-[#b91c1c]">{error}</p>
          </div>
        )}
        <Button fullWidth size="lg" {...deliberate(handleNext)} disabled={saving || unanswered}>
          {step === 'review' ? (saving ? 'Saving…' : `Save ${dogName}`) : step === 'anything' ? 'Review' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

/** Per-dog care notes follow the dog tabs on a group profile. */
function CareTabs({ groupDogs, careKey, onCareKey }: Props) {
  if (groupDogs.length < 2) return null
  const value = groupDogs.some((d) => d.key === careKey) ? careKey : PRIMARY_DOG_KEY
  return <DogTabs dogs={groupDogs} value={value} onChange={onCareKey} />
}

function MealsStep(props: Props) {
  const { dogName, schedule, setSchedule, answers, setAnswers, care, setCare, renderEntry } = props
  const mealType = [{ value: 'meal' as const, label: 'Meal' }]
  function pick(meals: 'known' | 'unsure') {
    setAnswers((a) => ({ ...a, meals }))
    if (meals === 'known' && !schedule.some(isPlainMeal)) {
      setSchedule((prev) => [...prev, { time: '08:00', taskType: 'meal', note: '' }])
    }
  }
  return (
    <>
      <div role="radiogroup" aria-label={`When does ${dogName} eat?`} className="flex flex-col gap-2">
        <RadioCard selected={answers.meals === 'known'} label="I know the times" onSelect={() => pick('known')}>
          {schedule.map((e, i) => (isPlainMeal(e) ? renderEntry(e, i, mealType) : null))}
          <AddButton onClick={() => setSchedule((prev) => [...prev, { time: '12:00', taskType: 'meal', note: '' }])}>
            Add a meal
          </AddButton>
        </RadioCard>
        <RadioCard
          selected={answers.meals === 'unsure'}
          label="Not sure yet"
          hint="Add meal times later from the dog’s profile."
          onSelect={() => pick('unsure')}
        />
      </div>

      <SectionLabel>About food</SectionLabel>
      <CareTabs {...props} />
      <div>
        <Label>Food notes</Label>
        <TextField value={care.foodNotes} onChange={setCare('foodNotes')} placeholder="Food type, portion size…" multiline />
      </div>
      <div>
        <Label>Any food allergies?</Label>
        <Chips options={yesNoUnsure} value={care.hasAllergies} onChange={setCare('hasAllergies')} />
      </div>
      {/* Notes for yes (which ones) and no (anything to watch); not needed when unsure. */}
      {care.hasAllergies !== 'unsure' && (
        <div>
          <Label>{care.hasAllergies === 'yes' ? 'Which ones?' : 'Anything to watch?'}</Label>
          <TextField
            value={care.allergyNotes}
            onChange={setCare('allergyNotes')}
            placeholder={care.hasAllergies === 'yes' ? 'e.g. chicken, beef, grain' : 'e.g. sensitive stomach, avoid rich treats'}
            multiline
            rows={1}
          />
        </div>
      )}
    </>
  )
}

function plannedWalkTimes(rule: OutingRule, schedule: CareScheduleEntry[]): TypicalWalk[] {
  if (rule.longWalks === 'set-times')
    return schedule.filter((e) => e.taskType === 'walk').map((e) => ({ time: e.time }))
  if (rule.longWalks === 'time-of-day')
    return rule.dayPartWalks.map((w) => {
      const part = DAY_PARTS.find((d) => d.key === w.dayPart)!
      return { time: part.start, label: part.label }
    })
  return []
}

function GoingOutStep({ rule, onRuleChange, schedule, answers, setAnswers }: Props) {
  const unsure = answers.outing === 'unsure'
  return (
    <>
      <div className={unsure ? 'opacity-50' : ''}>
        <OutingSettingsCard
          rule={rule}
          onPatch={(patch) => {
            setAnswers((a) => ({ ...a, outing: 'known' }))
            onRuleChange({ ...rule, ...patch })
          }}
        />
      </div>
      <SectionLabel>A typical day</SectionLabel>
      <TypicalDay rule={rule} walkTimes={plannedWalkTimes(rule, schedule)} />
      <div role="radiogroup" aria-label="Not sure yet">
        <RadioCard
          selected={unsure}
          label="Not sure yet"
          hint={`Start with every ${hrsLabel(DEFAULT_OUTING_RULE.everyHours)} — you can change it any time.`}
          onSelect={() => {
            if (unsure) {
              setAnswers((a) => ({ ...a, outing: 'known' }))
              return
            }
            setAnswers((a) => ({ ...a, outing: 'unsure' }))
            onRuleChange({
              ...rule,
              everyHours: DEFAULT_OUTING_RULE.everyHours,
              wakeTime: DEFAULT_OUTING_RULE.wakeTime,
              bedtime: DEFAULT_OUTING_RULE.bedtime,
              askWhenItHappened: DEFAULT_OUTING_RULE.askWhenItHappened,
            })
          }}
        />
      </div>
    </>
  )
}

function LongWalksStep(props: Props) {
  const { rule, onRuleChange, schedule, setSchedule, care, setCare, renderEntry } = props
  const walkType = [{ value: 'walk' as const, label: 'Walk' }]
  // "Set times" is the default answer, so it starts with one walk to fill in
  // (once, on arriving at the step — removing it afterwards sticks).
  useEffect(() => {
    if (rule.longWalks !== 'set-times') return
    setSchedule((prev) =>
      prev.some((e) => e.taskType === 'walk') ? prev : [...prev, { time: '07:00', taskType: 'walk', note: '' }],
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <LongWalkChoice
        rule={rule}
        onPatch={(patch) => onRuleChange({ ...rule, ...patch })}
        setTimeWalks={schedule.map((e, i) => (e.taskType === 'walk' ? renderEntry(e, i, walkType) : null))}
        onAddWalk={() =>
          setSchedule((prev) => [
            ...prev,
            { time: prev.some((e) => e.taskType === 'walk') ? '18:00' : '07:00', taskType: 'walk', note: '' },
          ])
        }
      />

      <SectionLabel>About walks</SectionLabel>
      <CareTabs {...props} />
      <div>
        <Label>Walk notes</Label>
        <TextField
          value={care.walkNotes}
          onChange={setCare('walkNotes')}
          placeholder="Routes, leash behavior, how long…"
          multiline
        />
      </div>
      <div>
        <Label>Goes to dog parks?</Label>
        <Chips options={yesNoUnsure} value={care.goesToDogParks} onChange={setCare('goesToDogParks')} />
      </div>
      {care.goesToDogParks !== 'unsure' && (
        <TextField
          value={care.dogParkNotes}
          onChange={setCare('dogParkNotes')}
          placeholder={care.goesToDogParks === 'yes' ? 'Any conditions? e.g. fenced parks only' : 'Anything to know? e.g. reactive with big dogs'}
          multiline
          rows={1}
        />
      )}
    </>
  )
}

function MedicineStep({ answers, setAnswers, schedule, groupDogs }: Props) {
  const meals = schedule.filter(isPlainMeal).sort((a, b) => a.time.localeCompare(b.time))
  const mealsKnown = answers.meals === 'known' && meals.length > 0
  function setMedicine(medicine: YesNoUnsure) {
    setAnswers((a) => ({
      ...a,
      medicine,
      medicines: medicine === 'yes' && a.medicines.length === 0 ? [newMedicine()] : a.medicines,
    }))
  }
  function patch(id: string, p: Partial<MedicineDraft>) {
    setAnswers((a) => ({ ...a, medicines: a.medicines.map((m) => (m.id === id ? { ...m, ...p } : m)) }))
  }
  const PillIcon = TASK_TYPE_STYLE.medication.icon
  const forOptions = [
    { value: undefined, label: groupDogs.length === 2 ? 'Both' : 'All dogs' },
    ...groupDogs.map((d) => ({ value: d.key as string | undefined, label: d.name || 'Unnamed' })),
  ]

  return (
    <>
      <Chips
        options={[
          { value: 'yes' as const, label: 'Yes' },
          { value: 'no' as const, label: 'No' },
          { value: 'unsure' as const, label: 'Not sure yet' },
        ]}
        value={answers.medicine}
        onChange={setMedicine}
      />
      {answers.medicine === 'yes' && (
        <>
          {answers.medicines.map((m) => (
            <div key={m.id} className="bg-white border border-border-light rounded-[16px] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className={`size-8 rounded-full flex items-center justify-center shrink-0 ${TASK_TYPE_STYLE.medication.bg}`}>
                  <PillIcon size={16} className="text-white" />
                </span>
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => patch(m.id, { name: e.target.value })}
                  placeholder="Medicine name"
                  aria-label="Medicine name"
                  className="flex-1 min-w-0 bg-transparent font-dm font-bold text-[16px] text-text-primary placeholder:text-[#c4c4c4] placeholder:font-medium focus:outline-none"
                />
                {answers.medicines.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove medicine"
                    onClick={() => setAnswers((a) => ({ ...a, medicines: a.medicines.filter((x) => x.id !== m.id) }))}
                    className="size-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-text-secondary shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {groupDogs.length > 1 && (
                <div>
                  <Label>For</Label>
                  <Chips options={forOptions} value={m.forDog} onChange={(forDog) => patch(m.id, { forDog })} />
                </div>
              )}
              <div>
                <Label>How much</Label>
                <TextField value={m.amount} onChange={(amount) => patch(m.id, { amount })} placeholder="e.g. 1 tablet (18 mg)" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>When</Label>
                <Chips
                  options={[
                    { value: 'meal' as const, label: 'With a meal' },
                    { value: 'time' as const, label: 'Set time' },
                    { value: 'as-needed' as const, label: 'As needed' },
                  ]}
                  value={m.when}
                  onChange={(when) => patch(m.id, { when })}
                />
                {m.when === 'meal' &&
                  (mealsKnown ? (
                    // A follow-up to "With a meal", so it's checkboxes in a panel
                    // rather than more pills that read as extra options.
                    <div className="bg-card rounded-[12px] px-3 py-2.5 flex flex-col gap-1">
                      <p className="font-dm text-[12px] text-text-secondary">Which meals?</p>
                      {meals.map((e) => {
                        const on = m.mealTimes.includes(e.time)
                        return (
                          <button
                            key={e.time}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() =>
                              patch(m.id, {
                                mealTimes: on ? m.mealTimes.filter((x) => x !== e.time) : [...m.mealTimes, e.time],
                              })
                            }
                            className="flex items-center gap-2.5 py-1.5 text-left"
                          >
                            <span
                              className={`size-5 rounded-[6px] flex items-center justify-center shrink-0 ${
                                on ? 'bg-coral' : 'bg-white border-[1.5px] border-border-light'
                              }`}
                            >
                              {on && <Check size={13} strokeWidth={3} className="text-white" />}
                            </span>
                            <span className="font-dm font-bold text-[14px] text-text-primary">
                              {e.customTitle?.trim() || 'Meal'}
                            </span>
                            <span className="font-dm text-[14px] text-text-secondary">{formatTimeValue(e.time)}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="font-dm text-[12px] text-text-secondary">
                      No meal times yet — pick a set time, or add meals in question 1.
                    </p>
                  ))}
                {m.when === 'time' && (
                  <TimePickerButton
                    value={m.time}
                    onChange={(time) => patch(m.id, { time })}
                    className="w-[118px] bg-white border border-border-light rounded-[10px] pl-3 pr-7 py-2 font-dm font-bold text-[13px] text-text-primary"
                  />
                )}
              </div>
              <div>
                <Label>Notes</Label>
                <TextField value={m.note} onChange={(note) => patch(m.id, { note })} placeholder="Wrap in a pill pocket treat" />
              </div>
            </div>
          ))}
          <AddButton onClick={() => setAnswers((a) => ({ ...a, medicines: [...a.medicines, newMedicine()] }))}>
            Add another medicine
          </AddButton>
        </>
      )}
    </>
  )
}

function AnythingElseStep(props: Props) {
  const { schedule, setSchedule, care, setCare, renderEntry } = props
  function toggle(extra: (typeof EXTRAS)[number]) {
    setSchedule((prev) =>
      prev.some((e) => e.customTitle === extra.label)
        ? prev.filter((e) => e.customTitle !== extra.label)
        : [...prev, { time: extra.time, taskType: extra.taskType, customTitle: extra.label, note: '' }],
    )
  }
  /** Adds one more of a picked extra, right after the last one so the cards stay together. */
  function addAnother(extra: (typeof EXTRAS)[number]) {
    setSchedule((prev) => {
      let last = -1
      prev.forEach((e, j) => {
        if (e.customTitle === extra.label) last = j
      })
      const entry: CareScheduleEntry = { time: extra.time, taskType: extra.taskType, customTitle: extra.label, note: '' }
      return [...prev.slice(0, last + 1), entry, ...prev.slice(last + 1)]
    })
  }
  const picked = EXTRAS.filter((x) => schedule.some((e) => e.customTitle === x.label)).map((x) => x.label)
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Chips
          options={EXTRAS.map((x) => ({ value: x.label, label: x.label }))}
          value={picked}
          onChange={(label) => toggle(EXTRAS.find((x) => x.label === label)!)}
        />
        <button
          type="button"
          onClick={() => setSchedule((prev) => [...prev, { time: '12:00', taskType: 'other', customTitle: '', note: '' }])}
          className="px-4 py-2 rounded-full bg-white border border-border-light font-dm font-bold text-[13px] text-text-primary"
        >
          + Something else
        </button>
      </div>
      {schedule.map((e, i) => {
        if (!isExtra(e)) return null
        const extra = EXTRAS.find((x) => x.label === e.customTitle)
        if (!extra) return renderEntry(e, i, [{ value: 'other', label: 'Other' }])
        // The last card of a kind gets "+ Another …" so the same extra can repeat
        // (e.g. two snack times); the chip itself stays a plain on/off.
        const isLastOfKind = !schedule.some((x, j) => j > i && x.customTitle === extra.label)
        return (
          <Fragment key={i}>
            {renderEntry(e, i, [{ value: e.taskType, label: extra.label }], { hideTitle: true })}
            {isLastOfKind && (
              <button
                type="button"
                onClick={() => addAnother(extra)}
                className="self-start -mt-1 flex items-center gap-1.5 py-1 font-dm font-bold text-[13px] text-coral"
              >
                <Plus size={14} strokeWidth={2.5} />
                Another {extra.label.toLowerCase()}
              </button>
            )}
          </Fragment>
        )
      })}

      <SectionLabel>Good to know (optional)</SectionLabel>
      <CareTabs {...props} />
      <div>
        <Label>Behavior</Label>
        <TextField value={care.behaviorNotes} onChange={setCare('behaviorNotes')} placeholder="Fears, habits, how they are with other dogs…" multiline />
      </div>
      <div>
        <Label>Emergency</Label>
        <TextField value={care.emergencyNotes} onChange={setCare('emergencyNotes')} placeholder="Vet name & number, emergency contacts…" multiline />
      </div>
      <div>
        <Label>Other notes</Label>
        <TextField value={care.otherNotes} onChange={setCare('otherNotes')} placeholder="Anything else worth knowing…" multiline />
      </div>
    </>
  )
}

function ReviewLine({
  when,
  type,
  title,
  sub,
  muted,
}: {
  when: string
  type: TaskType
  title: string
  sub?: string
  muted?: boolean
}) {
  const { icon: Icon, bg } = TASK_TYPE_STYLE[type]
  return (
    <div className={`flex gap-3 ${sub ? 'items-start' : 'items-center'}`}>
      <span
        className={`font-dm font-bold text-[13px] w-[68px] shrink-0 ${sub ? 'pt-0.5' : ''} ${
          muted ? 'text-text-muted' : 'text-text-primary'
        }`}
      >
        {when}
      </span>
      <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${bg} ${sub ? 'mt-0.5' : ''} ${muted ? 'opacity-45' : ''}`}>
        <Icon size={12} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="font-dm font-bold text-[14px] text-text-primary leading-none">{title}</p>
        {sub && <p className="font-dm text-[12px] text-text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ReviewSection({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onEdit} className="w-full text-left flex flex-col gap-3 rounded-[12px] active:bg-gray-50">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </button>
  )
}

function ReviewStep({ rule, answers, result, goTo, groupDogs }: Props) {
  const isGroup = groupDogs.length > 1
  const onlyFor = (forDog?: string) =>
    isGroup && forDog ? `${groupDogs.find((d) => d.key === forDog)?.name || 'One dog'} only` : undefined
  const sub = (e: CareScheduleEntry) => [onlyFor(e.forDog), e.note?.trim()].filter(Boolean).join(' · ') || undefined
  const meals = result.schedule.filter((e) => e.taskType === 'meal')
  const meds = result.schedule.filter((e) => e.taskType === 'medication')
  const other = result.schedule.filter((e) => e.taskType === 'other')

  return (
    <>
      <div className="bg-white border border-border-light rounded-[22px] p-4 flex flex-col gap-4">
        <ReviewSection label="Meals & snacks" onEdit={() => goTo('meals')}>
          {meals.length > 0 ? (
            meals.map((e, i) => (
              <ReviewLine key={i} when={formatTimeValue(e.time)} type="meal" title={e.customTitle?.trim() || 'Meal'} sub={sub(e)} />
            ))
          ) : (
            <ReviewLine when="Not set" type="meal" title="Meals" sub="Add the times later" muted />
          )}
        </ReviewSection>

        <ReviewSection label="Walks & potty breaks" onEdit={() => goTo('long-walks')}>
          <GoingOutBlock rule={rule} careSchedule={result.schedule} />
        </ReviewSection>

        <ReviewSection label="Medicine" onEdit={() => goTo('medicine')}>
          {meds.map((e, i) => (
            <ReviewLine key={i} when={formatTimeValue(e.time)} type="medication" title={e.customTitle?.trim() || 'Medication'} sub={sub(e)} />
          ))}
          {result.asNeeded.map((a, i) => (
            <ReviewLine
              key={`n${i}`}
              when="As needed"
              type="medication"
              title={a.name}
              sub={[onlyFor(a.forDog), a.detail].filter(Boolean).join(' · ') || undefined}
            />
          ))}
          {meds.length === 0 && result.asNeeded.length === 0 && (
            <ReviewLine
              when={answers.medicine === 'no' ? 'None' : 'Not set'}
              type="medication"
              title={answers.medicine === 'no' ? 'No medicine' : 'Not sure yet'}
              muted
            />
          )}
        </ReviewSection>

        {other.length > 0 && (
          <ReviewSection label="Other care" onEdit={() => goTo('anything')}>
            {other.map((e, i) => (
              <ReviewLine key={i} when={formatTimeValue(e.time)} type="other" title={e.customTitle?.trim() || 'Care task'} sub={sub(e)} />
            ))}
          </ReviewSection>
        )}
      </div>
    </>
  )
}
