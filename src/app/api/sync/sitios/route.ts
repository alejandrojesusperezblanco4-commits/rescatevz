import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { obtenerSitios } from '@/lib/venezuelareporta'

function mapTipo(tipo: string): 'hospital' | 'shelter' {
  if (tipo === 'hospital' || tipo === 'clinica') return 'hospital'
  return 'shelter' // acopio, refugio, otro
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  // soloAbiertos: filtrar por estado_operativo === 'abierto' (default true)
  const soloAbiertos: boolean = body.soloAbiertos !== false

  try {
    const sitios = await obtenerSitios()

    const filtrados = soloAbiertos
      ? sitios.filter(s => !s.estado_operativo || s.estado_operativo === 'abierto')
      : sitios

    if (filtrados.length === 0) {
      return NextResponse.json({
        ok: true, inserted: 0, skipped: 0, total: 0,
        message: 'Venezuela Reporta no devolvió sitios con estado_operativo abierto. Intenta con soloAbiertos: false.',
      })
    }

    const admin = createAdminClient()
    const { data: existentes } = await admin
      .from('locations').select('name, type')

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
        address: s.municipio ?? null,
        capacity: s.personas_estimadas ?? null,
        current_occupancy: 0,
        is_active: true,
        phone: null,
      }))

    let inserted = 0
    if (nuevos.length > 0) {
      // Insertar en lotes de 50 para evitar timeouts
      for (let i = 0; i < nuevos.length; i += 50) {
        const { error } = await admin.from('locations').insert(nuevos.slice(i, i + 50))
        if (error) throw new Error(error.message)
        inserted += Math.min(50, nuevos.length - i)
      }
    }

    await admin.from('audit_log').insert({
      action: 'import_locations_vr',
      actor_id: user.id,
      details: { total_vr: filtrados.length, inserted, skipped: filtrados.length - inserted },
    })

    const { count: totalDB } = await admin
      .from('locations').select('*', { count: 'exact', head: true })

    return NextResponse.json({
      ok: true,
      total: filtrados.length,
      inserted,
      skipped: filtrados.length - inserted,
      totalDB,
      message: inserted > 0
        ? `✅ ${inserted} nuevas ubicaciones importadas de Venezuela Reporta`
        : 'Todos los sitios ya estaban en la base de datos',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sync/sitios]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
