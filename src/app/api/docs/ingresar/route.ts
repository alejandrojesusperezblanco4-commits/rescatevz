import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

interface PersonaDoc {
  nombre: string | null
  cedula: string | null
  edad: number | null
  estado: 'alive' | 'critical' | 'deceased' | 'unknown'
  encontrado_en: string
  descripcion_fisica: string | null
  notas: string | null
}

const VALID_STATUSES = ['alive', 'critical', 'deceased', 'unknown']

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = getAdminSupabase()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, is_verified')
    .eq('id', user.id)
    .single()

  const canInsert =
    profile?.role === 'admin' ||
    (['rescuer', 'medical'].includes(profile?.role) && profile?.is_verified)

  if (!canInsert) {
    return NextResponse.json({ error: 'Solo staff verificado puede ingresar víctimas' }, { status: 403 })
  }

  const { personas } = (await request.json()) as { personas: PersonaDoc[] }

  if (!Array.isArray(personas) || personas.length === 0) {
    return NextResponse.json({ error: 'Array de personas vacío' }, { status: 400 })
  }
  if (personas.length > 100) {
    return NextResponse.json({ error: 'Máximo 100 personas por lote' }, { status: 400 })
  }

  const rows = personas.map((p) => {
    // Enmascarar cédula — solo últimos 4 dígitos visibles en notes
    const cedulaMasked = p.cedula ? `****${p.cedula.replace(/\D/g, '').slice(-4)}` : null
    const noteParts = [
      cedulaMasked ? `Cédula: ${cedulaMasked}` : null,
      p.notas,
      'Ingresado mediante lector de documentos de campo',
    ].filter(Boolean)

    return {
      created_by: user.id,
      name: p.nombre || null,
      physical_description:
        p.descripcion_fisica ||
        `Persona registrada desde documento de campo${cedulaMasked ? ` — Cédula: ${cedulaMasked}` : ''}`,
      estimated_age: p.edad ?? null,
      is_minor: typeof p.edad === 'number' ? p.edad < 18 : false,
      status: VALID_STATUSES.includes(p.estado) ? p.estado : 'unknown',
      found_location: p.encontrado_en || 'Venezuela (sin especificar)',
      photo_urls: [] as string[],
      notes: noteParts.join(' · '),
    }
  })

  const { data, error } = await admin.from('victims').insert(rows).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_log').insert(
    data.map((v) => ({
      user_id: user.id,
      action: 'CREATE_VICTIM_DOCUMENT_OCR',
      resource_type: 'victim',
      resource_id: v.id,
      metadata: { source: 'documento_campo', lote: personas.length },
    }))
  )

  return NextResponse.json({ insertados: data.length, ids: data.map((v) => v.id) })
}
