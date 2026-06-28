'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Location, VictimStatus } from '@/lib/types'

interface VictimaFormProps {
  locations: Location[]
  userId: string
}

export default function VictimaForm({ locations, userId }: VictimaFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedAge, setEstimatedAge] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [status, setStatus] = useState<VictimStatus>('unknown')
  const [foundLocation, setFoundLocation] = useState('')
  const [currentLocationId, setCurrentLocationId] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Bucket privado: guardamos solo el path. Las fotos se sirven después
    // mediante URL firmada y temporal, nunca con una URL pública directa.
    const photoPaths: string[] = []
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('victim-photos').upload(path, photo)
      if (uploadError) {
        setError('Error subiendo foto: ' + uploadError.message)
        setLoading(false)
        return
      }
      photoPaths.push(path)
    }

    const { error: insertError } = await supabase.from('victims').insert({
      created_by: userId,
      name: name.trim() || null,
      physical_description: description.trim(),
      estimated_age: estimatedAge ? parseInt(estimatedAge) : null,
      is_minor: isMinor,
      status,
      found_location: foundLocation.trim(),
      current_location_id: currentLocationId || null,
      photo_urls: photoPaths,
      notes: notes.trim() || null,
    })

    if (insertError) {
      setError('Error al registrar: ' + insertError.message)
      setLoading(false)
      return
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'CREATE_VICTIM',
      resource_type: 'victim',
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-green-800 mb-2">Víctima registrada exitosamente</h2>
        <p className="text-green-700 text-sm mb-6">El registro ha sido guardado y estará disponible para búsqueda familiar.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(false); setName(''); setDescription(''); setPhotos([]) }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Registrar otra
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Ir al panel
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-gray-400 font-normal">(si se conoce)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre completo o apodo"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edad estimada</label>
          <input
            type="number"
            min="0"
            max="120"
            value={estimatedAge}
            onChange={e => {
              setEstimatedAge(e.target.value)
              setIsMinor(parseInt(e.target.value) < 18)
            }}
            placeholder="Ej: 35"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción física <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Altura aproximada, color de cabello, ropa que llevaba, señas particulares, tatuajes, cicatrices…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
        <input
          type="checkbox"
          id="isMinor"
          checked={isMinor}
          onChange={e => setIsMinor(e.target.checked)}
          className="w-4 h-4 accent-purple-600"
        />
        <label htmlFor="isMinor" className="text-sm font-medium text-purple-800">
          Es menor de edad — Activar protección especial (perfil oculto al público)
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Estado de salud <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { value: 'alive', label: '✅ Con vida', class: 'border-green-300 bg-green-50 text-green-800' },
            { value: 'critical', label: '🟠 Crítico', class: 'border-orange-300 bg-orange-50 text-orange-800' },
            { value: 'deceased', label: '⚫ Fallecido', class: 'border-gray-300 bg-gray-50 text-gray-700' },
            { value: 'unknown', label: '❓ Desconocido', class: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value as VictimStatus)}
              className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                status === opt.value ? opt.class + ' ring-2 ring-offset-1 ring-gray-400' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lugar donde fue encontrada <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={foundLocation}
          onChange={e => setFoundLocation(e.target.value)}
          placeholder="Ej: Calle El Paraíso, entre Los Rosales y Santa Rosa, Caracas"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital o refugio actual</label>
        <select
          value={currentLocationId}
          onChange={e => setCurrentLocationId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">Seleccionar ubicación actual…</option>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fotos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={e => setPhotos(Array.from(e.target.files || []))}
          className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
        />
        {photos.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{photos.length} foto{photos.length > 1 ? 's' : ''} seleccionada{photos.length > 1 ? 's' : ''}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">Las fotos se almacenan de forma segura y solo son accesibles por personal autorizado.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Información adicional relevante para médicos o familia"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {loading ? 'Guardando…' : 'Registrar víctima'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
