import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Location } from '@/lib/types'

export const revalidate = 300  // refresca cada 5 min

export default async function ComoAyudarPage() {
  const supabase = await createClient()

  const { data: centers } = await supabase
    .from('locations')
    .select('id, name, type, lat, lng, address, phone, needs, is_active')
    .eq('type', 'collection_center')
    .eq('is_active', true)
    .order('name')

  const locations = (centers ?? []) as Location[]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium px-4">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm">RV</div>
          <span className="font-bold text-lg">RescateVZ — Cómo ayudar</span>
        </div>
        <div className="flex gap-3">
          <Link href="/mapa-publico" className="text-sm text-gray-300 hover:text-white transition-colors">Ver mapa</Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Inicio</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📦</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Quiero ayudar</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Estos son los centros de acopio y ONGs activos que reciben donaciones.
            Lleva directamente lo que más necesitan — cada artículo cuenta.
          </p>
        </div>

        {/* Artículos más necesarios — resumen global */}
        <GlobalNeedsBar centers={locations} />

        {/* Lista de centros */}
        {locations.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">Aún no hay centros de acopio registrados.</p>
            <p className="text-sm mt-1">
              ¿Tienes una ONG o punto de acopio?{' '}
              <Link href="/registro?rol=ngo" className="text-green-700 underline font-medium">Regístrate aquí</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map(center => (
              <CenterCard key={center.id} center={center} />
            ))}
          </div>
        )}

        {/* CTA para ONGs */}
        <div className="mt-12 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-green-900 mb-1">¿Tienes una ONG o punto de acopio?</p>
          <p className="text-sm text-green-700 mb-4">
            Regístrate para aparecer en este mapa y que la gente sepa qué necesitas.
          </p>
          <Link
            href="/registro?rol=ngo"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Registrar mi centro de acopio
          </Link>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 text-center py-4 text-xs">
        <p>RescateVZ — Plataforma humanitaria sin fines de lucro · Venezuela 2026</p>
      </footer>
    </div>
  )
}

function GlobalNeedsBar({ centers }: { centers: Location[] }) {
  const allNeeds = centers.flatMap(c => c.needs ?? [])
  if (allNeeds.length === 0) return null

  const freq: Record<string, number> = {}
  allNeeds.forEach(n => { freq[n] = (freq[n] ?? 0) + 1 })
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <div className="bg-white border border-green-200 rounded-xl p-5 mb-8">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Lo más solicitado en este momento
      </p>
      <div className="flex flex-wrap gap-2">
        {top.map(([item, count]) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 bg-green-100 text-green-900 text-sm font-medium px-3 py-1 rounded-full"
          >
            {item}
            {count > 1 && (
              <span className="bg-green-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

function CenterCard({ center }: { center: Location }) {
  const mapsUrl = `https://www.google.com/maps?q=${center.lat},${center.lng}`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📦</span>
            <h2 className="text-base font-bold text-gray-900 leading-tight">{center.name}</h2>
          </div>

          {center.address && (
            <p className="text-sm text-gray-500 mb-3">{center.address}</p>
          )}

          {center.needs && center.needs.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Necesitan</p>
              <div className="flex flex-wrap gap-1.5">
                {center.needs.map(n => (
                  <span
                    key={n}
                    className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Contactar para consultar qué artículos necesitan</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            🗺️ Cómo llegar
          </a>
          {center.phone && (
            <a
              href={`tel:${center.phone}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 border border-green-200 hover:border-green-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              📞 {center.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
