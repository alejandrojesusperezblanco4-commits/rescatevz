import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/admin/settings?key=...
// Público — cualquiera puede leer settings (RLS lo permite)
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })

  const admin = getAdmin()
  const { data, error } = await admin.from('app_settings').select('value').eq('key', key).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ key, value: data?.value ?? null })
}

// PUT /api/admin/settings
// Admin only — actualiza un setting
export async function PUT(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = getAdmin()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })

  const { key, value } = await req.json() as { key: string; value: string }
  if (!key || value === undefined) return NextResponse.json({ error: 'key y value requeridos' }, { status: 400 })

  const { error } = await admin.from('app_settings').upsert({
    key,
    value,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, key, value })
}
