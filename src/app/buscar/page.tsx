import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import Header from '@/components/Header'
import BusquedaFamiliar from '@/components/BusquedaFamiliar'

export default async function BuscarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      {profile && <Header profile={profile as Profile} />}
      <BusquedaFamiliar />
    </div>
  )
}
