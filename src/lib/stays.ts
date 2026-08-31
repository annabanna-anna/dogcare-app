import { supabase } from './supabase'
import type { Stay } from '../types'
import type { Database } from './database.types'

type StayRow = Database['public']['Tables']['stays']['Row'] & {
  stay_dogs: { dog_id: string }[] | null
}

const STAY_SELECT = '*, stay_dogs(dog_id)'

function mapRow(row: StayRow): Stay {
  return {
    id: row.id,
    dogIds: (row.stay_dogs ?? []).map((d) => d.dog_id),
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not signed in.')
  return data.user.id
}

async function setStayDogs(stayId: string, dogIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase.from('stay_dogs').delete().eq('stay_id', stayId)
  if (deleteError) throw deleteError
  if (dogIds.length === 0) return
  const { error: insertError } = await supabase
    .from('stay_dogs')
    .insert(dogIds.map((dogId) => ({ stay_id: stayId, dog_id: dogId })))
  if (insertError) throw insertError
}

export async function listStays(): Promise<Stay[]> {
  const { data, error } = await supabase.from('stays').select(STAY_SELECT).order('start_date')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function createStay(input: {
  dogIds: string[]
  startDate: string
  endDate: string
  notes?: string
}): Promise<Stay> {
  const ownerId = await currentUserId()
  const { data, error } = await supabase
    .from('stays')
    .insert({
      owner_id: ownerId,
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes || null,
    })
    .select('*')
    .single()
  if (error) throw error
  await setStayDogs(data.id, input.dogIds)
  return { ...mapRow({ ...data, stay_dogs: null }), dogIds: input.dogIds }
}

export async function getStay(id: string): Promise<Stay | null> {
  const { data, error } = await supabase.from('stays').select(STAY_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapRow(data) : null
}

export async function updateStay(
  id: string,
  input: { dogIds: string[]; startDate: string; endDate: string; notes?: string },
): Promise<Stay> {
  const { data, error } = await supabase
    .from('stays')
    .update({
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes || null,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  await setStayDogs(id, input.dogIds)
  return { ...mapRow({ ...data, stay_dogs: null }), dogIds: input.dogIds }
}

export async function deleteStay(id: string): Promise<void> {
  const { error } = await supabase.from('stays').delete().eq('id', id)
  if (error) throw error
}
