import { createClient } from '@supabase/supabase-js'

const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aurirjornlsqepblndwa.supabase.co'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const multiplayerConfigured = Boolean(projectUrl && publishableKey)

export const supabase = createClient(projectUrl, publishableKey || 'missing-publishable-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } },
})

export async function ensureAnonymousUser() {
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) return data.session.user
  const result = await supabase.auth.signInAnonymously()
  if (result.error) throw result.error
  if (!result.data.user) throw new Error('Could not create a player session.')
  return result.data.user
}
