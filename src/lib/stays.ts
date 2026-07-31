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
  input: { startDate: string; endDate: string; notes?: string },
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
  return mapRow(data)
}
