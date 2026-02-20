import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are injected by vite.config.ts
// from the Vercel Supabase integration env vars (NEXT_PUBLIC_SUPABASE_URL, etc.)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseMissing = !supabaseUrl || !supabaseAnonKey

if (supabaseMissing) {
  console.error(
    'Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'These are automatically mapped from NEXT_PUBLIC_SUPABASE_URL / SUPABASE_ANON_KEY in vite.config.ts.'
  )
}

export const supabase: SupabaseClient<Database> = supabaseMissing
  ? (new Proxy({} as SupabaseClient<Database>, {
      get(_target, prop) {
        // Return a safe no-op for .auth and nested calls so the app
        // renders the config error screen instead of crashing
        if (prop === 'auth') {
          return new Proxy({}, {
            get() {
              return () => Promise.resolve({ data: { session: null, user: null, subscription: { unsubscribe() {} } }, error: new Error('Supabase not configured') })
            },
          })
        }
        if (prop === 'from') {
          return () => new Proxy({}, {
            get() {
              return () => Promise.resolve({ data: null, error: new Error('Supabase not configured'), count: 0 })
            },
          })
        }
        return () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      },
    }))
  : createClient<Database>(supabaseUrl, supabaseAnonKey)
