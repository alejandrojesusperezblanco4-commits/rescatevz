import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Location } from '@/lib/types'
import MapaClientWrapper from '@/components/MapaClientWrapper'

export default async function MapaPublicoPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select(`
      id, name, type, lat, lng, address, phone, capacity, current_occupancy, is_active
    `)
    .eq('is_active', true)
    .order('type')

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm">RV</div>
          <span className="font-bold text-lg">RescateVZ — Mapa de emergencia</span>
        </div>
        <div className="flex gap-3">
          <Link href="/buscar" className="text-sm text-gray-300 hover:text-white transition-colors">Buscar familiar</Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Inicio</Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map */}
        <div className="flex-1 h-[60vh] lg:h-auto p-4">
          <MapaClientWrapper locations={locationsWithCount} />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex gap-4 mb-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> Hospitales ({hospitals.length})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Refugios ({shelters.length})</span>
            </div>

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
              <p className="text-sm text-gray-400 text-center py-8">Cargando ubicaciones…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LocationCard({ location }: { location: Location }) {
  const isHospital = location.type === 'hospital'
  return (
    <div className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{isHospital ? '🏥' : '🏕️'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-tight">{location.name}</p>
          {location.address && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{location.address}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {location.capacity && (
              <span className="text-xs text-gray-500">
                Ocupación: {location.current_occupancy}/{location.capacity}
              </span>
            )}
            {location.victim_count !== undefined && location.victim_count > 0 && (
              <span className="text-xs font-medium text-red-600">
                {location.victim_count} registrado{location.victim_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {location.phone && (
            <a href={`tel:${location.phone}`} className="text-xs text-blue-600 hover:underline mt-0.5 block">
              📞 {location.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
