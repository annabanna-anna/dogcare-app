import { supabase } from './supabase'
import type { CareScheduleEntry, Dog, DogSize } from '../types'
import type { Database } from './database.types'

type DogRow = Database['public']['Tables']['dogs']['Row']

function mapRow(row: DogRow): Dog {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    size: row.size,
    ownerName: row.owner_name,
    ownerContact: row.owner_contact,
    photoUrl: row.photo_url ?? undefined,
    behaviorNotes: row.behavior_notes,
    foodNotes: row.food_notes,
    medicationNotes: row.medication_notes,
    walkNotes: row.walk_notes,
    emergencyNotes: row.emergency_notes,
    otherNotes: row.other_notes,
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
  ownerName: string
  ownerContact: string
  photoUrl?: string | null
  behaviorNotes: string
  foodNotes: string
  medicationNotes: string
  walkNotes: string
  emergencyNotes: string
  otherNotes: string
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
      owner_name: input.ownerName,
      owner_contact: input.ownerContact,
      photo_url: input.photoUrl ?? null,
      behavior_notes: input.behaviorNotes,
      food_notes: input.foodNotes,
      medication_notes: input.medicationNotes,
      walk_notes: input.walkNotes,
      emergency_notes: input.emergencyNotes,
      other_notes: input.otherNotes,
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
      owner_name: input.ownerName,
      owner_contact: input.ownerContact,
      photo_url: input.photoUrl ?? null,
      behavior_notes: input.behaviorNotes,
      food_notes: input.foodNotes,
      medication_notes: input.medicationNotes,
      walk_notes: input.walkNotes,
      emergency_notes: input.emergencyNotes,
      other_notes: input.otherNotes,
      walk_time_flexible: input.walkTimeFlexible,
      care_schedule: input.careSchedule,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data)
}

/** Deletes the dog row (stays/tasks cascade via FK) and its photo, if any. */
export async function deleteDog(id: string): Promise<void> {
  const ownerId = await currentUserId()
  const { error } = await supabase.from('dogs').delete().eq('id', id)
  if (error) throw error
  // Best-effort cleanup — a missing/already-gone object shouldn't fail the delete.
  await supabase.storage.from('dog-photos').remove([`${ownerId}/${id}.jpg`])
}

/** Uploads to the owner-scoped `dog-photos` bucket and returns a cache-busted public URL. */
export async function uploadDogPhoto(dogId: string, blob: Blob): Promise<string> {
  const ownerId = await currentUserId()
  const path = `${ownerId}/${dogId}.jpg`
  const { error } = await supabase.storage
    .from('dog-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('dog-photos').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
