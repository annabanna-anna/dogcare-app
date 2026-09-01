// Public-facing details used by the marketing and legal pages (/about,
// /privacy). Kept in one place because these are the values that change
// when the app gets a real domain — and because Google's OAuth verification
// review reads the privacy policy against what the app actually does, so
// stale contact details here are a review risk, not a cosmetic one.

export const SITE_DOMAIN = 'heypup.annaoshiro.com'

/** Where users reach a human about their data. Must be a working inbox
 *  before the verification request is submitted. */
export const CONTACT_EMAIL = `privacy@${SITE_DOMAIN}`

/** Shown on the privacy policy. Update whenever the policy's substance
 *  changes — not on typo fixes. */
export const PRIVACY_EFFECTIVE_DATE = 'September 1, 2026'
