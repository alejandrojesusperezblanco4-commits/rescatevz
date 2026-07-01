import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/push/notify
// Body: { victimName?: string, foundLocation: string, status: string }
// Llamado internamente desde VictimaForm tras registro exitoso.
export async function POST(req: NextRequest) {
  if (!process.env.VAPID_SUBJECT || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'vapid_not_configured' })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  // Solo accesible desde el mismo origen
  const origin = req.headers.get('origin')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (origin && origin !== appUrl && !appUrl.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { foundLocation } = await req.json() as { foundLocation?: string }
  const admin = getAdmin()

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .limit(200)

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify({
    title: 'RescateVZ — Nueva persona registrada',
    body: foundLocation
      ? `Una persona fue registrada en ${foundLocation}. Puede ser quien buscas.`
      : 'Una nueva persona fue registrada en la base de datos.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/buscar',
  })

  let sent = 0
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

  // Limpiar suscripciones muertas
  if (dead.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', dead)
  }

  return NextResponse.json({ sent, removed: dead.length })
}
