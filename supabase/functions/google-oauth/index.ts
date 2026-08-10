// google-oauth — the server half of GoodPup's Google Calendar connection.
//
// Google access tokens always expire after 1 hour and that isn't
// configurable. The only way to stay connected is a refresh token, and
// exchanging one requires the OAuth client secret — which can't live in the
// browser. So this function holds the secret and does the exchange.
//
// The browser captures Google's refresh token once at connect time (it
// arrives on the Supabase session as provider_refresh_token), hands it here
// to be stored, and from then on just asks for fresh access tokens.
//
// Three actions, all authenticated with the caller's Supabase JWT:
//   store      — save the refresh token captured at connect time
//   refresh    — exchange it for a fresh ~1hr access token
//   disconnect — forget it (used by "Disconnect" in Settings)
//
// Deploy:  npx supabase functions deploy google-oauth
// Secrets: npx supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
//
// IMPORTANT: GOOGLE_CLIENT_ID/SECRET must be the same OAuth client that's
// configured under Supabase Auth → Providers → Google. A refresh token is
// only valid for the client id it was issued to, so a mismatch fails every
// refresh with invalid_client.

import { createClient } from 'npm:@supabase/supabase-js@2'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

interface RequestBody {
  action?: 'store' | 'refresh' | 'disconnect'
  refreshToken?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Identify the caller from their Supabase JWT. Everything below is scoped
  // to this user id — the client never names whose credentials to touch.
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'Missing Authorization header.' }, 401)
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !userData.user) return json({ error: 'Invalid session.' }, 401)
  const ownerId = userData.user.id

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return json({ error: 'Expected a JSON body.' }, 400)
  }

  if (body.action === 'disconnect') {
    const { error } = await supabase.from('google_credentials').delete().eq('owner_id', ownerId)
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }

  if (body.action === 'store') {
    if (!body.refreshToken) return json({ error: 'Missing refreshToken.' }, 400)
    const { error } = await supabase
      .from('google_credentials')
      .upsert(
        { owner_id: ownerId, refresh_token: body.refreshToken, updated_at: new Date().toISOString() },
        { onConflict: 'owner_id' },
      )
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }

  if (body.action !== 'refresh') return json({ error: 'Unknown action.' }, 400)

  const { data: cred, error: credError } = await supabase
    .from('google_credentials')
    .select('refresh_token')
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (credError) return json({ error: credError.message }, 500)
  // NOT_CONNECTED is distinct from REVOKED below: nothing was ever stored,
  // so the app should prompt a first-time connect rather than report that
  // something broke.
  if (!cred) return json({ error: 'No Google connection stored.', code: 'NOT_CONNECTED' }, 404)

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: cred.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const payload = (await res.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!res.ok || !payload.access_token) {
    // invalid_grant means the refresh token is dead for good — the user
    // revoked access in their Google account, changed password, or it aged
    // out. Drop it so the app stops retrying and asks for a reconnect
    // instead. Every other failure (network, quota, misconfigured secret)
    // is transient or our fault, so the token stays put.
    if (payload.error === 'invalid_grant') {
      await supabase.from('google_credentials').delete().eq('owner_id', ownerId)
      return json({ error: 'Google access was revoked.', code: 'REVOKED' }, 401)
    }
    console.error('google token refresh failed', res.status, payload.error, payload.error_description)
    return json({ error: payload.error_description ?? 'Could not refresh Google access.' }, 502)
  }

  return json({
    accessToken: payload.access_token,
    expiresIn: payload.expires_in ?? 3600,
  })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
