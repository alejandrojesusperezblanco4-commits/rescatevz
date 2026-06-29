'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  address: string | null
  phone: string | null
  capacity: number | null
  current_occupancy: number
  is_active: boolean
}

interface UbicacionesPanelProps {
  locations: Location[]
}

const EMPTY_FORM = {
  name: '', type: 'hospital', lat: '', lng: '',
  address: '', phone: '', capacity: '',
}

export default function UbicacionesPanel({ locations }: UbicacionesPanelProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setForm({
      name: loc.name,
      type: loc.type,
      lat: String(loc.lat),
      lng: String(loc.lng),
      address: loc.address || '',
      phone: loc.phone || '',
      capacity: loc.capacity ? String(loc.capacity) : '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const payload = {
      name: form.name.trim(),
      type: form.type,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    }

    if (isNaN(payload.lat) || isNaN(payload.lng)) {
      setError('Las coordenadas deben ser números válidos. Ej: lat 10.4929, lng -66.9005')
      setLoading(false)
      return
    }

    const { error: dbError } = editing
      ? await supabase.from('locations').update(payload).eq('id', editing.id)
      : await supabase.from('locations').insert({ ...payload, is_active: true })

    if (dbError) {
      setError('Error al guardar: ' + dbError.message)
    } else {
      setShowForm(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    setProcessing(id)
    const supabase = createClient()
    await supabase.from('locations').update({ is_active: !current }).eq('id', id)
    router.refresh()
    setProcessing(null)
  }

  const activas = locations.filter(l => l.is_active)
  const inactivas = locations.filter(l => !l.is_active)

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={openNew}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Añadir ubicación
        </button>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar ubicación' : 'Nueva ubicación'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Hospital Universitario de Caracas"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="hospital">🏥 Hospital</option>
                  <option value="shelter">🏕️ Refugio</option>
                  <option value="rescue_zone">🚨 Zona de rescate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitud <span className="text-red-500">*</span></label>
                  <input required value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="10.4929"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitud <span className="text-red-500">*</span></label>
                  <input required value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="-66.9005"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Busca en <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline">Google Maps</a>, clic derecho sobre el lugar → copia las coordenadas.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Av. Neverí, Los Chaguaramos, Caracas"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+58212..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                  <input type="number" min="0" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    placeholder="500"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  {loading ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir ubicación'}
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

      {/* Lista activas */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Activas ({activas.length})
        </h2>
        <div className="space-y-2">
          {activas.map(loc => (
            <LocationRow key={loc.id} loc={loc} onEdit={openEdit} onToggle={toggleActive} processing={processing} />
          ))}
        </div>
      </div>

      {inactivas.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Inactivas ({inactivas.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {inactivas.map(loc => (
              <LocationRow key={loc.id} loc={loc} onEdit={openEdit} onToggle={toggleActive} processing={processing} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LocationRow({ loc, onEdit, onToggle, processing }: {
  loc: Location
  onEdit: (l: Location) => void
  onToggle: (id: string, current: boolean) => void
  processing: string | null
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{loc.type === 'hospital' ? '🏥' : loc.type === 'shelter' ? '🏕️' : '🚨'}</span>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{loc.name}</p>
          <p className="text-xs text-gray-400 truncate">
            {loc.address || `${loc.lat}, ${loc.lng}`}
            {loc.capacity ? ` · Cap: ${loc.capacity}` : ''}
            {loc.phone ? ` · ${loc.phone}` : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onEdit(loc)}
          className="text-xs border border-gray-200 text-gray-600 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors">
          Editar
        </button>
        <button
          onClick={() => onToggle(loc.id, loc.is_active)}
          disabled={processing === loc.id}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
            loc.is_active
              ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}>
          {processing === loc.id ? '…' : loc.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}
