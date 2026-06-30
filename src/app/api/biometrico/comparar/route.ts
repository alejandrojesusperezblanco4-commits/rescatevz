import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { chat, imagePart, textPart } from '@/lib/agent/openrouter'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, is_verified').eq('id', user.id).single()
  return profile
}

async function signedUrl(path: string): Promise<string | null> {
  const admin = getAdmin()
  const { data } = await admin.storage.from('victim-photos').createSignedUrl(path, 120)
  return data?.signedUrl ?? null
}

export interface BiometricoMatch {
  victimId: string
  name: string | null
  status: string
  confianza: 'alta' | 'media'
  razon: string
}

// POST /api/biometrico/comparar
// Body: { victimId: string }
// Compara la foto de esta víctima contra las últimas 15 víctimas adultas con fotos
export async function POST(req: NextRequest) {
  const profile = await getAuthProfile()
  if (!profile) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const canCompare = ['admin', 'medical', 'rescuer'].includes(profile.role) && profile.is_verified
  if (!canCompare) return NextResponse.json({ error: 'Solo staff verificado' }, { status: 403 })

  const { victimId } = await req.json()
  if (!victimId) return NextResponse.json({ error: 'Falta victimId' }, { status: 400 })

  const admin = getAdmin()

  // 1. Obtener la víctima de referencia con sus fotos
  const { data: reference } = await admin
    .from('victims')
    .select('id, name, status, photo_urls, is_minor')
    .eq('id', victimId)
    .single()

  if (!reference || reference.is_minor) {
    return NextResponse.json({ error: 'Víctima no encontrada o protegida' }, { status: 404 })
  }

  const refPaths = (reference.photo_urls || []) as string[]
  if (refPaths.length === 0) {
    return NextResponse.json({ error: 'Esta víctima no tiene fotos para comparar' }, { status: 422 })
  }

  // 2. Obtener candidatos: últimas 15 víctimas adultas con fotos, excluyendo la de referencia
  const { data: candidates } = await admin
    .from('victims')
    .select('id, name, status, photo_urls')
    .eq('is_minor', false)
    .neq('id', victimId)
    .not('photo_urls', 'eq', '{}')
    .order('created_at', { ascending: false })
    .limit(15)

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ matches: [], mensaje: 'No hay otras víctimas con fotos para comparar.' })
  }

  // 3. Obtener signed URLs para referencia y candidatos
  const refUrl = await signedUrl(refPaths[0])
  if (!refUrl) return NextResponse.json({ error: 'No se pudo acceder a la foto de referencia' }, { status: 500 })

  interface CandidateWithUrl {
    id: string
    name: string | null
    status: string
    url: string
  }

  const candidateData = await Promise.all(
    candidates.map(async (c): Promise<CandidateWithUrl | null> => {
      const paths = (c.photo_urls || []) as string[]
      if (paths.length === 0) return null
      const url = await signedUrl(paths[0])
      return url ? { id: c.id, name: c.name, status: c.status, url } : null
    })
  )
  const validCandidates = candidateData.filter((c): c is CandidateWithUrl => c !== null)

  if (validCandidates.length === 0) {
    return NextResponse.json({ matches: [], mensaje: 'No se pudieron cargar las fotos de los candidatos.' })
  }

  // 4. Llamar a Claude Vision con todas las imágenes
  const content = [
    textPart(
      `Eres un sistema de apoyo humanitario. Analiza si la PERSONA DE REFERENCIA (primera imagen) aparece en alguna de las imágenes de CANDIDATOS numeradas a continuación.

Responde SOLO con JSON válido:
{"coincidencias": [{"indice": N, "confianza": "alta|media", "razon": "descripcion breve en español"}]}

Solo incluye coincidencias con confianza alta o media. Si no hay ninguna: {"coincidencias": []}
Este sistema es de ayuda — un humano revisará cada sugerencia antes de tomar cualquier acción.

PERSONA DE REFERENCIA:`
    ),
    imagePart(refUrl),
    ...validCandidates.flatMap((c, i) => [
      textPart(`CANDIDATO ${i + 1}:`),
      imagePart(c.url),
    ]),
    textPart('Ahora responde con el JSON de coincidencias:'),
  ]

  let raw: string
  try {
    raw = await chat([{ role: 'user', content }], { json: true })
  } catch (err: any) {
    return NextResponse.json({ error: `Error de visión: ${err.message}` }, { status: 500 })
  }

  let parsed: { coincidencias: { indice: number; confianza: string; razon: string }[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ matches: [], mensaje: 'Respuesta inesperada del modelo de visión.' })
  }

  const matches: BiometricoMatch[] = (parsed.coincidencias || [])
    .filter(c => c.confianza === 'alta' || c.confianza === 'media')
    .map(c => {
      const candidate = validCandidates[c.indice - 1]
      if (!candidate) return null
      return {
        victimId: candidate.id,
        name: candidate.name,
        status: candidate.status,
        confianza: c.confianza as 'alta' | 'media',
        razon: c.razon,
      }
    })
    .filter(Boolean) as BiometricoMatch[]

  return NextResponse.json({ matches, totalCandidatos: validCandidates.length })
}
