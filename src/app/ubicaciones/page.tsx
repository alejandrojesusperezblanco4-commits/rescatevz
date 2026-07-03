import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import UbicacionesPanel from '@/components/UbicacionesPanel'

export default async function UbicacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, type, lat, lng, address, phone, capacity, current_occupancy, is_active, created_at')
    .order('is_active', { ascending: false })
    .order('type')
    .order('name')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      <Header profile={profile as Profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
          Hospitales y refugios
        </h1>
        <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>
          Gestiona las ubicaciones activas que aparecen en el mapa y en el formulario de registro de víctimas.
        </p>
        <UbicacionesPanel locations={locations || []} />
      </main>
    </div>
  )
}
