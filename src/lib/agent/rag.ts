import { GUIAS } from '@/data/primeros-auxilios'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Recupera el texto completo de las guías más relevantes para la consulta
export function retrieveFirstAid(query: string): string {
  const q = query.toLowerCase()

  // Keywords por guía
  const keywords: Record<string, string[]> = {
    rcp: ['rcp', 'reanimacion', 'corazon', 'no respira', 'paro', 'compresion', 'cardio'],
    hemorragia: ['sangre', 'hemorragia', 'herida', 'sangrado', 'torniquete', 'corte'],
    shock: ['shock', 'palido', 'frio', 'sudor', 'presion baja', 'desmayo'],
    aplastamiento: ['aplastamiento', 'atrapado', 'escombros', 'crush', 'aplastado'],
    fracturas: ['fractura', 'hueso', 'roto', 'inmovilizar', 'columna', 'espalda'],
    quemaduras: ['quemadura', 'fuego', 'llama', 'quemado', 'calor'],
    inconsciencia: ['inconsciente', 'desmayado', 'no responde', 'perdi el conocimiento'],
    asfixia: ['asfixia', 'atragantado', 'no puede respirar', 'heimlich', 'obstruccion'],
  }

  const matches = GUIAS.filter(g => {
    const kws = keywords[g.slug] || []
    return kws.some(k => q.includes(k)) || q.includes(g.slug)
  })

  if (matches.length === 0) return ''

  // Devuelve el contenido estructurado de las guías más relevantes (máx 2)
  return matches.slice(0, 2).map(g => {
    const pasos = g.pasos.map((p, i) => `${i + 1}. ${p.texto}${p.alerta ? ` ⚠️ ${p.alerta}` : ''}`).join('\n')
    const noHacer = g.no_hacer.map(x => `✗ ${x}`).join('\n')
    return `### ${g.icono} ${g.titulo}\n${g.resumen}\n\n**Pasos:**\n${pasos}\n\n**No hacer:**\n${noHacer}`
  }).join('\n\n---\n\n')
}

// Busca víctimas por texto en nombre o descripción física
export async function searchVictims(query: string) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('victims')
    .select('id, name, physical_description, status, is_minor, current_location:locations(name, type)')
    .eq('is_minor', false)
    .or(`name.ilike.%${query}%,physical_description.ilike.%${query}%`)
    .limit(5)
  return data || []
}

// Devuelve hospitales y refugios activos con ocupación
export async function getLocations() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('locations')
    .select('id, name, type, address, phone, capacity, current_occupancy')
    .eq('is_active', true)
    .order('type')
  return data || []
}

// Registra una víctima directamente desde el agente
export async function createVictim(params: {
  createdBy: string
  name: string | null
  physicalDescription: string
  status: string
  foundLocation: string
  hospitalName?: string
  estimatedAge?: number | null
}) {
  const supabase = getSupabase()

  let locationId: string | null = null
  if (params.hospitalName) {
    const { data: locs } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${params.hospitalName}%`)
      .eq('is_active', true)
      .limit(1)
    if (locs?.[0]) locationId = locs[0].id
  }

  const isMinor = params.estimatedAge != null && params.estimatedAge < 18

  const { data, error } = await supabase
    .from('victims')
    .insert({
      created_by: params.createdBy,
      name: params.name,
      physical_description: params.physicalDescription,
      estimated_age: params.estimatedAge || null,
      is_minor: isMinor,
      status: params.status,
      found_location: params.foundLocation,
      current_location_id: locationId,
      photo_urls: [],
    })
    .select('id')
    .single()

  if (error) throw error

  await supabase.from('audit_log').insert({
    user_id: params.createdBy,
    action: 'CREATE_VICTIM_WHATSAPP_AGENT',
    resource_type: 'victim',
    resource_id: data.id,
  })

  return { id: data.id, isMinor, locationId }
}
