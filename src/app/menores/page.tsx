import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import MenoresPanel from '@/components/MenoresPanel'

export default async function MenoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: reportes } = await supabase
    .from('minor_inquiries')
    .select(`
      id,
      reporter_name,
      reporter_contact,
      description,
      id_document_url,
      status,
      created_at,
      reporter:profiles!minor_inquiries_reporter_user_id_fkey(id, email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      <Header profile={profile as Profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
          Reportes de menores
        </h1>
        <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>
          No hay búsqueda ni coincidencia automática para menores. Cruza manualmente cada reporte contra los
          menores registrados (ficha de víctima) y verifica el documento antes de contactar al reportante.
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MenoresPanel reportes={(reportes || []) as any[]} adminId={user.id} />
      </main>
    </div>
  )
}
