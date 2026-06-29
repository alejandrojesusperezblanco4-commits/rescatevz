import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS, type VictimStatus } from '@/lib/types'
import ActualizarVictimaForm from '@/components/ActualizarVictimaForm'

export default async function VictimaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // RLS decide si esta fila existe para este usuario: staff autorizado, o
  // un familiar con access_request aprobado y vigente para esta víctima.
  const canUpdate = ['admin', 'medical'].includes(profile.role)

  const { data: victim, error } = await supabase
    .from('victims')
    .select(`
      id, name, physical_description, is_minor, status, estimated_age,
      found_location, notes, photo_urls, current_location_id,
      current_location:locations(id, name, type, address, phone)
    `)
    .eq('id', id)
    .single()

  if (error || !victim) {
    redirect('/mis-solicitudes')
  }

  let photoUrls: string[] = []
  const paths = (victim.photo_urls || []) as string[]
  if (paths.length > 0) {
    const admin = createAdminClient()
    const signed = await Promise.all(
      paths.map(p => admin.storage.from('victim-photos').createSignedUrl(p, 300))
    )
    photoUrls = signed.map(s => s.data?.signedUrl).filter((u): u is string => Boolean(u))
  }

  const rawLocation = victim.current_location
  const location = (Array.isArray(rawLocation) ? rawLocation[0] : rawLocation) as
    { id: string; name: string; type: string; address: string | null; phone: string | null } | null

  let locations: { id: string; name: string; type: string }[] = []
  if (canUpdate) {
    const { data } = await supabase.from('locations').select('id, name, type').eq('is_active', true).order('type')
    locations = data || []
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          href={profile.role === 'family' ? '/mis-solicitudes' : '/victimas'}
          className="text-sm text-red-600 hover:underline"
        >
          ← {profile.role === 'family' ? 'Mis solicitudes' : 'Lista de víctimas'}
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">{victim.name || 'Persona sin nombre registrado'}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[victim.status as VictimStatus]}`}>
              {STATUS_LABELS[victim.status as VictimStatus]}
            </span>
          </div>

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {photoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="Foto de la víctima" className="rounded-lg object-cover w-full h-32" />
              ))}
            </div>
          )}

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Descripción física</dt>
              <dd className="text-gray-900">{victim.physical_description}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Encontrada en</dt>
              <dd className="text-gray-900">{victim.found_location}</dd>
            </div>
            {location && (
              <div>
                <dt className="text-gray-500">Ubicación actual</dt>
                <dd className="text-gray-900">
                  {location.name}
                  {location.address && <span className="text-gray-500"> — {location.address}</span>}
                  {location.phone && (
                    <a href={`tel:${location.phone}`} className="block text-blue-600 hover:underline mt-0.5">
                      📞 {location.phone}
                    </a>
                  )}
                </dd>
              </div>
            )}
            {victim.estimated_age && (
              <div>
                <dt className="text-gray-500">Edad estimada</dt>
                <dd className="text-gray-900">{victim.estimated_age} años</dd>
              </div>
            )}
            {victim.is_minor && (
              <div>
                <dt className="text-gray-500">Protección</dt>
                <dd><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Menor de edad</span></dd>
              </div>
            )}
            {victim.notes && (
              <div>
                <dt className="text-gray-500">Notas médicas</dt>
                <dd className="text-gray-900">{victim.notes}</dd>
              </div>
            )}
          </dl>

          {canUpdate && (
            <ActualizarVictimaForm
              victimId={victim.id}
              currentStatus={victim.status as VictimStatus}
              currentLocationId={victim.current_location_id}
              currentNotes={victim.notes}
              locations={locations}
              userId={user.id}
            />
          )}
        </div>
      </main>
    </div>
  )
}
