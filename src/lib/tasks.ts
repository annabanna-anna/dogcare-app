import { supabase } from './supabase'
import type { Task, TaskStatus } from '../types'
import type { Database } from './database.types'

type TaskRow = Database['public']['Tables']['tasks']['Row']

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    stayId: row.stay_id,
    dogId: row.dog_id,
    dogName: row.dog_name,
    type: row.type,
    title: row.title,
    scheduledTime: row.scheduled_time,
    note: row.note ?? undefined,
    status: row.status,
    completedAt: row.completed_at ?? undefined,
    googleExtId: row.google_ext_id ?? undefined,
    googleExtKind: (row.google_ext_kind as 'event' | 'task' | null) ?? undefined,
  }
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Not signed in.')
  return data.user.id
}

export async function listTasksBetween(startIso: string, endIso: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .gte('scheduled_time', startIso)
    .lte('scheduled_time', endIso)
    .order('scheduled_time')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function listTasksByStay(stayId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('stay_id', stayId)
    .order('scheduled_time')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

/** Bulk-inserts generated tasks for a confirmed stay; ids are DB-assigned. */
export async function createTasks(tasks: Task[]): Promise<Task[]> {
  const ownerId = await currentUserId()
  const rows = tasks.map((t) => ({
    owner_id: ownerId,
    stay_id: t.stayId,
    dog_id: t.dogId,
    dog_name: t.dogName,
    type: t.type,
    title: t.title,
    scheduled_time: t.scheduledTime,
    note: t.note || null,
    status: t.status,
    completed_at: t.completedAt || null,
  }))
  const { data, error } = await supabase.from('tasks').insert(rows).select('*')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function deleteTasksByStay(stayId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('stay_id', stayId)
  if (error) throw error
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

/** Records what a task was last pushed to Google as, so a future push can
 *  update that same event/task instead of creating a duplicate. */
export async function setTaskGoogleRef(
  id: string,
  kind: 'event' | 'task',
  extId: string,
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ google_ext_id: extId, google_ext_kind: kind })
    .eq('id', id)
  if (error) throw error
}
