'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { VictimStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

interface Location {
  id: string
  name: string
  type: string
}

interface ActualizarVictimaFormProps {
  victimId: string
  currentStatus: VictimStatus
  currentLocationId: string | null
  currentNotes: string | null
  locations: Location[]
  userId: string
}

export default function ActualizarVictimaForm({
  victimId,
  currentStatus,
  currentLocationId,
  currentNotes,
  locations,
  userId,
}: ActualizarVictimaFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<VictimStatus>(currentStatus)
  const [locationId, setLocationId] = useState(currentLocationId || '')
  const [notes, setNotes] = useState(currentNotes || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const changed = status !== currentStatus
    || locationId !== (currentLocationId || '')
    || notes !== (currentNotes || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!changed) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('victims')
      .update({
        status,
        current_location_id: locationId || null,
        notes: notes.trim() || null,
      })
      .eq('id', victimId)

    if (updateError) {
      setError('Error al actualizar: ' + updateError.message)
      setLoading(false)
      return
    }

    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'UPDATE_VICTIM',
      resource_type: 'victim',
      resource_id: victimId,
      metadata: { new_status: status, prev_status: currentStatus },
    })

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      setSuccess(false)
      setOpen(false)
      router.refresh()
    }, 1500)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-4 border-2 border-dashed border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-600 rounded-xl py-3 text-sm font-medium transition-colors"
      >
        ✏️ Actualizar estado médico
      </button>
    )
  }

  return (
    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-blue-900">Actualizar estado médico</h2>
        <button onClick={() => setOpen(false)} className="text-blue-400 hover:text-blue-600 text-xl leading-none">×</button>
      </div>

      {success ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm font-medium text-green-700">Actualizado correctamente</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estado de salud */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Estado de salud</label>
            <div className="grid grid-cols-2 gap-2">
              {(['alive', 'critical', 'deceased', 'unknown'] as VictimStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2.5 px-3 text-sm font-medium rounded-lg border transition-colors text-left ${
                    status === s
                      ? s === 'alive' ? 'bg-green-600 text-white border-green-600'
                        : s === 'critical' ? 'bg-orange-500 text-white border-orange-500'
                        : s === 'deceased' ? 'bg-gray-600 text-white border-gray-600'
                        : 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {s === 'alive' ? '✅' : s === 'critical' ? '🟠' : s === 'deceased' ? '⚫' : '❓'}{' '}
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación actual */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Ubicación actual</label>
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin ubicación asignada</option>
              {locations.filter(l => l.type === 'hospital').length > 0 && (
                <optgroup label="🏥 Hospitales">
                  {locations.filter(l => l.type === 'hospital').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </optgroup>
              )}
              {locations.filter(l => l.type === 'shelter').length > 0 && (
                <optgroup label="🏕️ Refugios">
                  {locations.filter(l => l.type === 'shelter').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Notas médicas */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Notas médicas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Diagnóstico, medicación, observaciones del médico…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !changed}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
