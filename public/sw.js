// HeyPup service worker — receives Web Push messages and shows them as
// system notifications, even when no tab is open. Kept dependency-free and
// tiny on purpose: it does nothing else (no caching/offline).

// Per-task-type body copy. "other" stays generic since the task title
// itself carries all the meaning there.
const TASK_BODY = {
  walk: {
    upcoming: (name) => name + "'s due for a walk",
    due: (name) => 'Walkies! ' + name + "'s ready to go",
  },
  meal: {
    upcoming: (name) => name + "'s mealtime is coming up",
    due: (name) => "Dinner's served — " + name + "'s waiting!",
  },
  medication: {
    upcoming: (name) => name + "'s meds are coming up",
    due: (name) => "Time for " + name + "'s meds",
  },
  potty: {
    upcoming: (name) => name + ' might need a potty break soon',
    due: (name) => name + "'s gotta go!",
  },
  other: {
    upcoming: (name) => name + "'s ready when you are",
    due: (name) => "It's go time for " + name + '!',
  },
}

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
    // scheduled moment — the "coming up" phrasing would read wrong there.
    const name = payload.dogName || 'Your pup'
    const isDue = scheduled.getTime() - Date.now() < 60 * 1000
    const phrasing = TASK_BODY[payload.taskType] || TASK_BODY.other
    payload.body = (isDue ? phrasing.due : phrasing.upcoming)(name) + ' (' + time + ')'
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
