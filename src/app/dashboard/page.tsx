import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const [
    { count: total },
    { count: alive },
    { count: critical },
    { count: deceased },
    { count: minors },
    { count: pendingSolicitudes },
    { count: pendingStaff },
    { data: recentVictims },
    { data: locations },
  ] = await Promise.all([
    supabase.from('victims').select('*', { count: 'exact', head: true }),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'alive'),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'critical'),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'deceased'),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('is_minor', true),
    profile.role === 'admin'
      ? supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    profile.role === 'admin'
      ? supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['rescuer', 'medical']).eq('is_verified', false)
      : Promise.resolve({ count: 0 }),
    supabase.from('victims').select('id, name, status, is_minor, created_at').order('created_at', { ascending: false }).limit(6),
    supabase.from('locations').select('id, name, type, current_occupancy, capacity').eq('is_active', true).order('type').limit(6),
  ])

  const canRegister = profile.role === 'admin' || (profile.is_verified && ['rescuer', 'medical'].includes(profile.role))

  const statCards = [
    { label: 'TOTAL', value: total || 0, color: '#F0F4FF', borderClass: 'border-l-white' },
    { label: 'CON VIDA', value: alive || 0, color: '#22C55E', borderClass: 'border-l-green-500' },
    { label: 'CRÍTICO', value: critical || 0, color: '#DC2626', borderClass: 'border-l-red-600' },
    { label: 'FALLECIDOS', value: deceased || 0, color: '#94A3B8', borderClass: 'border-l-slate-400' },
    { label: 'MENORES', value: minors || 0, color: '#A855F7', borderClass: 'border-l-purple-500' },
  ]

  return (
    <div className="min-h-screen flex flex-col antialiased"
      style={{ background: '#1a2744', color: '#F0F4FF', fontFamily: "'Manrope', sans-serif" }}>

      {/* 1. Topbar alerta fija */}
      <div className="h-8 text-white flex items-center justify-center uppercase tracking-wider text-xs fixed top-0 w-full z-[60]"
        style={{ background: '#DC2626' }}>
        <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
        EMERGENCIA ACTIVA · Terremotos Venezuela · 24 jun 2026
      </div>

      {/* 2. Header / Navbar */}
      <header className="shadow-md flex justify-between items-center w-full px-8 h-16 fixed top-8 z-50 border-b"
        style={{ background: '#1e2d4a', borderColor: 'rgba(36,51,86,0.5)' }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center font-black text-xs shrink-0"
              style={{ background: '#D4A017', color: '#1a2744' }}>
              RV
            </div>
            <span className="font-bold text-base" style={{ color: '#F0F4FF' }}>RescateVZ</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
              style={{ background: 'rgba(212,160,23,0.15)', color: '#D4A017', borderColor: 'rgba(212,160,23,0.3)' }}>
              {profile.role === 'admin' ? 'Admin' : profile.role === 'rescuer' ? 'Rescatista' : profile.role === 'medical' ? 'Médico' : 'Familia'}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 h-full font-semibold text-sm">
            <Link href="/dashboard" className="border-b-2 h-16 flex items-center px-1"
              style={{ color: '#D4A017', borderColor: '#D4A017' }}>
              Dashboard
            </Link>
            {['rescuer', 'medical', 'admin'].includes(profile.role) && (
              <Link href="/victimas" className="h-16 flex items-center px-1 transition-colors hover:text-white"
                style={{ color: '#94A3B8' }}>Víctimas</Link>
            )}
            <Link href="/mapa-publico" className="h-16 flex items-center px-1 transition-colors hover:text-white"
              style={{ color: '#94A3B8' }}>Mapa</Link>
            {profile.role === 'admin' && (
              <>
                <Link href="/ubicaciones" className="h-16 flex items-center px-1 transition-colors hover:text-white"
                  style={{ color: '#94A3B8' }}>Ubicaciones</Link>
                <Link href="/solicitudes" className="h-16 flex items-center px-1 transition-colors hover:text-white"
                  style={{ color: '#94A3B8' }}>Solicitudes</Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <div className="text-sm font-semibold" style={{ color: '#F0F4FF' }}>{profile.full_name}</div>
              <div className="text-[11px]" style={{ color: '#94A3B8' }}>(Admin)</div>
            </div>
          </div>
          {canRegister && (
            <Link href="/victimas/nueva"
              className="px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 text-sm"
              style={{ background: '#D4A017', color: '#1a2744' }}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
              Registrar víctima
            </Link>
          )}
        </div>
      </header>

      {/* Main — pt-28 = top-8 (alert bar) + h-16 (header) */}
      <main className="flex-grow pt-28 px-4 md:px-8 pb-12 flex flex-col gap-6 w-full max-w-7xl mx-auto">

        {/* Verificación pendiente */}
        {!profile.is_verified && profile.role !== 'family' && (
          <div className="flex items-center gap-3 p-4 rounded-lg"
            style={{ background: 'rgba(212,160,23,0.10)', border: '1px solid rgba(212,160,23,0.20)' }}>
            <span className="material-symbols-outlined" style={{ color: '#D4A017' }}>schedule</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#D4A017' }}>Cuenta pendiente de verificación</p>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                Un administrador revisará tu solicitud como {profile.role === 'rescuer' ? 'rescatista' : 'personal médico'} pronto.
              </p>
            </div>
          </div>
        )}

        {/* 3. Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map(s => (
            <div key={s.label}
              className={`rounded-lg p-4 flex flex-col justify-between border-l-4 ${s.borderClass}`}
              style={{
                background: '#1e2d4a',
                border: '1px solid rgba(36,51,86,0.5)',
                borderLeftWidth: '4px',
                borderLeftColor: s.color,
                height: '120px',
              }}>
              <div className="text-[12px] font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                {s.label}
              </div>
              <div className="tabular-nums font-black" style={{ fontSize: '42px', lineHeight: 1.2, color: s.color }}>
                {s.value.toLocaleString('es-VE')}
              </div>
            </div>
          ))}
        </div>

        {/* 4. Alertas admin */}
        {profile.role === 'admin' && ((pendingSolicitudes || 0) > 0 || (pendingStaff || 0) > 0) && (
          <div className="flex flex-col sm:flex-row gap-4">
            {(pendingSolicitudes || 0) > 0 && (
              <Link href="/solicitudes" className="flex-1 rounded-lg p-3 flex items-center gap-3 text-sm transition-opacity hover:opacity-90"
                style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.20)', color: '#F0F4FF' }}>
                <span className="material-symbols-outlined" style={{ color: '#DC2626' }}>notifications</span>
                <span>
                  <strong>{pendingSolicitudes} solicitud{(pendingSolicitudes || 0) > 1 ? 'es' : ''} de acceso familiar</strong> pendiente{(pendingSolicitudes || 0) > 1 ? 's' : ''} de revisión.
                </span>
              </Link>
            )}
            {(pendingStaff || 0) > 0 && (
              <Link href="/verificacion" className="flex-1 rounded-lg p-3 flex items-center gap-3 text-sm transition-opacity hover:opacity-90"
                style={{ background: 'rgba(212,160,23,0.10)', border: '1px solid rgba(212,160,23,0.20)', color: '#F0F4FF' }}>
                <span className="material-symbols-outlined" style={{ color: '#D4A017' }}>person</span>
                <span>
                  <strong>{pendingStaff} rescatista{(pendingStaff || 0) > 1 ? 's' : ''}</strong> requieren verificación de acceso.
                </span>
              </Link>
            )}
          </div>
        )}

        {/* 5. Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimos registros */}
          <div className="rounded-lg flex flex-col"
            style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
            <div className="p-4 flex justify-between items-center"
              style={{ borderBottom: '1px solid rgba(36,51,86,0.5)' }}>
              <h2 className="font-semibold text-base" style={{ color: '#F0F4FF' }}>Últimos registros</h2>
              <Link href="/victimas" className="text-sm transition-colors hover:text-white"
                style={{ color: '#94A3B8' }}>Ver todos</Link>
            </div>
            <div className="p-2 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {!recentVictims || recentVictims.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#64748B' }}>No hay registros aún</p>
              ) : recentVictims.map(v => {
                const initials = v.name ? v.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '?'
                const mins = Math.round((Date.now() - new Date(v.created_at).getTime()) / 60000)
                const statusCfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
                  alive: { label: 'Con vida', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
                  critical: { label: 'Crítico', color: '#DC2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)' },
                  deceased: { label: 'Fallecido', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)' },
                  missing: { label: 'Desaparecido', color: '#D4A017', bg: 'rgba(212,160,23,0.15)', border: 'rgba(212,160,23,0.3)' },
                }
                const cfg = statusCfg[v.status] ?? statusCfg.missing
                return (
                  <Link key={v.id} href={`/victima/${v.id}`}
                    className="flex items-center justify-between p-3 rounded-md transition-colors"
                    style={{ borderBottom: '1px solid rgba(36,51,86,0.5)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: 'rgba(36,51,86,0.5)', color: '#F0F4FF' }}>
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: v.name ? '#F0F4FF' : '#64748B', fontStyle: v.name ? 'normal' : 'italic' }}>
                          {v.name || 'Sin nombre registrado'}
                        </div>
                        <div className="text-xs flex items-center gap-2" style={{ color: '#94A3B8' }}>
                          <span>Hace {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.is_minor && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)' }}>
                          Menor
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Hospitales y refugios */}
          <div className="rounded-lg flex flex-col"
            style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
            <div className="p-4 flex justify-between items-center"
              style={{ borderBottom: '1px solid rgba(36,51,86,0.5)' }}>
              <h2 className="font-semibold text-base" style={{ color: '#F0F4FF' }}>Hospitales y refugios activos</h2>
              <Link href="/mapa-publico" className="text-sm transition-colors hover:text-white"
                style={{ color: '#94A3B8' }}>Ver mapa</Link>
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {!locations || locations.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#64748B' }}>Sin ubicaciones activas</p>
              ) : locations.map(loc => {
                const pct = loc.capacity ? Math.round((loc.current_occupancy / loc.capacity) * 100) : null
                const barColor = pct === null ? '#D4A017' : pct > 90 ? '#DC2626' : pct > 70 ? '#D4A017' : '#22C55E'
                return (
                  <div key={loc.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm flex items-center gap-2" style={{ color: '#F0F4FF' }}>
                        <span className="material-symbols-outlined text-base" style={{ color: '#94A3B8' }}>
                          {loc.type === 'hospital' ? 'local_hospital' : 'cottage'}
                        </span>
                        {loc.name}
                      </span>
                      {pct !== null && (
                        <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{pct}%</span>
                      )}
                    </div>
                    {pct !== null && (
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#1a2744' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
