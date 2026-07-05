export type UserRole = 'admin' | 'rescuer' | 'medical' | 'family' | 'ngo' | 'engineer'

export type VictimStatus = 'alive' | 'critical' | 'deceased' | 'missing' | 'unknown'

export type LocationType = 'hospital' | 'shelter' | 'rescue_zone' | 'collapsed_building' | 'collection_center'

export interface VictimStatusCounts {
  alive: number
  critical: number
  deceased: number
  missing: number
  unknown: number
}

// Semáforo de habitabilidad de estructuras (evaluación post-terremoto):
// pending = aún por analizar, green = habitable, yellow = uso restringido,
// red = no habitable / peligro.
export type HabitabilityStatus = 'pending' | 'green' | 'yellow' | 'red'

export type StructureType =
  | 'residential' | 'school' | 'hospital' | 'commercial'
  | 'government' | 'bridge' | 'other'

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
  reporter_name: string | null
  reporter_email: string | null
  reporter_phone: string | null
  created_at: string
  updated_at: string
  current_location?: Location
}

export type IdDocumentType = 'cedula' | 'acta_nacimiento'

export interface VictimStatusLog {
  id: string
  victim_id: string
  old_status: VictimStatus | null
  new_status: VictimStatus
  changed_by: string | null
  notes: string | null
  created_at: string
}

export interface AccessRequest {
  id: string
  family_user_id: string
  victim_id: string
  id_document_url: string
  id_document_type: IdDocumentType
  relationship_description: string
  status: AccessRequestStatus
  approved_by: string | null
  approved_at: string | null
  expires_at: string | null
  created_at: string
  victim?: Pick<Victim, 'id' | 'name' | 'physical_description' | 'is_minor' | 'status'>
  family_user?: Pick<Profile, 'id' | 'email' | 'full_name'>
}

// Resultado de la función RPC search_victims_public: a propósito solo
// trae estos 4 campos, nunca nombre, cédula, foto ni descripción física.
export interface PublicSearchMatch {
  victim_id: string
  location_name: string
  location_type: string
  victim_status: VictimStatus
}

export interface Structure {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  structure_type: StructureType | null
  habitability: HabitabilityStatus
  report_notes: string | null
  assessment_notes: string | null
  reported_by: string | null
  assessed_by: string | null
  assessed_at: string | null
  created_at: string
  updated_at: string
  assessor?: Pick<Profile, 'id' | 'full_name'>
}

export interface MinorInquiry {
  id: string
  reporter_user_id: string
  reporter_name: string
  reporter_contact: string
  description: string
  id_document_url: string
  status: 'pending' | 'reviewed'
  created_at: string
  reporter?: Pick<Profile, 'id' | 'email' | 'full_name'>
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
  family:   'Familiar',
  ngo:      'ONG / Centro de acopio',
  engineer: 'Ingeniero/Arquitecto',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  family:   'Busco a un familiar desaparecido. Podré solicitar acceso a registros tras verificar mi identidad.',
  rescuer:  'Soy voluntario o rescatista activo en campo. Podré registrar víctimas tras aprobación de un administrador.',
  medical:  'Soy médico, enfermero o personal de salud. Podré actualizar el estado médico de víctimas.',
  ngo:      'Represento una ONG o centro de acopio. Publicaremos nuestra ubicación y qué artículos necesitamos.',
  engineer: 'Soy ingeniero o arquitecto. Podré evaluar la habitabilidad de estructuras dañadas.',
  admin:    'Administrador del sistema.',
}

export const HABITABILITY_LABELS: Record<HabitabilityStatus, string> = {
  pending: 'Por analizar',
  green:   'Habitable',
  yellow:  'Uso restringido',
  red:     'No habitable',
}

export const HABITABILITY_COLORS: Record<HabitabilityStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  green:   'bg-green-100 text-green-800',
  yellow:  'bg-yellow-100 text-yellow-800',
  red:     'bg-red-100 text-red-800',
}

export const HABITABILITY_HEX: Record<HabitabilityStatus, string> = {
  pending: '#6B7280',
  green:   '#16A34A',
  yellow:  '#CA8A04',
  red:     '#DC2626',
}

export const STRUCTURE_TYPE_LABELS: Record<StructureType, string> = {
  residential: 'Residencial',
  school:      'Escuela',
  hospital:    'Centro de salud',
  commercial:  'Comercial',
  government:  'Gubernamental',
  bridge:      'Puente / Vía',
  other:       'Otro',
}
