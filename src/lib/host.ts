/** heypup.app is the marketing site; web.heypup.app is the installable app.
 *  Both serve this same bundle, so the hostname decides what "/" shows.
 *  Anywhere else (localhost, preview deploys) behaves like the old single-host
 *  setup: marketing at "/", app at "/today", "/dogs", etc. */
const APP_HOST = 'web.heypup.app'
const MARKETING_HOST = 'heypup.app'

const { hostname } = window.location

export const isAppHost = hostname === APP_HOST
export const isMarketingHost = hostname === MARKETING_HOST || hostname === `www.${MARKETING_HOST}`

/** Where "Open app" links go. Absolute on the marketing host (different
 *  origin); a same-origin path everywhere else. */
export const APP_URL = isMarketingHost ? `https://${APP_HOST}/today` : '/today'
