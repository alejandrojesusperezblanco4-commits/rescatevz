import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import SolicitudesPanel from '@/components/SolicitudesPanel'

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: solicitudes } = await supabase
    .from('access_requests')
    .select(`
      id,
      status,
      relationship_description,
      id_document_url,
      created_at,
      approved_at,
      expires_at,
      victim:victims(id, name, physical_description, is_minor, status, current_location_id),
      family_user:profiles!access_requests_family_user_id_fkey(id, email, full_name, cedula)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitudes de acceso familiar</h1>
        <p className="text-sm text-gray-500 mb-8">
          Revisa las solicitudes de familias que quieren ver el perfil completo de una víctima.
          Verifica la cédula antes de aprobar. Las aprobaciones expiran en 48 horas.
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SolicitudesPanel solicitudes={(solicitudes || []) as any[]} adminId={user.id} />
      </main>
    </div>
  )
}
