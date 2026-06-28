'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AlertasResponse, SismoEvent } from '@/app/api/alertas-sismos/route'

const POLL_INTERVAL = 2 * 60 * 1000  // 2 minutos

function magColor(mag: number): { bg: string; text: string; ring: string; label: string } {
  if (mag >= 7.0) return { bg: 'bg-red-700',    text: 'text-white',      ring: 'ring-red-800',    label: 'MAYOR' }
  if (mag >= 6.0) return { bg: 'bg-red-500',    text: 'text-white',      ring: 'ring-red-600',    label: 'FUERTE' }
  if (mag >= 5.0) return { bg: 'bg-orange-500', text: 'text-white',      ring: 'ring-orange-600', label: 'MODERADO' }
  if (mag >= 4.5) return { bg: 'bg-yellow-400', text: 'text-yellow-900', ring: 'ring-yellow-500', label: 'LEVE' }
  return             { bg: 'bg-gray-200',    text: 'text-gray-700',   ring: 'ring-gray-300',   label: '' }
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days  > 0) return `hace ${days} día${days > 1 ? 's' : ''}`
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  if (mins  > 0) return `hace ${mins} min`
  return 'ahora mismo'
}

function MagBadge({ mag }: { mag: number }) {
  const c = magColor(mag)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      M {mag.toFixed(1)}
      {c.label && <span className="opacity-80 text-[10px]">· {c.label}</span>}
    </span>
  )
}

function TsunamiAlert() {
  return (
    <div className="flex items-center gap-3 bg-blue-700 text-white px-4 py-3 rounded-lg animate-pulse">
      <span className="text-2xl">🌊</span>
      <div>
        <p className="font-bold text-sm">ALERTA DE TSUNAMI ACTIVA</p>
        <p className="text-xs text-blue-200">
          Consulta el{' '}
          <a href="https://tsunami.gov" target="_blank" rel="noreferrer" className="underline font-medium">
            Centro de Alertas de Tsunami de NOAA (tsunami.gov)
          </a>
          {' '}para instrucciones oficiales de evacuación.
        </p>
      </div>
    </div>
  )
}

function EventRow({ ev }: { ev: SismoEvent }) {
  return (
    <a
      href={ev.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-shrink-0 pt-0.5">
        <MagBadge mag={ev.magnitude} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 font-medium leading-snug group-hover:text-red-700 transition-colors truncate">
          {ev.place}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {timeAgo(ev.time)} · Prof. {ev.depth} km
          {ev.tsunami && <span className="ml-2 text-blue-600 font-semibold">🌊 Alerta tsunami</span>}
        </p>
      </div>
      <span className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1 text-xs">→</span>
    </a>
  )
}

export default function AlertasSismos() {
  const [data, setData]         = useState<AlertasResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchAlertas = useCallback(async () => {
    try {
      const res  = await fetch('/api/alertas-sismos')
      const json = await res.json() as AlertasResponse
      setData(json)
      setLastUpdate(new Date())
      setError(false)
      // Auto-expandir si hay tsunami o sismo M6+
      if (json.hasTsunami || json.events.some(e => e.magnitude >= 6.0)) {
        setExpanded(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlertas()
    const id = setInterval(fetchAlertas, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAlertas])

  const topEvent    = data?.events?.[0] ?? null
  const eventCount  = data?.events?.length ?? 0
  const hasTsunami  = data?.hasTsunami ?? false

  return (
    <div className={`border-b ${hasTsunami ? 'bg-blue-900' : 'bg-gray-900'} text-white`}>
      {/* Header / resumen */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-base flex-shrink-0">
          {loading ? '⏳' : hasTsunami ? '🌊' : '🔔'}
        </span>

        <div className="flex-1 min-w-0">
          {loading && (
            <span className="text-xs text-gray-400">Consultando actividad sísmica (USGS)…</span>
          )}
          {!loading && error && (
            <span className="text-xs text-gray-400">No se pudo cargar la actividad sísmica. Reintentando…</span>
          )}
          {!loading && !error && eventCount === 0 && (
            <span className="text-xs text-gray-300">Sin sismos M4.5+ registrados en los últimos 7 días en el Caribe.</span>
          )}
          {!loading && !error && topEvent && (
            <span className="text-xs text-gray-200">
              <span className="font-semibold text-white">{eventCount} sismo{eventCount > 1 ? 's' : ''}</span>
              {' '}M4.5+ en el Caribe (7 días) ·{' '}
              Último: <span className="font-semibold text-white">M {topEvent.magnitude}</span>
              {' — '}{topEvent.place}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {lastUpdate && (
            <span className="text-[10px] text-gray-500 hidden sm:block">
              Act. {lastUpdate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-white/10 bg-white">
          <div className="max-w-3xl mx-auto p-4 space-y-3">

            {hasTsunami && <TsunamiAlert />}

            {eventCount > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Sismos M4.5+ · Venezuela y el Caribe · últimos 7 días
                </p>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {data!.events.map(ev => (
                    <EventRow key={ev.id} ev={ev} />
                  ))}
                </div>
              </div>
            )}

            {eventCount === 0 && !loading && (
              <p className="text-sm text-gray-500 text-center py-4">
                No se registran sismos M4.5+ en el área en los últimos 7 días.
              </p>
            )}

            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-1">
              <span>📡</span>
              Datos en tiempo real del{' '}
              <a
                href="https://earthquake.usgs.gov"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-gray-600"
              >
                USGS Earthquake Hazards Program
              </a>
              {' '}(Servicio Geológico de EE.UU.) · Actualiza cada 2 minutos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
