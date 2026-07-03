import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import VictimasFilters from '@/components/VictimasFilters'

const PAGE_SIZE = 25

interface SearchParams {
  estado?: string
  ubicacion?: string
  menor?: string
  q?: string
  pagina?: string
}

export default async function VictimasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['admin', 'rescuer', 'medical'].includes(profile.role)) redirect('/dashboard')

  const params = await searchParams
  const estado = params.estado || ''
  const ubicacionId = params.ubicacion || ''
  const soloMenores = params.menor === 'true'
  const q = params.q || ''
  const pagina = Math.max(1, parseInt(params.pagina || '1'))
  const offset = (pagina - 1) * PAGE_SIZE

  // Build query
  let query = supabase
    .from('victims')
    .select(`
      id, name, physical_description, estimated_age, is_minor,
      status, found_location, photo_urls, created_at,
      current_location:locations(id, name, type)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (estado) query = query.eq('status', estado)
  if (ubicacionId) query = query.eq('current_location_id', ubicacionId)
  if (soloMenores) query = query.eq('is_minor', true)
  if (q.trim().length >= 2) query = query.or(`name.ilike.%${q}%,physical_description.ilike.%${q}%,found_location.ilike.%${q}%`)

  // Rescuers can't see minors
  if (profile.role === 'rescuer') query = query.eq('is_minor', false)

  const { data: victims, count } = await query

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, type')
    .eq('is_active', true)
    .order('type')

  const totalPaginas = Math.ceil((count || 0) / PAGE_SIZE)

  // Stats para los filtros activos
  const stats = {
    alive: (victims || []).filter(v => v.status === 'alive').length,
    critical: (victims || []).filter(v => v.status === 'critical').length,
    deceased: (victims || []).filter(v => v.status === 'deceased').length,
    unknown: (victims || []).filter(v => v.status === 'unknown').length,
    minors: (victims || []).filter(v => v.is_minor).length,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
              Víctimas registradas
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
              {count !== null ? `${count} registro${count !== 1 ? 's' : ''}` : ''}
              {estado || ubicacionId || soloMenores || q ? ' — con filtros activos' : ' en total'}
            </p>
          </div>
          {(profile.role === 'admin' || (profile.is_verified && profile.role !== 'family')) && (
            <Link href="/victimas/nueva"
              className="flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-lg transition-all hover:brightness-110"
              style={{ background: '#D4A017', color: '#1a2744' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>add</span>
              Registrar víctima
            </Link>
          )}
        </div>

        {/* Filtros */}
        <VictimasFilters
          locations={(locations || []) as { id: string; name: string; type: string }[]}
          currentEstado={estado}
          currentUbicacion={ubicacionId}
          currentMenor={soloMenores}
          currentQ={q}
          canSeeMenors={profile.role !== 'rescuer'}
        />

        {/* Mini stats de la vista actual */}
        {(victims?.length ?? 0) > 0 && (
          <div className="flex gap-3 flex-wrap mb-5">
            {stats.alive > 0 && <StatBadge label="Con vida" value={stats.alive} color="green" />}
            {stats.critical > 0 && <StatBadge label="Crítico" value={stats.critical} color="orange" />}
            {stats.deceased > 0 && <StatBadge label="Fallecido" value={stats.deceased} color="gray" />}
            {stats.unknown > 0 && <StatBadge label="Desconocido" value={stats.unknown} color="yellow" />}
            {stats.minors > 0 && profile.role !== 'rescuer' && <StatBadge label="Menores" value={stats.minors} color="purple" />}
          </div>
        )}

        {/* Lista */}
        {!victims || victims.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium text-gray-600">No hay víctimas con esos filtros</p>
            <Link href="/victimas" className="text-sm text-red-600 hover:underline mt-2 inline-block">
              Limpiar filtros
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {victims.map((v: any) => (
                <Link
                  key={v.id}
                  href={`/victima/${v.id}`}
                  className="flex items-center gap-4 bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-colors group"
                >
                  {/* Foto miniatura o placeholder */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {v.photo_urls?.length > 0 ? (
                      <span className="text-xl">📷</span>
                    ) : (
                      <span className="text-xl">{v.is_minor ? '👶' : '👤'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                        {v.name || <span className="text-gray-400 italic">Sin nombre</span>}
                      </span>
                      {v.is_minor && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Menor</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_LABELS[v.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{v.physical_description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {v.current_location && (
                        <span className="text-xs text-gray-400">
                          {v.current_location.type === 'hospital' ? '🏥' : '🏕️'} {v.current_location.name}
                        </span>
                      )}
                      {v.estimated_age && (
                        <span className="text-xs text-gray-400">~{v.estimated_age} años</span>
                      )}
                      <span className="text-xs text-gray-300">
                        {new Date(v.created_at).toLocaleDateString('es-VE')}
                      </span>
                    </div>
                  </div>

                  <span className="text-gray-300 group-hover:text-gray-500 text-xl shrink-0">›</span>
                </Link>
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2">
                {pagina > 1 && (
                  <PaginaLink params={params} pagina={pagina - 1} label="← Anterior" />
                )}
                <span className="text-sm text-gray-500">
                  Página {pagina} de {totalPaginas}
                </span>
                {pagina < totalPaginas && (
                  <PaginaLink params={params} pagina={pagina + 1} label="Siguiente →" />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[color]}`}>
      {value} {label}
    </span>
  )
}

function PaginaLink({ params, pagina, label }: { params: SearchParams; pagina: number; label: string }) {
  const qs = new URLSearchParams({
    ...(params.estado ? { estado: params.estado } : {}),
    ...(params.ubicacion ? { ubicacion: params.ubicacion } : {}),
    ...(params.menor ? { menor: params.menor } : {}),
    ...(params.q ? { q: params.q } : {}),
    pagina: String(pagina),
  }).toString()
  return (
    <Link href={`/victimas?${qs}`} className="text-sm text-red-600 hover:underline font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
      {label}
    </Link>
  )
}
