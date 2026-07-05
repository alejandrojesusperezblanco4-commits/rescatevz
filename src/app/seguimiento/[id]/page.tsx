import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 30

const STATUS_LABELS: Record<string, string> = {
  alive:    'Con vida',
  critical: 'Estado crítico',
  deceased: 'Fallecido/a',
  missing:  'Desaparecido/a',
  unknown:  'Sin identificar',
}

const STATUS_STYLES: Record<string, string> = {
  alive:    'bg-green-100 text-green-800 border-green-200',
  critical: 'bg-orange-100 text-orange-800 border-orange-200',
  deceased: 'bg-gray-200 text-gray-700 border-gray-300',
  missing:  'bg-purple-100 text-purple-800 border-purple-200',
  unknown:  'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const STATUS_DOT: Record<string, string> = {
  alive:    'bg-green-500',
  critical: 'bg-orange-500',
  deceased: 'bg-gray-500',
  missing:  'bg-purple-500',
  unknown:  'bg-yellow-400',
}

export default async function SeguimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // El RLS de victims no permite lectura anónima (y el reportante sin cuenta es
  // el destinatario de esta página) — se usa la función SECURITY DEFINER de
  // columnas fijas get_victim_tracking, igual que hace /buscar con
  // search_victims_public. Nunca consultar victims directamente desde una
  // ruta pública.
  const { data: tracking } = await supabase
    .rpc('get_victim_tracking', { p_victim_id: id })
    .single()

  if (!tracking) notFound()

  const victim = {
    status:         (tracking as any).victim_status as string,
    found_location: (tracking as any).found_location as string,
    created_at:     (tracking as any).registered_at as string,
  }
  const location = (tracking as any).location_name
    ? { name: (tracking as any).location_name as string, address: (tracking as any).location_address as string | null }
    : null

  const { data: log } = await supabase
    .from('victim_status_log')
    .select('old_status, new_status, created_at')
    .eq('victim_id', id)
    .order('created_at', { ascending: false })

  const createdAt = new Date(victim.created_at)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium px-4">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      <header className="bg-gray-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">RV</div>
          <span className="font-bold text-base truncate">RescateVZ<span className="hidden sm:inline"> — Seguimiento de caso</span></span>
        </div>
        <Link href="/" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap flex-shrink-0">
          ← Inicio
        </Link>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <p className="text-xs text-gray-400 mb-1 font-mono">Caso #{id.slice(0, 8).toUpperCase()}</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Estado de la persona reportada</h1>

        {/* Estado actual */}
        <div className={`border rounded-xl p-5 mb-6 ${STATUS_STYLES[victim.status] ?? STATUS_STYLES['unknown']}`}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Estado actual</p>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_DOT[victim.status] ?? STATUS_DOT['unknown']}`} />
            <span className="text-xl font-bold">
              {STATUS_LABELS[victim.status] ?? victim.status}
            </span>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dónde fue reportado/a</p>
          <p className="text-sm text-gray-800 font-medium">{victim.found_location}</p>
          {location && (
            <p className="text-sm text-gray-600 mt-1">
              Ubicación actual: <span className="font-medium">{location.name}</span>
              {location.address && <span className="text-gray-400"> · {location.address}</span>}
            </p>
          )}
        </div>

        {/* Historial de cambios */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Historial de actualizaciones</p>

          <div className="space-y-0">
            {/* Entrada original */}
            <TimelineItem
              date={createdAt}
              label="Caso registrado en el sistema"
              badge={STATUS_LABELS[victim.status] ?? victim.status}
              badgeStyle={STATUS_STYLES[victim.status]}
              dotStyle={STATUS_DOT[victim.status]}
              isFirst
              isLast={!log || log.length === 0}
            />

            {/* Cambios posteriores (más reciente arriba) */}
            {(log ?? []).map((entry, i) => (
              <TimelineItem
                key={i}
                date={new Date(entry.created_at as string)}
                label={`Estado actualizado: ${STATUS_LABELS[entry.old_status ?? ''] ?? entry.old_status ?? '?'} → ${STATUS_LABELS[entry.new_status] ?? entry.new_status}`}
                badge={STATUS_LABELS[entry.new_status] ?? entry.new_status}
                badgeStyle={STATUS_STYLES[entry.new_status] ?? STATUS_STYLES['unknown']}
                dotStyle={STATUS_DOT[entry.new_status] ?? STATUS_DOT['unknown']}
                isFirst={false}
                isLast={i === (log ?? []).length - 1}
              />
            ))}
          </div>
        </div>

        {/* Aviso de privacidad */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Sobre esta página</p>
          <p className="text-xs text-blue-700">
            Por privacidad y seguridad, este seguimiento no muestra el nombre ni datos personales de la persona.
            Solo el personal autorizado de RescateVZ puede ver el perfil completo.
            Si tienes una emergencia, llama al <strong>171</strong> (Protección Civil Venezuela).
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/buscar" className="text-sm text-red-600 hover:underline font-medium">
            Buscar a otro familiar →
          </Link>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 text-center py-4 text-xs">
        <p>RescateVZ — Plataforma humanitaria sin fines de lucro · Venezuela 2026</p>
      </footer>
    </div>
  )
}

function TimelineItem({
  date, label, badge, badgeStyle, dotStyle, isFirst, isLast,
}: {
  date: Date; label: string; badge: string; badgeStyle: string; dotStyle: string
  isFirst: boolean; isLast: boolean
}) {
  return (
    <div className="flex gap-4">
      {/* Línea vertical */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${dotStyle}`} />
        {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
      </div>

      {/* Contenido */}
      <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
        <p className="text-sm text-gray-800 font-medium leading-snug">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {date.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' '}·{' '}
          {date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <span className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
          {badge}
        </span>
      </div>
    </div>
  )
}
