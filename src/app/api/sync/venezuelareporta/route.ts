import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { buscarPersonas, buscarIngresos } from '@/lib/venezuelareporta'

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

// POST /api/sync/venezuelareporta
// Body: { victimId: string }  → busca coincidencias para una víctima concreta
// Body: { batch: true }       → cruza todas las víctimas sin resolver
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = getAdminSupabase()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const body = await request.json()

  if (body.batch) {
    return handleBatch(admin)
  }

  if (body.victimId) {
    return handleSingle(admin, body.victimId)
  }

  return NextResponse.json({ error: 'Falta victimId o batch:true' }, { status: 400 })
}

async function handleSingle(admin: ReturnType<typeof getAdminSupabase>, victimId: string) {
  const { data: victim } = await admin
    .from('victims')
    .select('id, name, physical_description, estimated_age, found_location')
    .eq('id', victimId)
    .single()

  if (!victim) return NextResponse.json({ error: 'Víctima no encontrada' }, { status: 404 })

  const query = victim.name || victim.physical_description.slice(0, 60)
  const [personas, ingresos] = await Promise.all([
    buscarPersonas(query, 10),
    buscarIngresos(query, 10),
  ])

  return NextResponse.json({
    victimId,
    query,
    buscados: personas.personas,
    hospitalizados: ingresos.personas,
    total: personas.total + ingresos.total,
  })
}

async function handleBatch(admin: ReturnType<typeof getAdminSupabase>) {
  const { data: victims } = await admin
    .from('victims')
    .select('id, name, physical_description, found_location')
    .eq('is_minor', false)
    .in('status', ['unknown', 'alive'])
    .not('name', 'is', null)
    .limit(50)

  if (!victims?.length) return NextResponse.json({ matches: [], total: 0 })

  const results = await Promise.allSettled(
    victims.map(async (v) => {
      const query = v.name!.slice(0, 60)
      const [personas, ingresos] = await Promise.all([
        buscarPersonas(query, 5),
        buscarIngresos(query, 5),
      ])
      return {
        victimId: v.id,
        victimName: v.name,
        buscados: personas.personas.slice(0, 3),
        hospitalizados: ingresos.personas.slice(0, 3),
        hasMatches: personas.total > 0 || ingresos.total > 0,
      }
    })
  )

  const matches = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(r => r.hasMatches)

  return NextResponse.json({ matches, total: matches.length, checked: victims.length })
}
