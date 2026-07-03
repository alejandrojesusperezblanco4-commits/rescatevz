import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile, IdDocumentType } from '@/lib/types'

const DOCUMENT_TYPE_LABELS: Record<IdDocumentType, string> = {
  cedula: 'Cédula',
  acta_nacimiento: 'Acta de nacimiento',
}

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',  color: '#D4A017', bg: 'rgba(212,160,23,0.12)',  border: 'rgba(212,160,23,0.3)' },
  approved: { label: 'Aprobada',   color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
  rejected: { label: 'Rechazada',  color: '#64748B', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)' },
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
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
          Mis solicitudes de acceso
        </h1>
        <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>
          Estado de tus solicitudes para ver el perfil completo de una persona encontrada.
          Las aprobaciones son válidas por 48 horas.
        </p>

        {!solicitudes || solicitudes.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: '#64748B' }}>inbox</span>
            <p className="text-sm mb-2" style={{ color: '#64748B' }}>
              Aún no has enviado solicitudes.
            </p>
            <Link href="/buscar" className="text-sm font-medium hover:underline" style={{ color: '#D4A017' }}>
              Buscar a un familiar →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map(s => {
              const cfg = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.rejected
              const isApprovedActive = s.status === 'approved' && s.expires_at && new Date(s.expires_at) > new Date()
              const expiresAt = s.expires_at ? new Date(s.expires_at) : null
              return (
                <div key={s.id} className="rounded-xl p-5"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs" style={{ color: '#64748B' }}>
                      {new Date(s.created_at).toLocaleDateString('es-VE')}
                    </span>
                  </div>
                  <p className="text-sm mb-1" style={{ color: '#d0d8f0' }}>
                    Relación: {s.relationship_description}
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>
                    Documento: {DOCUMENT_TYPE_LABELS[s.id_document_type as IdDocumentType]}
                  </p>
                  {isApprovedActive ? (
                    <div className="flex items-center justify-between">
                      <Link href={`/victima/${s.victim_id}`}
                        className="text-sm font-bold px-4 py-2 rounded-lg transition-all hover:brightness-110 inline-block"
                        style={{ background: '#D4A017', color: '#1a2744' }}>
                        Ver perfil completo →
                      </Link>
                      {expiresAt && (
                        <span className="text-xs" style={{ color: '#64748B' }}>
                          Expira: {expiresAt.toLocaleDateString('es-VE')}
                        </span>
                      )}
                    </div>
                  ) : s.status === 'approved' ? (
                    <p className="text-xs" style={{ color: '#D4A017' }}>
                      El acceso expiró. Solicita de nuevo si lo necesitas.
                    </p>
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
