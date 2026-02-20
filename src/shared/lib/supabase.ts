import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are injected by vite.config.ts
// from the Vercel Supabase integration env vars (NEXT_PUBLIC_SUPABASE_URL, etc.)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseMissing = !supabaseUrl || !supabaseAnonKey

if (supabaseMissing) {
  console.warn(
    'Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'Auth and data operations will fail until configured.'
  )
}

// Always create a real client – use a placeholder URL when vars are missing
// so the SDK initialises without throwing. Calls will simply fail gracefully.
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
