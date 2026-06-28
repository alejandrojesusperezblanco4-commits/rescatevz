export type UserRole = 'admin' | 'rescuer' | 'medical' | 'family' | 'ngo'

export type VictimStatus = 'alive' | 'critical' | 'deceased' | 'missing' | 'unknown'

export type LocationType = 'hospital' | 'shelter' | 'rescue_zone' | 'collapsed_building' | 'collection_center'

export interface VictimStatusCounts {
  alive: number
  critical: number
  deceased: number
  missing: number
  unknown: number
}

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  cedula: string | null
  cedula_photo_url: string | null
  selfie_url: string | null
  is_verified: boolean
  created_at: string
}

export interface Location {
  id: string
  name: string
  type: LocationType
  lat: number
  lng: number
  address: string | null
  phone: string | null
  capacity: number | null
  current_occupancy: number
  is_active: boolean
  needs?: string[]
  victim_count?: number
  victim_counts?: VictimStatusCounts
}

export interface Victim {
  id: string
  created_by: string
  name: string | null
  cedula: string | null
  partida_nacimiento: string | null
  tutor_cedula: string | null
  physical_description: string
  estimated_age: number | null
  is_minor: boolean
  status: VictimStatus
  found_location: string
  current_location_id: string | null
  photo_urls: string[]
  notes: string | null
  created_at: string
  updated_at: string
  current_location?: Location
}

export interface AccessRequest {
  id: string
  family_user_id: string
  victim_id: string
  id_document_url: string
  relationship_description: string
  status: AccessRequestStatus
  approved_by: string | null
  approved_at: string | null
  expires_at: string | null
  created_at: string
  victim?: Pick<Victim, 'id' | 'name' | 'physical_description' | 'is_minor' | 'status'>
  family_user?: Pick<Profile, 'id' | 'email' | 'full_name'>
}

export interface SearchResult {
  location_name: string
  location_type: LocationType
  location_id: string
  match_count: number
  victim_id?: string
  victim_name?: string | null
  victim_status?: VictimStatus
  is_minor?: boolean
}

export const STATUS_LABELS: Record<VictimStatus, string> = {
  alive: 'Con vida',
  critical: 'Estado crítico',
  deceased: 'Fallecido',
  missing: 'Desaparecido',
  unknown: 'Desconocido',
}

export const STATUS_COLORS: Record<VictimStatus, string> = {
  alive: 'bg-green-100 text-green-800',
  critical: 'bg-orange-100 text-orange-800',
  deceased: 'bg-gray-100 text-gray-800',
  missing: 'bg-purple-100 text-purple-800',
  unknown: 'bg-yellow-100 text-yellow-800',
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  hospital:           'Hospital',
  shelter:            'Refugio',
  rescue_zone:        'Zona de rescate',
  collapsed_building: 'Edificio derrumbado',
  collection_center:  'Centro de acopio / ONG',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:   'Administrador',
  rescuer: 'Rescatista',
  medical: 'Personal médico',
  family:  'Familiar',
  ngo:     'ONG / Centro de acopio',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  family:  'Busco a un familiar desaparecido. Podré solicitar acceso a registros tras verificar mi identidad.',
  rescuer: 'Soy voluntario o rescatista activo en campo. Podré registrar víctimas tras aprobación de un administrador.',
  medical: 'Soy médico, enfermero o personal de salud. Podré actualizar el estado médico de víctimas.',
  ngo:     'Represento una ONG o centro de acopio. Publicaremos nuestra ubicación y qué artículos necesitamos.',
  admin:   'Administrador del sistema.',
}
