import { createClient } from '@supabase/supabase-js'

export const supabaseProjectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aurirjornlsqepblndwa.supabase.co'
export const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_41OH28xTGCwfGjS5wvSKVg_gcBjop6-'

export const multiplayerConfigured = Boolean(supabaseProjectUrl && supabasePublishableKey)

export const supabase = createClient(supabaseProjectUrl, supabasePublishableKey || 'missing-publishable-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } },
})

// Staff authentication must not share storage with anonymous multiplayer auth.
// Otherwise opening or joining a room can replace a persisted Command Centre
// session (and signing out of one surface can sign out the other).
export const staffSupabase = createClient(supabaseProjectUrl, supabasePublishableKey || 'missing-publishable-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'decked:command-centre:auth:v1',
  },
})

export async function ensureAnonymousUser() {
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) return data.session.user
  const result = await supabase.auth.signInAnonymously()
  if (result.error) throw result.error
  if (!result.data.user) throw new Error('Could not create a player session.')
  return result.data.user
}
