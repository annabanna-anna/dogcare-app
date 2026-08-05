import { supabase } from './supabase'

// Web Push reminders. The browser side of the pipeline:
//
//   1. Register the service worker (public/sw.js) and ask notification
//      permission (must happen from a user gesture — the Settings toggle).
//   2. Subscribe to the browser vendor's push service with our VAPID public
//      key; the browser hands back a unique endpoint URL + encryption keys.
//   3. Store that subscription in the push_subscriptions table, along with
//      how many minutes before each task this device wants to be nudged.
//
// The sending side lives in supabase/functions/send-task-reminders — a
// scheduled Edge Function that looks for tasks coming due and pushes to
// every stored subscription. This file never sends anything itself.
//
// One subscription row per browser/device (keyed on the endpoint URL), so
// the same account can get reminders on both a phone and a laptop.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** True on iOS Safari when the app is running as a plain browser tab — iOS
 *  only allows web push once the app is installed to the home screen. */
export function isIosNeedingInstall(): boolean {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  return isIos && !standalone && !isPushSupported()
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js')
}

/** Re-registers the service worker on app load so browsers pick up sw.js
 *  updates. Safe no-op when unsupported or permission was never granted. */
export function refreshServiceWorker(): void {
  if (!isPushSupported() || Notification.permission !== 'granted') return
  void navigator.serviceWorker.register('/sw.js').catch(() => {})
}

/** Whether this browser currently has an active reminder subscription. */
export async function isPushReminderEnabled(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  return !!subscription
}

/** Turns reminders on for this device: permission → subscribe → store.
 *  Throws with a user-readable message if any step is refused. */
export async function enablePushReminders(reminderMinutes: number): Promise<void> {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Push is not configured — missing VITE_VAPID_PUBLIC_KEY.')
  }
  if (!isPushSupported()) {
    throw new Error(
      isIosNeedingInstall()
        ? 'On iPhone, add GoodPup to your Home Screen first (Share → Add to Home Screen), then enable reminders from there.'
        : 'This browser does not support push notifications.',
    )
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notifications are blocked — allow them for this site in your browser settings.')
  }

  const registration = await getRegistration()
  await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }))

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not signed in.')

  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Could not read the push subscription from this browser.')
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      owner_id: userData.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      reminder_minutes: reminderMinutes,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

/** Turns reminders off for this device and forgets the stored subscription. */
export async function disablePushReminders(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}

/** Updates how far ahead this device gets nudged. No-op if not subscribed. */
export async function setReminderMinutes(minutes: number): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await supabase
    .from('push_subscriptions')
    .update({ reminder_minutes: minutes })
    .eq('endpoint', subscription.endpoint)
}

/** Reads this device's saved lead time, falling back to the default. */
export async function getReminderMinutes(): Promise<number> {
  if (!isPushSupported()) return 15
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return 15
  const { data } = await supabase
    .from('push_subscriptions')
    .select('reminder_minutes')
    .eq('endpoint', subscription.endpoint)
    .maybeSingle()
  return data?.reminder_minutes ?? 15
}

// The Push API wants the VAPID public key as raw bytes, not the URL-safe
// base64 string it's usually shipped around as. Env values pasted into
// hosting dashboards often pick up stray quotes or whitespace, which makes
// Safari's atob throw an opaque "invalid characters" error — strip them.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const cleaned = base64String.trim().replace(/^["']|["']$/g, '')
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4)
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}
