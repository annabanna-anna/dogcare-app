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
    dayPart: row.day_part ?? undefined,
    logged: row.logged ?? false,
    originalTime: row.original_time ?? undefined,
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

/** The stay's most recently completed walk or potty break — what an
 *  "every X hours" clock counts from. */
export async function getLastOuting(stayId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('stay_id', stayId)
    .eq('status', 'done')
    .in('type', ['walk', 'potty'])
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow(data) : null
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
    // Only sent when set, so ordinary tasks still insert on a database that
    // predates the column.
    ...(t.dayPart ? { day_part: t.dayPart } : {}),
    ...(t.logged ? { logged: true } : {}),
  }))
  const { data, error } = await supabase.from('tasks').insert(rows).select('*')
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function deleteTasksByStay(stayId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('stay_id', stayId)
  if (error) throw error
}

export async function deleteTasksByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('tasks').delete().in('id', ids)
  if (error) throw error
}

/** completedAt defaults to now — pass it when the sitter logs a walk late. */
export async function updateTaskStatus(id: string, status: TaskStatus, completedAt?: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, completed_at: status === 'done' ? (completedAt ?? new Date().toISOString()) : null })
    .eq('id', id)
  if (error) throw error
}

/** Moves tasks to new times — one task edited on Today, plus any later walks
 *  and potty breaks the sitter chose to move along with it. */
export interface TaskTimeChange {
  id: string
  scheduledTime: string
  /** What it was scheduled for before any move; null once it's back there. */
  originalTime: string | null
}

export async function updateTaskTimes(changes: TaskTimeChange[]): Promise<void> {
  const run = (withOriginal: boolean) =>
    Promise.all(
      changes.map(({ id, scheduledTime, originalTime }) =>
        supabase
          .from('tasks')
          .update({ scheduled_time: scheduledTime, ...(withOriginal ? { original_time: originalTime } : {}) })
          .eq('id', id),
      ),
    )
  let results = await run(true)
  // A database that predates original_time (PGRST204: unknown column) still
  // saves the new time — the row just can't show the old one yet.
  if (results.some((r) => r.error?.code === 'PGRST204')) results = await run(false)
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
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
