'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Match {
  victimId: string
  name: string | null
  status: string
  confianza: 'alta' | 'media'
  razon: string
}

interface Props {
  victimId: string
  hasPhotos: boolean
}

const STATUS_ES: Record<string, string> = {
  alive: 'Con vida',
  critical: 'Crítico/a',
  deceased: 'Fallecido/a',
  unknown: 'Desconocido',
}

export default function BiometricoPanel({ victimId, hasPhotos }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [totalCandidatos, setTotalCandidatos] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function comparar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/biometrico/comparar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victimId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setMatches(data.matches || [])
      setTotalCandidatos(data.totalCandidatos || 0)
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!hasPhotos) return null

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Matching biométrico IA</p>
          {!done && (
            <p className="text-xs text-gray-400 mt-0.5">
              Compara la foto contra otras víctimas registradas con fotos
            </p>
          )}
        </div>
        {!done && (
          <button
            onClick={comparar}
            disabled={loading}
            className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analizando…' : 'Buscar similares'}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          Comparando con {totalCandidatos || '…'} víctimas con foto…
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {done && (
        <div>
          {matches.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              Sin coincidencias biométricas entre {totalCandidatos} víctimas analizadas.
            </p>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <Link
                  key={m.victimId}
                  href={`/victima/${m.victimId}`}
                  className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {m.name || 'Sin nombre'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        m.confianza === 'alta'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {m.confianza === 'alta' ? 'Confianza alta' : 'Confianza media'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{STATUS_ES[m.status] || m.status}</p>
                    <p className="text-xs text-gray-400 mt-0.5 italic">{m.razon}</p>
                  </div>
                  <span className="text-xs text-indigo-500 shrink-0">Ver →</span>
                </Link>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Sugerencias generadas por IA — requieren revisión humana antes de cualquier acción.
            {totalCandidatos > 0 && ` Analizadas: ${totalCandidatos} víctimas.`}
          </p>

          <button onClick={() => { setDone(false); setMatches([]) }} className="text-xs text-indigo-600 hover:underline mt-1">
            Repetir análisis
          </button>
        </div>
      )}
    </div>
  )
}
