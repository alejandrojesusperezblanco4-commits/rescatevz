import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const STATUS_LABELS: Record<string, string> = {
  alive:    'Con vida',
  critical: 'Estado crítico',
  deceased: 'Fallecido/a',
  missing:  'Desaparecido/a',
  unknown:  'Sin identificar',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Escapa texto de la base de datos antes de interpolarlo en el HTML del email
// (nombre/ubicación los escriben rescatistas; el correo no debe poder inyectar HTML).
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

// Anti-spam: máximo un email por víctima cada 5 minutos (memoria del proceso;
// suficiente contra clics repetidos — el auth de staff de abajo es la barrera real).
const lastSent = new Map<string, number>()
const RATE_WINDOW_MS = 5 * 60 * 1000

export async function POST(request: Request) {
  const { victim_id } = await request.json() as { victim_id: string }
  if (!victim_id || !UUID_RE.test(victim_id)) {
    return NextResponse.json({ error: 'victim_id requerido' }, { status: 400 })
  }

  const supabase = await createClient()

  // Solo staff verificado puede disparar notificaciones (mismo criterio que
  // el editor de estado en /victimas/[id]) — RLS no basta como única barrera aquí.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, is_verified').eq('id', user.id).single()
  const canNotify = profile && (profile.role === 'admin'
    || (profile.role === 'medical' && profile.is_verified)
    || (profile.role === 'rescuer' && profile.is_verified))
  if (!canNotify) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const prev = lastSent.get(victim_id)
  if (prev && Date.now() - prev < RATE_WINDOW_MS) {
    return NextResponse.json({ sent: false, reason: 'notificación reciente — espera unos minutos' }, { status: 429 })
  }

  const { data: victim } = await supabase
    .from('victims')
    .select('id, name, status, found_location, reporter_name, reporter_email, current_location_id, locations(name)')
    .eq('id', victim_id)
    .single()

  if (!victim || !victim.reporter_email) {
    return NextResponse.json({ skipped: true, reason: 'sin correo de reportante' })
  }

  const { data: lastLog } = await supabase
    .from('victim_status_log')
    .select('old_status, new_status, created_at')
    .eq('victim_id', victim_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const newStatus = lastLog?.new_status ?? victim.status
  const oldStatus = lastLog?.old_status

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Sin configurar: solo loguear para depuración
    console.log(`[RescateVZ] Notificación pendiente → ${victim.reporter_email} — cambio: ${oldStatus} → ${newStatus}`)
    return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY no configurado' })
  }

  const locationName  = escapeHtml((victim as any).locations?.name ?? victim.found_location ?? '')
  const personName    = escapeHtml(victim.name ?? 'La persona reportada')
  const reporterName  = victim.reporter_name ? escapeHtml(victim.reporter_name) : ''
  const foundLocation = escapeHtml(victim.found_location ?? '')
  const trackingUrl   = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://rescatevz.com'}/seguimiento/${victim_id}`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#F9FAFB;padding:24px;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB">
    <div style="background:#DC2626;color:white;padding:20px 24px">
      <p style="margin:0;font-weight:700;font-size:18px">RescateVZ — Actualización de caso</p>
      <p style="margin:4px 0 0;font-size:12px;opacity:.85">Sistema humanitario de emergencia · Venezuela 2026</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;color:#374151">
        ${reporterName ? `Hola <strong>${reporterName}</strong>,` : 'Hola,'}
      </p>
      <p style="margin:0 0 20px;color:#374151">
        El estado de <strong>${personName}</strong> (reportado/a en <em>${foundLocation}</em>) ha sido actualizado:
      </p>
      ${oldStatus ? `
      <div style="display:flex;align-items:center;gap:12px;margin:0 0 20px">
        <span style="background:#F3F4F6;color:#6B7280;padding:6px 14px;border-radius:999px;font-size:14px;font-weight:600">${STATUS_LABELS[oldStatus] ?? escapeHtml(oldStatus)}</span>
        <span style="color:#9CA3AF;font-size:18px">→</span>
        <span style="background:#DCFCE7;color:#166534;padding:6px 14px;border-radius:999px;font-size:14px;font-weight:600">${STATUS_LABELS[newStatus] ?? escapeHtml(newStatus)}</span>
      </div>` : `
      <div style="margin:0 0 20px">
        <span style="background:#DCFCE7;color:#166534;padding:8px 16px;border-radius:999px;font-size:14px;font-weight:600">
          Estado actual: ${STATUS_LABELS[newStatus] ?? escapeHtml(newStatus)}
        </span>
      </div>`}
      ${locationName ? `<p style="color:#6B7280;font-size:14px;margin:0 0 20px">Ubicación actual registrada: <strong style="color:#374151">${locationName}</strong></p>` : ''}
      <a href="${trackingUrl}"
         style="display:inline-block;background:#DC2626;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Ver seguimiento del caso →
      </a>
      <p style="color:#9CA3AF;font-size:12px;margin:24px 0 0;border-top:1px solid #F3F4F6;padding-top:16px">
        Este correo fue enviado porque registraste este caso en RescateVZ. Si no lo reconoces, puedes ignorarlo.
        Guardas el enlace de seguimiento: <a href="${trackingUrl}" style="color:#DC2626">${trackingUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    process.env.RESEND_FROM_EMAIL ?? 'RescateVZ <notificaciones@rescatevz.com>',
      to:      [victim.reporter_email],
      subject: `Actualización: ${victim.name ?? 'La persona reportada'} — ${STATUS_LABELS[newStatus] ?? newStatus}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[RescateVZ] Resend error:', err)
    return NextResponse.json({ sent: false, error: err }, { status: 502 })
  }

  lastSent.set(victim_id, Date.now())
  return NextResponse.json({ sent: true })
}
