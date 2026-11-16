import { supabase } from './supabase'
import type { Stay } from '../types'
import type { Database } from './database.types'

type StayRow = Database['public']['Tables']['stays']['Row']

function mapRow(row: StayRow): Stay {
  return {
    id: row.id,
    dogId: row.dog_id,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes ?? undefined,
    dogKeys: row.dog_keys ?? undefined,
    lastOutAt: row.last_out_at ?? undefined,
    createdAt: row.created_at,
  }
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not signed in.')
  return data.user.id
}

export async function listStays(): Promise<Stay[]> {
  const { data, error } = await supabase.from('stays').select('*').order('start_date')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function createStay(input: {
  dogId: string
  startDate: string
  endDate: string
  notes?: string
  dogKeys?: string[]
}): Promise<Stay> {
  const ownerId = await currentUserId()
  const { data, error } = await supabase
    .from('stays')
    .insert({
      owner_id: ownerId,
      dog_id: input.dogId,
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes || null,
      // Only sent for a partial stay, so whole-profile stays still save on a
      // database that hasn't had the dog_keys column added yet
      ...(input.dogKeys ? { dog_keys: input.dogKeys } : {}),
    })
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function getStay(id: string): Promise<Stay | null> {
  const { data, error } = await supabase.from('stays').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapRow(data) : null
}

export async function updateStay(
  id: string,
  // dogKeys: null resets to every dog; undefined leaves it untouched
  input: { startDate: string; endDate: string; notes?: string; dogKeys?: string[] | null },
): Promise<Stay> {
  const { data, error } = await supabase
    .from('stays')
    .update({
      start_date: input.startDate,
      end_date: input.endDate,
      notes: input.notes || null,
      ...(input.dogKeys !== undefined ? { dog_keys: input.dogKeys } : {}),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data)
}

/** Saves "the dog was last out at …" for a stay's going-out clock. */
export async function setStayLastOut(id: string, at: string): Promise<void> {
  const { error } = await supabase.from('stays').update({ last_out_at: at }).eq('id', id)
  if (error) throw error
}

export async function deleteStay(id: string): Promise<void> {
  const { error } = await supabase.from('stays').delete().eq('id', id)
  if (error) throw error
}
