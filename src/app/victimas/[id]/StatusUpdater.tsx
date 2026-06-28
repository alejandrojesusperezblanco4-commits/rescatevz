'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { VictimStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

const STATUS_OPTIONS: VictimStatus[] = ['alive', 'critical', 'missing', 'deceased', 'unknown']

interface Props {
  victimId: string
  currentStatus: VictimStatus
  currentLocationId: string
  hasReporterEmail: boolean
  locations: { id: string; name: string; type: string }[]
}

export default function StatusUpdater({ victimId, currentStatus, currentLocationId, hasReporterEmail, locations }: Props) {
  const router = useRouter()
  const [newStatus, setNewStatus]     = useState<VictimStatus>(currentStatus)
  const [locationId, setLocationId]   = useState(currentLocationId)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [saved, setSaved]             = useState(false)
  const [notified, setNotified]       = useState<boolean | null>(null)

  const changed = newStatus !== currentStatus || locationId !== currentLocationId

  async function handleSave() {
    if (!changed) return
    setLoading(true); setError(''); setSaved(false); setNotified(null)

    const supabase = createClient()
    const { error: upErr } = await supabase
      .from('victims')
      .update({
        status:              newStatus,
        current_location_id: locationId || null,
      })
      .eq('id', victimId)

    if (upErr) {
      setError('Error al guardar: ' + upErr.message)
      setLoading(false); return
    }

    // Notificar al reportante si cambió el estado y hay correo
    if (newStatus !== currentStatus && hasReporterEmail) {
      const notifRes = await fetch('/api/notificar-reportante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victim_id: victimId }),
      })
      setNotified(notifRes.ok)
    }

    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Selector de estado */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Nuevo estado</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setNewStatus(s); setSaved(false) }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                newStatus === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de ubicación */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Ubicación actual</label>
        <select
          value={locationId}
          onChange={e => { setLocationId(e.target.value); setSaved(false) }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">Sin ubicación registrada</option>
          {['hospital', 'shelter', 'collapsed_building'].map(type => {
            const group = locations.filter(l => l.type === type)
            if (group.length === 0) return null
            const labels: Record<string, string> = {
              hospital: '🏥 Hospitales',
              shelter: '🏕️ Refugios',
              collapsed_building: '🏚️ Edificios derrumbados',
            }
            return (
              <optgroup key={type} label={labels[type]}>
                {group.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </optgroup>
            )
          })}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-2 rounded-lg">
          ✅ Estado guardado correctamente.
          {notified === true && hasReporterEmail && ' Correo enviado al reportante.'}
          {notified === false && hasReporterEmail && ' No se pudo enviar el correo (revisar RESEND_API_KEY).'}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !changed}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>

      {hasReporterEmail && newStatus !== currentStatus && !saved && (
        <p className="text-xs text-blue-600">
          Al guardar, se enviará un correo de notificación al reportante.
        </p>
      )}
    </div>
  )
}
