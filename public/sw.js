// HeyPup service worker — receives Web Push messages and shows them as
// system notifications, even when no tab is open. Kept dependency-free and
// tiny on purpose: it does nothing else (no caching/offline).

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'HeyPup', body: 'You have an upcoming task.', url: '/' }
  try {
    payload = { ...payload, ...event.data.json() }
  } catch {
    // Not JSON (or empty) — fall back to the generic reminder text.
  }
  // The server sends the raw timestamp instead of prose so the time can be
  // formatted here, in the device's own locale and timezone.
  if (payload.scheduledTime) {
    const scheduled = new Date(payload.scheduledTime)
    const time = scheduled.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
    // "On time" reminders (and late-delivered ones) land at or after the
    // scheduled moment — "coming up" would read wrong there.
    payload.body =
      scheduled.getTime() - Date.now() < 60 * 1000
        ? "It's time! (" + time + ')'
        : 'Coming up at ' + time
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/paw.svg',
      badge: '/paw.svg',
      tag: payload.tag, // same tag replaces rather than stacks duplicates
      data: { url: payload.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  const fullUrl = new URL(url, self.registration.scope).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => 'focus' in c)
      // WindowClient.navigate() isn't supported on iOS/WebKit, so open a
      // fresh window there instead of silently failing to bring one forward.
      if (existing && 'navigate' in existing) {
        return existing.navigate(fullUrl).then((client) => client.focus())
      }
      if (existing) return existing.focus()
      return self.clients.openWindow(fullUrl)
    }),
  )
})
