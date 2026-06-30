'use client'

import { useState } from 'react'

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

export default function SincronizacionPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({ soloActivos: true }),
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
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Sincronización externa
        </h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          Cruza las víctimas registradas en RescateVZ contra la base de datos de{' '}
          <a href="https://venezuelareporta.org" target="_blank" rel="noopener noreferrer"
            className="underline" style={{ color: '#D4A017' }}>
            Venezuela Reporta
          </a>{' '}
          — personas buscadas y listas de ingresos hospitalarios.
        </p>
      </div>

      {/* — Importar hospitales y refugios — */}
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
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
              download
            </span>
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

      {/* — Cruce de víctimas — */}
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
                    <a
                      href={`/victima/${match.victimId}`}
                      className="ml-auto text-xs text-blue-400 hover:underline"
                    >
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
                          <a
                            key={p.id}
                            href={p.ficha_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 bg-gray-800 hover:bg-gray-750 rounded-lg p-3 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{p.nombre}</span>
                                {p.verificado && (
                                  <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">
                                    verificado
                                  </span>
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
                      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Ingresos hospitalarios
                      </div>
                      <div className="space-y-2">
                        {match.hospitalizados.map((p) => (
                          <a
                            key={p.id}
                            href={p.ficha_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 bg-gray-800 hover:bg-gray-750 rounded-lg p-3 transition-colors"
                          >
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
