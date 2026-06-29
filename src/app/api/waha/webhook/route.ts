import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runAgent } from '@/lib/agent'
import { sendMessage, extractPhone } from '@/lib/agent/waha'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true }) // WAHA espera 200 siempre
  }

  // WAHA envía distintos tipos de eventos — solo procesamos mensajes de texto entrantes
  const event = body.event as string
  if (event !== 'message' && event !== 'message.any') {
    return NextResponse.json({ ok: true })
  }

  const payload = body.payload as Record<string, unknown>
  const fromMe = payload?.fromMe as boolean
  if (fromMe) return NextResponse.json({ ok: true }) // ignorar mensajes propios

  const from = payload?.from as string
  const messageBody = (payload?.body as string || '').trim()

  if (!from || !messageBody) return NextResponse.json({ ok: true })

  const phone = extractPhone(from)

  // Buscar usuario por teléfono
  const supabase = getSupabase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_verified, full_name')
    .eq('phone', `+${phone.replace(/^\+/, '')}`)
    .maybeSingle()

  const userId = profile?.id || 'anonymous'
  const userRole = (profile?.role as any) || null
  const isVerified = profile?.is_verified ?? false

  // Si tiene rol de staff pero no está verificado, tratarlo como family
  const effectiveRole = (userRole && ['rescuer', 'medical'].includes(userRole) && !isVerified)
    ? 'family'
    : userRole

  let reply: string
  try {
    reply = await runAgent(messageBody, {
      userId,
      userRole: effectiveRole,
      userName: profile?.full_name || 'Usuario',
      phone,
    })
  } catch (err) {
    console.error('Agent error:', err)
    reply = '❌ Ocurrió un error interno. Intenta de nuevo en un momento.'
  }

  // Enviar respuesta vía WAHA
  await sendMessage(from, reply)

  return NextResponse.json({ ok: true })
}
