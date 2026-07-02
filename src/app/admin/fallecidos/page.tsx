import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/types'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function FallecidosPage() {
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
  if (!profile || !['admin', 'medical'].includes(profile.role)) redirect('/dashboard')

  const { data: fallecidos, count } = await admin
    .from('victims')
    .select(`
      id, name, physical_description, estimated_age, is_minor,
      found_location, notes, created_at, updated_at,
      current_location:locations(name, address)
    `, { count: 'exact' })
    .eq('status', 'deceased')
    .order('updated_at', { ascending: false })

  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count: ultimas24h } = await admin
    .from('victims')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'deceased')
    .gte('updated_at', since24h)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <Header profile={profile as Profile} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined" style={{ color: '#64748B', fontSize: '26px', fontVariationSettings: "'FILL' 1" }}>
                sentiment_sad
              </span>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Fallecidos registrados
              </h1>
            </div>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Víctimas con estado "Fallecido" confirmado por personal médico o de rescate
            </p>
          </div>
          {profile.role === 'admin' && (
            <a
              href="/api/admin/export?status=deceased"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110"
              style={{ background: '#1e2d4a', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>download</span>
              Exportar CSV
            </a>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl p-5 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
            <div className="text-4xl font-black tabular-nums mb-1" style={{ color: '#94A3B8' }}>
              {(count ?? 0).toLocaleString('es-VE')}
            </div>
            <div className="text-xs uppercase tracking-widest" style={{ color: '#475569' }}>Total registrados</div>
          </div>
          <div className="rounded-xl p-5 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
            <div className="text-4xl font-black tabular-nums mb-1" style={{ color: '#64748B' }}>
              {(ultimas24h ?? 0).toLocaleString('es-VE')}
            </div>
            <div className="text-xs uppercase tracking-widest" style={{ color: '#475569' }}>Últimas 24 horas</div>
          </div>
          <div className="col-span-2 md:col-span-1 rounded-xl p-5 text-center" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
            <Link href="/admin/analytics"
              className="flex flex-col items-center gap-1 transition-all hover:opacity-80">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>
                analytics
              </span>
              <div className="text-xs font-bold" style={{ color: '#D4A017' }}>Ver analytics completo →</div>
            </Link>
          </div>
        </div>

        {/* Lista */}
        {(!fallecidos || fallecidos.length === 0) ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl block mb-4" style={{ color: '#334155' }}>
              check_circle
            </span>
            <p className="font-medium" style={{ color: '#475569' }}>No hay fallecidos registrados</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fallecidos.map((v: any) => {
              const loc = Array.isArray(v.current_location) ? v.current_location[0] : v.current_location
              return (
                <div key={v.id} className="rounded-xl p-4"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
                  <div className="flex items-start gap-4">
                    {/* Icono */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#64748B', fontVariationSettings: "'FILL' 1" }}>
                        person
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm" style={{ color: '#F0F4FF' }}>
                          {v.is_minor ? '[Menor — datos protegidos]' : (v.name || 'Sin nombre registrado')}
                        </span>
                        {v.estimated_age && !v.is_minor && (
                          <span className="text-xs" style={{ color: '#475569' }}>{v.estimated_age} años</span>
                        )}
                      </div>
                      {!v.is_minor && v.physical_description && (
                        <p className="text-xs mb-1 line-clamp-2" style={{ color: '#64748B' }}>
                          {v.physical_description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#475569' }}>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                          {v.found_location}
                        </span>
                        {loc?.name && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>local_hospital</span>
                            {loc.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                          {fmtDate(v.updated_at)}
                        </span>
                      </div>
                      {!v.is_minor && v.notes && (
                        <p className="text-xs mt-2 italic" style={{ color: '#64748B' }}>
                          {v.notes}
                        </p>
                      )}
                    </div>

                    {/* Link */}
                    <Link href={`/victima/${v.id}`}
                      className="shrink-0 text-xs transition-all hover:opacity-70"
                      style={{ color: '#475569' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
