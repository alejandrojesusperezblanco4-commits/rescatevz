import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Conteos reales de toda la DB en paralelo
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {!profile.is_verified && profile.role !== 'family' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-medium text-amber-800">Cuenta pendiente de verificación</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Un administrador revisará tu solicitud como {profile.role === 'rescuer' ? 'rescatista' : 'personal médico'} pronto.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
          {(profile.role === 'admin' || (profile.is_verified && ['rescuer', 'medical'].includes(profile.role))) && (
            <Link href="/victimas/nueva" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Registrar víctima
            </Link>
          )}
        </div>

        {/* Stats totales reales */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total registradas" value={total || 0} color="blue" />
          <StatCard label="Con vida" value={alive || 0} color="green" />
          <StatCard label="Estado crítico" value={critical || 0} color="orange" />
          <StatCard label="Fallecidos" value={deceased || 0} color="gray" />
          <StatCard label="Menores" value={minors || 0} color="purple" />
        </div>

        {/* Alertas admin */}
        {profile.role === 'admin' && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {(pendingSolicitudes || 0) > 0 && (
              <AlertCard
                icon="🔔"
                text={`${pendingSolicitudes} solicitud${pendingSolicitudes! > 1 ? 'es' : ''} de acceso familiar pendiente${pendingSolicitudes! > 1 ? 's' : ''}`}
                href="/solicitudes"
                label="Revisar"
                color="red"
              />
            )}
            {(pendingStaff || 0) > 0 && (
              <AlertCard
                icon="👤"
                text={`${pendingStaff} rescatista${pendingStaff! > 1 ? 's' : ''} pendiente${pendingStaff! > 1 ? 's' : ''} de verificación`}
                href="/verificacion"
                label="Verificar"
                color="amber"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimas víctimas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Últimos registros</h2>
                <p className="text-xs text-gray-400 mt-0.5">{total || 0} víctimas en total</p>
              </div>
              <Link href="/victimas" className="text-sm text-red-600 hover:underline">Ver todos</Link>
            </div>
            {!recentVictims || recentVictims.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay registros aún</p>
            ) : (
              <div className="space-y-2">
                {recentVictims.map(v => (
                  <Link
                    key={v.id}
                    href={`/victima/${v.id}`}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {v.is_minor && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium shrink-0">Menor</span>}
                      <span className="text-sm text-gray-700 truncate">{v.name || <span className="text-gray-400 italic">Sin nombre</span>}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${STATUS_COLORS[v.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[v.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Hospitales y refugios */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Hospitales y refugios</h2>
              <div className="flex gap-3">
                {profile.role === 'admin' && (
                  <Link href="/ubicaciones" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">Gestionar</Link>
                )}
                <Link href="/mapa-publico" className="text-sm text-red-600 hover:underline">Ver mapa</Link>
              </div>
            </div>
            {!locations || locations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin ubicaciones activas</p>
            ) : (
              <div className="space-y-2">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{loc.type === 'hospital' ? '🏥' : '🏕️'}</span>
                      <span className="text-sm text-gray-700 truncate">{loc.name}</span>
                    </div>
                    {loc.capacity && (
                      <span className={`text-xs shrink-0 ml-2 font-medium ${
                        (loc.current_occupancy / loc.capacity) > 0.9 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {loc.current_occupancy}/{loc.capacity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value.toLocaleString('es-VE')}</div>
      <div className="text-xs mt-0.5 opacity-80 leading-tight">{label}</div>
    </div>
  )
}

function AlertCard({ icon, text, href, label, color }: {
  icon: string; text: string; href: string; label: string; color: 'red' | 'amber'
}) {
  const cls = color === 'red'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800'
  const btnCls = color === 'red'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-amber-500 hover:bg-amber-600'
  return (
    <div className={`flex-1 border rounded-xl p-4 flex items-center justify-between gap-4 ${cls}`}>
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-sm font-medium">{text}</span>
      </div>
      <Link href={href} className={`text-xs text-white px-3 py-1.5 rounded-lg shrink-0 transition-colors ${btnCls}`}>
        {label}
      </Link>
    </div>
  )
}
