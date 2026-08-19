// send-task-reminders — the sending half of HeyPup's push-reminder pipeline.
//
// Runs on a schedule (see supabase/reminders-cron.sql, every minute via
// pg_cron). Each run:
//   1. Loads pending tasks due within the next hour that haven't been
//      notified yet (reminder_sent_at is null).
//   2. Loads every push subscription, grouped by owner.
//   3. For each subscription, picks the owner's tasks now inside that
//      device's reminder window (scheduled_time <= now + reminder_minutes)
//      and sends one Web Push per task.
//   4. Marks each task's reminder_sent_at once at least one device took the
//      push, so tasks never notify twice.
// Subscriptions the push service reports as gone (404/410 — browser
// uninstalled, permission revoked) are deleted so they aren't retried.
//
// Deploy:  npx supabase functions deploy send-task-reminders
// Secrets: npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const MAX_LEAD_MINUTES = 60 // largest lead time offered in the app's Settings
// A task stays eligible this long past its scheduled time. Without it, the
// "on time" (0-minute) lead could never fire — the cron only ticks once a
// minute, so it's always slightly past the exact moment. Also lets a
// reminder that missed its window (function briefly down) go out late
// rather than never.
const GRACE_MINUTES = 10

interface TaskRow {
  id: string
  owner_id: string
  dog_name: string
  title: string
  scheduled_time: string
}

interface SubscriptionRow {
  id: string
  owner_id: string
  endpoint: string
  p256dh: string
  auth: string
  reminder_minutes: number
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@heypup.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const now = new Date()
  const horizon = new Date(now.getTime() + MAX_LEAD_MINUTES * 60 * 1000)
  const graceFloor = new Date(now.getTime() - GRACE_MINUTES * 60 * 1000)

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, owner_id, dog_name, title, scheduled_time')
    .eq('status', 'pending')
    .is('reminder_sent_at', null)
    .gt('scheduled_time', graceFloor.toISOString())
    .lte('scheduled_time', horizon.toISOString())
  if (tasksError) return jsonResponse({ error: tasksError.message }, 500)
  if (!tasks || tasks.length === 0) return jsonResponse({ sent: 0, reason: 'no tasks in window' })

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, owner_id, endpoint, p256dh, auth, reminder_minutes')
  if (subsError) return jsonResponse({ error: subsError.message }, 500)
  if (!subs || subs.length === 0) return jsonResponse({ sent: 0, reason: 'no push subscriptions' })

  const subsByOwner = new Map<string, SubscriptionRow[]>()
  for (const sub of subs as SubscriptionRow[]) {
    const list = subsByOwner.get(sub.owner_id) ?? []
    list.push(sub)
    subsByOwner.set(sub.owner_id, list)
  }

  let sent = 0
  let notYetInWindow = 0
  const sendErrors: string[] = []
  const notifiedTaskIds = new Set<string>()
  const deadSubscriptionIds = new Set<string>()

  for (const task of tasks as TaskRow[]) {
    const ownerSubs = subsByOwner.get(task.owner_id)
    if (!ownerSubs) continue
    const scheduled = new Date(task.scheduled_time)

    for (const sub of ownerSubs) {
      const windowStart = scheduled.getTime() - sub.reminder_minutes * 60 * 1000
      if (now.getTime() < windowStart) {
        notYetInWindow++
        continue // not yet inside this device's lead time
      }

      // No body text here — the service worker formats "Coming up at 3:30 PM"
      // on the device, so the time renders in the device's own timezone.
      const payload = JSON.stringify({
        title: `${task.title} — ${task.dog_name}`,
        scheduledTime: task.scheduled_time,
        tag: `task-${task.id}`,
        url: '/today',
      })

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent++
        notifiedTaskIds.add(task.id)
      } catch (e) {
        const statusCode = (e as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) deadSubscriptionIds.add(sub.id)
        // Other failures: leave reminder_sent_at unset so the next run retries.
        const detail = (e as { body?: string }).body || (e as Error).message || String(e)
        sendErrors.push(`status ${statusCode ?? '?'}: ${detail}`.slice(0, 300))
        console.error('push send failed', sub.endpoint.slice(0, 60), detail)
      }
    }
  }

  if (notifiedTaskIds.size > 0) {
    await supabase
      .from('tasks')
      .update({ reminder_sent_at: now.toISOString() })
      .in('id', [...notifiedTaskIds])
  }
  if (deadSubscriptionIds.size > 0) {
    await supabase.from('push_subscriptions').delete().in('id', [...deadSubscriptionIds])
  }

  return jsonResponse({
    sent,
    expired: deadSubscriptionIds.size,
    tasksInWindow: tasks.length,
    subscriptions: subs.length,
    notYetInWindow,
    errors: sendErrors.slice(0, 3),
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
