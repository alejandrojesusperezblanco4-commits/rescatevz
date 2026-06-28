import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Location, VictimStatus, VictimStatusCounts } from '@/lib/types'
import MapaClientWrapper from '@/components/MapaClientWrapper'

export default async function MapaPublicoPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, type, lat, lng, address, phone, capacity, current_occupancy, needs, is_active')
    .eq('is_active', true)
    .order('type')

  const { data: victimRows } = await supabase
    .from('victims')
    .select('current_location_id, status')
    .not('current_location_id', 'is', null)

  const EMPTY_COUNTS = (): VictimStatusCounts => ({ alive: 0, critical: 0, deceased: 0, missing: 0, unknown: 0 })

  const countMap: Record<string, VictimStatusCounts & { total: number }> = {}
  ;(victimRows || []).forEach(v => {
    if (!v.current_location_id) return
    if (!countMap[v.current_location_id]) countMap[v.current_location_id] = { ...EMPTY_COUNTS(), total: 0 }
    const s = v.status as VictimStatus
    countMap[v.current_location_id][s]++
    countMap[v.current_location_id].total++
  })

  const locationsWithCount: Location[] = (locations || []).map(loc => {
    const c = countMap[loc.id]
    return {
      ...loc,
      victim_count:  c?.total || 0,
      victim_counts: c ? { alive: c.alive, critical: c.critical, deceased: c.deceased, missing: c.missing, unknown: c.unknown } : EMPTY_COUNTS(),
    }
  })

  const hospitals   = locationsWithCount.filter(l => l.type === 'hospital')
  const shelters    = locationsWithCount.filter(l => l.type === 'shelter')
  const collapsed   = locationsWithCount.filter(l => l.type === 'collapsed_building')
  const collections = locationsWithCount.filter(l => l.type === 'collection_center')

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
        {/* Mapa */}
        <div className="flex-1 h-[60vh] lg:h-auto p-4">
          <MapaClientWrapper locations={locationsWithCount} />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                Hospitales ({hospitals.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                Refugios ({shelters.length})
              </span>
              {collapsed.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                  Derrumbes ({collapsed.length})
                </span>
              )}
              {collections.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
                  Acopio/ONG ({collections.length})
                </span>
              )}
            </div>

            {/* Edificios derrumbados — primero por urgencia */}
            {collapsed.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  🏚️ Edificios derrumbados
                </h2>
                <div className="space-y-2">
                  {collapsed.map(loc => (
                    <CollapsedCard key={loc.id} location={loc} />
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
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Refugios activos</h2>
                <div className="space-y-2">
                  {shelters.map(loc => (
                    <LocationCard key={loc.id} location={loc} />
                  ))}
                </div>
              </div>
            )}

            {collections.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  📦 Centros de acopio y ONGs
                </h2>
                <div className="space-y-2">
                  {collections.map(loc => (
                    <CollectionCard key={loc.id} location={loc} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Puedes llevar donaciones directamente a estos puntos.{' '}
                  <a href="/como-ayudar" className="text-green-700 underline font-medium">Ver lista completa →</a>
                </p>
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
  const counts = location.victim_counts
  const total  = counts ? counts.alive + counts.critical + counts.deceased + counts.missing + counts.unknown : 0

  return (
    <div className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{isHospital ? '🏥' : '🏕️'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-tight">{location.name}</p>
          {location.address && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{location.address}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {location.capacity && (
              <span className="text-xs text-gray-500">
                Ocupación: {location.current_occupancy}/{location.capacity}
              </span>
            )}
            {total > 0 && (
              <span className="text-xs font-medium text-red-600">
                {total} registrado{total > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {counts && total > 0 && (
            <StatusPills counts={counts} />
          )}
          {location.phone && (
            <a href={`tel:${location.phone}`} className="text-xs text-blue-600 hover:underline mt-1 block">
              📞 {location.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function CollapsedCard({ location }: { location: Location }) {
  const counts = location.victim_counts
  const total  = counts ? counts.alive + counts.critical + counts.deceased + counts.missing + counts.unknown : 0

  return (
    <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-3 hover:border-amber-400 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">🏚️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 leading-tight">{location.name}</p>
          {location.address && (
            <p className="text-xs text-amber-700 mt-0.5 truncate">{location.address}</p>
          )}
          {counts && total > 0
            ? <StatusPills counts={counts} />
            : <p className="text-xs text-amber-600 mt-1.5">Sin personas registradas aún</p>
          }
        </div>
      </div>
    </div>
  )
}

function CollectionCard({ location }: { location: Location }) {
  return (
    <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3 hover:border-green-400 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">📦</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-900 leading-tight">{location.name}</p>
          {location.address && (
            <p className="text-xs text-green-700 mt-0.5 truncate">{location.address}</p>
          )}
          {location.needs && location.needs.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {location.needs.map(n => (
                <span key={n} className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-800">{n}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-600 mt-1">Contactar para ver qué necesitan</p>
          )}
          {location.phone && (
            <a href={`tel:${location.phone}`} className="text-xs text-green-700 hover:underline mt-1 block font-medium">
              📞 {location.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPills({ counts }: { counts: VictimStatusCounts }) {
  const items: { label: string; value: number; cls: string }[] = [
    { label: 'Con vida',     value: counts.alive,    cls: 'bg-green-100 text-green-800' },
    { label: 'Crítico',      value: counts.critical, cls: 'bg-orange-100 text-orange-800' },
    { label: 'Fallecidos',   value: counts.deceased, cls: 'bg-gray-200 text-gray-700' },
    { label: 'Desaparecidos',value: counts.missing,  cls: 'bg-purple-100 text-purple-800' },
    { label: 'Sin ID',       value: counts.unknown,  cls: 'bg-yellow-100 text-yellow-800' },
  ].filter(i => i.value > 0)

  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {items.map(i => (
        <span key={i.label} className={`text-xs font-medium px-1.5 py-0.5 rounded ${i.cls}`}>
          {i.value} {i.label}
        </span>
      ))}
    </div>
  )
}
