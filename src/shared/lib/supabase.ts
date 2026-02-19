import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are injected by vite.config.ts
// from the Vercel Supabase integration env vars (NEXT_PUBLIC_SUPABASE_URL, etc.)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'These are automatically mapped from NEXT_PUBLIC_SUPABASE_URL / SUPABASE_ANON_KEY in vite.config.ts.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
