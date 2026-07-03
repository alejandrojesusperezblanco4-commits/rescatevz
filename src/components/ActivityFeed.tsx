'use client'

import { useEffect, useState } from 'react'

interface Evento {
  location: string
  count: number
  at: string
  hasCritical: boolean
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora mismo'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export default function ActivityFeed() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [live, setLive] = useState(false)

  async function fetchActividad() {
    try {
      const res = await fetch('/api/public/actividad', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setEventos(data.eventos || [])
      setLive(true)
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    fetchActividad()
    const interval = setInterval(fetchActividad, 45_000)
    return () => clearInterval(interval)
  }, [])

  if (eventos.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>
          Actividad en tiempo real
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
        <div className="divide-y" style={{ borderColor: 'rgba(36,51,86,0.4)' }}>
          {eventos.slice(0, 6).map((e, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span
                className="material-symbols-outlined shrink-0"
                style={{
                  fontSize: '18px',
                  color: e.hasCritical ? '#DC2626' : '#22C55E',
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                {e.hasCritical ? 'emergency' : 'person_add'}
              </span>
              <p className="flex-1 text-sm" style={{ color: '#d0d8f0' }}>
                <span className="font-semibold">{e.count} persona{e.count !== 1 ? 's' : ''}</span>
                {' '}registrada{e.count !== 1 ? 's' : ''} en{' '}
                <span style={{ color: '#F0F4FF' }}>{e.location}</span>
              </p>
              <span className="text-xs shrink-0 tabular-nums" style={{ color: '#475569' }}>
                {timeAgo(e.at)}
              </span>
            </div>
          ))}
        </div>
        {live && (
          <div className="px-4 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid rgba(36,51,86,0.4)', background: 'rgba(15,26,46,0.5)' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
            <span className="text-xs" style={{ color: '#475569' }}>Actualizando cada 45 segundos</span>
          </div>
        )}
      </div>
    </section>
  )
}
