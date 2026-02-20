import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { logger } from '@/shared/lib/logger'

// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are injected by vite.config.ts
// from the Vercel Supabase integration env vars (NEXT_PUBLIC_SUPABASE_URL, etc.)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // Show a visible error instead of throwing (which causes a white screen)
  const el = document.getElementById('root')
  if (el) {
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;flex-direction:column;gap:8px">' +
      '<h2 style="color:#ef4444">Error de configuración</h2>' +
      '<p>Faltan variables de entorno: <code>VITE_SUPABASE_URL</code> y/o <code>VITE_SUPABASE_ANON_KEY</code></p>' +
      '<p style="color:#888;font-size:14px">Configúralas en Vercel (Settings → Environment Variables) o en un archivo <code>.env</code> local.</p>' +
      '</div>'
  }
  logger.error(
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
