import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/types'
import Header from '@/components/Header'
import SaludAdminPanel from '@/components/SaludAdminPanel'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export default async function AdminSaludPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { data: riskSetting },
    { count: deceased },
    { count: deceased24h },
    { count: totalVictims },
  ] = await Promise.all([
    admin.from('app_settings').select('value').eq('key', 'epidemic_risk_level').maybeSingle(),
    admin.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'deceased'),
    admin.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'deceased')
      .gte('updated_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
    admin.from('victims').select('*', { count: 'exact', head: true }),
  ])

  const currentLevel = riskSetting?.value ?? 'alto'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <Header profile={profile as Profile} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined" style={{ color: '#EF4444', fontSize: '26px', fontVariationSettings: "'FILL' 1" }}>
            health_and_safety
          </span>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Panel de salud pública
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Control del nivel de riesgo epidemiológico y alertas sanitarias
            </p>
          </div>
        </div>

        {/* Stats fallecidos */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-4 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
            <div className="text-3xl font-black tabular-nums mb-0.5" style={{ color: '#64748B' }}>
              {(deceased ?? 0).toLocaleString('es-VE')}
            </div>
            <div className="text-xs" style={{ color: '#475569' }}>Fallecidos total</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
            <div className="text-3xl font-black tabular-nums mb-0.5" style={{ color: '#64748B' }}>
              {(deceased24h ?? 0).toLocaleString('es-VE')}
            </div>
            <div className="text-xs" style={{ color: '#475569' }}>Últ. 24 horas</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
            <div className="text-3xl font-black tabular-nums mb-0.5" style={{ color: '#94A3B8' }}>
              {totalVictims && totalVictims > 0
                ? `${Math.round(((deceased ?? 0) / totalVictims) * 100)}%`
                : '—'
              }
            </div>
            <div className="text-xs" style={{ color: '#475569' }}>Tasa de mortalidad</div>
          </div>
        </div>

        <SaludAdminPanel currentLevel={currentLevel} />
      </main>
    </div>
  )
}
