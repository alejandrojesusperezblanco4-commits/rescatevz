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

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const

export default function SolicitudesPanel({ solicitudes, adminId }: SolicitudesPanelProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)

  const filtered = solicitudes.filter(s => filter === 'all' || s.status === filter)

  async function handleViewDocument(path: string) {
    setLoadingDoc(path)
    const supabase = createClient()
    // Bucket privado: generamos una URL firmada de corta duración en vez
    // de exponer una URL pública permanente del documento de identidad.
    const { data, error } = await supabase.storage.from('access-docs').createSignedUrl(path, 300)
    setLoadingDoc(null)
    if (error || !data) {
      alert('No se pudo generar el enlace al documento: ' + (error?.message || 'desconocido'))
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleDecision(solicitudId: string, decision: 'approved' | 'rejected') {
    setProcessing(solicitudId)
    const supabase = createClient()

    const updateData: Record<string, unknown> = {
      status: decision,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    }

    if (decision === 'approved') {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 48)
      updateData.expires_at = expiresAt.toISOString()
    }

    await supabase.from('access_requests').update(updateData).eq('id', solicitudId)
    await supabase.from('audit_log').insert({
      user_id: adminId,
      action: decision === 'approved' ? 'APPROVE_ACCESS_REQUEST' : 'REJECT_ACCESS_REQUEST',
      resource_type: 'access_request',
      resource_id: solicitudId,
    })

    router.refresh()
    setProcessing(null)
  }

  const pending = solicitudes.filter(s => s.status === 'pending').length

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f === 'all' ? `Todas (${solicitudes.length})` :
             f === 'pending' ? `Pendientes (${pending})` :
             f === 'approved' ? 'Aprobadas' : 'Rechazadas'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium text-gray-600">No hay solicitudes {filter !== 'all' ? filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => (
            <div key={s.id} className={`bg-white rounded-xl border p-5 ${
              s.status === 'pending' ? 'border-amber-200' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Family info */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{s.family_user?.full_name || 'Usuario desconocido'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      s.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {s.status === 'pending' ? 'Pendiente' : s.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{s.family_user?.email} · CI: {s.family_user?.cedula || 'No registrada'}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Relación:</span> {s.relationship_description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Solicitud: {new Date(s.created_at).toLocaleString('es-VE')}
                  </p>

                  {/* Victim info */}
                  {s.victim && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">Víctima solicitada:</p>
                      <div className="flex items-center gap-2">
                        {s.victim.is_minor && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">MENOR</span>
                        )}
                        <span className="text-sm text-gray-800">
                          {s.victim.name || 'Sin nombre'} — {s.victim.physical_description.slice(0, 80)}{s.victim.physical_description.length > 80 ? '…' : ''}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.victim.status as keyof typeof STATUS_COLORS]}`}>
                          {STATUS_LABELS[s.victim.status as keyof typeof STATUS_LABELS]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleViewDocument(s.id_document_url)}
                    disabled={loadingDoc === s.id_document_url}
                    className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 px-3 py-1.5 rounded-lg text-center transition-colors"
                  >
                    {loadingDoc === s.id_document_url ? 'Generando…' : `Ver ${DOCUMENT_TYPE_LABELS[s.id_document_type]}`}
                  </button>
                  {s.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleDecision(s.id, 'approved')}
                        disabled={!!processing}
                        className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {processing === s.id ? '…' : '✅ Aprobar'}
                      </button>
                      <button
                        onClick={() => handleDecision(s.id, 'rejected')}
                        disabled={!!processing}
                        className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {processing === s.id ? '…' : '❌ Rechazar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
