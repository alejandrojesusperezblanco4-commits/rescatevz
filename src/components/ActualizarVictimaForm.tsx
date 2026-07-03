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
  isRescuer?: boolean
}

const STATUS_OPTIONS: { value: VictimStatus; icon: string; color: string; bg: string; border: string }[] = [
  { value: 'alive',    icon: 'check_circle', color: '#22C55E', bg: 'rgba(34,197,94,0.15)',   border: '#22C55E' },
  { value: 'critical', icon: 'emergency',    color: '#F97316', bg: 'rgba(249,115,22,0.15)',  border: '#F97316' },
  { value: 'deceased', icon: 'cancel',       color: '#64748B', bg: 'rgba(100,116,139,0.15)', border: '#64748B' },
  { value: 'unknown',  icon: 'help',         color: '#D4A017', bg: 'rgba(212,160,23,0.15)',  border: '#D4A017' },
]

export default function ActualizarVictimaForm({
  victimId, currentStatus, currentLocationId, currentNotes, locations, userId, isRescuer = false,
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
      .update({ status, current_location_id: locationId || null, notes: notes.trim() || null })
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
    setTimeout(() => { setSuccess(false); setOpen(false); router.refresh() }, 1500)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full mt-5 py-3 text-sm font-medium rounded-xl border-2 border-dashed transition-all hover:brightness-110"
        style={{ borderColor: 'rgba(212,160,23,0.3)', color: '#D4A017' }}>
        <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '16px' }}>edit</span>
        {isRescuer ? 'Actualizar desde campo' : 'Actualizar estado médico'}
      </button>
    )
  }

  return (
    <div className="mt-5 rounded-xl p-5"
      style={{ background: '#162040', border: '1px solid rgba(212,160,23,0.25)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
          {isRescuer ? 'Actualizar desde campo' : 'Actualizar estado médico'}
        </h2>
        <button onClick={() => setOpen(false)} style={{ color: '#64748B', fontSize: '20px', lineHeight: 1 }}>×</button>
      </div>

      {success ? (
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-5xl block mb-2" style={{ color: '#22C55E', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-medium" style={{ color: '#22C55E' }}>Actualizado correctamente</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Estado */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#64748B' }}>
              Estado de salud
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                  className="py-2.5 px-3 text-sm font-semibold rounded-lg border-2 text-left flex items-center gap-2 transition-all"
                  style={status === opt.value
                    ? { background: opt.bg, borderColor: opt.border, color: opt.color }
                    : { background: 'transparent', borderColor: 'rgba(36,51,86,0.5)', color: '#94A3B8' }
                  }>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                    {opt.icon}
                  </span>
                  {STATUS_LABELS[opt.value]}
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#64748B' }}>
              Ubicación actual
            </label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm">
              <option value="">Sin ubicación asignada</option>
              {locations.filter(l => l.type === 'hospital').length > 0 && (
                <optgroup label="Hospitales">
                  {locations.filter(l => l.type === 'hospital').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </optgroup>
              )}
              {locations.filter(l => l.type === 'shelter').length > 0 && (
                <optgroup label="Refugios y acopios">
                  {locations.filter(l => l.type === 'shelter').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#64748B' }}>
              {isRescuer ? 'Notas de campo' : 'Notas médicas'}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              placeholder={isRescuer
                ? 'Estado cuando fue encontrada, condiciones, notas del rescate…'
                : 'Diagnóstico, medicación, observaciones clínicas…'
              }
            />
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading || !changed}
              className="flex-1 font-bold py-2.5 rounded-lg text-sm transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: '#D4A017', color: '#1a2744' }}>
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm transition-colors hover:brightness-110"
              style={{ border: '1px solid rgba(36,51,86,0.7)', color: '#94A3B8' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
