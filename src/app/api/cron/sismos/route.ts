import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchSismosVenezuela } from '@/lib/usgs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/cron/sismos
// Protegido con CRON_SECRET en Authorization: Bearer <secret>
// Llamar desde cron-job.org o Railway Cron cada 10 minutos.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let sismos
  try {
    sismos = await fetchSismosVenezuela(4.0, 10)
  } catch {
    return NextResponse.json({ error: 'Error contactando USGS' }, { status: 502 })
  }

  if (!sismos.length) return NextResponse.json({ checked: 0, notified: 0 })

  // Obtener IDs ya notificados
  const ids = sismos.map(s => s.usgsId)
  const { data: logged } = await admin
    .from('sismos_log')
    .select('usgs_id')
    .in('usgs_id', ids)

  const loggedSet = new Set((logged ?? []).map((r: { usgs_id: string }) => r.usgs_id))
  const nuevos = sismos.filter(s => !loggedSet.has(s.usgsId))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rescate-vz.com'
  let notified = 0

  for (const sismo of nuevos) {
    try {
      const res = await fetch(`${appUrl}/api/sismos/notificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`,
        },
        body: JSON.stringify({
          usgsId: sismo.usgsId,
          magnitude: sismo.magnitude,
          place: sismo.place,
          occurredAt: sismo.occurredAt,
        }),
      })
      if (res.ok) notified++
    } catch {
      // Continúa con el siguiente
    }
  }

  return NextResponse.json({ checked: sismos.length, newFound: nuevos.length, notified })
}
