import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile, Location } from '@/lib/types'
import VictimaForm from '@/components/VictimaForm'

export default async function NuevaVictimaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const canRegister = profile.role === 'admin' || (profile.is_verified && ['rescuer', 'medical'].includes(profile.role))
  if (!canRegister) redirect('/dashboard')

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, type')
    .eq('is_active', true)
    .order('type')

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registrar víctima rescatada</h1>
        <p className="text-sm text-gray-500 mb-8">
          Completa la información de la persona rescatada. Si no conoces el nombre, describe sus características físicas.
        </p>
        <VictimaForm locations={locations as Location[] || []} userId={user.id} />
      </main>
    </div>
  )
}
