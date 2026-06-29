import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PUBLIC_API_KEY = process.env.RESCATEVZ_PUBLIC_API_KEY || 'rescatevz-public-2026'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// API pública para que otras plataformas venezolanas envíen registros
// Header requerido: X-RescateVZ-Key
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('X-RescateVZ-Key')
  if (apiKey !== PUBLIC_API_KEY) {
    return NextResponse.json({ error: 'API key inválida' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { name, physical_description, status, found_location, estimated_age, source } = body

  if (!physical_description || !found_location) {
    return NextResponse.json({
      error: 'Campos requeridos: physical_description, found_location'
    }, { status: 422 })
  }

  const validStatuses = ['alive', 'critical', 'deceased', 'unknown']
  const safeStatus = validStatuses.includes(status as string) ? status : 'unknown'

  const supabase = getSupabase()

  // Los registros externos entran con un usuario especial de importación
  const { data: importUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'import@rescatevz.app')
    .maybeSingle()

  if (!importUser) {
    return NextResponse.json({ error: 'Sistema de importación no configurado' }, { status: 500 })
  }

  const { data, error } = await supabase.from('victims').insert({
    created_by: importUser.id,
    name: name || null,
    physical_description: physical_description as string,
    status: safeStatus,
    found_location: found_location as string,
    estimated_age: estimated_age ? parseInt(String(estimated_age)) : null,
    is_minor: estimated_age ? parseInt(String(estimated_age)) < 18 : false,
    photo_urls: [],
    notes: source ? `Importado desde: ${source}` : 'Importado via API externa',
  }).select('id').single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('audit_log').insert({
    user_id: importUser.id,
    action: 'CREATE_VICTIM_EXTERNAL_API',
    resource_type: 'victim',
    resource_id: data.id,
    metadata: { source: source || 'unknown' },
  })

  return NextResponse.json({ id: data.id, message: 'Víctima registrada' }, { status: 201 })
}
