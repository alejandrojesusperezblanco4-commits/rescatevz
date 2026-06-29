import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

type VictimStatus = 'alive' | 'critical' | 'deceased' | 'unknown'

// Inicializado dentro de la función para que las env vars estén disponibles en runtime
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const params = Object.fromEntries(new URLSearchParams(body))

  // Validar firma de Twilio para evitar spoofing
  const signature = request.headers.get('x-twilio-signature') || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const webhookUrl = `${appUrl}/api/twilio/webhook`

  if (appUrl && process.env.TWILIO_AUTH_TOKEN) {
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      signature,
      webhookUrl,
      params
    )
    if (!isValid) {
      return new NextResponse('Unauthorized', { status: 403 })
    }
  }

  const from = (params.From || '').replace('whatsapp:', '').trim()
  const messageBody = (params.Body || '').trim()
  const supabase = getSupabase()

  let reply = ''

  // Comando AYUDA
  if (/^(ayuda|help|\?)$/i.test(messageBody)) {
    reply = formatAyuda()
  } else if (/^V\b|^VICTIMA\b/i.test(messageBody)) {
    // Buscar rescatista por número de teléfono
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, is_verified, full_name')
      .eq('phone', from)
      .maybeSingle()

    if (!profile) {
      reply = `❌ Tu número (${from}) no está registrado en RescateVZ.\n\nVisita la app para crear tu cuenta como rescatista:\n${appUrl}/registro`
    } else if (!['rescuer', 'medical', 'admin'].includes(profile.role)) {
      reply = '❌ Tu cuenta no tiene permisos de rescatista. Contacta a un administrador.'
    } else if (!profile.is_verified && profile.role !== 'admin') {
      reply = '⏳ Tu cuenta aún no fue verificada por un administrador.\n\nEspera la aprobación para poder registrar víctimas.'
    } else {
      reply = await procesarVictima(messageBody, profile.id, appUrl, supabase)
    }
  } else {
    reply = `👋 Hola. Soy el bot de RescateVZ.\n\nEnvía *AYUDA* para ver cómo registrar una víctima.\n\nO visita: ${appUrl}`
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(reply)}</Message>
</Response>`

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

async function procesarVictima(message: string, createdBy: string, appUrl: string, supabase: ReturnType<typeof getSupabase>): Promise<string> {
  // Formato: V nombre | descripción física | estado | lugar encontrado | hospital
  const contenido = message.replace(/^(V|VICTIMA)\s*/i, '').trim()
  const partes = contenido.split('|').map(p => p.trim()).filter(Boolean)

  if (partes.length < 2) {
    return `❌ Faltan datos. Necesito al menos nombre y descripción.\n\n${formatAyuda()}`
  }

  const [nombreRaw, descripcion, estadoRaw = '', lugarRaw = '', hospitalRaw = '', edadRaw = ''] = partes

  const name = /^(sin\s?nombre|desconocido|n\/a)$/i.test(nombreRaw) ? null : nombreRaw
  const found_location = lugarRaw || 'No especificado'
  const estimated_age = edadRaw ? parseInt(edadRaw) || null : null
  const is_minor = estimated_age !== null && estimated_age < 18

  const status: VictimStatus = (() => {
    const e = estadoRaw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (['vivo', 'viva', 'alive', 'con vida', 'bien'].includes(e)) return 'alive'
    if (['critico', 'critica', 'critical', 'grave'].includes(e)) return 'critical'
    if (['fallecido', 'fallecida', 'muerto', 'muerta', 'deceased', 'dead'].includes(e)) return 'deceased'
    return 'unknown'
  })()

  // Buscar hospital por nombre parcial
  let current_location_id: string | null = null
  let hospitalEncontrado = ''
  if (hospitalRaw) {
    const { data: locs } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${hospitalRaw}%`)
      .eq('is_active', true)
      .limit(1)
    if (locs?.[0]) {
      current_location_id = locs[0].id
      hospitalEncontrado = locs[0].name
    }
  }

  const { data: victim, error } = await supabase
    .from('victims')
    .insert({
      created_by: createdBy,
      name,
      physical_description: descripcion,
      estimated_age,
      is_minor,
      status,
      found_location,
      current_location_id,
      photo_urls: [],
    })
    .select('id')
    .single()

  if (error || !victim) {
    return '❌ Error al guardar. Intenta de nuevo o usa la app web.'
  }

  await supabase.from('audit_log').insert({
    user_id: createdBy,
    action: 'CREATE_VICTIM_WHATSAPP',
    resource_type: 'victim',
    resource_id: victim.id,
  })

  const emoji = { alive: '✅', critical: '🟠', deceased: '⚫', unknown: '❓' }[status]
  const estadoLabel = { alive: 'Con vida', critical: 'Crítico', deceased: 'Fallecido', unknown: 'Desconocido' }[status]

  return [
    `✅ Víctima registrada`,
    `ID: ${victim.id.slice(0, 8).toUpperCase()}`,
    name ? `Nombre: ${name}` : 'Nombre: desconocido',
    `Estado: ${emoji} ${estadoLabel}`,
    `Lugar: ${found_location}`,
    hospitalEncontrado ? `Hospital: ${hospitalEncontrado}` : hospitalRaw ? `⚠️ Hospital "${hospitalRaw}" no encontrado` : '',
    is_minor ? '⚠️ MENOR — perfil protegido' : '',
    '',
    `Ver: ${appUrl}/victima/${victim.id}`,
  ].filter(l => l !== '').join('\n')
}

function formatAyuda(): string {
  return [
    '📋 *CÓMO REGISTRAR UNA VÍCTIMA*',
    '',
    'Envía: *V* seguido de los datos separados por *|*',
    '',
    'V nombre | descripción | estado | lugar | hospital',
    '',
    '*Estados:* vivo · critico · fallecido · desconocido',
    '',
    '*Ejemplo:*',
    'V Juan Pérez | hombre 40a camisa azul | vivo | Calle El Paraíso | Hospital Universitario',
    '',
    'Para nombre desconocido usa: *sin nombre*',
  ].join('\n')
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
