'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Structure, HabitabilityStatus, UserRole } from '@/lib/types'
import {
  HABITABILITY_LABELS, HABITABILITY_COLORS, HABITABILITY_HEX,
  STRUCTURE_TYPE_LABELS,
} from '@/lib/types'

interface EstructurasPanelProps {
  structures: Structure[]
  role: UserRole
  userId: string
  isVerified: boolean
}

const ORDER: HabitabilityStatus[] = ['pending', 'red', 'yellow', 'green']

const EMPTY_FORM = {
  name: '', structure_type: 'residential', address: '', lat: '', lng: '',
  habitability: 'pending' as HabitabilityStatus, assessment_notes: '', report_notes: '',
}

export default function EstructurasPanel({ structures, role, userId, isVerified }: EstructurasPanelProps) {
  const router = useRouter()
  // Debe coincidir con la RLS: admin siempre; ingenieros evalúan y
  // rescatistas reportan solo si están verificados.
  const canAssess = role === 'admin' || (role === 'engineer' && isVerified)
  const canReport = canAssess || (role === 'rescuer' && isVerified)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Structure | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | HabitabilityStatus>('all')

  const counts: Record<HabitabilityStatus, number> = {
    pending: 0, green: 0, yellow: 0, red: 0,
  }
  structures.forEach(s => { counts[s.habitability]++ })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openAssess(s: Structure) {
    setEditing(s)
    setForm({
      name: s.name,
      structure_type: s.structure_type || 'other',
      address: s.address || '',
      lat: s.lat != null ? String(s.lat) : '',
      lng: s.lng != null ? String(s.lng) : '',
      habitability: s.habitability,
      assessment_notes: s.assessment_notes || '',
      report_notes: s.report_notes || '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.name.trim()) {
      setError('El nombre o identificación de la estructura es obligatorio.')
      setLoading(false)
      return
    }

    let lat: number | null = null
    let lng: number | null = null
    if (form.lat.trim() || form.lng.trim()) {
      lat = parseFloat(form.lat)
      lng = parseFloat(form.lng)
      if (isNaN(lat) || isNaN(lng)) {
        setError('Las coordenadas deben ser números válidos (o déjalas vacías). Ej: lat 10.4929, lng -66.9005')
        setLoading(false)
        return
      }
    }

    const supabase = createClient()

    const base = {
      name: form.name.trim(),
      structure_type: form.structure_type,
      address: form.address.trim() || null,
      lat, lng,
    }

    try {
      if (editing) {
        // Evaluar / editar (solo ingenieros/admin llegan aquí)
        const isAssessed = form.habitability !== 'pending'
        const { error: dbError } = await supabase
          .from('structures')
          .update({
            ...base,
            habitability: form.habitability,
            assessment_notes: form.assessment_notes.trim() || null,
            assessed_by: isAssessed ? userId : null,
            assessed_at: isAssessed ? new Date().toISOString() : null,
          })
          .eq('id', editing.id)
        if (dbError) throw dbError

        await supabase.from('audit_log').insert({
          user_id: userId,
          action: 'ASSESS_STRUCTURE',
          resource_type: 'structure',
          resource_id: editing.id,
          metadata: { habitability: form.habitability },
        })
      } else if (canAssess) {
        // Alta completa por ingeniero/admin
        const isAssessed = form.habitability !== 'pending'
        const { data, error: dbError } = await supabase
          .from('structures')
          .insert({
            ...base,
            habitability: form.habitability,
            assessment_notes: form.assessment_notes.trim() || null,
            assessed_by: isAssessed ? userId : null,
            assessed_at: isAssessed ? new Date().toISOString() : null,
          })
          .select('id')
          .single()
        if (dbError) throw dbError

        await supabase.from('audit_log').insert({
          user_id: userId,
          action: 'CREATE_STRUCTURE',
          resource_type: 'structure',
          resource_id: data?.id,
          metadata: { habitability: form.habitability },
        })
      } else {
        // Reporte de rescatista: siempre entra como 'pending'
        const { data, error: dbError } = await supabase
          .from('structures')
          .insert({
            ...base,
            habitability: 'pending',
            report_notes: form.report_notes.trim() || null,
            reported_by: userId,
          })
          .select('id')
          .single()
        if (dbError) throw dbError

        await supabase.from('audit_log').insert({
          user_id: userId,
          action: 'REPORT_STRUCTURE',
          resource_type: 'structure',
          resource_id: data?.id,
        })
      }

      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError('Error al guardar: ' + (err instanceof Error ? err.message : 'desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const visible = filter === 'all' ? structures : structures.filter(s => s.habitability === filter)

  return (
    <div>
      {/* Resumen semáforo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {ORDER.map(st => (
          <button
            key={st}
            onClick={() => setFilter(f => (f === st ? 'all' : st))}
            className={`rounded-xl border p-4 text-left transition-all ${
              filter === st ? 'ring-2 ring-offset-1 ring-gray-400 border-transparent' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: HABITABILITY_HEX[st] }} />
              <span className="text-2xl font-bold text-gray-900">{counts[st]}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{HABITABILITY_LABELS[st]}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Todas ({structures.length})
          </FilterChip>
          {ORDER.map(st => (
            <FilterChip key={st} active={filter === st} onClick={() => setFilter(st)}>
              {HABITABILITY_LABELS[st]} ({counts[st]})
            </FilterChip>
          ))}
        </div>
        {canReport && (
          <button
            onClick={openCreate}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            {canAssess ? '+ Añadir estructura' : '+ Reportar estructura'}
          </button>
        )}
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🏚️</div>
          <p className="font-medium text-gray-600">
            {structures.length === 0 ? 'Aún no hay estructuras registradas' : 'No hay estructuras en este estado'}
          </p>
          {canReport && structures.length === 0 && (
            <p className="text-sm mt-1">Usa «{canAssess ? 'Añadir' : 'Reportar'} estructura» para empezar.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(s => (
            <StructureRow key={s.id} s={s} canAssess={canAssess} onAssess={openAssess} />
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Evaluar estructura' : canAssess ? 'Nueva estructura' : 'Reportar estructura'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              {canAssess
                ? 'Asigna el estado del semáforo y deja constancia de la inspección.'
                : 'Reporta una edificación para que un ingeniero la evalúe. Quedará «por analizar».'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre o identificación <span className="text-red-500">*</span>
                </label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Edificio Residencias El Paraíso, Torre A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de estructura</label>
                <select value={form.structure_type} onChange={e => setForm(f => ({ ...f, structure_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500">
                  {Object.entries(STRUCTURE_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Av. principal, sector, Caracas"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                  <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="10.4929"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                  <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="-66.9005"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Opcional, pero necesario para que aparezca en el mapa. En{' '}
                <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline">Google Maps</a>,
                clic derecho sobre el lugar → copia las coordenadas.
              </p>

              {canAssess ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado de habitabilidad (semáforo)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ORDER.map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, habitability: st }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                            form.habitability === st
                              ? 'border-gray-900 bg-gray-50 font-medium text-gray-900'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: HABITABILITY_HEX[st] }} />
                          {HABITABILITY_LABELS[st]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de la inspección</label>
                    <textarea rows={3} value={form.assessment_notes} onChange={e => setForm(f => ({ ...f, assessment_notes: e.target.value }))}
                      placeholder="Daños observados, recomendaciones, restricciones de acceso…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>

                  {editing?.report_notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Reporte de campo:</span> {editing.report_notes}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué observaste?</label>
                  <textarea rows={3} value={form.report_notes} onChange={e => setForm(f => ({ ...f, report_notes: e.target.value }))}
                    placeholder="Grietas, inclinación, colapso parcial, por qué crees que necesita inspección…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  {loading ? 'Guardando…' : editing ? 'Guardar evaluación' : canAssess ? 'Añadir estructura' : 'Enviar reporte'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
        active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

function StructureRow({ s, canAssess, onAssess }: {
  s: Structure
  canAssess: boolean
  onAssess: (s: Structure) => void
}) {
  const notes = s.assessment_notes || s.report_notes
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="w-3.5 h-3.5 rounded-full inline-block shrink-0 mt-1"
          style={{ background: HABITABILITY_HEX[s.habitability] }}
          title={HABITABILITY_LABELS[s.habitability]}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900">{s.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HABITABILITY_COLORS[s.habitability]}`}>
              {HABITABILITY_LABELS[s.habitability]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {s.structure_type ? STRUCTURE_TYPE_LABELS[s.structure_type] : 'Sin tipo'}
            {s.address ? ` · ${s.address}` : s.lat != null ? ` · ${s.lat}, ${s.lng}` : ''}
            {s.lat == null ? ' · sin coordenadas' : ''}
          </p>
          {notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notes}</p>}
        </div>
      </div>
      {canAssess && (
        <button
          onClick={() => onAssess(s)}
          className="text-xs border border-gray-200 text-gray-600 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          {s.habitability === 'pending' ? 'Evaluar' : 'Reevaluar'}
        </button>
      )}
    </div>
  )
}
