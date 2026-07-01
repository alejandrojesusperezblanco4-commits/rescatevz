import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
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

  // Últimos 14 días
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()

  const [
    { data: victims },
    { data: requests },
    { data: byStatus },
    { data: topLocs },
  ] = await Promise.all([
    admin.from('victims').select('created_at').gte('created_at', since).order('created_at'),
    admin.from('access_requests').select('created_at, status').gte('created_at', since),
    admin.from('victims').select('status'),
    admin.from('victims').select('found_location').not('found_location', 'is', null),
  ])

  // Agrupa por día (Caracas UTC-4)
  function byDay(rows: { created_at: string }[]) {
    const map: Record<string, number> = {}
    for (const r of rows || []) {
      const d = new Date(r.created_at)
      d.setHours(d.getHours() - 4) // UTC-4 Caracas
      const key = d.toISOString().slice(0, 10)
      map[key] = (map[key] || 0) + 1
    }
    // Rellenar días vacíos
    const result: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000)
      d.setHours(d.getHours() - 4)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: key, count: map[key] || 0 })
    }
    return result
  }

  // Status distribution
  const statusCounts: Record<string, number> = {}
  for (const v of byStatus || []) statusCounts[v.status] = (statusCounts[v.status] || 0) + 1

  // Top 5 ubicaciones
  const locCounts: Record<string, number> = {}
  for (const v of topLocs || []) {
    const loc = (v.found_location || '').split(',')[0].trim().slice(0, 40)
    if (loc) locCounts[loc] = (locCounts[loc] || 0) + 1
  }
  const topLocations = Object.entries(locCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    registrosPorDia: byDay(victims || []),
    solicitudesPorDia: byDay(requests || []),
    statusDistribution: statusCounts,
    topLocations,
    totals: {
      victims: (byStatus || []).length,
      requests: (requests || []).length,
      approved: (requests || []).filter(r => r.status === 'approved').length,
    },
  })
}
