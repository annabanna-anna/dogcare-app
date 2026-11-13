import { supabase } from './supabase'
import type { CareScheduleEntry, Dog, DogCareNotes, DogGroupMember, DogSize, YesNoUnsure } from '../types'
import type { Database } from './database.types'

type DogRow = Database['public']['Tables']['dogs']['Row']

/** Group members saved before per-dog care existed have no id/photo/notes of
 *  their own — they shared the profile's notes, so they inherit them here. */
function mapMember(raw: Partial<DogGroupMember>, i: number, shared: DogCareNotes): DogGroupMember {
  return {
    ...shared,
    ...raw,
    id: raw.id ?? `member-${i + 1}`,
    name: raw.name ?? '',
    breed: raw.breed ?? '',
    size: raw.size ?? 'medium',
  }
}

function mapRow(row: DogRow): Dog {
  const care: DogCareNotes = {
    behaviorNotes: row.behavior_notes,
    foodNotes: row.food_notes,
    medicationNotes: row.medication_notes,
    walkNotes: row.walk_notes,
    emergencyNotes: row.emergency_notes,
    otherNotes: row.other_notes,
    hasAllergies: row.has_allergies,
    allergyNotes: row.allergy_notes,
    goesToDogParks: row.goes_to_dog_parks,
    dogParkNotes: row.dog_park_notes ?? '',
  }
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    size: row.size,
    additionalDogs: (row.additional_dogs ?? []).map((m, i) => mapMember(m, i, care)),
    ownerName: row.owner_name,
    ownerContact: row.owner_contact,
    photoUrl: row.photo_url ?? undefined,
    ...care,
    walkTimeFlexible: row.walk_time_flexible,
    careSchedule: row.care_schedule ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface DogInput {
  name: string
  breed: string
  size: DogSize
  additionalDogs: DogGroupMember[]
  ownerName: string
  ownerContact: string
  photoUrl?: string | null
  behaviorNotes: string
  foodNotes: string
  medicationNotes: string
  walkNotes: string
  emergencyNotes: string
  otherNotes: string
  hasAllergies: YesNoUnsure
  allergyNotes: string
  goesToDogParks: YesNoUnsure
  dogParkNotes: string
  walkTimeFlexible: boolean
  careSchedule: CareScheduleEntry[]
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not signed in.')
  return data.user.id
}

export async function listDogs(): Promise<Dog[]> {
  const { data, error } = await supabase.from('dogs').select('*').order('name')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function getDog(id: string): Promise<Dog | null> {
  const { data, error } = await supabase.from('dogs').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapRow(data) : null
}

/** id is generated client-side (crypto.randomUUID()) so a photo can be uploaded to its
 *  storage path before the row exists. */
export async function createDog(id: string, input: DogInput): Promise<Dog> {
  const ownerId = await currentUserId()
  const { data, error } = await supabase
    .from('dogs')
    .insert({
      id,
      owner_id: ownerId,
      name: input.name,
      breed: input.breed,
      size: input.size,
      additional_dogs: input.additionalDogs,
      owner_name: input.ownerName,
      owner_contact: input.ownerContact,
      photo_url: input.photoUrl ?? null,
      behavior_notes: input.behaviorNotes,
      food_notes: input.foodNotes,
      medication_notes: input.medicationNotes,
      walk_notes: input.walkNotes,
      emergency_notes: input.emergencyNotes,
      other_notes: input.otherNotes,
      has_allergies: input.hasAllergies,
      allergy_notes: input.allergyNotes,
      goes_to_dog_parks: input.goesToDogParks,
      dog_park_notes: input.dogParkNotes,
      walk_time_flexible: input.walkTimeFlexible,
      care_schedule: input.careSchedule,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function updateDog(id: string, input: DogInput): Promise<Dog> {
  const { data, error } = await supabase
    .from('dogs')
    .update({
      name: input.name,
      breed: input.breed,
      size: input.size,
      additional_dogs: input.additionalDogs,
      owner_name: input.ownerName,
      owner_contact: input.ownerContact,
      photo_url: input.photoUrl ?? null,
      behavior_notes: input.behaviorNotes,
      food_notes: input.foodNotes,
      medication_notes: input.medicationNotes,
      walk_notes: input.walkNotes,
      emergency_notes: input.emergencyNotes,
      other_notes: input.otherNotes,
      has_allergies: input.hasAllergies,
      allergy_notes: input.allergyNotes,
      goes_to_dog_parks: input.goesToDogParks,
      dog_park_notes: input.dogParkNotes,
      walk_time_flexible: input.walkTimeFlexible,
      care_schedule: input.careSchedule,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data)
}

/** Deletes the dog row (stays/tasks cascade via FK) and its photos, if any. */
export async function deleteDog(id: string): Promise<void> {
  const ownerId = await currentUserId()
  const { error } = await supabase.from('dogs').delete().eq('id', id)
  if (error) throw error
  // Best-effort cleanup — a missing/already-gone object shouldn't fail the delete.
  // Group members' photos live next to the main one as `<id>-<memberId>.jpg`.
  const { data: files } = await supabase.storage.from('dog-photos').list(ownerId, { search: id })
  const paths = (files ?? []).map((f) => `${ownerId}/${f.name}`)
  await supabase.storage.from('dog-photos').remove(paths.length ? paths : [`${ownerId}/${id}.jpg`])
}

/** Uploads to the owner-scoped `dog-photos` bucket and returns a cache-busted public URL.
 *  Pass memberId for a group member's photo. */
export async function uploadDogPhoto(dogId: string, blob: Blob, memberId?: string): Promise<string> {
  const ownerId = await currentUserId()
  const path = `${ownerId}/${memberId ? `${dogId}-${memberId}` : dogId}.jpg`
  const { error } = await supabase.storage
    .from('dog-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('dog-photos').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
