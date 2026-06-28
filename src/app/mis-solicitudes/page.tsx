import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile, IdDocumentType } from '@/lib/types'

const DOCUMENT_TYPE_LABELS: Record<IdDocumentType, string> = {
  cedula: 'Cédula',
  acta_nacimiento: 'Acta de nacimiento',
}

export default async function MisSolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: solicitudes } = await supabase
    .from('access_requests')
    .select('id, status, id_document_type, relationship_description, created_at, expires_at, victim_id')
    .eq('family_user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis solicitudes de acceso</h1>
        <p className="text-sm text-gray-500 mb-8">
          Aquí puedes ver el estado de tus solicitudes para confirmar y ver el perfil completo de una persona
          encontrada. Las aprobaciones son válidas por 48 horas.
        </p>

        {!solicitudes || solicitudes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">
            Aún no has enviado solicitudes. Puedes hacerlo desde{' '}
            <Link href="/buscar" className="text-red-600 hover:underline">la búsqueda</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            {solicitudes.map(s => {
              const isApprovedActive = s.status === 'approved' && s.expires_at && new Date(s.expires_at) > new Date()
              return (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      s.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {s.status === 'pending' ? 'Pendiente' : s.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('es-VE')}</span>
                  </div>
                  <p className="text-sm text-gray-600">Relación: {s.relationship_description}</p>
                  <p className="text-xs text-gray-400">Documento: {DOCUMENT_TYPE_LABELS[s.id_document_type as IdDocumentType]}</p>
                  {isApprovedActive ? (
                    <Link
                      href={`/victima/${s.victim_id}`}
                      className="inline-block mt-2 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Ver perfil completo
                    </Link>
                  ) : s.status === 'approved' ? (
                    <p className="text-xs text-amber-600 mt-2">El acceso expiró. Solicita de nuevo si lo necesitas.</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
