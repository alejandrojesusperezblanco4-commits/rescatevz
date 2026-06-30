import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Location, Profile } from '@/lib/types'
import MapaClientWrapper from '@/components/MapaClientWrapper'
import Header from '@/components/Header'

export default async function MapaPublicoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

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
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      {profile ? (
        <Header profile={profile as Profile} />
      ) : (
        <header className="px-6 py-3 flex items-center justify-between"
          style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
              style={{ background: '#1e2d4a', border: '1.5px solid #D4A017', color: '#D4A017' }}>
              RV
            </div>
            <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>Mapa de emergencia</span>
          </div>
          <div className="flex gap-4">
            <Link href="/buscar" className="text-sm transition-colors hover:text-white" style={{ color: '#94A3B8' }}>
              Buscar familiar
            </Link>
            <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: '#64748B' }}>
              ← Inicio
            </Link>
          </div>
        </header>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 h-[60vh] lg:h-auto p-3">
          <MapaClientWrapper locations={locationsWithCount} />
        </div>

        <div className="w-full lg:w-80 overflow-y-auto"
          style={{ background: '#1e2d4a', borderLeft: '1px solid rgba(36,51,86,0.5)' }}>
          <div className="p-4">
            <div className="flex gap-4 mb-5 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#DC2626' }} />
                <span style={{ color: '#94A3B8' }}>Hospitales ({hospitals.length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6' }} />
                <span style={{ color: '#94A3B8' }}>Refugios ({shelters.length})</span>
              </span>
            </div>

            {hospitals.length > 0 && (
              <div className="mb-6">
                <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
                  Hospitales activos
                </h2>
                <div className="space-y-2">
                  {hospitals.map(loc => <LocationCard key={loc.id} location={loc} />)}
                </div>
              </div>
            )}

            {shelters.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
                  Refugios activos
                </h2>
                <div className="space-y-2">
                  {shelters.map(loc => <LocationCard key={loc.id} location={loc} />)}
                </div>
              </div>
            )}

            {locationsWithCount.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#64748B' }}>Cargando ubicaciones…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LocationCard({ location }: { location: Location }) {
  const isHospital = location.type === 'hospital'
  const pct = location.capacity ? Math.round((location.current_occupancy / location.capacity) * 100) : null
  const barColor = pct === null ? '#D4A017' : pct > 90 ? '#DC2626' : pct > 70 ? '#D4A017' : '#22C55E'
  return (
    <div className="rounded-lg p-3 transition-all hover:brightness-110"
      style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-base mt-0.5" style={{ color: '#94A3B8' }}>
          {isHospital ? 'local_hospital' : 'cottage'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight" style={{ color: '#F0F4FF' }}>{location.name}</p>
          {location.address && (
            <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B' }}>{location.address}</p>
          )}
          {pct !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#94A3B8' }}>{location.current_occupancy}/{location.capacity}</span>
                <span style={{ color: barColor }}>{pct}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
              </div>
            </div>
          )}
          {location.victim_count !== undefined && location.victim_count > 0 && (
            <span className="text-xs mt-1 inline-block" style={{ color: '#DC2626' }}>
              {location.victim_count} registrado{location.victim_count > 1 ? 's' : ''}
            </span>
          )}
          {location.phone && (
            <a href={`tel:${location.phone}`} className="text-xs hover:underline mt-1 block" style={{ color: '#D4A017' }}>
              {location.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
