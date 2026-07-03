import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import ImportadorCSV from '@/components/ImportadorCSV'

export default async function ImportarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: locations } = await supabase
    .from('locations').select('id, name, type').eq('is_active', true).order('type')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      <Header profile={profile as Profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
          Importar víctimas desde CSV
        </h1>
        <p className="text-sm mb-2" style={{ color: '#94A3B8' }}>
          Importa registros desde otras plataformas (Venezuela Te Busca, desaparecidos.com, etc.) exportando como CSV.
        </p>
        <div className="rounded-xl p-4 mb-8 text-sm"
          style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', color: '#d0d8f0' }}>
          <strong>Formato del CSV:</strong> El archivo debe tener columnas:
          <code className="bg-amber-100 px-1 rounded mx-1">nombre, descripcion, estado, edad, lugar_encontrado, hospital</code>
          Los estados válidos son: <code className="bg-amber-100 px-1 rounded">vivo, critico, fallecido, desconocido</code>
        </div>
        <ImportadorCSV locations={locations || []} userId={user.id} />
      </main>
    </div>
  )
}
