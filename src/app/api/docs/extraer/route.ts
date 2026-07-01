import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { chat, imagePart, textPart } from '@/lib/agent/openrouter'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const PROMPT = `Eres un asistente de rescate humanitario en Venezuela. Analiza este documento de campo y extrae todos los registros de personas.

Para cada persona extrae:
- nombre: nombre completo si está visible, null si no
- cedula: número de cédula venezolana si aparece (solo dígitos), null si no
- edad: número entero, null si no se menciona
- estado: "alive" si vivo/a salvo, "critical" si herido/grave, "deceased" si falleció, "unknown" si no se indica
- encontrado_en: lugar, hospital o zona donde fue encontrada (si no se especifica usa "Venezuela")
- descripcion_fisica: descripción de ropa o rasgos físicos, null si no hay
- notas: heridas, medicamentos, contacto familiar u otra info relevante, null si no

Devuelve SOLO JSON válido con este formato exacto:
{
  "personas": [
    {
      "nombre": string | null,
      "cedula": string | null,
      "edad": number | null,
      "estado": "alive" | "critical" | "deceased" | "unknown",
      "encontrado_en": string,
      "descripcion_fisica": string | null,
      "notas": string | null
    }
  ],
  "tipo_documento": "lista_hospitalaria" | "lista_rescate" | "censo_refugio" | "otro",
  "confianza": "alta" | "media" | "baja",
  "advertencias": string[]
}

Si la imagen es ilegible o no contiene personas, devuelve {"personas":[],"tipo_documento":"otro","confianza":"baja","advertencias":["imagen sin datos de personas legibles"]}.`

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = getAdminSupabase()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, is_verified')
    .eq('id', user.id)
    .single()

  const canExtract =
    profile?.role === 'admin' ||
    (['rescuer', 'medical', 'engineer'].includes(profile?.role) && profile?.is_verified)

  if (!canExtract) {
    return NextResponse.json({ error: 'Sin permisos para extraer documentos' }, { status: 403 })
  }

  const body = await request.json()
  const { imageData } = body as { imageData: string }

  if (!imageData || !imageData.startsWith('data:image')) {
    return NextResponse.json({ error: 'Se requiere imageData como data URL' }, { status: 400 })
  }

  const rawJson = await chat(
    [{ role: 'user', content: [imagePart(imageData), textPart(PROMPT)] }],
    { json: true }
  )

  let result: unknown
  try {
    result = JSON.parse(rawJson)
  } catch {
    return NextResponse.json({ error: 'Error procesando respuesta del modelo' }, { status: 500 })
  }

  return NextResponse.json(result)
}
