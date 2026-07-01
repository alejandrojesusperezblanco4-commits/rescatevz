'use client'

import { useEffect, useState } from 'react'

interface DayPoint { date: string; count: number }
interface Analytics {
  registrosPorDia: DayPoint[]
  solicitudesPorDia: DayPoint[]
  statusDistribution: Record<string, number>
  topLocations: { name: string; count: number }[]
  totals: { victims: number; requests: number; approved: number }
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  alive:    { label: 'Con vida',    color: '#22C55E' },
  critical: { label: 'Crítico',     color: '#DC2626' },
  deceased: { label: 'Fallecido',   color: '#94A3B8' },
  unknown:  { label: 'Desconocido', color: '#D4A017' },
}

function BarChart({ data, color, label }: { data: DayPoint[]; color: string; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#64748B' }}>{label}</p>
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums"
              style={{ color }}>
              {d.count || ''}
            </span>
            <div className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)}%`,
                background: d.count > 0 ? color : 'rgba(36,51,86,0.4)',
                minHeight: d.count > 0 ? '4px' : '2px',
              }} />
            {i % 2 === 0 && (
              <span className="text-[8px] tabular-nums" style={{ color: '#475569' }}>
                {d.date.slice(5)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPanel() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: '#D4A017' }}>progress_activity</span>
    </div>
  )

  if (!data) return (
    <div className="text-center py-16" style={{ color: '#64748B' }}>Error cargando analytics.</div>
  )

  const totalVictimas = data.totals.victims
  const statusEntries = Object.entries(data.statusDistribution)

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total registros', value: totalVictimas, icon: 'group', color: '#D4A017' },
          { label: 'Con vida', value: data.statusDistribution.alive || 0, icon: 'favorite', color: '#22C55E' },
          { label: 'Solicitudes familias', value: data.totals.requests, icon: 'pending_actions', color: '#3B82F6' },
          { label: 'Familias conectadas', value: data.totals.approved, icon: 'family_restroom', color: '#A855F7' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)', borderLeft: `3px solid ${k.color}` }}>
            <span className="material-symbols-outlined mb-2 block" style={{ fontSize: '20px', color: k.color, fontVariationSettings: "'FILL' 1" }}>{k.icon}</span>
            <p className="text-2xl font-black tabular-nums" style={{ color: k.color, fontFamily: 'Manrope, sans-serif' }}>
              {k.value.toLocaleString('es-VE')}
            </p>
            <p className="text-xs mt-0.5 uppercase tracking-wide" style={{ color: '#64748B' }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Gráficos de líneas de tiempo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <BarChart data={data.registrosPorDia} color="#D4A017" label="Registros por día" />
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <BarChart data={data.solicitudesPorDia} color="#3B82F6" label="Solicitudes de familiares por día" />
        </div>
      </div>

      {/* Status distribution + Top ubicaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Distribución por estado */}
        <div className="rounded-2xl p-5" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#64748B' }}>
            Distribución por estado
          </p>
          {statusEntries.length === 0 ? (
            <p className="text-sm" style={{ color: '#64748B' }}>Sin datos</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const cfg = STATUS_CFG[status] ?? { label: status, color: '#64748B' }
                const pct = totalVictimas > 0 ? Math.round((count / totalVictimas) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      <span style={{ color: '#64748B' }}>{count.toLocaleString('es-VE')} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(36,51,86,0.5)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top ubicaciones */}
        <div className="rounded-2xl p-5" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#64748B' }}>
            Principales zonas de hallazgo
          </p>
          {data.topLocations.length === 0 ? (
            <p className="text-sm" style={{ color: '#64748B' }}>Sin datos</p>
          ) : (
            <div className="space-y-3">
              {data.topLocations.map((loc, i) => {
                const maxCount = data.topLocations[0].count
                const pct = Math.round((loc.count / maxCount) * 100)
                return (
                  <div key={loc.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate pr-2" style={{ color: '#F0F4FF' }}>
                        <span className="tabular-nums mr-1.5" style={{ color: '#475569' }}>#{i + 1}</span>
                        {loc.name}
                      </span>
                      <span className="shrink-0" style={{ color: '#D4A017', fontWeight: 600 }}>
                        {loc.count.toLocaleString('es-VE')}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,51,86,0.5)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `rgba(212,160,23,${0.4 + (pct / 100) * 0.6})` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
