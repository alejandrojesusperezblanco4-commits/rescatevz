import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Devuelve actividad reciente anonimizada (últimas 24h, máx 10 eventos).
// Público, sin auth. No expone nombres ni datos personales.
export const revalidate = 0

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  const { data } = await supabase
    .from('victims')
    .select('found_location, status, created_at')
    .gte('created_at', since)
    .eq('is_minor', false)
    .order('created_at', { ascending: false })
    .limit(40)

  if (!data || data.length === 0) {
    return NextResponse.json({ eventos: [] })
  }

  // Agrupa por ubicación + ventana de 10 minutos
  const buckets: Record<string, { location: string; count: number; at: string; status: string[] }> = {}
  for (const v of data) {
    const loc = (v.found_location || 'Venezuela').split(',')[0].trim().slice(0, 40)
    const bucket = Math.floor(new Date(v.created_at).getTime() / (10 * 60 * 1000))
    const key = `${loc}|${bucket}`
    if (!buckets[key]) buckets[key] = { location: loc, count: 0, at: v.created_at, status: [] }
    buckets[key].count++
    if (!buckets[key].status.includes(v.status)) buckets[key].status.push(v.status)
  }

  const eventos = Object.values(buckets)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10)
    .map(b => ({
      location: b.location,
      count: b.count,
      at: b.at,
      hasCritical: b.status.includes('critical'),
    }))

  return NextResponse.json({ eventos })
}
