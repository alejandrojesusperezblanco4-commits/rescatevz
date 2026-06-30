import { chat } from './openrouter'
import { retrieveFirstAid, searchVictims, getLocations, createVictim } from './rag'
import type { UserRole } from '@/lib/types'

interface AgentContext {
  userId: string
  userRole: UserRole | null
  userName: string
  phone: string
}

const STATUS_LABELS: Record<string, string> = {
  alive: '✅ Con vida',
  critical: '🟠 Estado crítico',
  deceased: '⚫ Fallecido',
  unknown: '❓ Desconocido',
}

const SYSTEM_PROMPT = `Eres RescateVZ, un asistente de emergencias humanitarias para el terremoto en Venezuela (junio 2026).
Ayudas a rescatistas, médicos y familias a través del chat de la plataforma.

CAPACIDADES:
1. Registrar víctimas rescatadas (solo rescatistas/médicos/admins verificados)
2. Buscar personas desaparecidas en hospitales y refugios
3. Dar protocolos de primeros auxilios paso a paso
4. Informar sobre hospitales y refugios activos

REGLAS:
- Sé conciso y claro. El usuario puede estar en una situación de estrés.
- Para registrar víctimas, extrae: nombre (puede ser null), descripción física, estado (alive/critical/deceased/unknown), lugar donde fue encontrada, hospital/refugio actual, edad estimada.
- Las búsquedas de menores (<18 años) no están disponibles públicamente por protección. Indica que deben ir a /buscar e identificarse.
- Si el usuario no tiene permisos para una acción, explícalo brevemente.
- Responde siempre en español.
- Cuando registres una víctima exitosamente, confirma con el ID corto.`

export async function runAgent(message: string, context: AgentContext): Promise<string> {
  const { userId, userRole, userName } = context
  const canRegister = userRole !== null && ['admin', 'rescuer', 'medical'].includes(userRole)

  // 1. Clasificar intención
  const intentResponse = await chat([
    {
      role: 'system',
      content: `Clasifica el mensaje en exactamente uno de estos intents: REGISTER_VICTIM | SEARCH_PERSON | FIRST_AID | LOCATION_INFO | HELP | OTHER.
Responde solo con el intent en mayúsculas, nada más.`,
    },
    { role: 'user', content: message },
  ])

  const intent = intentResponse.trim().toUpperCase()

  // 2. Ejecutar la acción según el intent
  switch (intent) {
    case 'REGISTER_VICTIM':
      return await handleRegister(message, context, canRegister)

    case 'SEARCH_PERSON':
      return await handleSearch(message)

    case 'FIRST_AID':
      return await handleFirstAid(message)

    case 'LOCATION_INFO':
      return await handleLocations()

    case 'HELP':
      return buildHelp(userRole)

    default:
      // Para mensajes generales, responde usando el LLM con contexto básico
      return await chat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Usuario: ${userName} (${userRole || 'no registrado'})\n\n${message}` },
      ])
  }
}

async function handleRegister(
  message: string,
  context: AgentContext,
  canRegister: boolean
): Promise<string> {
  if (!canRegister) {
    return `❌ Solo rescatistas y médicos verificados pueden registrar víctimas.\n\nRegistra tu cuenta en: ${process.env.NEXT_PUBLIC_APP_URL}/registro`
  }

  // Extraer datos estructurados de la víctima con el LLM
  const extraction = await chat([
    {
      role: 'system',
      content: `Extrae los datos de la víctima del mensaje y devuelve JSON con exactamente estas claves:
{
  "name": string | null,
  "physical_description": string,
  "status": "alive" | "critical" | "deceased" | "unknown",
  "found_location": string,
  "hospital": string | null,
  "estimated_age": number | null
}
Si no se menciona el nombre, usa null. "physical_description" debe incluir características físicas (ropa, cabello, complexión). Si no hay hospital, usa null.`,
    },
    { role: 'user', content: message },
  ], { json: true })

  let data: {
    name: string | null
    physical_description: string
    status: string
    found_location: string
    hospital: string | null
    estimated_age: number | null
  }

  try {
    data = JSON.parse(extraction)
  } catch {
    return '❌ No pude entender los datos de la víctima. Intenta ser más específico:\n\nEjemplo: "Encontré a Juan Pérez, hombre 45 años camisa azul, está vivo, en Calle El Paraíso, lo llevamos al Hospital Universitario"'
  }

  if (!data.physical_description || !data.found_location) {
    return '❌ Necesito al menos la descripción física y el lugar donde fue encontrada la víctima.'
  }

  try {
    const result = await createVictim({
      createdBy: context.userId,
      name: data.name,
      physicalDescription: data.physical_description,
      status: data.status || 'unknown',
      foundLocation: data.found_location,
      hospitalName: data.hospital || undefined,
      estimatedAge: data.estimated_age,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const lines = [
      `✅ Víctima registrada`,
      `ID: ${result.id.slice(0, 8).toUpperCase()}`,
      data.name ? `Nombre: ${data.name}` : 'Nombre: desconocido',
      `Estado: ${STATUS_LABELS[data.status] || STATUS_LABELS.unknown}`,
      `Lugar: ${data.found_location}`,
      result.isMinor ? '⚠️ MENOR — perfil protegido, solo admin' : '',
      '',
      `Ver: ${appUrl}/victima/${result.id}`,
    ].filter(Boolean)

    return lines.join('\n')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return `❌ Error al guardar: ${msg}`
  }
}

async function handleSearch(message: string): Promise<string> {
  // Extraer el término de búsqueda
  const termResponse = await chat([
    {
      role: 'system',
      content: 'Extrae el nombre o descripción de la persona que se busca. Devuelve solo el término de búsqueda, nada más.',
    },
    { role: 'user', content: message },
  ])

  const term = termResponse.trim()
  if (!term) return '❓ No entendí a quién buscas. Dime el nombre o descripción física.'

  const victims = await searchVictims(term)

  if (victims.length === 0) {
    return `🔍 No encontré coincidencias para "${term}".\n\nPrueba con otro nombre o descripción. Para buscar a un menor de edad, usa la app web:\n${process.env.NEXT_PUBLIC_APP_URL}/buscar`
  }

  const lines = [`🔍 Encontré ${victims.length} coincidencia${victims.length > 1 ? 's' : ''} para "${term}":\n`]

  for (const v of victims) {
    const loc = Array.isArray(v.current_location) ? v.current_location[0] : v.current_location
    const locText = loc ? `📍 ${loc.name}` : '📍 Sin ubicación'
    const estado = STATUS_LABELS[v.status as string] || STATUS_LABELS.unknown
    lines.push(`• ${v.name || '(sin nombre)'} — ${estado}\n  ${locText}`)
  }

  lines.push(`\nPara ver el perfil completo, la familia debe solicitar acceso en:\n${process.env.NEXT_PUBLIC_APP_URL}/buscar`)

  return lines.join('\n')
}

async function handleFirstAid(message: string): Promise<string> {
  const context = retrieveFirstAid(message)

  if (!context) {
    // Si no hay guía específica, usa el LLM con el sistema general
    return await chat([
      { role: 'system', content: `${SYSTEM_PROMPT}\n\nResponde con el protocolo de primeros auxilios más relevante. Sé conciso pero completo.` },
      { role: 'user', content: message },
    ])
  }

  // RAG: incluye el contenido de la guía en el contexto del LLM
  const response = await chat([
    {
      role: 'system',
      content: `Eres un asistente de primeros auxilios. Usa la siguiente guía para responder la pregunta del usuario de forma clara y adaptada a WhatsApp (conciso, usa números para los pasos).

GUÍA DE REFERENCIA:
${context}`,
    },
    { role: 'user', content: message },
  ])

  return response + `\n\n📖 Guía completa: ${process.env.NEXT_PUBLIC_APP_URL}/primeros-auxilios`
}

async function handleLocations(): Promise<string> {
  const locations = await getLocations()

  if (locations.length === 0) return '🏥 No hay ubicaciones activas registradas.'

  const hospitals = locations.filter((l: any) => l.type === 'hospital')
  const shelters = locations.filter((l: any) => l.type === 'shelter')

  const lines: string[] = []

  if (hospitals.length > 0) {
    lines.push('🏥 *HOSPITALES ACTIVOS*')
    hospitals.slice(0, 5).forEach((h: any) => {
      const occ = h.capacity ? ` (${h.current_occupancy}/${h.capacity})` : ''
      lines.push(`• ${h.name}${occ}`)
      if (h.phone) lines.push(`  📞 ${h.phone}`)
    })
  }

  if (shelters.length > 0) {
    lines.push('\n🏕️ *REFUGIOS ACTIVOS*')
    shelters.slice(0, 5).forEach((s: any) => {
      const occ = s.capacity ? ` (${s.current_occupancy}/${s.capacity})` : ''
      lines.push(`• ${s.name}${occ}`)
    })
  }

  lines.push(`\n🗺️ Mapa completo: ${process.env.NEXT_PUBLIC_APP_URL}/mapa-publico`)

  return lines.join('\n')
}

function buildHelp(role: UserRole | null): string {
  const lines = [
    '🤖 *RescateVZ — Bot de emergencias*',
    '',
    'Puedo ayudarte con:',
    'Registrar víctima — Describe a la persona rescatada',
    'Buscar persona — "busca a [nombre]"',
    'Primeros auxilios — "cómo hacer RCP", "qué hacer con hemorragia"',
    'Hospitales y refugios — "dónde hay hospitales activos"',
  ]

  if (!role) {
    lines.push('', '⚠️ Tu número no está registrado. Para registrar víctimas:')
    lines.push(`${process.env.NEXT_PUBLIC_APP_URL}/registro`)
  }

  return lines.join('\n')
}
