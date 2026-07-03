import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import webpush from 'web-push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/sismos/notificar
// Body: { usgsId, magnitude, place, occurredAt }
// Acceso: admin autenticado O CRON_SECRET en Authorization header
export async function POST(req: NextRequest) {
  const admin = getAdmin()

  // Permite llamadas internas del cron con el secret
  const isInternalCron =
    process.env.CRON_SECRET &&
    req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

  if (!isInternalCron) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
  }

  const { usgsId, magnitude, place, occurredAt } = await req.json() as {
    usgsId: string; magnitude: number; place: string; occurredAt: string
  }

  if (!usgsId || !magnitude || !place) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Verificar duplicado
  const { data: existing } = await admin
    .from('sismos_log')
    .select('usgs_id')
    .eq('usgs_id', usgsId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, alreadyNotified: true, sent: 0 })
  }

  // Enviar push
  let sent = 0
  if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .limit(500)

    if (subs?.length) {
      const mag = magnitude.toFixed(1)
      const payload = JSON.stringify({
        type: 'sismo',
        title: `⚠️ Sismo M${mag} — RescateVZ`,
        body: place,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        url: '/sismos',
      })

      const dead: string[] = []
      await Promise.allSettled(subs.map(async sub => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
          sent++
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) dead.push(sub.endpoint)
        }
      }))

      if (dead.length) {
        await admin.from('push_subscriptions').delete().in('endpoint', dead)
      }
    }
  }

  // Registrar en log para evitar duplicados futuros
  await admin.from('sismos_log').insert({
    usgs_id: usgsId,
    magnitude,
    place,
    occurred_at: occurredAt || new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, alreadyNotified: false, sent })
}
