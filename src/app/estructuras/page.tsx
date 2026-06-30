import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { Profile, Structure } from '@/lib/types'
import EstructurasPanel from '@/components/EstructurasPanel'

// Pendientes primero, luego rojo/amarillo/verde; dentro de cada grupo, las
// más recientes arriba. El orden del semáforo se afina en el cliente.
const STATUS_ORDER: Record<string, number> = { pending: 0, red: 1, yellow: 2, green: 3 }

export default async function EstructurasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  // Familiares no gestionan estructuras (pueden verlas en el mapa público).
  if (profile.role === 'family') redirect('/dashboard')

  const { data: structures } = await supabase
    .from('structures')
    .select('id, name, address, lat, lng, structure_type, habitability, report_notes, assessment_notes, reported_by, assessed_by, assessed_at, created_at, updated_at')
    .order('updated_at', { ascending: false })

  const ordered = (structures || []).slice().sort(
    (a, b) => (STATUS_ORDER[a.habitability] ?? 9) - (STATUS_ORDER[b.habitability] ?? 9)
  )

  const canAssess = profile.role === 'admin' || profile.role === 'engineer'

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-red-600 text-white text-center py-1.5 text-xs font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <Header profile={profile as Profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Habitabilidad de estructuras</h1>
        <p className="text-sm text-gray-500 mb-8">
          {canAssess
            ? 'Evalúa edificaciones con el semáforo de habitabilidad y revisa las que faltan por analizar. El estado se publica en el mapa.'
            : 'Reporta edificaciones que necesiten inspección. Un ingeniero o arquitecto les asignará el estado del semáforo.'}
        </p>

        {/* Referencia externa: mapa satelital de daños de NASA (uso interno).
            Es una estimación de probabilidad por zona, no un listado por edificio;
            sirve para priorizar dónde inspeccionar. */}
        <a
          href="https://gis.earthdata.nasa.gov/portal/apps/mapviewer/index.html?webmap=0c3d77dd5aae46e4829d9a282477615c"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🛰️</span>
            <div>
              <p className="font-medium text-blue-900">
                Mapa de daños satelital — NASA <span className="text-xs align-top">↗</span>
              </p>
              <p className="text-sm text-blue-800 mt-0.5">
                Probabilidad de estructuras dañadas (Sentinel-1, ARIA/JPL) del terremoto. Úsalo como referencia
                para decidir qué zonas inspeccionar primero. Es una estimación preliminar por área, no un listado
                verificado edificio por edificio.
              </p>
            </div>
          </div>
        </a>

        {!profile.is_verified && (profile.role === 'engineer' || profile.role === 'rescuer') && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <span className="text-xl shrink-0">⏳</span>
            <p className="text-sm text-amber-800">
              Tu cuenta está pendiente de verificación. Puedes consultar el listado, pero{' '}
              {profile.role === 'engineer' ? 'aún no puedes evaluar ni añadir estructuras' : 'aún no puedes reportar estructuras'} hasta
              que un administrador te apruebe.
            </p>
          </div>
        )}
        <EstructurasPanel
          structures={(ordered as Structure[]) || []}
          role={profile.role}
          userId={user.id}
          isVerified={profile.is_verified}
        />
      </main>
    </div>
  )
}
