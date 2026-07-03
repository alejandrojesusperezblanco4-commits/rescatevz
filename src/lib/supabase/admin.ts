import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SOLO para route handlers / código de servidor. Usa la service role key,
// que ignora RLS por completo — nunca importar este archivo desde un
// componente 'use client' ni exponer SUPABASE_SERVICE_ROLE_KEY como NEXT_PUBLIC_*.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
