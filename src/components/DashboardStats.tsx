'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Counts {
  total: number
  alive: number
  critical: number
  deceased: number
  minors: number
}

const STAT_CONFIG = [
  { key: 'total',    label: 'TOTAL',      color: '#F0F4FF', icon: 'group',       accent: '#F0F4FF' },
  { key: 'alive',    label: 'CON VIDA',   color: '#22C55E', icon: 'favorite',    accent: '#22C55E' },
  { key: 'critical', label: 'CRÍTICO',    color: '#DC2626', icon: 'emergency',   accent: '#DC2626' },
  { key: 'deceased', label: 'FALLECIDOS', color: '#94A3B8', icon: 'do_not_disturb_on', accent: '#94A3B8' },
  { key: 'minors',   label: 'MENORES',   color: '#A855F7', icon: 'child_care',  accent: '#A855F7' },
] as const

export default function DashboardStats({ initial }: { initial: Counts }) {
  const [counts, setCounts] = useState<Counts>(initial)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function refetch() {
      const [
        { count: total },
        { count: alive },
        { count: critical },
        { count: deceased },
        { count: minors },
      ] = await Promise.all([
        supabase.from('victims').select('*', { count: 'exact', head: true }),
        supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'alive'),
        supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'critical'),
        supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'deceased'),
        supabase.from('victims').select('*', { count: 'exact', head: true }).eq('is_minor', true),
      ])
      setCounts({ total: total ?? 0, alive: alive ?? 0, critical: critical ?? 0, deceased: deceased ?? 0, minors: minors ?? 0 })
    }

    const channel = supabase
      .channel('dashboard-victims')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'victims' }, () => {
        refetch()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setLive(true)
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: live ? '#22C55E' : '#475569', animation: live ? 'pulse 2s infinite' : 'none' }}
          />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: live ? '#22C55E' : '#475569' }}>
            {live ? 'En vivo' : 'Conectando…'}
          </span>
        </div>
        <span className="text-xs" style={{ color: '#475569' }}>Resumen de situación</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CONFIG.map(({ key, label, icon, accent }) => {
          const value = counts[key]
          return (
            <div key={key} className="rounded-xl p-4 transition-all hover:brightness-105"
              style={{
                background: '#1e2d4a',
                borderLeft: `3px solid ${accent}`,
                border: `1px solid rgba(36,51,86,0.5)`,
                borderLeftWidth: '3px',
                borderLeftColor: accent,
              }}>
              <span className="material-symbols-outlined mb-2 block"
                style={{ fontSize: '20px', color: accent, fontVariationSettings: "'FILL' 1" }}>
                {icon}
              </span>
              <p className="text-2xl font-black tabular-nums" style={{ color: accent, fontFamily: 'Manrope, sans-serif' }}>
                {value.toLocaleString('es-VE')}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#64748B' }}>
                {label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
