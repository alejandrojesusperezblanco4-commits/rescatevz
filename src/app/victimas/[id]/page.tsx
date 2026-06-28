import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import type { Profile, VictimStatus } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import StatusUpdater from './StatusUpdater'

export default async function VictimaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const canEdit = profile.role === 'admin' || (profile.role === 'medical' && profile.is_verified)
    || (profile.role === 'rescuer' && profile.is_verified)

  const { data: victim } = await supabase
    .from('victims')
    .select(`
      id, name, cedula, partida_nacimiento, tutor_cedula, physical_description,
      estimated_age, is_minor, status, found_location, photo_urls, notes,
      reporter_name, reporter_email, reporter_phone, created_at, updated_at,
      current_location_id,
      locations(name, type, address)
    `)
    .eq('id', id)
    .single()

  if (!victim) notFound()

  const { data: statusLog } = await supabase
    .from('victim_status_log')
    .select('old_status, new_status, created_at, profiles(full_name)')
    .eq('victim_id', id)
    .order('created_at', { ascending: false })

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, type')
    .in('type', ['hospital', 'shelter', 'collapsed_building'])
    .eq('is_active', true)

  const location = (victim as any).locations
  const hasReporter = !!(victim.reporter_email || victim.reporter_phone)

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Panel</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Víctima #{id.slice(0, 8).toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-4">

            {/* Estado actual + editor */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Estado</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[victim.status as VictimStatus]}`}>
                  {STATUS_LABELS[victim.status as VictimStatus]}
                </span>
              </div>

              {canEdit ? (
                <StatusUpdater
                  victimId={victim.id}
                  currentStatus={victim.status as VictimStatus}
                  currentLocationId={victim.current_location_id ?? ''}
                  hasReporterEmail={!!victim.reporter_email}
                  locations={locations ?? []}
                />
              ) : (
                <p className="text-sm text-gray-500">Solo personal médico y administradores pueden actualizar el estado.</p>
              )}
            </div>

            {/* Datos de la persona */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Datos de la persona</h2>
              <dl className="space-y-2.5 text-sm">
                <Row label="Nombre" value={victim.name ?? '(sin nombre registrado)'} />
                <Row label="Edad estimada" value={victim.estimated_age ? `${victim.estimated_age} años` : '—'} />
                <Row label="Es menor de edad" value={victim.is_minor ? 'Sí — protección especial activa' : 'No'} />
                {victim.cedula && <Row label="Cédula" value={victim.cedula} />}
                {victim.partida_nacimiento && <Row label="Partida de nacimiento" value={victim.partida_nacimiento} />}
                {victim.tutor_cedula && <Row label="Cédula del tutor" value={victim.tutor_cedula} />}
                <Row label="Descripción física" value={victim.physical_description} />
                <Row label="Encontrado/a en" value={victim.found_location} />
                {location && <Row label="Ubicación actual" value={`${location.name}${location.address ? ` · ${location.address}` : ''}`} />}
                {victim.notes && <Row label="Notas" value={victim.notes} />}
              </dl>
            </div>

            {/* Fotos */}
            {victim.photo_urls && victim.photo_urls.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Fotos ({victim.photo_urls.length})</h2>
                <div className="grid grid-cols-3 gap-2">
                  {victim.photo_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-4">

            {/* Reportante */}
            {hasReporter ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Quien reportó</h2>
                <dl className="space-y-2 text-sm">
                  {victim.reporter_name && <Row label="Nombre" value={victim.reporter_name} />}
                  {victim.reporter_email && (
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Correo</dt>
                      <dd>
                        <a href={`mailto:${victim.reporter_email}`} className="text-red-600 hover:underline text-sm">
                          {victim.reporter_email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {victim.reporter_phone && (
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Teléfono</dt>
                      <dd>
                        <a href={`tel:${victim.reporter_phone}`} className="text-red-600 hover:underline text-sm">
                          {victim.reporter_phone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Enlace de seguimiento público:</p>
                  <a
                    href={`/seguimiento/${victim.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all"
                  >
                    /seguimiento/{victim.id.slice(0, 8)}…
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-400 text-center">
                Sin datos de contacto del reportante
              </div>
            )}

            {/* Historial de estados */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Historial de estados</h2>
              {(!statusLog || statusLog.length === 0) ? (
                <p className="text-sm text-gray-400">Sin cambios de estado registrados.</p>
              ) : (
                <div className="space-y-3">
                  {statusLog.map((entry, i) => (
                    <div key={i} className="text-xs border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[entry.old_status as VictimStatus] ?? ''}`}>
                          {STATUS_LABELS[entry.old_status as VictimStatus] ?? entry.old_status ?? '?'}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={`px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[entry.new_status as VictimStatus] ?? ''}`}>
                          {STATUS_LABELS[entry.new_status as VictimStatus] ?? entry.new_status}
                        </span>
                      </div>
                      <p className="text-gray-400">
                        {new Date(entry.created_at as string).toLocaleString('es-VE')}
                        {(entry as any).profiles?.full_name && ` · ${(entry as any).profiles.full_name}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="text-xs text-gray-400 space-y-1 px-1">
              <p>Registrado: {new Date(victim.created_at as string).toLocaleString('es-VE')}</p>
              <p>Actualizado: {new Date(victim.updated_at as string).toLocaleString('es-VE')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  )
}
