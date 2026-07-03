import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Profile } from '@/lib/types'
import Header from '@/components/Header'

export const revalidate = 120

const TYPE_LABELS: Record<string, string> = {
  hospital: 'Hospital',
  shelter: 'Refugio',
  rescue_zone: 'Centro de acopio',
}

const TYPE_ICON: Record<string, string> = {
  hospital: 'local_hospital',
  shelter: 'home',
  rescue_zone: 'inventory_2',
}

const URGENCY_CONFIG = {
  urgent: { label: 'URGENTE', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  normal: { label: 'Necesitan', color: '#D4A017', bg: 'rgba(212,160,23,0.10)', border: 'rgba(212,160,23,0.25)' },
  covered: { label: 'Cubierto', color: '#22C55E', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export default async function DonacionesPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const { data: locations } = await admin
    .from('locations')
    .select('id, name, type, address, phone, needs, needs_message, needs_urgency, needs_updated_at, current_occupancy, capacity, is_active')
    .eq('is_active', true)
    .not('needs', 'eq', '{}')
    .order('needs_urgency', { ascending: true }) // urgent primero
    .order('needs_updated_at', { ascending: false })

  const { data: allLocations } = await admin
    .from('locations')
    .select('id, name, type, address, phone, needs, needs_message, needs_urgency, needs_updated_at, current_occupancy, capacity, is_active')
    .eq('is_active', true)
    .order('type')

  const withNeeds = (locations || []).filter(l => l.needs?.length > 0)
  const urgent = withNeeds.filter(l => l.needs_urgency === 'urgent')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      {profile ? (
        <Header profile={profile as Profile} />
      ) : (
        <header className="px-6 py-3 flex items-center justify-between sticky top-0 z-50"
          style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="RescateVZ" className="w-7 h-7" />
            <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>RescateVZ</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/buscar" style={{ color: '#94A3B8' }}>Buscar familiar</Link>
            <Link href="/mapa-publico" style={{ color: '#94A3B8' }}>Mapa</Link>
            <Link href="/login" className="font-bold" style={{ color: '#D4A017' }}>Entrar</Link>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            ¿Qué necesitan los centros?
          </h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Los hospitales, refugios y centros de acopio publican aquí sus necesidades en tiempo real.
            Si puedes ayudar, contacta directamente al centro.
          </p>
        </div>

        {/* Urgentes */}
        {urgent.length > 0 && (
          <div className="rounded-xl p-4 mb-6"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined animate-pulse" style={{ color: '#EF4444', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <p className="text-sm font-bold uppercase tracking-wide" style={{ color: '#FCA5A5' }}>
                {urgent.length} centro{urgent.length > 1 ? 's' : ''} con necesidades urgentes
              </p>
            </div>
            <div className="space-y-2">
              {urgent.map(loc => (
                <div key={loc.id} className="flex items-center gap-3 text-sm">
                  <span className="font-semibold" style={{ color: '#F0F4FF' }}>{loc.name}</span>
                  <span style={{ color: '#64748B' }}>—</span>
                  <span style={{ color: '#FCA5A5' }}>{loc.needs?.join(', ')}</span>
                  {loc.phone && (
                    <a href={`tel:${loc.phone}`} className="ml-auto flex items-center gap-1 font-semibold hover:underline"
                      style={{ color: '#EF4444' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>phone</span>
                      {loc.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Todos con necesidades */}
        {withNeeds.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#475569' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>
              volunteer_activism
            </span>
            <p className="font-medium">Aún no hay necesidades publicadas.</p>
            <p className="text-sm mt-1">Los coordinadores de cada centro publicarán aquí sus requerimientos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withNeeds.map(loc => {
              const urg = URGENCY_CONFIG[loc.needs_urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.normal
              const pct = loc.capacity ? Math.round((loc.current_occupancy / loc.capacity) * 100) : null
              return (
                <div key={loc.id} className="rounded-2xl p-5"
                  style={{ background: '#1e2d4a', border: `1px solid ${urg.border}` }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${urg.color}18`, border: `1px solid ${urg.color}35` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: urg.color, fontVariationSettings: "'FILL' 1" }}>
                          {TYPE_ICON[loc.type] ?? 'location_on'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>{loc.name}</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                          {TYPE_LABELS[loc.type] ?? loc.type}
                          {loc.address ? ` · ${loc.address}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: urg.bg, color: urg.color, border: `1px solid ${urg.border}` }}>
                      {urg.label}
                    </span>
                  </div>

                  {/* Necesidades */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(loc.needs || []).map((n: string) => (
                      <span key={n} className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ background: `${urg.color}12`, color: urg.color, border: `1px solid ${urg.color}30` }}>
                        {n}
                      </span>
                    ))}
                  </div>

                  {loc.needs_message && (
                    <p className="text-sm mb-3 leading-relaxed" style={{ color: '#94A3B8' }}>
                      {loc.needs_message}
                    </p>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      {pct !== null && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(36,51,86,0.5)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${Math.min(pct, 100)}%`, background: pct > 90 ? '#EF4444' : pct > 70 ? '#D4A017' : '#22C55E' }} />
                          </div>
                          <span className="text-xs" style={{ color: '#64748B' }}>{loc.current_occupancy}/{loc.capacity} personas</span>
                        </div>
                      )}
                      {loc.needs_updated_at && (
                        <span className="text-xs" style={{ color: '#475569' }}>
                          Actualizado {timeAgo(loc.needs_updated_at)}
                        </span>
                      )}
                    </div>

                    {loc.phone && (
                      <a href={`tel:${loc.phone}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                        style={{ background: urg.bg, color: urg.color, border: `1px solid ${urg.border}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>phone</span>
                        Contactar
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Link al mapa */}
        <div className="mt-8 text-center">
          <Link href="/mapa-publico"
            className="inline-flex items-center gap-2 text-sm hover:underline"
            style={{ color: '#D4A017' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>map</span>
            Ver todos los centros en el mapa
          </Link>
        </div>
      </main>
    </div>
  )
}
