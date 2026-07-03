'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ToastProvider'
import type { Structure, HabitabilityStatus, UserRole } from '@/lib/types'
import {
  HABITABILITY_LABELS, HABITABILITY_HEX,
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

const SEMAFORO_DARK: Record<HabitabilityStatus, { bg: string; border: string; text: string }> = {
  pending: { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.35)', text: '#94A3B8' },
  red:     { bg: 'rgba(220,38,38,0.12)',   border: 'rgba(220,38,38,0.35)',   text: '#FCA5A5' },
  yellow:  { bg: 'rgba(212,160,23,0.12)',  border: 'rgba(212,160,23,0.35)',  text: '#FCD34D' },
  green:   { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   text: '#86EFAC' },
}

export default function EstructurasPanel({ structures, role, userId, isVerified }: EstructurasPanelProps) {
  const router = useRouter()
  const toast = useToast()
  const canAssess = role === 'admin' || (role === 'engineer' && isVerified)
  const canReport = canAssess || (role === 'rescuer' && isVerified)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Structure | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | HabitabilityStatus>('all')

  const counts: Record<HabitabilityStatus, number> = { pending: 0, green: 0, yellow: 0, red: 0 }
  structures.forEach(s => { counts[s.habitability]++ })

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true)
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
    setError(''); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    if (!form.name.trim()) {
      setError('El nombre o identificación de la estructura es obligatorio.')
      setLoading(false); return
    }

    let lat: number | null = null
    let lng: number | null = null
    if (form.lat.trim() || form.lng.trim()) {
      lat = parseFloat(form.lat); lng = parseFloat(form.lng)
      if (isNaN(lat) || isNaN(lng)) {
        setError('Las coordenadas deben ser números válidos (o déjalas vacías). Ej: lat 10.4929, lng -66.9005')
        setLoading(false); return
      }
    }

    const supabase = createClient()
    const base = { name: form.name.trim(), structure_type: form.structure_type, address: form.address.trim() || null, lat, lng }

    try {
      if (editing) {
        const isAssessed = form.habitability !== 'pending'
        const { error: dbError } = await supabase.from('structures').update({
          ...base, habitability: form.habitability,
          assessment_notes: form.assessment_notes.trim() || null,
          assessed_by: isAssessed ? userId : null,
          assessed_at: isAssessed ? new Date().toISOString() : null,
        }).eq('id', editing.id)
        if (dbError) throw dbError
        await supabase.from('audit_log').insert({ user_id: userId, action: 'ASSESS_STRUCTURE', resource_type: 'structure', resource_id: editing.id, metadata: { habitability: form.habitability } })
      } else if (canAssess) {
        const isAssessed = form.habitability !== 'pending'
        const { data, error: dbError } = await supabase.from('structures').insert({
          ...base, habitability: form.habitability,
          assessment_notes: form.assessment_notes.trim() || null,
          assessed_by: isAssessed ? userId : null,
          assessed_at: isAssessed ? new Date().toISOString() : null,
        }).select('id').single()
        if (dbError) throw dbError
        await supabase.from('audit_log').insert({ user_id: userId, action: 'CREATE_STRUCTURE', resource_type: 'structure', resource_id: data?.id, metadata: { habitability: form.habitability } })
      } else {
        const { data, error: dbError } = await supabase.from('structures').insert({
          ...base, habitability: 'pending', report_notes: form.report_notes.trim() || null, reported_by: userId,
        }).select('id').single()
        if (dbError) throw dbError
        await supabase.from('audit_log').insert({ user_id: userId, action: 'REPORT_STRUCTURE', resource_type: 'structure', resource_id: data?.id })
      }

      setShowForm(false)
      router.refresh()
      toast.success(editing ? 'Evaluación guardada correctamente.' : canAssess ? 'Estructura añadida al mapa.' : 'Reporte enviado a los ingenieros.')
    } catch (err) {
      const msg = 'Error al guardar: ' + (err instanceof Error ? err.message : 'desconocido')
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const visible = filter === 'all' ? structures : structures.filter(s => s.habitability === filter)

  return (
    <div>
      {/* Resumen semáforo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {ORDER.map(st => {
          const c = SEMAFORO_DARK[st]
          const isActive = filter === st
          return (
            <button
              key={st}
              onClick={() => setFilter(f => (f === st ? 'all' : st))}
              className="rounded-xl p-4 text-left transition-all hover:brightness-110"
              style={{
                background: isActive ? c.bg : 'rgba(22,32,64,0.7)',
                border: `1px solid ${isActive ? c.border : 'rgba(36,51,86,0.5)'}`,
                outline: isActive ? `2px solid ${HABITABILITY_HEX[st]}` : 'none',
                outlineOffset: '2px',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: HABITABILITY_HEX[st] }} />
                <span className="text-2xl font-bold" style={{ color: '#F0F4FF' }}>{counts[st]}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: c.text }}>{HABITABILITY_LABELS[st]}</div>
            </button>
          )
        })}
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
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110 flex items-center gap-1.5"
            style={{ background: '#DC2626', color: '#fff' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>add</span>
            {canAssess ? 'Añadir estructura' : 'Reportar estructura'}
          </button>
        )}
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#334155', display: 'block', marginBottom: '12px' }}>
            home_work
          </span>
          <p className="font-medium" style={{ color: '#64748B' }}>
            {structures.length === 0 ? 'Aún no hay estructuras registradas' : 'No hay estructuras en este estado'}
          </p>
          {canReport && structures.length === 0 && (
            <p className="text-sm mt-1" style={{ color: '#475569' }}>
              Usa «{canAssess ? 'Añadir' : 'Reportar'} estructura» para empezar.
            </p>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)' }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold" style={{ color: '#F0F4FF' }}>
                {editing ? 'Evaluar estructura' : canAssess ? 'Nueva estructura' : 'Reportar estructura'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="transition-all hover:opacity-70"
                style={{ color: '#64748B', fontSize: '20px', lineHeight: 1 }}>×</button>
            </div>
            <p className="text-xs mb-5" style={{ color: '#64748B' }}>
              {canAssess
                ? 'Asigna el estado del semáforo y deja constancia de la inspección.'
                : 'Reporta una edificación para que un ingeniero la evalúe. Quedará «por analizar».'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nombre o identificación" required>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Edificio Residencias El Paraíso, Torre A"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
              </Field>

              <Field label="Tipo de estructura">
                <select value={form.structure_type} onChange={e => setForm(f => ({ ...f, structure_type: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}>
                  {Object.entries(STRUCTURE_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Dirección">
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Av. principal, sector, Caracas"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitud">
                  <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="10.4929"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                    style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                </Field>
                <Field label="Longitud">
                  <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="-66.9005"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                    style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                </Field>
              </div>
              <p className="text-xs -mt-2" style={{ color: '#475569' }}>
                Opcional, pero necesario para aparecer en el mapa.{' '}
                <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer"
                  className="underline" style={{ color: '#D4A017' }}>Google Maps</a>
                {' '}→ clic derecho → copiar coordenadas.
              </p>

              {canAssess ? (
                <>
                  <Field label="Estado de habitabilidad (semáforo)">
                    <div className="grid grid-cols-2 gap-2">
                      {ORDER.map(st => {
                        const c = SEMAFORO_DARK[st]
                        const sel = form.habitability === st
                        return (
                          <button key={st} type="button"
                            onClick={() => setForm(f => ({ ...f, habitability: st }))}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                            style={{
                              background: sel ? c.bg : 'transparent',
                              border: `1px solid ${sel ? c.border : 'rgba(36,51,86,0.5)'}`,
                              color: sel ? c.text : '#94A3B8',
                              fontWeight: sel ? 600 : 400,
                            }}>
                            <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: HABITABILITY_HEX[st] }} />
                            {HABITABILITY_LABELS[st]}
                          </button>
                        )
                      })}
                    </div>
                  </Field>

                  <Field label="Observaciones de la inspección">
                    <textarea rows={3} value={form.assessment_notes}
                      onChange={e => setForm(f => ({ ...f, assessment_notes: e.target.value }))}
                      placeholder="Daños observados, recomendaciones, restricciones de acceso…"
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                      style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                  </Field>

                  {editing?.report_notes && (
                    <div className="rounded-lg px-3 py-2 text-xs"
                      style={{ background: 'rgba(36,51,86,0.5)', border: '1px solid rgba(36,51,86,0.7)', color: '#94A3B8' }}>
                      <span className="font-medium" style={{ color: '#F0F4FF' }}>Reporte de campo:</span>{' '}
                      {editing.report_notes}
                    </div>
                  )}
                </>
              ) : (
                <Field label="¿Qué observaste?">
                  <textarea rows={3} value={form.report_notes}
                    onChange={e => setForm(f => ({ ...f, report_notes: e.target.value }))}
                    placeholder="Grietas, inclinación, colapso parcial, por qué crees que necesita inspección…"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                    style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                </Field>
              )}

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 font-medium py-2.5 rounded-lg text-sm transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: '#DC2626', color: '#fff' }}>
                  {loading ? 'Guardando…' : editing ? 'Guardar evaluación' : canAssess ? 'Añadir estructura' : 'Enviar reporte'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg text-sm transition-all hover:brightness-110"
                  style={{ border: '1px solid rgba(36,51,86,0.7)', color: '#94A3B8' }}>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#94A3B8' }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded-full transition-all hover:brightness-110"
      style={active
        ? { background: '#D4A017', color: '#1a2744', fontWeight: 600 }
        : { background: 'rgba(22,32,64,0.7)', border: '1px solid rgba(36,51,86,0.5)', color: '#94A3B8' }
      }
    >
      {children}
    </button>
  )
}

function StructureRow({ s, canAssess, onAssess }: {
  s: Structure; canAssess: boolean; onAssess: (s: Structure) => void
}) {
  const notes = s.assessment_notes || s.report_notes
  const c = SEMAFORO_DARK[s.habitability]
  return (
    <div className="rounded-xl p-4 flex items-start justify-between gap-4 transition-all hover:brightness-105"
      style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-3.5 h-3.5 rounded-full inline-block shrink-0 mt-1"
          style={{ background: HABITABILITY_HEX[s.habitability] }} title={HABITABILITY_LABELS[s.habitability]} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium" style={{ color: '#F0F4FF' }}>{s.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
              {HABITABILITY_LABELS[s.habitability]}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
            {s.structure_type ? STRUCTURE_TYPE_LABELS[s.structure_type] : 'Sin tipo'}
            {s.address ? ` · ${s.address}` : s.lat != null ? ` · ${s.lat}, ${s.lng}` : ''}
            {s.lat == null ? ' · sin coordenadas' : ''}
          </p>
          {notes && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#94A3B8' }}>{notes}</p>}
        </div>
      </div>
      {canAssess && (
        <button onClick={() => onAssess(s)}
          className="text-xs px-3 py-1.5 rounded-lg transition-all hover:brightness-110 shrink-0"
          style={{ border: '1px solid rgba(212,160,23,0.35)', color: '#D4A017' }}>
          {s.habitability === 'pending' ? 'Evaluar' : 'Reevaluar'}
        </button>
      )}
    </div>
  )
}
