// Public-facing details used by the marketing and legal pages (/about,
// /privacy). Kept in one place because these are the values that change
// when the app gets a real domain — and because Google's OAuth verification
// review reads the privacy policy against what the app actually does, so
// stale contact details here are a review risk, not a cosmetic one.

// TODO(anna): replace once the custom domain is registered. Google's
// verification flow requires the privacy policy to live on a domain you've
// verified in Search Console, and a *.vercel.app subdomain can't be
// verified — so this has to be a domain you own.
export const SITE_DOMAIN = 'goodpup.app'

/** Where users reach a human about their data. Must be a working inbox
 *  before the verification request is submitted. */
export const CONTACT_EMAIL = `privacy@${SITE_DOMAIN}`

/** Shown on the privacy policy. Update whenever the policy's substance
 *  changes — not on typo fixes. */
export const PRIVACY_EFFECTIVE_DATE = 'August 9, 2026'
