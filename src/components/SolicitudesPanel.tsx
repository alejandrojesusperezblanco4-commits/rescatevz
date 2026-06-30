'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { IdDocumentType } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'

const DOCUMENT_TYPE_LABELS: Record<IdDocumentType, string> = {
  cedula: 'Cédula',
  acta_nacimiento: 'Acta de nacimiento',
}

interface Solicitud {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  relationship_description: string
  id_document_url: string
  id_document_type: IdDocumentType
  created_at: string
  victim: { id: string; name: string | null; physical_description: string; is_minor: boolean; status: string } | null
  family_user: { id: string; email: string; full_name: string; cedula: string | null } | null
}

interface SolicitudesPanelProps {
  solicitudes: Solicitud[]
  adminId: string
}

const FILTERS = ['pending', 'approved', 'rejected', 'all'] as const
const FILTER_LABELS: Record<typeof FILTERS[number], string> = {
  pending: 'Pendientes',
  approved: 'Aprobadas',
  rejected: 'Rechazadas',
  all: 'Todas',
}

const STATUS_STYLE = {
  pending:  { color: '#D4A017', bg: 'rgba(212,160,23,0.12)',  border: 'rgba(212,160,23,0.3)' },
  approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
  rejected: { color: '#64748B', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)' },
}

export default function SolicitudesPanel({ solicitudes, adminId }: SolicitudesPanelProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<typeof FILTERS[number]>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)

  const pending = solicitudes.filter(s => s.status === 'pending').length
  const filtered = solicitudes.filter(s => filter === 'all' || s.status === filter)

  async function handleViewDocument(path: string) {
    setLoadingDoc(path)
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('access-docs').createSignedUrl(path, 300)
    setLoadingDoc(null)
    if (error || !data) { alert('No se pudo generar el enlace: ' + (error?.message || 'error')); return }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleDecision(s: Solicitud, decision: 'approved' | 'rejected') {
    setProcessing(s.id)
    const supabase = createClient()

    const expiresAt = decision === 'approved'
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : undefined

    await supabase.from('access_requests').update({
      status: decision,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      ...(expiresAt ? { expires_at: expiresAt } : {}),
    }).eq('id', s.id)

    await supabase.from('audit_log').insert({
      user_id: adminId,
      action: decision === 'approved' ? 'APPROVE_ACCESS_REQUEST' : 'REJECT_ACCESS_REQUEST',
      resource_type: 'access_request',
      resource_id: s.id,
    })

    // Notificar por email si hay datos de la familia
    if (s.family_user?.email) {
      try {
        await fetch('/api/notify/acceso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyEmail: s.family_user.email,
            familyName: s.family_user.full_name || s.family_user.email,
            victimName: s.victim?.name || null,
            victimId: s.victim?.id || '',
            decision,
            expiresAt,
          }),
        })
      } catch {
        // No bloquear el flujo si falla el email
      }
    }

    router.refresh()
    setProcessing(null)
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => {
          const count = f === 'all' ? solicitudes.length : f === 'pending' ? pending : solicitudes.filter(s => s.status === f).length
          const isActive = filter === f
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all"
              style={isActive
                ? { background: '#D4A017', color: '#1a2744' }
                : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(36,51,86,0.5)' }
              }>
              {FILTER_LABELS[f]} ({count})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#64748B', fontVariationSettings: "'FILL' 0" }}>
            inbox
          </span>
          <p className="font-medium" style={{ color: '#64748B' }}>
            No hay solicitudes {filter !== 'all' ? FILTER_LABELS[filter].toLowerCase() : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => {
            const st = STATUS_STYLE[s.status]
            return (
              <div key={s.id} className="rounded-xl p-5"
                style={{ background: '#1e2d4a', border: `1px solid ${s.status === 'pending' ? 'rgba(212,160,23,0.3)' : 'rgba(36,51,86,0.5)'}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold" style={{ color: '#F0F4FF' }}>
                        {s.family_user?.full_name || 'Usuario desconocido'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                        {s.status === 'pending' ? 'Pendiente' : s.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>
                      {s.family_user?.email}
                      {s.family_user?.cedula ? ` · CI: ${s.family_user.cedula}` : ''}
                    </p>
                    <p className="text-sm mt-1.5" style={{ color: '#d0d8f0' }}>
                      <span className="font-medium" style={{ color: '#94A3B8' }}>Relación:</span> {s.relationship_description}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                      {new Date(s.created_at).toLocaleString('es-VE')}
                    </p>

                    {s.victim && (
                      <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap"
                        style={{ borderTop: '1px solid rgba(36,51,86,0.5)' }}>
                        <span className="text-xs" style={{ color: '#64748B' }}>Víctima:</span>
                        {s.victim.is_minor && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)' }}>
                            MENOR
                          </span>
                        )}
                        <span className="text-sm" style={{ color: '#d0d8f0' }}>
                          {s.victim.name || 'Sin nombre'} — {s.victim.physical_description.slice(0, 70)}{s.victim.physical_description.length > 70 ? '…' : ''}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.victim.status as keyof typeof STATUS_COLORS]}`}>
                          {STATUS_LABELS[s.victim.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleViewDocument(s.id_document_url)}
                      disabled={loadingDoc === s.id_document_url}
                      className="text-xs px-3 py-1.5 rounded-lg text-center transition-all hover:brightness-110 disabled:opacity-60"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(36,51,86,0.5)' }}>
                      {loadingDoc === s.id_document_url ? 'Generando…' : `Ver ${DOCUMENT_TYPE_LABELS[s.id_document_type]}`}
                    </button>

                    {s.status === 'pending' && (
                      <>
                        <button onClick={() => handleDecision(s, 'approved')}
                          disabled={!!processing}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60 flex items-center gap-1 justify-center"
                          style={{ background: '#22C55E', color: '#fff' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {processing === s.id ? '…' : 'Aprobar'}
                        </button>
                        <button onClick={() => handleDecision(s, 'rejected')}
                          disabled={!!processing}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60 flex items-center gap-1 justify-center"
                          style={{ background: 'rgba(220,38,38,0.15)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.3)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>cancel</span>
                          {processing === s.id ? '…' : 'Rechazar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
