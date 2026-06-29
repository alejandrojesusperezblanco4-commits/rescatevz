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
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Importar víctimas desde CSV</h1>
        <p className="text-sm text-gray-500 mb-2">
          Importa registros desde otras plataformas (Venezuela Te Busca, desaparecidos.com, etc.) exportando como CSV.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
          <strong>Formato del CSV:</strong> El archivo debe tener columnas:
          <code className="bg-amber-100 px-1 rounded mx-1">nombre, descripcion, estado, edad, lugar_encontrado, hospital</code>
          Los estados válidos son: <code className="bg-amber-100 px-1 rounded">vivo, critico, fallecido, desconocido</code>
        </div>
        <ImportadorCSV locations={locations || []} userId={user.id} />
      </main>
    </div>
  )
}
