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

export default function SincronizacionPage() {
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

      <div className="rounded-lg p-5 mb-8" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="font-semibold mb-1" style={{ color: '#F0F4FF' }}>Venezuela Reporta</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              API pública con registros de personas buscadas, ingresos hospitalarios y sitios de atención.
              Lectura libre · Sin autenticación · Atribución obligatoria.
            </p>
          </div>
          <button
            onClick={runSync}
            disabled={loading}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: '#D4A017', color: '#1a2744' }}
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
