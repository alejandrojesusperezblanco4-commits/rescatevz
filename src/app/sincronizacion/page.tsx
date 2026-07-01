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

type FotoStatus = 'pending' | 'processing' | 'done' | 'error'

interface FotoItem {
  preview: string
  name: string
  status: FotoStatus
  personasCount: number
  errorMsg?: string
}

interface VRPersona {
  id: string; nombre: string; cedula?: string; edad?: number
  ciudad?: string; zona?: string; ficha_url: string; verificado: boolean
}
interface VRIngreso {
  id: string; nombre: string; edad?: number; ubicacion: string; fecha?: string; ficha_url: string
}
interface Match { victimId: string; victimName: string; buscados: VRPersona[]; hospitalizados: VRIngreso[] }
interface BatchResult { matches: Match[]; total: number; checked: number }
interface SitiosResult { ok: boolean; total: number; inserted: number; skipped: number; message: string }

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
  alive: 'Con vida', critical: 'Herido / crítico', deceased: 'Fallecido', unknown: 'Desconocido',
}

const STATUS_ICON: Record<FotoStatus, { icon: string; color: string }> = {
  pending:    { icon: 'schedule',          color: '#475569' },
  processing: { icon: 'progress_activity', color: '#D4A017' },
  done:       { icon: 'check_circle',      color: '#22C55E' },
  error:      { icon: 'error',             color: '#DC2626' },
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function SincronizacionPage() {

  // — multi-foto lector —
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fotos, setFotos] = useState<FotoItem[]>([])
  const [personas, setPersonas] = useState<PersonaExtraida[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [ingresando, setIngresando] = useState(false)
  const [ingresarError, setIngresarError] = useState<string | null>(null)
  const [ingresadoCount, setIngresadoCount] = useState<number | null>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    const items: FotoItem[] = await Promise.all(arr.map(async f => ({
      preview: await resizeImage(f),
      name: f.name,
      status: 'pending' as FotoStatus,
      personasCount: 0,
    })))
    setFotos(prev => [...prev, ...items])
    setIngresadoCount(null)
    setIngresarError(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  async function processAll() {
    setIsProcessing(true)
    const currentFotos = fotos
    for (let i = 0; i < currentFotos.length; i++) {
      if (currentFotos[i].status !== 'pending') continue

      setFotos(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f))

      try {
        const res = await fetch('/api/docs/extraer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: currentFotos[i].preview }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

        const nuevas: PersonaExtraida[] = data.personas || []
        setPersonas(prev => [...prev, ...nuevas])
        setFotos(prev => prev.map((f, idx) => idx === i
          ? { ...f, status: 'done', personasCount: nuevas.length }
          : f
        ))
      } catch (err) {
        setFotos(prev => prev.map((f, idx) => idx === i
          ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Error' }
          : f
        ))
      }

      // Pausa entre fotos para no saturar la API
      if (i < currentFotos.length - 1) await new Promise(r => setTimeout(r, 800))
    }
    setIsProcessing(false)
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

  function reset() {
    setFotos([]); setPersonas([])
    setIngresadoCount(null); setIngresarError(null)
  }

  async function ingresar() {
    if (personas.length === 0) return
    setIngresando(true); setIngresarError(null)
    try {
      const res = await fetch('/api/docs/ingresar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personas }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setIngresadoCount(data.insertados)
      setFotos([]); setPersonas([])
    } catch (e: unknown) {
      setIngresarError(e instanceof Error ? e.message : String(e))
    } finally {
      setIngresando(false)
    }
  }

  const pendingCount = fotos.filter(f => f.status === 'pending').length
  const doneCount = fotos.filter(f => f.status === 'done').length
  const totalPersonas = personas.length

  // — VR sitios —
  const [sitiosLoading, setSitiosLoading] = useState(false)
  const [sitiosResult, setSitiosResult] = useState<SitiosResult | null>(null)
  const [sitiosError, setSitiosError] = useState<string | null>(null)

  async function importarSitios() {
    setSitiosLoading(true); setSitiosError(null); setSitiosResult(null)
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
    setLoading(true); setError(null); setResult(null)
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
          Sincronización y documentos
        </h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          Importa personas desde fotos de listas de campo o cruza registros con plataformas externas.
        </p>
      </div>

      {/* ══ LECTOR DE DOCUMENTOS MULTI-FOTO ══ */}
      <div className="rounded-xl p-5 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined" style={{ color: '#D4A017', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
            document_scanner
          </span>
          <h2 className="font-bold" style={{ color: '#F0F4FF' }}>Lector de documentos de campo</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
          Sube una o varias fotos de listas — la IA las analiza una a una y extrae a cada persona. Revisa antes de ingresar.
        </p>

        {/* Éxito */}
        {ingresadoCount !== null && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {ingresadoCount} persona{ingresadoCount !== 1 ? 's' : ''} ingresada{ingresadoCount !== 1 ? 's' : ''} correctamente.
          </div>
        )}

        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all hover:brightness-110 mb-4"
          style={{ border: '2px dashed rgba(212,160,23,0.4)', background: '#162040', minHeight: '120px', padding: '1.5rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#D4A017', fontVariationSettings: "'FILL' 0" }}>
            add_a_photo
          </span>
          <p className="text-sm text-center" style={{ color: '#94A3B8' }}>
            Arrastra fotos aquí o <span style={{ color: '#D4A017' }}>toca para seleccionar</span>
            <br /><span className="text-xs" style={{ color: '#475569' }}>Puedes seleccionar varias a la vez · JPG · PNG · WEBP</span>
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }}
        />

        {/* Cola de fotos */}
        {fotos.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>
                {fotos.length} foto{fotos.length !== 1 ? 's' : ''} en cola
              </p>
              <button onClick={reset} className="text-xs transition-all hover:opacity-70" style={{ color: '#64748B' }}>
                Limpiar todo
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {fotos.map((f, i) => {
                const s = STATUS_ICON[f.status]
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2"
                    style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.preview} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#F0F4FF' }}>{f.name}</p>
                      <p className="text-xs" style={{ color: '#64748B' }}>
                        {f.status === 'done' ? `${f.personasCount} persona${f.personasCount !== 1 ? 's' : ''} extraída${f.personasCount !== 1 ? 's' : ''}` : ''}
                        {f.status === 'error' ? f.errorMsg : ''}
                        {f.status === 'pending' ? 'En espera' : ''}
                        {f.status === 'processing' ? 'Analizando…' : ''}
                      </p>
                    </div>
                    <span
                      className={`material-symbols-outlined ${f.status === 'processing' ? 'animate-spin' : ''}`}
                      style={{ fontSize: '20px', color: s.color, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
                    >
                      {s.icon}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Progreso global */}
            {fotos.length > 1 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: '#64748B' }}>
                  <span>{doneCount}/{fotos.length} analizadas</span>
                  <span>{totalPersonas} personas extraídas hasta ahora</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,51,86,0.5)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${fotos.length ? (doneCount / fotos.length) * 100 : 0}%`, background: '#D4A017' }} />
                </div>
              </div>
            )}

            {/* Botón analizar */}
            {pendingCount > 0 && (
              <button
                onClick={processAll}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#D4A017', color: '#1a2744' }}
              >
                {isProcessing
                  ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span> Analizando foto {doneCount + 1} de {fotos.length}…</>
                  : <><span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>manage_search</span>
                      Analizar {pendingCount} foto{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</>
                }
              </button>
            )}
          </div>
        )}

        {/* Tarjetas editables */}
        {personas.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: '#F0F4FF' }}>
                {personas.length} persona{personas.length !== 1 ? 's' : ''} extraída{personas.length !== 1 ? 's' : ''} — revisa antes de ingresar
              </p>
              <button onClick={addPersona}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:brightness-110"
                style={{ color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)', background: 'rgba(212,160,23,0.08)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                Agregar
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {personas.map((p, idx) => (
                <div key={idx} className="rounded-lg p-4" style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold tabular-nums"
                      style={{ color: '#475569', background: '#1e2d4a', padding: '2px 8px', borderRadius: '9999px' }}>
                      #{idx + 1}
                    </span>
                    <button onClick={() => removePersona(idx)}
                      className="ml-auto text-xs flex items-center gap-1 transition-all hover:opacity-80"
                      style={{ color: '#EF4444' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                      Quitar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Nombre', field: 'nombre', placeholder: 'Desconocido' },
                      { label: 'Cédula', field: 'cedula', placeholder: '—' },
                    ].map(({ label, field, placeholder }) => (
                      <div key={field}>
                        <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>{label}</label>
                        <input type="text"
                          value={(p[field as keyof PersonaExtraida] as string) || ''}
                          onChange={(e) => updatePersona(idx, field as keyof PersonaExtraida, e.target.value || null)}
                          placeholder={placeholder}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Edad</label>
                      <input type="number" value={p.edad ?? ''} min={0} max={130}
                        onChange={(e) => updatePersona(idx, 'edad', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="—"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Estado</label>
                      <select value={p.estado} onChange={(e) => updatePersona(idx, 'estado', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}>
                        {Object.entries(ESTADO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Dónde fue encontrado/a</label>
                      <input type="text" value={p.encontrado_en}
                        onChange={(e) => updatePersona(idx, 'encontrado_en', e.target.value)}
                        placeholder="Hospital, refugio, zona…"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Notas</label>
                      <input type="text" value={p.notas || ''}
                        onChange={(e) => updatePersona(idx, 'notas', e.target.value || null)}
                        placeholder="Heridas, medicamentos, familiar contactado…"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }} />
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

            <button onClick={ingresar} disabled={ingresando || personas.length === 0}
              className="mt-4 w-full py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#22C55E', color: '#052e16' }}>
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
            <h2 className="font-semibold mb-1" style={{ color: '#F0F4FF' }}>Importar hospitales y refugios</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Descarga sitios activos de Venezuela Reporta e impórtalos a RescateVZ. Solo añade ubicaciones nuevas.
            </p>
          </div>
          <button onClick={importarSitios} disabled={sitiosLoading}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            style={{ background: '#D4A017', color: '#1a2744' }}>
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
            <div className="rounded-lg px-4 py-3 text-center" style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
              <div className="text-2xl font-black tabular-nums" style={{ color: '#D4A017' }}>{sitiosResult.inserted}</div>
              <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>nuevas ubicaciones</div>
            </div>
            <div className="rounded-lg px-4 py-3 text-center" style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
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
              API pública · personas buscadas, ingresos hospitalarios y sitios. Lectura libre · Sin autenticación.
            </p>
          </div>
          <button onClick={runSync} disabled={loading}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: '#1a2744', color: '#D4A017', border: '1px solid rgba(212,160,23,0.4)' }}>
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
            <div className="text-center py-12 text-gray-500">No se encontraron coincidencias en esta consulta.</div>
          ) : (
            <div className="space-y-6">
              {result.matches.map((match) => (
                <div key={match.victimId} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">RescateVZ</span>
                    <span className="font-semibold">{match.victimName}</span>
                    <a href={`/victima/${match.victimId}`} className="ml-auto text-xs text-blue-400 hover:underline">Ver perfil →</a>
                  </div>
                  {match.buscados.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Personas buscadas en Venezuela Reporta</div>
                      <div className="space-y-2">
                        {match.buscados.map((p) => (
                          <a key={p.id} href={p.ficha_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-start gap-3 bg-gray-800 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{p.nombre}</span>
                                {p.verificado && <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">verificado</span>}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 space-x-3">
                                {p.edad && <span>{p.edad} años</span>}
                                {p.ciudad && <span>{p.ciudad}{p.zona ? `, ${p.zona}` : ''}</span>}
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
                            className="flex items-start gap-3 bg-gray-800 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{p.nombre}</div>
                              <div className="text-xs text-gray-400 mt-0.5 space-x-3">
                                {p.edad && <span>{p.edad} años</span>}
                                <span>{p.ubicacion}</span>
                              </div>
                            </div>
                            <span className="text-xs text-blue-400 shrink-0">Ver →</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-3">Fuente: Venezuela Reporta — venezuelareporta.org</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
