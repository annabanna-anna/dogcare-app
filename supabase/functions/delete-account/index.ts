// delete-account — permanently deletes the calling user's HeyPup account.
//
// Removing the auth user needs the service role key, which can't live in the
// browser. Every app table references auth.users(id) ON DELETE CASCADE, so
// deleting the user also deletes their dogs, stays, tasks, push
// subscriptions, Google credentials and feedback. The Google account itself
// is untouched.
//
// Deploy:  npx supabase functions deploy delete-account
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Only ever deletes the user identified by the caller's own JWT.
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'Missing Authorization header.' }, 401)
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !userData.user) return json({ error: 'Invalid session.' }, 401)

  const { error } = await supabase.auth.admin.deleteUser(userData.user.id)
  if (error) return json({ error: error.message }, 500)
  return json({ ok: true })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
