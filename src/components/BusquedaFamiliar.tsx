'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { PublicSearchMatch } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'

interface SolicitudData {
  victimId: string
  locationName: string
}

export default function BusquedaFamiliar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicSearchMatch[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchCount, setSearchCount] = useState(0)
  const [searchError, setSearchError] = useState('')

  // Solicitud de acceso
  const [solicitud, setSolicitud] = useState<SolicitudData | null>(null)
  const [relationship, setRelationship] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [solicitudLoading, setSolicitudLoading] = useState(false)
  const [solicitudSuccess, setSolicitudSuccess] = useState(false)
  const [solicitudError, setSolicitudError] = useState('')

  // Reporte de menor (sin búsqueda automática)
  const [showMenorForm, setShowMenorForm] = useState(false)
  const [menorNombre, setMenorNombre] = useState('')
  const [menorContacto, setMenorContacto] = useState('')
  const [menorDescripcion, setMenorDescripcion] = useState('')
  const [menorLoading, setMenorLoading] = useState(false)
  const [menorSuccess, setMenorSuccess] = useState(false)
  const [menorError, setMenorError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || query.trim().length < 3) return
    if (searchCount >= 5) return

    setLoading(true)
    setResults(null)
    setSearchError('')

    const supabase = createClient()

    // RPC en vez de leer la tabla victims directamente: nunca devuelve
    // nombre, cédula, foto ni descripción física, solo ubicación + estado.
    const { data, error } = await supabase.rpc('search_victims_public', { p_query: query.trim() })

    if (error) {
      setSearchError('No se pudo completar la búsqueda. Intenta de nuevo.')
      setResults([])
    } else {
      setResults((data || []) as PublicSearchMatch[])
    }

    setSearchCount(c => c + 1)
    setLoading(false)
  }

  async function handleSolicitud(e: React.FormEvent) {
    e.preventDefault()
    if (!solicitud || !idFile) return
    setSolicitudLoading(true)
    setSolicitudError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSolicitudError('Debes iniciar sesión para solicitar acceso')
      setSolicitudLoading(false)
      return
    }

    // Bucket privado: solo guardamos el path, nunca una URL pública.
    const ext = idFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('access-docs').upload(path, idFile)
    if (uploadError) {
      setSolicitudError('Error al subir documento: ' + uploadError.message)
      setSolicitudLoading(false)
      return
    }

    // Esta búsqueda pública nunca devuelve menores (is_minor = false en el
    // RPC), así que la persona solicitada siempre debería tener cédula.
    const { error: insertError } = await supabase.from('access_requests').insert({
      family_user_id: user.id,
      victim_id: solicitud.victimId,
      id_document_url: path,
      id_document_type: 'cedula',
      relationship_description: relationship,
    })

    if (insertError) {
      setSolicitudError('Error al enviar solicitud: ' + insertError.message)
      setSolicitudLoading(false)
      return
    }

    setSolicitudSuccess(true)
    setSolicitudLoading(false)
  }

  async function handleMenorSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMenorLoading(true)
    setMenorError('')

    const supabase = createClient()
    const { error } = await supabase.from('minor_inquiries').insert({
      reporter_name: menorNombre.trim(),
      reporter_contact: menorContacto.trim(),
      description: menorDescripcion.trim(),
    })

    if (error) {
      setMenorError('Error al enviar el reporte: ' + error.message)
      setMenorLoading(false)
      return
    }

    setMenorSuccess(true)
    setMenorLoading(false)
  }

  return (
    <>
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm">RV</div>
          <span className="font-bold text-lg">RescateVZ</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Inicio</Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buscar a un familiar</h1>
        <p className="text-sm text-gray-500 mb-8">
          Busca por nombre completo o características físicas. Por seguridad, solo confirmamos si hay una
          coincidencia y en qué hospital o refugio está, junto con su estado de salud — sin mostrar fotos, nombre
          completo ni otros datos. Para más información, deberás verificar tu identidad y tu parentesco.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nombre, apellido o descripción física…"
            minLength={3}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={loading || searchCount >= 5 || query.trim().length < 3}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? '…' : 'Buscar'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mb-6">
          ¿Buscas a un niño o niña?{' '}
          <button type="button" onClick={() => setShowMenorForm(true)} className="text-red-600 hover:underline font-medium">
            Los menores no aparecen aquí, reporta el caso directamente
          </button>
          .
        </p>

        {searchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {searchError}
          </div>
        )}

        {searchCount >= 5 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-4">
            Has alcanzado el límite de búsquedas por sesión.{' '}
            <Link href="/login" className="underline font-medium">Inicia sesión</Link> para continuar.
          </div>
        )}

        {/* Results */}
        {results !== null && (
          <div>
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium text-gray-600">No se encontraron coincidencias</p>
                <p className="text-sm mt-1">Intenta con un nombre diferente o características físicas</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Se encontraron <strong>{results.length}</strong> coincidencia{results.length > 1 ? 's' : ''}.
                  Por seguridad, los detalles completos requieren verificación de identidad.
                </p>
                <div className="space-y-3">
                  {results.map(match => (
                    <div key={match.victim_id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{match.location_type === 'hospital' ? '🏥' : '🏕️'}</span>
                          <span className="font-medium text-gray-900">{match.location_name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[match.victim_status]}`}>
                          {STATUS_LABELS[match.victim_status]}
                        </span>
                      </div>
                      <button
                        onClick={() => setSolicitud({ victimId: match.victim_id, locationName: match.location_name })}
                        className="shrink-0 text-sm bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Solicitar acceso
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Solicitud de acceso */}
      {solicitud && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            {solicitudSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">📋</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Solicitud enviada</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Un administrador revisará tu solicitud y te contactará. El tiempo de respuesta es inferior a 2 horas.
                </p>
                <button
                  onClick={() => { setSolicitud(null); setSolicitudSuccess(false) }}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Solicitar acceso al perfil</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Coincidencia en: {solicitud.locationName}</p>
                  </div>
                  <button onClick={() => setSolicitud(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg mb-4">
                  Para proteger la privacidad de las víctimas, necesitamos verificar tu identidad y parentesco.
                </div>

                <form onSubmit={handleSolicitud} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relación con la persona</label>
                    <input
                      type="text"
                      required
                      value={relationship}
                      onChange={e => setRelationship(e.target.value)}
                      placeholder="Ej: madre, hermano, esposo/a, hijo/a…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Foto de tu cédula de identidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      accept="image/*"
                      capture="environment"
                      onChange={e => setIdFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">Solo visible para administradores, mediante enlace temporal.</p>
                  </div>

                  {solicitudError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                      {solicitudError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={solicitudLoading || !idFile}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                    >
                      {solicitudLoading ? 'Enviando…' : 'Enviar solicitud'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSolicitud(null)}
                      className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Reporte de menor (sin búsqueda/matching automático) */}
      {showMenorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            {menorSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">📋</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Reporte enviado</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Un administrador revisará el caso manualmente contra los menores registrados y te contactará.
                </p>
                <button
                  onClick={() => { setShowMenorForm(false); setMenorSuccess(false); setMenorNombre(''); setMenorContacto(''); setMenorDescripcion('') }}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Reportar búsqueda de un menor</h2>
                    <p className="text-sm text-gray-500 mt-0.5">No hacemos búsqueda automática de menores por seguridad.</p>
                  </div>
                  <button onClick={() => setShowMenorForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>

                <div className="bg-purple-50 border border-purple-200 text-purple-800 text-xs px-3 py-2 rounded-lg mb-4">
                  Un administrador revisará tu reporte manualmente y se pondrá en contacto contigo directamente.
                </div>

                <form onSubmit={handleMenorSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
                    <input
                      type="text"
                      required
                      value={menorNombre}
                      onChange={e => setMenorNombre(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tu teléfono o correo de contacto</label>
                    <input
                      type="text"
                      required
                      value={menorContacto}
                      onChange={e => setMenorContacto(e.target.value)}
                      placeholder="Para que el administrador pueda contactarte"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Describe al menor que buscas</label>
                    <textarea
                      required
                      rows={3}
                      value={menorDescripcion}
                      onChange={e => setMenorDescripcion(e.target.value)}
                      placeholder="Nombre, edad aproximada, características físicas, dónde se le vio por última vez…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {menorError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                      {menorError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={menorLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                    >
                      {menorLoading ? 'Enviando…' : 'Enviar reporte'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMenorForm(false)}
                      className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
