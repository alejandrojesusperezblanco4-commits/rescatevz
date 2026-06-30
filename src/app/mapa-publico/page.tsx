import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Location, Structure, HabitabilityStatus } from '@/lib/types'
import { HABITABILITY_LABELS, HABITABILITY_HEX } from '@/lib/types'
import MapaClientWrapper from '@/components/MapaClientWrapper'
import PublicShell from '@/components/PublicShell'

const HAB_ORDER: HabitabilityStatus[] = ['green', 'yellow', 'red', 'pending']

export default async function MapaPublicoPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select(`
      id, name, type, lat, lng, address, phone, capacity, current_occupancy, is_active
    `)
    .eq('is_active', true)
    .order('type')

  // Estructuras con coordenadas para pintarlas en el mapa con el semáforo.
  const { data: structuresData } = await supabase
    .from('structures')
    .select('id, name, address, lat, lng, structure_type, habitability, assessment_notes, report_notes')
    .not('lat', 'is', null)

  const structures = (structuresData || []) as Structure[]
  const structureCounts: Record<HabitabilityStatus, number> = { pending: 0, green: 0, yellow: 0, red: 0 }
  structures.forEach(s => { structureCounts[s.habitability]++ })

  // Count victims per location
  const { data: victimCounts } = await supabase
    .from('victims')
    .select('current_location_id')
    .not('current_location_id', 'is', null)

  const countMap: Record<string, number> = {}
  ;(victimCounts || []).forEach(v => {
    if (v.current_location_id) {
      countMap[v.current_location_id] = (countMap[v.current_location_id] || 0) + 1
    }
  })

  const locationsWithCount: Location[] = (locations || []).map(loc => ({
    ...loc,
    victim_count: countMap[loc.id] || 0,
  }))

  const hospitals = locationsWithCount.filter(l => l.type === 'hospital')
  const shelters = locationsWithCount.filter(l => l.type === 'shelter')

  return (
    <PublicShell
      title="Mapa de emergencia"
      headerRight={
        <>
          <Link href="/buscar" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
            Buscar familiar
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
            ← Inicio
          </Link>
        </>
      }
      mainClassName="flex-1 flex flex-col lg:flex-row"
    >
      {/* Map */}
      <div className="flex-1 h-[60vh] lg:h-auto p-4">
        <MapaClientWrapper locations={locationsWithCount} structures={structures} />
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto" style={{ background: '#161B22' }}>
        <div className="p-4">
          <div className="flex gap-4 mb-4 text-sm text-gray-300">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> Hospitales ({hospitals.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Refugios ({shelters.length})</span>
          </div>

          {structures.length > 0 && (
            <div className="mb-5 pb-4 border-b border-white/10">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🏢 Habitabilidad de estructuras</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-300">
                {HAB_ORDER.map(st => (
                  <span key={st} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: HABITABILITY_HEX[st] }} />
                    {HABITABILITY_LABELS[st]} ({structureCounts[st]})
                  </span>
                ))}
              </div>
            </div>
          )}

          {hospitals.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Hospitales activos</h2>
              <div className="space-y-2">
                {hospitals.map(loc => (
                  <LocationCard key={loc.id} location={loc} />
                ))}
              </div>
            </div>
          )}

          {shelters.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Refugios activos</h2>
              <div className="space-y-2">
                {shelters.map(loc => (
                  <LocationCard key={loc.id} location={loc} />
                ))}
              </div>
            </div>
          )}

          {locationsWithCount.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">Cargando ubicaciones…</p>
          )}
        </div>
      </div>
    </PublicShell>
  )
}

function LocationCard({ location }: { location: Location }) {
  const isHospital = location.type === 'hospital'
  return (
    <div className="border border-white/10 rounded-lg p-3 hover:border-white/25 transition-colors" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{isHospital ? '🏥' : '🏕️'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight">{location.name}</p>
          {location.address && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{location.address}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {location.capacity && (
              <span className="text-xs text-gray-400">
                Ocupación: {location.current_occupancy}/{location.capacity}
              </span>
            )}
            {location.victim_count !== undefined && location.victim_count > 0 && (
              <span className="text-xs font-medium text-red-400">
                {location.victim_count} registrado{location.victim_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {location.phone && (
            <a href={`tel:${location.phone}`} className="text-xs text-blue-400 hover:underline mt-0.5 block">
              📞 {location.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
