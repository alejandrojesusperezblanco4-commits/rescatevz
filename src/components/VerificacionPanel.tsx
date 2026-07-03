'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/types'

interface StaffProfile {
  id: string
  email: string
  full_name: string
  role: 'rescuer' | 'medical' | 'engineer'
  cedula: string | null
  cedula_photo_url: string | null
  created_at: string
  is_verified: boolean
}

const ROLE_BADGE: Record<StaffProfile['role'], string> = {
  medical: 'bg-blue-100 text-blue-700',
  rescuer: 'bg-orange-100 text-orange-700',
  engineer: 'bg-teal-100 text-teal-700',
}

interface VerificacionPanelProps {
  pendientes: StaffProfile[]
  verificados: StaffProfile[]
  adminId: string
}

export default function VerificacionPanel({ pendientes, verificados, adminId }: VerificacionPanelProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [tab, setTab] = useState<'pendientes' | 'verificados'>('pendientes')
  const [cedulaUrl, setCedulaUrl] = useState<string | null>(null)
  const [cedulaLoading, setCedulaLoading] = useState<string | null>(null)

  async function verCedula(userId: string) {
    setCedulaLoading(userId)
    try {
      const res = await fetch(`/api/admin/kyc-doc?userId=${userId}`)
      const data = await res.json()
      if (data.url) setCedulaUrl(data.url)
    } finally {
      setCedulaLoading(null)
    }
  }

  async function aprobar(userId: string) {
    setProcessing(userId)
    const supabase = createClient()
    await supabase.from('profiles').update({ is_verified: true }).eq('id', userId)
    await supabase.from('audit_log').insert({
      user_id: adminId,
      action: 'VERIFY_STAFF',
      resource_type: 'profile',
      resource_id: userId,
    })
    router.refresh()
    setProcessing(null)
  }

  async function rechazar(userId: string) {
    setProcessing(userId)
    const supabase = createClient()
    // Demote to family — mantiene acceso a la app pero sin poder registrar víctimas
    await supabase.from('profiles').update({ role: 'family', is_verified: false }).eq('id', userId)
    await supabase.from('audit_log').insert({
      user_id: adminId,
      action: 'REJECT_STAFF',
      resource_type: 'profile',
      resource_id: userId,
    })
    router.refresh()
    setProcessing(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const lista = tab === 'pendientes' ? pendientes : verificados

  return (
    <div>
      {/* Modal foto cédula */}
      {cedulaUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setCedulaUrl(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setCedulaUrl(null)}
              className="absolute -top-10 right-0 text-white flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              Cerrar
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cedulaUrl} alt="Foto de cédula" className="w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('pendientes')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'pendientes'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          Pendientes{pendientes.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {pendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('verificados')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'verificados'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          Verificados ({verificados.length})
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">{tab === 'pendientes' ? '✅' : '👥'}</div>
          <p className="font-medium text-gray-600">
            {tab === 'pendientes' ? 'No hay solicitudes pendientes' : 'Aún no hay staff verificado'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-5 flex items-center justify-between gap-4 ${
                tab === 'pendientes' ? 'border-amber-200' : 'border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900">{p.full_name || '(sin nombre)'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[p.role]}`}>
                    {ROLE_LABELS[p.role]}
                  </span>
                  {p.is_verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      ✓ Verificado
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{p.email}</p>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <p className="text-xs text-gray-400">
                    CI: <span className="font-medium text-gray-600">{p.cedula || 'No registrada'}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Registrado: {formatDate(p.created_at)}
                  </p>
                  {p.cedula_photo_url ? (
                    <button
                      onClick={() => verCedula(p.id)}
                      disabled={cedulaLoading === p.id}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:brightness-110 disabled:opacity-50"
                      style={{ background: 'rgba(59,130,246,0.10)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>
                        {cedulaLoading === p.id ? 'progress_activity' : 'badge'}
                      </span>
                      {cedulaLoading === p.id ? 'Cargando…' : 'Ver cédula'}
                    </button>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,160,23,0.10)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}>
                      Sin foto de cédula
                    </span>
                  )}
                </div>
              </div>

              {tab === 'pendientes' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => aprobar(p.id)}
                    disabled={processing === p.id}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {processing === p.id ? '…' : '✅ Aprobar'}
                  </button>
                  <button
                    onClick={() => rechazar(p.id)}
                    disabled={processing === p.id}
                    className="bg-white hover:bg-red-50 disabled:opacity-60 border border-red-300 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {processing === p.id ? '…' : '✗ Rechazar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
