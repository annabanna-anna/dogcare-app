import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { mockDogs } from '../data/mockDogs'
import type { DogSize } from '../types'

interface FormState {
  name: string
  breed: string
  size: DogSize
  ownerName: string
  ownerContact: string
  behaviorNotes: string
  foodNotes: string
  medicationNotes: string
  walkNotes: string
  emergencyNotes: string
}

const defaultForm: FormState = {
  name: '',
  breed: '',
  size: 'medium',
  ownerName: '',
  ownerContact: '',
  behaviorNotes: '',
  foodNotes: '',
  medicationNotes: '',
  walkNotes: '',
  emergencyNotes: '',
}

const sizeOptions: { value: DogSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'XL' },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-dm font-bold text-[12px] text-text-secondary uppercase tracking-widest mb-1.5">
      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors"
    />
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-border-light rounded-[12px] px-4 py-3 font-dm text-[15px] text-text-primary placeholder:text-[#c4c4c4] focus:outline-none focus:border-coral transition-colors resize-none"
    />
  )
}

export default function AddEditDogPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = id && id !== 'new'
  const existing = isEdit ? mockDogs.find((d) => d.id === id) : undefined

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          name: existing.name,
          breed: existing.breed,
          size: existing.size,
          ownerName: existing.ownerName,
          ownerContact: existing.ownerContact,
          behaviorNotes: existing.behaviorNotes,
          foodNotes: existing.foodNotes,
          medicationNotes: existing.medicationNotes,
          walkNotes: existing.walkNotes,
          emergencyNotes: existing.emergencyNotes,
        }
      : defaultForm,
  )

  function set<K extends keyof FormState>(key: K) {
    return (value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    // In a real app: save to Supabase or local state
    // For now: navigate back
    alert(isEdit ? `${form.name}'s profile updated! (mock)` : `${form.name} added! (mock)`)
    navigate(isEdit ? `/dogs/${id}` : '/dogs')
  }

  return (
    <div className="min-h-svh bg-cream pb-28">
      <PageHeader back title={isEdit ? `Edit ${existing?.name ?? 'Dog'}` : 'Add Dog'} />

      <div className="px-6 mt-4 flex flex-col gap-5">
        {/* Basic Info */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Basic Info
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Dog's Name</FieldLabel>
              <Input value={form.name} onChange={set('name')} placeholder="e.g. Ollie" />
            </div>
            <div>
              <FieldLabel>Breed</FieldLabel>
              <Input value={form.breed} onChange={set('breed')} placeholder="e.g. Golden Retriever" />
            </div>
            <div>
              <FieldLabel>Size</FieldLabel>
              <div className="flex gap-2">
                {sizeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => set('size')(value)}
                    className={`flex-1 py-2.5 rounded-[12px] font-dm font-bold text-[14px] border transition-colors ${
                      form.size === value
                        ? 'bg-coral border-coral text-white'
                        : 'bg-white border-border-light text-text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Owner Info */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Owner
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Owner Name</FieldLabel>
              <Input value={form.ownerName} onChange={set('ownerName')} placeholder="Full name" />
            </div>
            <div>
              <FieldLabel>Contact</FieldLabel>
              <Input
                value={form.ownerContact}
                onChange={set('ownerContact')}
                placeholder="Phone or email"
                type="tel"
              />
            </div>
          </div>
        </section>

        {/* Care Notes */}
        <section>
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest mb-3">
            Care Instructions
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Behavior Notes</FieldLabel>
              <Textarea
                value={form.behaviorNotes}
                onChange={set('behaviorNotes')}
                placeholder="Temperament, fears, habits, social behavior..."
              />
            </div>
            <div>
              <FieldLabel>Food Notes</FieldLabel>
              <Textarea
                value={form.foodNotes}
                onChange={set('foodNotes')}
                placeholder="Food type, portion size, allergies, schedule..."
              />
            </div>
            <div>
              <FieldLabel>Medication Notes</FieldLabel>
              <Textarea
                value={form.medicationNotes}
                onChange={set('medicationNotes')}
                placeholder="Medication names, doses, timing..."
              />
            </div>
            <div>
              <FieldLabel>Walk Notes</FieldLabel>
              <Textarea
                value={form.walkNotes}
                onChange={set('walkNotes')}
                placeholder="Duration, preferred routes, leash behavior..."
              />
            </div>
            <div>
              <FieldLabel>Emergency Notes</FieldLabel>
              <Textarea
                value={form.emergencyNotes}
                onChange={set('emergencyNotes')}
                placeholder="Vet name & number, emergency contacts, allergies..."
                rows={4}
              />
            </div>
          </div>
        </section>

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={!form.name.trim()}>
          {isEdit ? 'Save Changes' : 'Add Dog'}
        </Button>
      </div>
    </div>
  )
}
