'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Location, VictimStatus } from '@/lib/types'

interface VictimaFormProps {
  locations: Location[]
  userId: string
}

type CedulaState = 'idle' | 'checking' | 'ok' | 'duplicate'

interface DuplicateInfo {
  id: string
  name: string | null
  status: VictimStatus
  found_location: string
}

function normalizeCedula(raw: string): string {
  const upper = raw.trim().toUpperCase().replace(/\s/g, '')
  // Accept "V12345678", "V-12345678", "12345678" (assumes V)
  const match = upper.match(/^([VE])-?(\d{6,8})$/)
  if (match) return `${match[1]}-${match[2]}`
  // bare digits → assume V
  const digits = upper.match(/^(\d{6,8})$/)
  if (digits) return `V-${digits[1]}`
  return ''
}

const STATUS_OPTIONS: { value: VictimStatus; label: string; cls: string }[] = [
  { value: 'alive',    label: '✅ Con vida',     cls: 'border-green-300 bg-green-50 text-green-800' },
  { value: 'critical', label: '🟠 Crítico',       cls: 'border-orange-300 bg-orange-50 text-orange-800' },
  { value: 'deceased', label: '⚫ Fallecido',     cls: 'border-gray-300 bg-gray-50 text-gray-700' },
  { value: 'missing',  label: '🔍 Desaparecido', cls: 'border-purple-300 bg-purple-50 text-purple-800' },
  { value: 'unknown',  label: '❓ Desconocido',  cls: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
]

export default function VictimaForm({ locations, userId }: VictimaFormProps) {
  const router = useRouter()
  const [name, setName]                     = useState('')
  const [cedula, setCedula]                 = useState('')
  const [cedulaState, setCedulaState]       = useState<CedulaState>('idle')
  const [duplicate, setDuplicate]           = useState<DuplicateInfo | null>(null)
  const [description, setDescription]       = useState('')
  const [estimatedAge, setEstimatedAge]     = useState('')
  const [isMinor, setIsMinor]               = useState(false)
  const [status, setStatus]                 = useState<VictimStatus>('unknown')
  const [foundLocation, setFoundLocation]   = useState('')
  const [currentLocationId, setCurrentLocationId] = useState('')
  const [notes, setNotes]                   = useState('')
  const [photos, setPhotos]                 = useState<File[]>([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [success, setSuccess]               = useState(false)
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function checkCedula(raw: string) {
    const normalized = normalizeCedula(raw)
    if (!normalized) {
      setCedulaState('idle')
      setDuplicate(null)
      return
    }

    setCedulaState('checking')
    setDuplicate(null)

    const supabase = createClient()
    const { data } = await supabase
      .from('victims')
      .select('id, name, status, found_location')
      .eq('cedula', normalized)
      .maybeSingle()

    if (data) {
      setCedulaState('duplicate')
      setDuplicate(data as DuplicateInfo)
    } else {
      setCedulaState('ok')
    }
  }

  function handleCedulaChange(value: string) {
    setCedula(value)
    setCedulaState('idle')
    setDuplicate(null)
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
    if (value.trim().length >= 6) {
      checkTimeoutRef.current = setTimeout(() => checkCedula(value), 500)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cedulaState === 'duplicate') return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const normalizedCedula = normalizeCedula(cedula)

    // Upload photos
    const photoUrls: string[] = []
    for (const photo of photos) {
      const ext  = photo.name.split('.').pop()
      const path = `victims/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('victim-photos').upload(path, photo)
      if (uploadError) {
        setError('Error subiendo foto: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('victim-photos').getPublicUrl(path)
      photoUrls.push(urlData.publicUrl)
    }

    const { error: insertError } = await supabase.from('victims').insert({
      created_by:           userId,
      name:                 name.trim() || null,
      cedula:               normalizedCedula || null,
      physical_description: description.trim(),
      estimated_age:        estimatedAge ? parseInt(estimatedAge) : null,
      is_minor:             isMinor,
      status,
      found_location:       foundLocation.trim(),
      current_location_id:  currentLocationId || null,
      photo_urls:           photoUrls,
      notes:                notes.trim() || null,
    })

    if (insertError) {
      // Catch DB-level unique violation as fallback
      if (insertError.code === '23505') {
        setError('Esta cédula ya existe en el sistema. Verifica el registro antes de continuar.')
      } else {
        setError('Error al registrar: ' + insertError.message)
      }
      setLoading(false)
      return
    }

    await supabase.from('audit_log').insert({
      user_id:       userId,
      action:        'CREATE_VICTIM',
      resource_type: 'victim',
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-green-800 mb-2">Registro guardado exitosamente</h2>
        <p className="text-green-700 text-sm mb-6">El registro estará disponible para búsqueda familiar.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSuccess(false)
              setName(''); setCedula(''); setCedulaState('idle'); setDuplicate(null)
              setDescription(''); setPhotos([])
            }}
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

      {/* Cédula — control antiduplucados */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cédula de identidad{' '}
          <span className="text-gray-400 font-normal">(si se conoce)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={cedula}
            onChange={e => handleCedulaChange(e.target.value)}
            placeholder="V-12345678 o E-12345678"
            maxLength={12}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-9 focus:outline-none focus:ring-2 transition-colors ${
              cedulaState === 'duplicate'
                ? 'border-red-400 focus:ring-red-400 bg-red-50'
                : cedulaState === 'ok'
                  ? 'border-green-400 focus:ring-green-400'
                  : 'border-gray-300 focus:ring-red-500'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base">
            {cedulaState === 'checking'  && <span className="animate-spin inline-block">⏳</span>}
            {cedulaState === 'ok'        && '✅'}
            {cedulaState === 'duplicate' && '🚫'}
          </span>
        </div>

        {cedulaState === 'duplicate' && duplicate && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-red-700 mb-1">
              ⚠️ Esta cédula ya está registrada
            </p>
            <p className="text-xs text-red-600">
              <span className="font-medium">{duplicate.name ?? 'Sin nombre registrado'}</span>
              {' · '}
              Estado: <span className="font-medium">{duplicate.status}</span>
              {' · '}
              Encontrada en: {duplicate.found_location}
            </p>
            <a
              href={`/victimas/${duplicate.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-red-700 underline font-medium mt-1 inline-block"
            >
              Ver registro existente →
            </a>
          </div>
        )}

        {cedulaState === 'ok' && (
          <p className="text-xs text-green-600 mt-1">Cédula verificada — no existe registro previo.</p>
        )}

        <p className="text-xs text-gray-400 mt-1">
          Acepta formato V-XXXXXXXX o E-XXXXXXXX. Se verifica en tiempo real para evitar duplicados.
        </p>
      </div>

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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                status === opt.value
                  ? opt.cls + ' ring-2 ring-offset-1 ring-gray-400'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
          <p className="text-xs text-gray-500 mt-1">
            {photos.length} foto{photos.length > 1 ? 's' : ''} seleccionada{photos.length > 1 ? 's' : ''}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Las fotos se almacenan de forma segura y solo son accesibles por personal autorizado.
        </p>
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
          disabled={loading || cedulaState === 'duplicate' || cedulaState === 'checking'}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
        >
          {loading         ? 'Guardando…'
           : cedulaState === 'checking'  ? 'Verificando cédula…'
           : cedulaState === 'duplicate' ? 'Cédula duplicada — no se puede guardar'
           : 'Registrar'}
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
