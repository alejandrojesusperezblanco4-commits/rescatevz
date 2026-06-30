import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publicarVictima } from '@/lib/venezuelareporta'

const STATUS_MAP: Record<string, 'buscando' | 'a_salvo' | 'encontrado' | null> = {
  alive: 'a_salvo',
  critical: 'encontrado',
  unknown: 'encontrado',
  deceased: null,
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.VENEZUELAREPORTA_API_KEY
  if (!apiKey) return NextResponse.json({ skipped: 'no_api_key' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { victimId } = await req.json()
  if (!victimId) return NextResponse.json({ error: 'missing victimId' }, { status: 400 })

  const { data: victim } = await supabase
    .from('victims')
    .select('id, name, physical_description, estimated_age, is_minor, status, found_location')
    .eq('id', victimId)
    .single()

  if (!victim) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (victim.is_minor) return NextResponse.json({ skipped: 'minor' })

  const vrStatus = STATUS_MAP[victim.status]
  if (!vrStatus) return NextResponse.json({ skipped: 'deceased' })

  try {
    const result = await publicarVictima(apiKey, {
      status: vrStatus,
      nombre: victim.name ?? undefined,
      edad: victim.estimated_age ?? undefined,
      ciudad: 'Venezuela',
      zona: victim.found_location,
      descripcion: victim.physical_description,
      ultima_vez: victim.found_location,
      origenId: victim.id,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[vr/publicar]', err)
    // VR sync es best-effort — no propagamos el error al cliente
    return NextResponse.json({ skipped: 'vr_error' })
  }
}
