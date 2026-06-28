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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Stats
  const [victimasResult, solicitudesResult, locationesResult] = await Promise.all([
    supabase.from('victims').select('id, status, is_minor, created_at').order('created_at', { ascending: false }).limit(10),
    profile.role === 'admin'
      ? supabase.from('access_requests').select('id').eq('status', 'pending')
      : Promise.resolve({ data: [] }),
    supabase.from('locations').select('id, name, type, current_occupancy, capacity').eq('is_active', true).limit(5),
  ])

  const victims = victimasResult.data || []
  const pendingSolicitudes = solicitudesResult.data?.length || 0
  const locations = locationesResult.data || []

  const stats = {
    total: victims.length,
    alive: victims.filter(v => v.status === 'alive').length,
    critical: victims.filter(v => v.status === 'critical').length,
    deceased: victims.filter(v => v.status === 'deceased').length,
    minors: victims.filter(v => v.is_minor).length,
  }

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
                Mientras tanto, puedes buscar víctimas y ver el mapa.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Panel de control</h1>
          {(profile.role === 'admin' || (profile.is_verified && (profile.role === 'rescuer' || profile.role === 'medical'))) && (
            <Link href="/victimas/nueva" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Registrar víctima
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Registradas" value={stats.total} color="blue" />
          <StatCard label="Con vida" value={stats.alive} color="green" />
          <StatCard label="Estado crítico" value={stats.critical} color="orange" />
          <StatCard label="Fallecidos" value={stats.deceased} color="gray" />
        </div>

        {profile.role === 'admin' && pendingSolicitudes > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <span className="font-medium text-red-800">{pendingSolicitudes} solicitud{pendingSolicitudes > 1 ? 'es' : ''} de acceso pendiente{pendingSolicitudes > 1 ? 's' : ''}</span>
            </div>
            <Link href="/solicitudes" className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              Revisar
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Últimas víctimas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Últimos registros</h2>
              <Link href="/buscar" className="text-sm text-red-600 hover:underline">Ver todos</Link>
            </div>
            {victims.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay registros aún</p>
            ) : (
              <div className="space-y-3">
                {victims.slice(0, 6).map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      {v.is_minor && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Menor</span>}
                      <span className="text-sm text-gray-700">#{v.id.slice(0, 8)}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[v.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hospitales y refugios */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Hospitales y refugios activos</h2>
              <Link href="/mapa-publico" className="text-sm text-red-600 hover:underline">Ver mapa</Link>
            </div>
            {locations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Cargando ubicaciones…</p>
            ) : (
              <div className="space-y-3">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{loc.type === 'hospital' ? '🏥' : '🏕️'}</span>
                      <span className="text-sm text-gray-700 line-clamp-1">{loc.name}</span>
                    </div>
                    {loc.capacity && (
                      <span className="text-xs text-gray-400">
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
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-0.5 opacity-80">{label}</div>
    </div>
  )
}
