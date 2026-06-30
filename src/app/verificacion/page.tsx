import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import VerificacionPanel from '@/components/VerificacionPanel'

export default async function VerificacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: pendientes } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, cedula, created_at, is_verified')
    .in('role', ['rescuer', 'medical', 'engineer'])
    .eq('is_verified', false)
    .order('created_at', { ascending: true })

  const { data: verificados } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, cedula, created_at, is_verified')
    .in('role', ['rescuer', 'medical', 'engineer'])
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Verificación de staff</h1>
          {(pendientes?.length ?? 0) > 0 && (
            <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full">
              {pendientes!.length} pendiente{pendientes!.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Revisa las solicitudes de rescatistas, personal médico e ingenieros/arquitectos antes de darles acceso.
          Al aprobar, podrán usar sus funciones (registrar víctimas o evaluar estructuras). Al rechazar, su cuenta queda como familiar.
        </p>
        <VerificacionPanel
          pendientes={pendientes ?? []}
          verificados={verificados ?? []}
          adminId={user.id}
        />
      </main>
    </div>
  )
}
