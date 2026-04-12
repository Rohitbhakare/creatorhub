import { createClient } from '@supabase/supabase-js'
import { env } from '../env.js'

// Service role client — bypasses RLS for server-side operations
// Never expose this key to the client
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
