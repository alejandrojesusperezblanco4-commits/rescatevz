import { fetchSismosVenezuela } from '@/lib/usgs'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import Header from '@/components/Header'
import Link from 'next/link'
import SismosPushButton from '@/components/SismosPushButton'
import SismosAdminPanel from '@/components/SismosAdminPanel'

export const revalidate = 300

function magColor(mag: number) {
  if (mag >= 6.5) return { text: '#DC2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)' }
  if (mag >= 5.5) return { text: '#F97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)' }
  if (mag >= 4.5) return { text: '#D4A017', bg: 'rgba(212,160,23,0.15)', border: 'rgba(212,160,23,0.4)' }
  return { text: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.3)' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'hace un momento'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export default async function SismosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  let sismos: Awaited<ReturnType<typeof fetchSismosVenezuela>> = []
  let fetchError = false
  try {
    sismos = await fetchSismosVenezuela(4.0, 10)
  } catch {
    fetchError = true
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      {profile ? (
        <Header profile={profile as Profile} />
      ) : (
        <header className="px-6 py-3 flex items-center justify-between"
          style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="RescateVZ" className="w-7 h-7" />
            <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>RescateVZ</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/buscar" className="text-sm" style={{ color: '#94A3B8' }}>Buscar familiar</Link>
            <Link href="/login" className="text-sm font-bold" style={{ color: '#D4A017' }}>Entrar</Link>
          </div>
        </header>
      )}

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined" style={{ color: '#DC2626', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>
              sensors
            </span>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Actividad sísmica
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Sismos ≥ M4.0 en los últimos días · Radio 600 km alrededor de Caracas · Fuente: USGS
          </p>
        </div>

        {/* Push subscription */}
        <SismosPushButton />

        {/* Panel admin: notificar sismo */}
        {isAdmin && sismos.length > 0 && (
          <SismosAdminPanel sismo={sismos[0]} />
        )}

        {/* Error USGS */}
        {fetchError && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
            No se pudo contactar USGS. Intenta recargar la página.
          </div>
        )}

        {/* Lista de sismos */}
        {!fetchError && sismos.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl block mb-4" style={{ color: '#334155' }}>
              check_circle
            </span>
            <p className="font-medium" style={{ color: '#475569' }}>Sin sismos ≥ M4.0 recientes</p>
            <p className="text-sm mt-1" style={{ color: '#334155' }}>
              No se detectó actividad significativa en los últimos días.
            </p>
          </div>
        )}

        {sismos.length > 0 && (
          <div className="flex flex-col gap-3">
            {sismos.map((s, i) => {
              const c = magColor(s.magnitude)
              const isFirst = i === 0
              return (
                <div key={s.usgsId}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{
                    background: isFirst ? 'rgba(220,38,38,0.07)' : '#1e2d4a',
                    border: `1px solid ${isFirst ? 'rgba(220,38,38,0.3)' : 'rgba(36,51,86,0.6)'}`,
                  }}>
                  {/* Magnitud badge */}
                  <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: c.text, lineHeight: 1 }}>M</span>
                    <span className="text-xl font-black tabular-nums leading-none" style={{ color: c.text }}>
                      {s.magnitude.toFixed(1)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {isFirst && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(220,38,38,0.2)', color: '#FCA5A5' }}>
                          Más reciente
                        </span>
                      )}
                      <span className="text-xs" style={{ color: '#475569' }}>{timeAgo(s.occurredAt)}</span>
                      <span className="text-xs" style={{ color: '#334155' }}>· {s.depth.toFixed(0)} km prof.</span>
                    </div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: '#F0F4FF' }}>{s.place}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                      {s.lat.toFixed(3)}°N, {Math.abs(s.lng).toFixed(3)}°O
                    </p>
                  </div>

                  {/* Link USGS */}
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-xs flex items-center gap-1 transition-all hover:opacity-70"
                    style={{ color: '#475569' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* Escala de referencia */}
        <div className="mt-8 rounded-xl p-4" style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
            Escala de magnitud
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              { range: '≥ 6.5', label: 'Gran sismo — daños severos', color: '#DC2626' },
              { range: '5.5–6.4', label: 'Fuerte — posibles daños', color: '#F97316' },
              { range: '4.5–5.4', label: 'Moderado — sentido ampliamente', color: '#D4A017' },
              { range: '4.0–4.4', label: 'Ligero — sentido localmente', color: '#94A3B8' },
            ].map(({ range, label, color }) => (
              <div key={range} className="flex items-center gap-2 text-xs">
                <span className="font-bold w-16 tabular-nums shrink-0" style={{ color }}>{range}</span>
                <span style={{ color: '#64748B' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: '#334155' }}>
          Datos: USGS Earthquake Hazards Program · Actualizado cada 5 minutos
        </p>
      </main>
    </div>
  )
}
