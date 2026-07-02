import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Location, Profile } from '@/lib/types'
import MapaClientWrapper from '@/components/MapaClientWrapper'
import MapaSidebar from '@/components/MapaSidebar'
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
        <div className="flex-1 h-[calc(100vh-8rem)] lg:h-auto p-3">
          <MapaClientWrapper locations={locationsWithCount} />
        </div>
        <MapaSidebar hospitals={hospitals} shelters={shelters} />
      </div>
    </div>
  )
}
