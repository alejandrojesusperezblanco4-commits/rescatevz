// Cliente para la API abierta de Venezuela Reporta (venezurlareporta.org)
// Lectura pública sin API key. Escritura requiere x-api-key (solicitar a ayuda@venezuelareporta.org)

const BASE = 'https://venezuelareporta.org/api/v1'
const ATTRIBUTION = 'Venezuela Reporta — venezuelareporta.org'

export interface VRPersona {
  id: string
  status: 'buscando' | 'a_salvo' | 'encontrado'
  nombre: string
  cedula?: string
  genero?: string
  edad?: number
  ciudad?: string
  zona?: string
  ultima_vez?: string
  descripcion?: string
  foto_url?: string
  origen?: string
  verificado: boolean
  created_at: string
  ficha_url: string
}

export interface VRIngreso {
  id: string
  nombre: string
  cedula?: string
  edad?: number
  sexo?: string
  procedencia?: string
  ubicacion: string
  fecha?: string
  recopilado_de?: string
  fuente?: string
  ficha_url: string
  created_at: string
}

export interface VRSitio {
  id: string
  nombre: string
  tipo: 'acopio' | 'clinica' | 'hospital' | 'refugio' | 'otro'
  municipio?: string
  direccion?: string
  lat?: number
  lng?: number
  activo: boolean
}

export interface VRPersonasResponse {
  ok: boolean
  atribucion: string
  generado_at: string
  total: number
  limit: number
  offset: number
  personas: VRPersona[]
}

export interface VRIngresosResponse {
  ok: boolean
  nota: string
  total: number
  personas: VRIngreso[]
}

async function vrFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error(`Venezuela Reporta API error ${res.status}: ${path}`)
  return res.json()
}

export async function buscarPersonas(query: string, limit = 20): Promise<VRPersonasResponse> {
  return vrFetch<VRPersonasResponse>('/personas', { q: query, status: 'buscando', limit })
}

export async function buscarIngresos(query: string, limit = 20): Promise<VRIngresosResponse> {
  return vrFetch<VRIngresosResponse>('/ingresos', { q: query, limit })
}

export async function obtenerSitios(tipo?: string): Promise<VRSitio[]> {
  const params: Record<string, string> = { limit: '5000' }
  if (tipo) params.tipo = tipo
  const res = await vrFetch<{ sitios: VRSitio[] }>('/sitios', params)
  return res.sitios ?? []
}

// Publica una víctima registrada en RescateVZ hacia Venezuela Reporta.
// Requiere API key — solicitar en ayuda@venezuelareporta.org
export async function publicarVictima(apiKey: string, data: {
  nombre?: string
  cedula?: string
  edad?: number
  ciudad?: string
  zona?: string
  descripcion: string
  ultima_vez: string
  origenId: string
}): Promise<{ publicado: boolean; id?: string }> {
  const res = await fetch(`${BASE}/personas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      status: 'buscando',
      nombre: data.nombre,
      cedula: data.cedula,
      edad: data.edad,
      ciudad: data.ciudad ?? 'Venezuela',
      zona: data.zona,
      descripcion: data.descripcion,
      ultima_vez: data.ultima_vez,
      origen_id: data.origenId,
    }),
  })

  if (res.status === 401 || res.status === 403) throw new Error('API key inválida o sin permisos de escritura')
  if (!res.ok) throw new Error(`Error publicando víctima: ${res.status}`)

  const json = await res.json()
  return { publicado: true, id: json.id }
}

export { ATTRIBUTION }
