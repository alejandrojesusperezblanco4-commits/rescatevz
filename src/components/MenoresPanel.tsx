'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Reporte {
  id: string
  reporter_name: string
  reporter_contact: string
  description: string
  id_document_url: string
  status: 'pending' | 'reviewed'
  created_at: string
  reporter: { id: string; email: string; full_name: string } | null
}

interface MenoresPanelProps {
  reportes: Reporte[]
  adminId: string
}

const STATUS_FILTERS = ['all', 'pending', 'reviewed'] as const

export default function MenoresPanel({ reportes, adminId }: MenoresPanelProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)

  const filtered = reportes.filter(r => filter === 'all' || r.status === filter)
  const pending = reportes.filter(r => r.status === 'pending').length

  async function handleViewDocument(path: string) {
    setLoadingDoc(path)
    const supabase = createClient()
    // Bucket privado access-docs: solo admin lo lee, vía enlace firmado temporal.
    const { data, error } = await supabase.storage.from('access-docs').createSignedUrl(path, 300)
    setLoadingDoc(null)
    if (error || !data) {
      alert('No se pudo generar el enlace al documento: ' + (error?.message || 'desconocido'))
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleMarkReviewed(reporteId: string) {
    setProcessing(reporteId)
    const supabase = createClient()

    await supabase.from('minor_inquiries').update({ status: 'reviewed' }).eq('id', reporteId)
    await supabase.from('audit_log').insert({
      user_id: adminId,
      action: 'REVIEW_MINOR_INQUIRY',
      resource_type: 'minor_inquiry',
      resource_id: reporteId,
    })

    router.refresh()
    setProcessing(null)
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f === 'all' ? `Todos (${reportes.length})` : f === 'pending' ? `Pendientes (${pending})` : 'Revisados'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium text-gray-600">No hay reportes {filter === 'pending' ? 'pendientes' : filter === 'reviewed' ? 'revisados' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className={`bg-white rounded-xl border p-5 ${r.status === 'pending' ? 'border-purple-200' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{r.reporter_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'pending' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {r.status === 'pending' ? 'Pendiente' : 'Revisado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {r.reporter?.email || 'Usuario desconocido'} · Contacto: {r.reporter_contact}
                  </p>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Reporte: {new Date(r.created_at).toLocaleString('es-VE')}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleViewDocument(r.id_document_url)}
                    disabled={loadingDoc === r.id_document_url}
                    className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 px-3 py-1.5 rounded-lg text-center transition-colors"
                  >
                    {loadingDoc === r.id_document_url ? 'Generando…' : 'Ver documento'}
                  </button>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleMarkReviewed(r.id)}
                      disabled={!!processing}
                      className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {processing === r.id ? '…' : '✅ Marcar revisado'}
                    </button>
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
