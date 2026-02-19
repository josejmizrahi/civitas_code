import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

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
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const supabase = (supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null) as SupabaseClient<Database>
