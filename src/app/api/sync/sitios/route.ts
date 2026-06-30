import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { obtenerSitios } from '@/lib/venezuelareporta'

// Mapea el tipo de sitio de VR al tipo de ubicación en RescateVZ
function mapTipo(tipo: string): 'hospital' | 'shelter' {
  if (tipo === 'hospital' || tipo === 'clinica') return 'hospital'
  return 'shelter' // refugio, acopio, otro
}

export async function POST(request: NextRequest) {
  // Verificar que el usuario es admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden importar sitios' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const soloActivos: boolean = body.soloActivos !== false // default: true

  try {
    const sitios = await obtenerSitios()
    const filtrados = soloActivos ? sitios.filter(s => s.activo) : sitios

    if (filtrados.length === 0) {
      return NextResponse.json({ inserted: 0, total: 0, message: 'Venezuela Reporta no devolvió sitios activos' })
    }

    const admin = createAdminClient()

    // Upsert basado en nombre + tipo para evitar duplicados
    // Usamos una columna generada: concat(lower(name), type) como clave lógica
    // En Supabase no hay ON CONFLICT sin unique constraint, así que comprobamos existentes primero
    const { data: existentes } = await admin
      .from('locations')
      .select('id, name, type')

    const existenteSet = new Set(
      (existentes || []).map(e => `${e.name.toLowerCase().trim()}::${e.type}`)
    )

    const nuevos = filtrados
      .filter(s => !existenteSet.has(`${s.nombre.toLowerCase().trim()}::${mapTipo(s.tipo)}`))
      .map(s => ({
        name: s.nombre,
        type: mapTipo(s.tipo),
        lat: s.lat ?? null,
        lng: s.lng ?? null,
        address: s.direccion ?? s.municipio ?? null,
        capacity: null,
        current_occupancy: 0,
        is_active: s.activo,
      }))

    let inserted = 0
    if (nuevos.length > 0) {
      const { error } = await admin.from('locations').insert(nuevos)
      if (error) throw new Error(error.message)
      inserted = nuevos.length
    }

    // Log en audit_log
    await admin.from('audit_log').insert({
      action: 'import_locations_vr',
      actor_id: user.id,
      details: {
        total_vr: filtrados.length,
        inserted,
        skipped: filtrados.length - inserted,
      },
    }).throwOnError()

    return NextResponse.json({
      ok: true,
      total: filtrados.length,
      inserted,
      skipped: filtrados.length - inserted,
      message: inserted > 0
        ? `Se importaron ${inserted} nuevas ubicaciones de Venezuela Reporta`
        : 'Todos los sitios ya estaban en la base de datos',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sync/sitios]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
