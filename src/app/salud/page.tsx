import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/lib/types'
import Header from '@/components/Header'
import Link from 'next/link'
import SaludRiesgoCard from '@/components/SaludRiesgoCard'
import { RIESGOS_EPIDEMICOS, RISK_LEVEL_META } from '@/data/riesgos-epidemicos'

export const revalidate = 60

export default async function SaludPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const admin = createAdminClient()

  const [
    { data: riskSetting },
    { count: deceased },
    { count: critical },
    { data: alertas },
    { data: centrosSalud },
  ] = await Promise.all([
    admin.from('app_settings').select('value').eq('key', 'epidemic_risk_level').maybeSingle(),
    admin.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'deceased'),
    admin.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'critical'),
    supabase.from('news_posts')
      .select('id, title, content, created_at')
      .eq('category', 'alerta')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('locations')
      .select('id, name, address, phone')
      .eq('type', 'hospital')
      .eq('is_active', true)
      .limit(10),
  ])

  const riskLevel = riskSetting?.value ?? 'alto'
  const riskMeta = RISK_LEVEL_META[riskLevel] ?? RISK_LEVEL_META.alto

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return 'hace menos de 1h'
    if (h < 24) return `hace ${h}h`
    return `hace ${Math.floor(h / 24)}d`
  }

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
            <Link href="/sismos" className="text-sm" style={{ color: '#94A3B8' }}>Sismos</Link>
            <Link href="/login" className="text-sm font-bold" style={{ color: '#D4A017' }}>Entrar</Link>
          </div>
        </header>
      )}

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="material-symbols-outlined" style={{ color: '#EF4444', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>
            health_and_safety
          </span>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Salud pública
            </h1>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Riesgos epidemiológicos post-terremoto · Venezuela 2026
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Link href="/admin/salud"
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: '#D4A017', color: '#1a2744' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
              Gestionar
            </Link>
          )}
        </div>

        {/* Banner nivel de riesgo */}
        <div className="rounded-xl p-5 mb-6"
          style={{ background: riskMeta.bg, border: `1px solid ${riskMeta.border}` }}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: riskMeta.color, fontVariationSettings: "'FILL' 1" }}>
              {riskMeta.icon}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: riskMeta.color, opacity: 0.8 }}>
                Nivel de riesgo epidemiológico
              </p>
              <p className="text-2xl font-black" style={{ color: riskMeta.color, fontFamily: 'Manrope, sans-serif' }}>
                {riskMeta.label}
              </p>
            </div>
          </div>
          <p className="text-sm mt-3" style={{ color: riskMeta.color, opacity: 0.85 }}>
            El riesgo de brotes epidémicos aumenta significativamente en las primeras semanas tras un terremoto.
            Extremar precauciones con agua, alimentos y heridas.
          </p>
        </div>

        {/* Stats contextuales */}
        {((deceased ?? 0) > 0 || (critical ?? 0) > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(deceased ?? 0) > 0 && (
              <div className="rounded-xl p-4 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
                <div className="text-3xl font-black tabular-nums mb-0.5" style={{ color: '#64748B' }}>
                  {(deceased ?? 0).toLocaleString('es-VE')}
                </div>
                <div className="text-xs" style={{ color: '#475569' }}>Fallecidos registrados</div>
              </div>
            )}
            {(critical ?? 0) > 0 && (
              <div className="rounded-xl p-4 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
                <div className="text-3xl font-black tabular-nums mb-0.5" style={{ color: '#F97316' }}>
                  {(critical ?? 0).toLocaleString('es-VE')}
                </div>
                <div className="text-xs" style={{ color: '#475569' }}>En estado crítico</div>
              </div>
            )}
          </div>
        )}

        {/* Alertas de salud admin */}
        {alertas && alertas.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#DC2626' }}>
              Alertas activas
            </p>
            <div className="flex flex-col gap-3">
              {alertas.map((a: any) => (
                <div key={a.id} className="rounded-xl p-4"
                  style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.25)' }}>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: '18px', color: '#DC2626', fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: '#FCA5A5' }}>{a.title}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#94A3B8' }}>{a.content}</p>
                      <p className="text-xs mt-2" style={{ color: '#475569' }}>{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Qué hacer si tienes síntomas */}
        <div className="rounded-xl p-5 mb-6"
          style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#F0F4FF' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>help</span>
            Si tienes síntomas
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { n: '1', text: 'Aléjate de otras personas para evitar contagios', icon: 'social_distance' },
              { n: '2', text: 'Busca atención médica en el centro de salud más cercano', icon: 'local_hospital' },
              { n: '3', text: 'Avisa al coordinador de tu refugio', icon: 'campaign' },
              { n: '4', text: 'Bebe agua tratada para mantenerte hidratado', icon: 'water_drop' },
              { n: '5', text: 'No te automediques — muchas enfermedades requieren antibióticos específicos', icon: 'medication' },
            ].map(({ n, text, icon }) => (
              <div key={n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)' }}>
                  <span className="text-xs font-black" style={{ color: '#D4A017' }}>{n}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748B', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enfermedades a vigilar */}
        <h2 className="font-bold mb-3" style={{ color: '#F0F4FF', fontFamily: 'Manrope, sans-serif' }}>
          Enfermedades a vigilar
        </h2>
        <div className="flex flex-col gap-3 mb-8">
          {RIESGOS_EPIDEMICOS.map(r => (
            <SaludRiesgoCard key={r.id} riesgo={r} />
          ))}
        </div>

        {/* Centros de salud */}
        {centrosSalud && centrosSalud.length > 0 && (
          <div>
            <h2 className="font-bold mb-3" style={{ color: '#F0F4FF', fontFamily: 'Manrope, sans-serif' }}>
              Centros de salud activos
            </h2>
            <div className="flex flex-col gap-2 mb-6">
              {centrosSalud.map((c: any) => (
                <div key={c.id} className="rounded-xl p-4 flex items-start gap-3"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
                  <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: '20px', color: '#3B82F6', fontVariationSettings: "'FILL' 1" }}>
                    local_hospital
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#F0F4FF' }}>{c.name}</p>
                    {c.address && <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{c.address}</p>}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="text-xs mt-1 inline-flex items-center gap-1 hover:underline" style={{ color: '#3B82F6' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>call</span>
                        {c.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/mapa-publico"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ background: '#162040', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>map</span>
              Ver todos en el mapa
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
