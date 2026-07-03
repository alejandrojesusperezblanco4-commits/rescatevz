import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface NotifyPayload {
  familyEmail: string
  familyName: string
  victimName: string | null
  victimId: string
  decision: 'approved' | 'rejected'
  expiresAt?: string
}

function buildHtml(p: NotifyPayload): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rescate-vz.com'
  const victimLabel = p.victimName || 'la persona registrada'

  if (p.decision === 'approved') {
    const expiry = p.expiresAt
      ? new Date(p.expiresAt).toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short' })
      : '48 horas'

    return {
      subject: '✅ Tu solicitud de acceso fue aprobada — RescateVZ',
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1a2744;font-family:'Inter',Arial,sans-serif;color:#F0F4FF;">
  <div style="max-width:560px;margin:40px auto;background:#1e2d4a;border-radius:12px;overflow:hidden;border:1px solid rgba(36,51,86,0.7);">
    <div style="background:#DC2626;padding:10px 24px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
        🚨 EMERGENCIA ACTIVA · Terremotos Venezuela · 24 jun 2026
      </p>
    </div>
    <div style="padding:32px 24px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:48px;height:48px;background:#1a2744;border:2px solid #D4A017;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#D4A017;font-size:14px;margin-bottom:12px;">RV</div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#F0F4FF;">Solicitud aprobada</h1>
      </div>
      <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hola <strong style="color:#F0F4FF;">${p.familyName}</strong>,
      </p>
      <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Un administrador revisó tu solicitud y ha aprobado el acceso al perfil de
        <strong style="color:#F0F4FF;">${victimLabel}</strong>.
      </p>
      <div style="background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#86EFAC;">
          ⏰ Este acceso expira el <strong>${expiry}</strong>. Después deberás solicitar acceso nuevamente.
        </p>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${appUrl}/victima/${p.victimId}"
          style="display:inline-block;background:#D4A017;color:#1a2744;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
          Ver perfil completo →
        </a>
      </div>
      <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
        Si no solicitaste este acceso, ignora este correo.<br>
        RescateVZ — Plataforma humanitaria · Venezuela 2026
      </p>
    </div>
  </div>
</body>
</html>`,
    }
  }

  return {
    subject: 'Tu solicitud de acceso fue revisada — RescateVZ',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1a2744;font-family:'Inter',Arial,sans-serif;color:#F0F4FF;">
  <div style="max-width:560px;margin:40px auto;background:#1e2d4a;border-radius:12px;overflow:hidden;border:1px solid rgba(36,51,86,0.7);">
    <div style="background:#DC2626;padding:10px 24px;text-align:center;">
      <p style="margin:0;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
        🚨 EMERGENCIA ACTIVA · Terremotos Venezuela · 24 jun 2026
      </p>
    </div>
    <div style="padding:32px 24px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:48px;height:48px;background:#1a2744;border:2px solid #D4A017;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#D4A017;font-size:14px;margin-bottom:12px;">RV</div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#F0F4FF;">Solicitud revisada</h1>
      </div>
      <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hola <strong style="color:#F0F4FF;">${p.familyName}</strong>,
      </p>
      <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hemos revisado tu solicitud de acceso al perfil de
        <strong style="color:#F0F4FF;">${victimLabel}</strong>.
        Lamentablemente no pudimos aprobarla en esta ocasión.
      </p>
      <div style="background:rgba(212,160,23,0.08);border:1px solid rgba(212,160,23,0.2);border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#FCD34D;">
          Si crees que hubo un error, puedes presentar nuevamente tu solicitud con documentación adicional desde la plataforma.
        </p>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${appUrl}/buscar"
          style="display:inline-block;background:#D4A017;color:#1a2744;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Volver a buscar →
        </a>
      </div>
      <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
        RescateVZ — Plataforma humanitaria · Venezuela 2026
      </p>
    </div>
  </div>
</body>
</html>`,
  }
}

export async function POST(request: NextRequest) {
  // Verificar admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins' }, { status: 403 })
  }

  const payload: NotifyPayload = await request.json()

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Sin Resend configurado: log y continuar sin error bloqueante
    console.warn('[notify/acceso] RESEND_API_KEY no configurado — email no enviado')
    return NextResponse.json({ ok: true, skipped: true, reason: 'RESEND_API_KEY no configurado' })
  }

  const { subject, html } = buildHtml(payload)
  const from = process.env.RESEND_FROM_EMAIL || 'RescateVZ <noreply@rescatevz.org>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [payload.familyEmail], subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[notify/acceso] Resend error:', err)
    return NextResponse.json({ ok: true, skipped: true, reason: 'Resend error: ' + err })
  }

  return NextResponse.json({ ok: true })
}
