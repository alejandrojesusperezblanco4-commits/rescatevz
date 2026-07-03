'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string; name: string; type: string
  lat: number; lng: number; address: string | null; phone: string | null
  capacity: number | null; current_occupancy: number; is_active: boolean
  needs?: string[]; needs_message?: string | null; needs_urgency?: string
}

const TYPE_LABELS: Record<string, string> = {
  hospital: 'Hospital', shelter: 'Refugio', rescue_zone: 'Centro de acopio',
}

const NEEDS_CATEGORIAS = [
  'Agua potable', 'Alimentos no perecederos', 'Medicamentos básicos',
  'Ropa y calzado', 'Mantas y colchonetas', 'Artículos de higiene',
  'Pañales y fórmula infantil', 'Herramientas de rescate',
  'Generadores / combustible', 'Personal médico voluntario', 'Sillas de ruedas / muletas',
]

const URGENCY_CFG = {
  urgent: { label: 'Urgente', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  normal:  { label: 'Necesitan', color: '#D4A017', bg: 'rgba(212,160,23,0.10)', border: 'rgba(212,160,23,0.25)' },
  covered: { label: 'Cubierto', color: '#22C55E', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)' },
}

const EMPTY_FORM = { name: '', type: 'hospital', lat: '', lng: '', address: '', phone: '', capacity: '' }

export default function UbicacionesPanel({ locations }: { locations: Location[] }) {
  const router = useRouter()

  // — formulario ubicación —
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  // — modal necesidades —
  const [needsLoc, setNeedsLoc] = useState<Location | null>(null)
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])
  const [customNeed, setCustomNeed] = useState('')
  const [needsMsg, setNeedsMsg] = useState('')
  const [needsUrgency, setNeedsUrgency] = useState<'urgent' | 'normal' | 'covered'>('normal')
  const [needsLoading, setNeedsLoading] = useState(false)
  const [needsError, setNeedsError] = useState('')

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true) }
  function openEdit(loc: Location) {
    setEditing(loc)
    setForm({ name: loc.name, type: loc.type, lat: String(loc.lat), lng: String(loc.lng), address: loc.address || '', phone: loc.phone || '', capacity: loc.capacity ? String(loc.capacity) : '' })
    setError(''); setShowForm(true)
  }
  function openNeeds(loc: Location) {
    setNeedsLoc(loc)
    setSelectedNeeds(loc.needs || [])
    setNeedsMsg(loc.needs_message || '')
    setNeedsUrgency((loc.needs_urgency as 'urgent' | 'normal' | 'covered') || 'normal')
    setNeedsError('')
  }

  function toggleNeed(n: string) {
    setSelectedNeeds(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const supabase = createClient()
    const payload = {
      name: form.name.trim(), type: form.type,
      lat: parseFloat(form.lat), lng: parseFloat(form.lng),
      address: form.address.trim() || null, phone: form.phone.trim() || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    }
    if (isNaN(payload.lat) || isNaN(payload.lng)) {
      setError('Coordenadas inválidas. Ej: lat 10.4929, lng -66.9005')
      setLoading(false); return
    }
    const { error: dbError } = editing
      ? await supabase.from('locations').update(payload).eq('id', editing.id)
      : await supabase.from('locations').insert({ ...payload, is_active: true })
    if (dbError) { setError('Error: ' + dbError.message) } else { setShowForm(false); router.refresh() }
    setLoading(false)
  }

  async function saveNeeds() {
    if (!needsLoc) return
    setNeedsLoading(true); setNeedsError('')
    const allNeeds = [...selectedNeeds, ...(customNeed.trim() ? [customNeed.trim()] : [])]
    const supabase = createClient()
    const { error: dbError } = await supabase.from('locations').update({
      needs: allNeeds,
      needs_message: needsMsg.trim() || null,
      needs_urgency: needsUrgency,
      needs_updated_at: new Date().toISOString(),
    }).eq('id', needsLoc.id)
    if (dbError) { setNeedsError('Error: ' + dbError.message) }
    else { setNeedsLoc(null); router.refresh() }
    setNeedsLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    setProcessing(id)
    const supabase = createClient()
    await supabase.from('locations').update({ is_active: !current }).eq('id', id)
    router.refresh(); setProcessing(null)
  }

  const activas = locations.filter(l => l.is_active)
  const inactivas = locations.filter(l => !l.is_active)

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110"
          style={{ background: '#DC2626', color: '#fff' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>add_location</span>
          Añadir ubicación
        </button>
      </div>

      {/* Lista activas */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
          Activas ({activas.length})
        </p>
        <div className="space-y-2">
          {activas.map(loc => (
            <LocationRow key={loc.id} loc={loc} onEdit={openEdit} onToggle={toggleActive} onNeeds={openNeeds} processing={processing} />
          ))}
        </div>
      </div>

      {inactivas.length > 0 && (
        <div className="opacity-60">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
            Inactivas ({inactivas.length})
          </p>
          <div className="space-y-2">
            {inactivas.map(loc => (
              <LocationRow key={loc.id} loc={loc} onEdit={openEdit} onToggle={toggleActive} onNeeds={openNeeds} processing={processing} />
            ))}
          </div>
        </div>
      )}

      {/* Modal: nueva/editar ubicación */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: '#F0F4FF' }}>{editing ? 'Editar ubicación' : 'Nueva ubicación'}</h2>
              <button onClick={() => setShowForm(false)} className="hover:opacity-70" style={{ color: '#64748B', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[{ label: 'Nombre', field: 'name', placeholder: 'Hospital Universitario de Caracas', required: true }].map(f => (
                <div key={f.field}>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#94A3B8' }}>
                    {f.label}{f.required && <span style={{ color: '#DC2626' }}>*</span>}
                  </label>
                  <input required={f.required} value={(form as Record<string, string>)[f.field]}
                    onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                    style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#94A3B8' }}>Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}>
                  <option value="hospital">Hospital</option>
                  <option value="shelter">Refugio</option>
                  <option value="rescue_zone">Centro de acopio</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['lat', 'lng'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 capitalize" style={{ color: '#94A3B8' }}>{field === 'lat' ? 'Latitud' : 'Longitud'}<span style={{ color: '#DC2626' }}>*</span></label>
                    <input required value={(form as Record<string, string>)[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={field === 'lat' ? '10.4929' : '-66.9005'}
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                      style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                  </div>
                ))}
              </div>
              <p className="text-xs -mt-2" style={{ color: '#475569' }}>
                <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={{ color: '#D4A017' }}>Google Maps</a>
                {' '}→ clic derecho → copiar coordenadas
              </p>
              {[
                { field: 'address', label: 'Dirección', placeholder: 'Av. Neverí, Los Chaguaramos, Caracas' },
                { field: 'phone', label: 'Teléfono', placeholder: '+58212…' },
                { field: 'capacity', label: 'Capacidad', placeholder: '500' },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#94A3B8' }}>{f.label}</label>
                  <input value={(form as Record<string, string>)[f.field]}
                    onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                    placeholder={f.placeholder}
                    type={f.field === 'capacity' ? 'number' : 'text'}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                    style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                </div>
              ))}
              {error && <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 font-medium py-2.5 rounded-lg text-sm transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: '#DC2626', color: '#fff' }}>
                  {loading ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir ubicación'}
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

      {/* Modal: necesidades de donaciones */}
      {needsLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold" style={{ color: '#F0F4FF' }}>
                Necesidades — {needsLoc.name}
              </h2>
              <button onClick={() => setNeedsLoc(null)} className="hover:opacity-70" style={{ color: '#64748B', fontSize: '20px' }}>×</button>
            </div>
            <p className="text-xs mb-5" style={{ color: '#64748B' }}>
              Selecciona qué necesita este centro. Se publicará en la sección pública de donaciones.
            </p>

            {/* Urgencia */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Nivel de urgencia</label>
              <div className="flex gap-2">
                {(Object.entries(URGENCY_CFG) as [string, typeof URGENCY_CFG.urgent][]).map(([key, cfg]) => (
                  <button key={key} type="button"
                    onClick={() => setNeedsUrgency(key as 'urgent' | 'normal' | 'covered')}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: needsUrgency === key ? cfg.bg : 'transparent',
                      border: `1px solid ${needsUrgency === key ? cfg.border : 'rgba(36,51,86,0.5)'}`,
                      color: needsUrgency === key ? cfg.color : '#64748B',
                    }}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categorías */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Qué necesitan</label>
              <div className="flex flex-wrap gap-2">
                {NEEDS_CATEGORIAS.map(n => {
                  const sel = selectedNeeds.includes(n)
                  return (
                    <button key={n} type="button" onClick={() => toggleNeed(n)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all hover:brightness-110"
                      style={sel
                        ? { background: 'rgba(212,160,23,0.15)', color: '#FCD34D', border: '1px solid rgba(212,160,23,0.4)', fontWeight: 600 }
                        : { background: 'rgba(36,51,86,0.4)', color: '#94A3B8', border: '1px solid rgba(36,51,86,0.5)' }
                      }>
                      {sel && '✓ '}{n}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Necesidad personalizada */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#94A3B8' }}>Otra necesidad específica</label>
              <input value={customNeed} onChange={e => setCustomNeed(e.target.value)}
                placeholder="Ej: Sillas de transporte, oxígeno…"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
            </div>

            {/* Mensaje adicional */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1" style={{ color: '#94A3B8' }}>Mensaje para donantes (opcional)</label>
              <textarea rows={2} value={needsMsg} onChange={e => setNeedsMsg(e.target.value)}
                placeholder="Horario de recepción, punto de contacto, cómo llegar…"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#D4A017]"
                style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
            </div>

            {needsError && <div className="mb-3 text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>{needsError}</div>}

            <div className="flex gap-3">
              <button onClick={saveNeeds} disabled={needsLoading}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: '#D4A017', color: '#1a2744' }}>
                {needsLoading ? 'Guardando…' : 'Publicar necesidades'}
              </button>
              <button onClick={() => setNeedsLoc(null)}
                className="px-4 py-2.5 rounded-lg text-sm transition-all hover:brightness-110"
                style={{ border: '1px solid rgba(36,51,86,0.7)', color: '#94A3B8' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LocationRow({ loc, onEdit, onToggle, onNeeds, processing }: {
  loc: Location; onEdit: (l: Location) => void
  onToggle: (id: string, c: boolean) => void
  onNeeds: (l: Location) => void
  processing: string | null
}) {
  const hasNeeds = loc.needs && loc.needs.length > 0
  const urgCfg = hasNeeds ? URGENCY_CFG[loc.needs_urgency as keyof typeof URGENCY_CFG] ?? URGENCY_CFG.normal : null
  return (
    <div className="rounded-xl p-4 flex items-center justify-between gap-3 transition-all hover:brightness-105"
      style={{ background: '#1e2d4a', border: `1px solid ${hasNeeds && urgCfg ? urgCfg.border : 'rgba(36,51,86,0.5)'}` }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px', color: '#64748B', fontVariationSettings: "'FILL' 1" }}>
          {loc.type === 'hospital' ? 'local_hospital' : loc.type === 'shelter' ? 'home' : 'inventory_2'}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate" style={{ color: '#F0F4FF' }}>{loc.name}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(36,51,86,0.5)', color: '#64748B' }}>
              {TYPE_LABELS[loc.type] ?? loc.type}
            </span>
            {hasNeeds && urgCfg && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: urgCfg.bg, color: urgCfg.color, border: `1px solid ${urgCfg.border}` }}>
                {urgCfg.label}
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: '#64748B' }}>
            {loc.address || `${loc.lat}, ${loc.lng}`}
            {loc.capacity ? ` · ${loc.current_occupancy}/${loc.capacity} personas` : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onNeeds(loc)}
          className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:brightness-110 flex items-center gap-1"
          style={{ border: '1px solid rgba(212,160,23,0.35)', color: '#D4A017' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
          Donaciones
        </button>
        <button onClick={() => onEdit(loc)}
          className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:brightness-110"
          style={{ border: '1px solid rgba(36,51,86,0.7)', color: '#94A3B8' }}>
          Editar
        </button>
        <button onClick={() => onToggle(loc.id, loc.is_active)} disabled={processing === loc.id}
          className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
          style={loc.is_active
            ? { border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }
            : { border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}>
          {processing === loc.id ? '…' : loc.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}
