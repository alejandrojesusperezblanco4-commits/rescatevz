import { redirect } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Header from '@/components/Header'
import type { Profile } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS, type VictimStatus } from '@/lib/types'
import ActualizarVictimaForm from '@/components/ActualizarVictimaForm'
import VictimaCompartir from '@/components/VictimaCompartir'
import BiometricoPanel from '@/components/BiometricoPanel'

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

  const victimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/victima/${id}`
  const qrDataUrl = await QRCode.toDataURL(victimUrl, { width: 200, margin: 2, color: { dark: '#1a2744', light: '#ffffff' } })

  const isStaff = ['admin', 'rescuer', 'medical'].includes(profile.role)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      <Header profile={profile as Profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          href={profile.role === 'family' ? '/mis-solicitudes' : '/victimas'}
          className="text-sm transition-colors hover:text-white"
          style={{ color: '#D4A017' }}
        >
          ← {profile.role === 'family' ? 'Mis solicitudes' : 'Lista de víctimas'}
        </Link>

        <div className="rounded-xl p-6 mt-4" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
              {victim.name || 'Persona sin nombre registrado'}
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[victim.status as VictimStatus]}`}>
              {STATUS_LABELS[victim.status as VictimStatus]}
            </span>
          </div>

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {photoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="Foto de la víctima" className="rounded-lg object-cover w-full h-32" />
              ))}
            </div>
          )}

          <dl className="space-y-4 text-sm" style={{ borderTop: '1px solid rgba(36,51,86,0.5)', paddingTop: '1.25rem' }}>
            <div>
              <dt className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#64748B' }}>Descripción física</dt>
              <dd style={{ color: '#d0d8f0' }}>{victim.physical_description}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#64748B' }}>Encontrada en</dt>
              <dd style={{ color: '#d0d8f0' }}>{victim.found_location}</dd>
            </div>
            {location && (
              <div>
                <dt className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#64748B' }}>Ubicación actual</dt>
                <dd style={{ color: '#d0d8f0' }}>
                  {location.name}
                  {location.address && <span style={{ color: '#94A3B8' }}> — {location.address}</span>}
                  {location.phone && (
                    <a href={`tel:${location.phone}`} className="flex items-center gap-1 mt-0.5 hover:underline"
                      style={{ color: '#D4A017' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>phone</span>
                      {location.phone}
                    </a>
                  )}
                </dd>
              </div>
            )}
            {victim.estimated_age && (
              <div>
                <dt className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#64748B' }}>Edad estimada</dt>
                <dd style={{ color: '#d0d8f0' }}>{victim.estimated_age} años</dd>
              </div>
            )}
            {victim.is_minor && (
              <div>
                <dt className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#64748B' }}>Protección especial</dt>
                <dd>
                  <span className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)' }}>
                    Menor de edad
                  </span>
                </dd>
              </div>
            )}
            {victim.notes && (
              <div>
                <dt className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#64748B' }}>Notas médicas</dt>
                <dd style={{ color: '#d0d8f0' }}>{victim.notes}</dd>
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

          <VictimaCompartir
            victimId={victim.id}
            victimName={victim.name}
            status={victim.status}
            foundLocation={victim.found_location}
            qrDataUrl={qrDataUrl}
            victimUrl={victimUrl}
          />

          {isStaff && profile.is_verified && (
            <BiometricoPanel
              victimId={victim.id}
              hasPhotos={photoUrls.length > 0}
            />
          )}
        </div>
      </main>
    </div>
  )
}
