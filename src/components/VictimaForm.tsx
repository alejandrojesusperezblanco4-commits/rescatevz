'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Location, VictimStatus } from '@/lib/types'

interface VictimaFormProps {
  locations: Location[]
  userId: string
}

type DocState = 'idle' | 'checking' | 'ok' | 'duplicate'

interface DuplicateInfo {
  id: string
  name: string | null
  status: VictimStatus
  found_location: string
}

function normalizeCedula(raw: string): string {
  const upper = raw.trim().toUpperCase().replace(/\s/g, '')
  const match  = upper.match(/^([VE])-?(\d{6,8})$/)
  if (match) return `${match[1]}-${match[2]}`
  const digits = upper.match(/^(\d{6,8})$/)
  if (digits) return `V-${digits[1]}`
  return ''
}

function normalizePartida(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ')
}

const STATUS_OPTIONS: { value: VictimStatus; label: string; cls: string }[] = [
  { value: 'alive',    label: '✅ Con vida',      cls: 'border-green-300 bg-green-50 text-green-800' },
  { value: 'critical', label: '🟠 Crítico',        cls: 'border-orange-300 bg-orange-50 text-orange-800' },
  { value: 'deceased', label: '⚫ Fallecido',      cls: 'border-gray-300 bg-gray-50 text-gray-700' },
  { value: 'missing',  label: '🔍 Desaparecido',  cls: 'border-purple-300 bg-purple-50 text-purple-800' },
  { value: 'unknown',  label: '❓ Desconocido',   cls: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
]

function DuplicateAlert({ info }: { info: DuplicateInfo }) {
  return (
    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
      <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Ya existe un registro con este documento</p>
      <p className="text-xs text-red-600">
        <span className="font-medium">{info.name ?? 'Sin nombre registrado'}</span>
        {' · '}Estado: <span className="font-medium">{info.status}</span>
        {' · '}Encontrado/a en: {info.found_location}
      </p>
      <a
        href={`/victimas/${info.id}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-red-700 underline font-medium mt-1 inline-block"
      >
        Ver registro existente →
      </a>
    </div>
  )
}

function DocStatusIcon({ state }: { state: DocState }) {
  if (state === 'checking')  return <span className="animate-spin inline-block">⏳</span>
  if (state === 'ok')        return <>✅</>
  if (state === 'duplicate') return <>🚫</>
  return null
}

export default function VictimaForm({ locations, userId }: VictimaFormProps) {
  const router = useRouter()

  // Identidad
  const [name, setName]               = useState('')
  const [cedula, setCedula]           = useState('')
  const [cedulaState, setCedulaState] = useState<DocState>('idle')
  const [cedulaDup, setCedulaDup]     = useState<DuplicateInfo | null>(null)

  // Identificación de menores
  const [partida, setPartida]         = useState('')
  const [partidaState, setPartidaState] = useState<DocState>('idle')
  const [partidaDup, setPartidaDup]   = useState<DuplicateInfo | null>(null)
  const [tutorCedula, setTutorCedula] = useState('')

  // Datos generales
  const [description, setDescription]     = useState('')
  const [estimatedAge, setEstimatedAge]   = useState('')
  const [isMinor, setIsMinor]             = useState(false)
  const [status, setStatus]               = useState<VictimStatus>('unknown')
  const [foundLocation, setFoundLocation] = useState('')
  const [currentLocationId, setCurrentLocationId] = useState('')
  const [notes, setNotes]               = useState('')
  const [photos, setPhotos]             = useState<File[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [insertedId, setInsertedId]     = useState<string | null>(null)

  // Datos del reportante
  const [reporterName, setReporterName]   = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [reporterPhone, setReporterPhone] = useState('')

  const cedulaTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const partidaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Chequeo cédula adulto ──────────────────────────────────────────────────
  async function checkCedula(raw: string) {
    const normalized = normalizeCedula(raw)
    if (!normalized) { setCedulaState('idle'); setCedulaDup(null); return }
    setCedulaState('checking')
    const { data } = await createClient()
      .from('victims').select('id, name, status, found_location')
      .eq('cedula', normalized).maybeSingle()
    if (data) { setCedulaState('duplicate'); setCedulaDup(data as DuplicateInfo) }
    else       { setCedulaState('ok');        setCedulaDup(null) }
  }

  function handleCedulaChange(value: string) {
    setCedula(value); setCedulaState('idle'); setCedulaDup(null)
    if (cedulaTimer.current) clearTimeout(cedulaTimer.current)
    if (value.trim().length >= 6)
      cedulaTimer.current = setTimeout(() => checkCedula(value), 500)
  }

  // ── Chequeo partida de nacimiento ─────────────────────────────────────────
  async function checkPartida(raw: string) {
    const normalized = normalizePartida(raw)
    if (!normalized) { setPartidaState('idle'); setPartidaDup(null); return }
    setPartidaState('checking')
    const { data } = await createClient()
      .from('victims').select('id, name, status, found_location')
      .eq('partida_nacimiento', normalized).maybeSingle()
    if (data) { setPartidaState('duplicate'); setPartidaDup(data as DuplicateInfo) }
    else       { setPartidaState('ok');        setPartidaDup(null) }
  }

  function handlePartidaChange(value: string) {
    setPartida(value); setPartidaState('idle'); setPartidaDup(null)
    if (partidaTimer.current) clearTimeout(partidaTimer.current)
    if (value.trim().length >= 4)
      partidaTimer.current = setTimeout(() => checkPartida(value), 500)
  }

  // ── Cuando cambia la edad, actualizar isMinor ──────────────────────────────
  function handleAgeChange(value: string) {
    setEstimatedAge(value)
    const age = parseInt(value)
    if (!isNaN(age)) setIsMinor(age < 18)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const hasDocDuplicate = cedulaState === 'duplicate' || partidaState === 'duplicate'
  const isCheckingDoc   = cedulaState === 'checking'  || partidaState === 'checking'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hasDocDuplicate || isCheckingDoc) return
    setLoading(true); setError('')

    const supabase         = createClient()
    const normalizedCedula = normalizeCedula(cedula)
    const normalizedPartida = normalizePartida(partida)

    // Upload fotos
    const photoUrls: string[] = []
    for (const photo of photos) {
      const ext  = photo.name.split('.').pop()
      const path = `victims/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('victim-photos').upload(path, photo)
      if (uploadError) {
        setError('Error subiendo foto: ' + uploadError.message)
        setLoading(false); return
      }
      const { data: urlData } = supabase.storage.from('victim-photos').getPublicUrl(path)
      photoUrls.push(urlData.publicUrl)
    }

    const { data: inserted, error: insertError } = await supabase.from('victims').insert({
      created_by:           userId,
      name:                 name.trim() || null,
      cedula:               (!isMinor && normalizedCedula) ? normalizedCedula : null,
      partida_nacimiento:   (isMinor && normalizedPartida) ? normalizedPartida : null,
      tutor_cedula:         (isMinor && tutorCedula.trim()) ? normalizeCedula(tutorCedula) || tutorCedula.trim() : null,
      physical_description: description.trim(),
      estimated_age:        estimatedAge ? parseInt(estimatedAge) : null,
      is_minor:             isMinor,
      status,
      found_location:       foundLocation.trim(),
      current_location_id:  currentLocationId || null,
      photo_urls:           photoUrls,
      notes:                notes.trim() || null,
      reporter_name:        reporterName.trim() || null,
      reporter_email:       reporterEmail.trim().toLowerCase() || null,
      reporter_phone:       reporterPhone.trim() || null,
    }).select('id').single()

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Este documento ya existe en el sistema. Verifica el registro existente antes de continuar.')
      } else {
        setError('Error al registrar: ' + insertError.message)
      }
      setLoading(false); return
    }

    setInsertedId(inserted?.id ?? null)

    await supabase.from('audit_log').insert({
      user_id: userId, action: 'CREATE_VICTIM', resource_type: 'victim',
    })

    setSuccess(true); setLoading(false)
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function resetForm() {
    setName(''); setCedula(''); setCedulaState('idle'); setCedulaDup(null)
    setPartida(''); setPartidaState('idle'); setPartidaDup(null); setTutorCedula('')
    setDescription(''); setPhotos([])
    setReporterName(''); setReporterEmail(''); setReporterPhone('')
    setInsertedId(null)
    setSuccess(false)
  }

  // ── Éxito ──────────────────────────────────────────────────────────────────
  if (success) {
    const trackingUrl = insertedId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/seguimiento/${insertedId}` : null

    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 sm:p-8">
        <div className="text-4xl mb-3 text-center">✅</div>
        <h2 className="text-xl font-bold text-green-800 mb-2 text-center">Registro guardado exitosamente</h2>
        <p className="text-green-700 text-sm mb-5 text-center">El caso estará disponible para búsqueda familiar.</p>

        {trackingUrl && (
          <div className="bg-white border border-green-300 rounded-lg p-4 mb-5">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Enlace de seguimiento para el reportante
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Comparte esta URL con quien reportó el caso. Podrán ver actualizaciones de estado sin necesidad de registrarse.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-800 break-all">
                {trackingUrl}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(trackingUrl)}
                className="shrink-0 text-xs bg-green-600 text-white px-2 py-1.5 rounded font-medium hover:bg-green-700 transition-colors"
              >
                Copiar
              </button>
            </div>
            {reporterEmail && (
              <p className="text-xs text-green-700 mt-2">
                Recibirán actualizaciones por correo en <strong>{reporterEmail}</strong> cuando cambie el estado.
              </p>
            )}
          </div>
        )}

        {insertedId && (
          <div className="mb-5">
            <a
              href={`/victimas/${insertedId}`}
              className="block text-center text-sm text-blue-600 hover:underline font-medium"
            >
              Ver perfil completo del caso →
            </a>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={resetForm} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            Registrar otra persona
          </button>
          <button onClick={() => router.push('/dashboard')} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Ir al panel
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

      {/* ── Nombre + Edad ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-gray-400 font-normal">(si se conoce)</span>
          </label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Nombre completo o apodo"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edad estimada</label>
          <input
            type="number" min="0" max="120" value={estimatedAge}
            onChange={e => handleAgeChange(e.target.value)}
            placeholder="Ej: 7"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* ── Menor de edad ── */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
        <input
          type="checkbox" id="isMinor" checked={isMinor}
          onChange={e => setIsMinor(e.target.checked)}
          className="w-4 h-4 accent-purple-600"
        />
        <label htmlFor="isMinor" className="text-sm font-medium text-purple-800">
          Es menor de edad — Activar protección especial (perfil oculto al público)
        </label>
      </div>

      {/* ── Documentos: condicional por isMinor ── */}
      {!isMinor ? (
        /* ADULTO — cédula */
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cédula de identidad <span className="text-gray-400 font-normal">(si se conoce)</span>
          </label>
          <div className="relative">
            <input
              type="text" value={cedula} onChange={e => handleCedulaChange(e.target.value)}
              placeholder="V-12345678 o E-12345678"
              maxLength={12}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-9 focus:outline-none focus:ring-2 transition-colors ${
                cedulaState === 'duplicate' ? 'border-red-400 focus:ring-red-400 bg-red-50'
                  : cedulaState === 'ok'   ? 'border-green-400 focus:ring-green-400'
                  : 'border-gray-300 focus:ring-red-500'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base">
              <DocStatusIcon state={cedulaState} />
            </span>
          </div>
          {cedulaState === 'duplicate' && cedulaDup && <DuplicateAlert info={cedulaDup} />}
          {cedulaState === 'ok' && <p className="text-xs text-green-600 mt-1">Cédula verificada — no existe registro previo.</p>}
          <p className="text-xs text-gray-400 mt-1">Formato V-XXXXXXXX o E-XXXXXXXX. Verifica en tiempo real para evitar duplicados.</p>
        </div>
      ) : (
        /* MENOR — partida de nacimiento + cédula del tutor */
        <div className="space-y-4 p-4 bg-purple-50 border border-purple-100 rounded-xl">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
            Identificación del menor
          </p>

          {/* Partida de nacimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° de partida de nacimiento <span className="text-gray-400 font-normal">(si se conoce)</span>
            </label>
            <div className="relative">
              <input
                type="text" value={partida} onChange={e => handlePartidaChange(e.target.value)}
                placeholder="Ej: 2019-S-123456"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-9 focus:outline-none focus:ring-2 transition-colors ${
                  partidaState === 'duplicate' ? 'border-red-400 focus:ring-red-400 bg-red-50'
                    : partidaState === 'ok'   ? 'border-green-400 focus:ring-green-400'
                    : 'border-gray-300 focus:ring-red-500'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base">
                <DocStatusIcon state={partidaState} />
              </span>
            </div>
            {partidaState === 'duplicate' && partidaDup && <DuplicateAlert info={partidaDup} />}
            {partidaState === 'ok' && <p className="text-xs text-green-600 mt-1">Partida verificada — no existe registro previo.</p>}
            <p className="text-xs text-gray-400 mt-1">
              Se usa para evitar registros duplicados del mismo menor. Déjalo vacío si no está disponible.
            </p>
          </div>

          {/* Cédula del tutor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cédula del padre / madre / tutor <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text" value={tutorCedula} onChange={e => setTutorCedula(e.target.value)}
              placeholder="V-12345678"
              maxLength={12}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Ayuda a vincular al menor con su familia en el sistema.
            </p>
          </div>
        </div>
      )}

      {/* ── Descripción física ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción física <span className="text-red-500">*</span>
        </label>
        <textarea
          required value={description} onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Altura aproximada, color de cabello, ropa que llevaba, señas particulares, tatuajes, cicatrices…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* ── Estado ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value} type="button" onClick={() => setStatus(opt.value)}
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

      {/* ── Lugar encontrado ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lugar donde fue encontrado/a <span className="text-red-500">*</span>
        </label>
        <input
          type="text" required value={foundLocation} onChange={e => setFoundLocation(e.target.value)}
          placeholder="Ej: Calle El Paraíso, entre Los Rosales y Santa Rosa, Caracas"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* ── Ubicación actual ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital o refugio actual</label>
        <select
          value={currentLocationId} onChange={e => setCurrentLocationId(e.target.value)}
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

      {/* ── Fotos ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fotos</label>
        <input
          type="file" accept="image/*" multiple capture="environment"
          onChange={e => setPhotos(Array.from(e.target.files || []))}
          className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
        />
        {photos.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {photos.length} foto{photos.length > 1 ? 's' : ''} seleccionada{photos.length > 1 ? 's' : ''}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">Las fotos se almacenan de forma segura y solo son accesibles por personal autorizado.</p>
      </div>

      {/* ── Notas ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Información adicional relevante para médicos o familia"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* ── Datos del reportante ── */}
      <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            {status === 'missing' ? '🔍 Datos de quien denuncia la desaparición' : '📋 Datos de contacto del reportante'}
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Opcional pero recomendado — recibirán actualizaciones automáticas por correo cuando cambie el estado.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del reportante</label>
            <input
              type="text" value={reporterName} onChange={e => setReporterName(e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
            <input
              type="tel" value={reporterPhone} onChange={e => setReporterPhone(e.target.value)}
              placeholder="+58 412 000 0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            type="email" value={reporterEmail} onChange={e => setReporterEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {reporterEmail && (
            <p className="text-xs text-blue-600 mt-1">
              Se enviará una notificación a este correo cada vez que cambie el estado del caso.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || hasDocDuplicate || isCheckingDoc}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
        >
          {loading          ? 'Guardando…'
           : isCheckingDoc  ? 'Verificando documento…'
           : hasDocDuplicate ? 'Documento duplicado — no se puede guardar'
           : 'Registrar'}
        </button>
        <button
          type="button" onClick={() => router.back()}
          className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
