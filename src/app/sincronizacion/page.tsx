'use client'

import { useState, useRef, useCallback } from 'react'

// ─── tipos ────────────────────────────────────────────────────────────────────

interface PersonaExtraida {
  nombre: string | null
  cedula: string | null
  edad: number | null
  estado: 'alive' | 'critical' | 'deceased' | 'unknown'
  encontrado_en: string
  descripcion_fisica: string | null
  notas: string | null
}

interface ExtractionResult {
  personas: PersonaExtraida[]
  tipo_documento: string
  confianza: 'alta' | 'media' | 'baja'
  advertencias: string[]
}

interface VRPersona {
  id: string
  nombre: string
  cedula?: string
  edad?: number
  ciudad?: string
  zona?: string
  descripcion?: string
  ficha_url: string
  verificado: boolean
}

interface VRIngreso {
  id: string
  nombre: string
  edad?: number
  ubicacion: string
  fecha?: string
  ficha_url: string
}

interface Match {
  victimId: string
  victimName: string
  buscados: VRPersona[]
  hospitalizados: VRIngreso[]
}

interface BatchResult {
  matches: Match[]
  total: number
  checked: number
}

interface SitiosResult {
  ok: boolean
  total: number
  inserted: number
  skipped: number
  message: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

const ESTADO_LABELS: Record<string, string> = {
  alive: 'Con vida',
  critical: 'Herido / crítico',
  deceased: 'Fallecido',
  unknown: 'Desconocido',
}

const CONFIANZA_COLOR: Record<string, string> = {
  alta: '#22C55E',
  media: '#F59E0B',
  baja: '#EF4444',
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function SincronizacionPage() {

  // — lector de documentos —
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [docPreview, setDocPreview] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null)
  const [personas, setPersonas] = useState<PersonaExtraida[]>([])
  const [ingresando, setIngresando] = useState(false)
  const [ingresarError, setIngresarError] = useState<string | null>(null)
  const [ingresadoCount, setIngresadoCount] = useState<number | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setExtraction(null)
    setPersonas([])
    setExtractError(null)
    setIngresarError(null)
    setIngresadoCount(null)
    try {
      const resized = await resizeImage(file)
      setDocPreview(resized)
    } catch {
      setExtractError('No se pudo leer la imagen.')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  async function extraer() {
    if (!docPreview) return
    setExtracting(true)
    setExtractError(null)
    setExtraction(null)
    setPersonas([])
    setIngresadoCount(null)
    try {
      const res = await fetch('/api/docs/extraer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: docPreview }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setExtraction(data as ExtractionResult)
      setPersonas((data as ExtractionResult).personas)
    } catch (e: unknown) {
      setExtractError(e instanceof Error ? e.message : String(e))
    } finally {
      setExtracting(false)
    }
  }

  function updatePersona(idx: number, field: keyof PersonaExtraida, value: unknown) {
    setPersonas(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  function removePersona(idx: number) {
    setPersonas(prev => prev.filter((_, i) => i !== idx))
  }

  function addPersona() {
    setPersonas(prev => [...prev, {
      nombre: null, cedula: null, edad: null,
      estado: 'unknown', encontrado_en: '', descripcion_fisica: null, notas: null,
    }])
  }

  async function ingresar() {
    if (personas.length === 0) return
    setIngresando(true)
    setIngresarError(null)
    try {
      const res = await fetch('/api/docs/ingresar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personas }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setIngresadoCount(data.insertados)
      setPersonas([])
      setExtraction(null)
      setDocPreview(null)
    } catch (e: unknown) {
      setIngresarError(e instanceof Error ? e.message : String(e))
    } finally {
      setIngresando(false)
    }
  }

  // — VR sitios —
  const [sitiosLoading, setSitiosLoading] = useState(false)
  const [sitiosResult, setSitiosResult] = useState<SitiosResult | null>(null)
  const [sitiosError, setSitiosError] = useState<string | null>(null)

  async function importarSitios() {
    setSitiosLoading(true)
    setSitiosError(null)
    setSitiosResult(null)
    try {
      const res = await fetch('/api/sync/sitios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soloAbiertos: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setSitiosResult(data)
    } catch (e: unknown) {
      setSitiosError(e instanceof Error ? e.message : String(e))
    } finally {
      setSitiosLoading(false)
    }
  }

  // — VR batch —
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runSync() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/sync/venezuelareporta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: true }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setResult(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto" style={{ background: '#1a2744', color: '#F0F4FF' }}>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Sincronización externa
        </h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          Importa datos desde documentos de campo o cruza registros con plataformas externas.
        </p>
      </div>

      {/* ══ LECTOR DE DOCUMENTOS ══ */}
      <div className="rounded-xl p-5 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined" style={{ color: '#D4A017', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
            document_scanner
          </span>
          <h2 className="font-bold" style={{ color: '#F0F4FF' }}>Lector de documentos de campo</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
          Fotografía una lista manuscrita o impresa — formularios de hospital, censos de refugio, partes de rescate.
          La IA extrae los datos y tú revisas antes de ingresar.
        </p>

        {/* dropzone / preview */}
        {!docPreview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all hover:brightness-110"
            style={{
              border: '2px dashed rgba(212,160,23,0.4)',
              background: '#162040',
              minHeight: '160px',
              padding: '2rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#D4A017', fontVariationSettings: "'FILL' 0" }}>
              add_a_photo
            </span>
            <p className="text-sm text-center" style={{ color: '#94A3B8' }}>
              Arrastra una foto aquí o <span style={{ color: '#D4A017' }}>toca para seleccionar</span>
            </p>
            <p className="text-xs" style={{ color: '#475569' }}>JPG · PNG · WEBP</p>
          </div>
        ) : (
          <div className="flex gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={docPreview}
              alt="Documento a analizar"
              className="rounded-lg object-cover"
              style={{ width: '120px', height: '120px', border: '1px solid rgba(36,51,86,0.7)' }}
            />
            <div className="flex-1">
              <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>Imagen lista para analizar.</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={extraer}
                  disabled={extracting}
                  className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
                  style={{ background: '#D4A017', color: '#1a2744' }}
                >
                  {extracting
                    ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span> Analizando…</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>manage_search</span> Extraer personas</>
                  }
                </button>
                <button
                  onClick={() => { setDocPreview(null); setExtraction(null); setPersonas([]); setExtractError(null); setIngresadoCount(null) }}
                  className="px-4 py-2 rounded-lg text-sm transition-all hover:brightness-110"
                  style={{ background: '#162040', color: '#94A3B8', border: '1px solid rgba(36,51,86,0.5)' }}
                >
                  Cambiar imagen
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {extractError && (
          <div className="mt-4 text-sm px-3 py-2 rounded-lg"
            style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
            {extractError}
          </div>
        )}

        {ingresadoCount !== null && (
          <div className="mt-4 flex items-center gap-2 text-sm px-3 py-3 rounded-lg"
            style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {ingresadoCount} persona{ingresadoCount !== 1 ? 's' : ''} ingresada{ingresadoCount !== 1 ? 's' : ''} a la base de datos correctamente.
          </div>
        )}

        {/* meta de la extracción */}
        {extraction && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#162040', color: '#94A3B8' }}>
              {extraction.tipo_documento.replace(/_/g, ' ')}
            </span>
            <span className="text-xs px-2 py-1 rounded-full" style={{
              background: CONFIANZA_COLOR[extraction.confianza] + '22',
              color: CONFIANZA_COLOR[extraction.confianza],
              border: `1px solid ${CONFIANZA_COLOR[extraction.confianza]}44`,
            }}>
              confianza {extraction.confianza}
            </span>
            {extraction.advertencias.map((a, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* tarjetas editables */}
        {personas.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: '#F0F4FF' }}>
                {personas.length} persona{personas.length !== 1 ? 's' : ''} extraída{personas.length !== 1 ? 's' : ''} — revisa antes de ingresar
              </p>
              <button
                onClick={addPersona}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:brightness-110"
                style={{ color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)', background: 'rgba(212,160,23,0.08)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                Agregar
              </button>
            </div>

            <div className="space-y-3">
              {personas.map((p, idx) => (
                <div key={idx} className="rounded-lg p-4" style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold tabular-nums"
                      style={{ color: '#475569', background: '#1e2d4a', padding: '2px 8px', borderRadius: '9999px' }}>
                      #{idx + 1}
                    </span>
                    <button
                      onClick={() => removePersona(idx)}
                      className="ml-auto text-xs flex items-center gap-1 transition-all hover:opacity-80"
                      style={{ color: '#EF4444' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                      Quitar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Nombre</label>
                      <input
                        type="text"
                        value={p.nombre || ''}
                        onChange={(e) => updatePersona(idx, 'nombre', e.target.value || null)}
                        placeholder="Desconocido"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Cédula</label>
                      <input
                        type="text"
                        value={p.cedula || ''}
                        onChange={(e) => updatePersona(idx, 'cedula', e.target.value || null)}
                        placeholder="—"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Edad</label>
                      <input
                        type="number"
                        value={p.edad ?? ''}
                        onChange={(e) => updatePersona(idx, 'edad', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="—"
                        min={0}
                        max={130}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Estado</label>
                      <select
                        value={p.estado}
                        onChange={(e) => updatePersona(idx, 'estado', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
                      >
                        {Object.entries(ESTADO_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Dónde fue encontrado/a</label>
                      <input
                        type="text"
                        value={p.encontrado_en}
                        onChange={(e) => updatePersona(idx, 'encontrado_en', e.target.value)}
                        placeholder="Hospital, refugio, zona…"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Descripción física</label>
                      <input
                        type="text"
                        value={p.descripcion_fisica || ''}
                        onChange={(e) => updatePersona(idx, 'descripcion_fisica', e.target.value || null)}
                        placeholder="Ropa, rasgos…"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Notas adicionales</label>
                      <input
                        type="text"
                        value={p.notas || ''}
                        onChange={(e) => updatePersona(idx, 'notas', e.target.value || null)}
                        placeholder="Heridas, medicamentos, familiar contactado…"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ingresarError && (
              <div className="mt-3 text-sm px-3 py-2 rounded-lg"
                style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
                {ingresarError}
              </div>
            )}

            <button
              onClick={ingresar}
              disabled={ingresando || personas.length === 0}
              className="mt-4 w-full py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#22C55E', color: '#052e16' }}
            >
              {ingresando
                ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span> Ingresando…</>
                : <><span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>group_add</span>
                    Confirmar e ingresar {personas.length} persona{personas.length !== 1 ? 's' : ''}</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ══ VR: importar sitios ══ */}
      <div className="rounded-lg p-5 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="font-semibold mb-1" style={{ color: '#F0F4FF' }}>
              Importar hospitales y refugios
            </h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Descarga los sitios activos (hospitales, refugios, centros de acopio) de Venezuela Reporta
              e impórtalos directamente a la base de datos de RescateVZ. Solo se añaden ubicaciones nuevas.
            </p>
          </div>
          <button
            onClick={importarSitios}
            disabled={sitiosLoading}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            style={{ background: '#D4A017', color: '#1a2744' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>download</span>
            {sitiosLoading ? 'Importando…' : 'Importar sitios'}
          </button>
        </div>

        {sitiosError && (
          <div className="mt-4 text-sm px-3 py-2 rounded-lg"
            style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
            {sitiosError}
          </div>
        )}

        {sitiosResult && (
          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-lg px-4 py-3 text-center"
              style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
              <div className="text-2xl font-black tabular-nums" style={{ color: '#D4A017' }}>{sitiosResult.inserted}</div>
              <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>nuevas ubicaciones</div>
            </div>
            <div className="rounded-lg px-4 py-3 text-center"
              style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
              <div className="text-2xl font-black tabular-nums" style={{ color: '#64748B' }}>{sitiosResult.skipped}</div>
              <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>ya existían</div>
            </div>
            <p className="text-sm flex-1" style={{ color: sitiosResult.inserted > 0 ? '#22C55E' : '#94A3B8' }}>
              {sitiosResult.message}
            </p>
          </div>
        )}
      </div>

      {/* ══ VR: cruce de víctimas ══ */}
      <div className="rounded-lg p-5 mb-8" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="font-semibold mb-1" style={{ color: '#F0F4FF' }}>Cruzar víctimas con Venezuela Reporta</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              API pública con registros de personas buscadas, ingresos hospitalarios y sitios de atención.
              Lectura libre · Sin autenticación · Atribución obligatoria.
            </p>
          </div>
          <button
            onClick={runSync}
            disabled={loading}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: '#1a2744', color: '#D4A017', border: '1px solid rgba(212,160,23,0.4)' }}
          >
            {loading ? 'Buscando…' : 'Buscar coincidencias'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg p-4 mb-6 text-sm"
          style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-white">{result.checked}</div>
              <div className="text-gray-400 text-xs mt-1">víctimas revisadas</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{result.total}</div>
              <div className="text-gray-400 text-xs mt-1">con posibles coincidencias</div>
            </div>
          </div>

          {result.matches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron coincidencias en esta consulta.
            </div>
          ) : (
            <div className="space-y-6">
              {result.matches.map((match) => (
                <div key={match.victimId} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">RescateVZ</span>
                    <span className="font-semibold">{match.victimName}</span>
                    <a href={`/victima/${match.victimId}`} className="ml-auto text-xs text-blue-400 hover:underline">
                      Ver perfil →
                    </a>
                  </div>

                  {match.buscados.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Personas buscadas en Venezuela Reporta
                      </div>
                      <div className="space-y-2">
                        {match.buscados.map((p) => (
                          <a key={p.id} href={p.ficha_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-start gap-3 bg-gray-800 hover:bg-gray-750 rounded-lg p-3 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{p.nombre}</span>
                                {p.verificado && (
                                  <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">verificado</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 space-x-3">
                                {p.edad && <span>{p.edad} años</span>}
                                {p.ciudad && <span>{p.ciudad}{p.zona ? `, ${p.zona}` : ''}</span>}
                                {p.cedula && <span>{p.cedula}</span>}
                              </div>
                            </div>
                            <span className="text-xs text-blue-400 shrink-0">Ver →</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.hospitalizados.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Ingresos hospitalarios</div>
                      <div className="space-y-2">
                        {match.hospitalizados.map((p) => (
                          <a key={p.id} href={p.ficha_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-start gap-3 bg-gray-800 hover:bg-gray-750 rounded-lg p-3 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{p.nombre}</div>
                              <div className="text-xs text-gray-400 mt-0.5 space-x-3">
                                {p.edad && <span>{p.edad} años</span>}
                                <span>{p.ubicacion}</span>
                                {p.fecha && <span>{p.fecha}</span>}
                              </div>
                            </div>
                            <span className="text-xs text-blue-400 shrink-0">Ver →</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 mt-3">
                    Fuente: Venezuela Reporta — venezuelareporta.org · Solo sugerencias, requiere revisión humana.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
