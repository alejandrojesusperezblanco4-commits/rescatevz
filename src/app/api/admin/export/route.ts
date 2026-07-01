import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function escapeCsv(val: unknown): string {
  if (val == null) return ''
  const str = String(val).replace(/"/g, '""')
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
}

export async function GET(req: Request) {
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
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const { data: victims } = await admin
    .from('victims')
    .select(`
      id, name, physical_description, estimated_age, is_minor, status,
      found_location, notes, created_at, updated_at,
      current_location:locations(name)
    `)
    .order('created_at', { ascending: false })

  const headers = [
    'ID', 'Nombre', 'Descripción física', 'Edad estimada', 'Es menor',
    'Estado', 'Encontrado en', 'Ubicación actual', 'Notas', 'Fecha registro', 'Última actualización',
  ]

  const STATUS_ES: Record<string, string> = {
    alive: 'Con vida', critical: 'Crítico', deceased: 'Fallecido', unknown: 'Desconocido',
  }

  const rows = (victims || []).map(v => {
    const loc = Array.isArray(v.current_location) ? v.current_location[0] : v.current_location
    return [
      v.id,
      v.is_minor ? '[MENOR — datos protegidos]' : (v.name || ''),
      v.is_minor ? '[MENOR — datos protegidos]' : (v.physical_description || ''),
      v.estimated_age ?? '',
      v.is_minor ? 'Sí' : 'No',
      STATUS_ES[v.status] ?? v.status,
      v.found_location,
      (loc as { name?: string } | null)?.name ?? '',
      v.is_minor ? '' : (v.notes || ''),
      new Date(v.created_at).toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
      new Date(v.updated_at).toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
    ].map(escapeCsv).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\r\n')
  const fecha = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rescatevz-victimas-${fecha}.csv"`,
    },
  })
}
