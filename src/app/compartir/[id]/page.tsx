import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<string, string> = {
  alive: 'Con vida', critical: 'Herido / crítico', deceased: 'Fallecido', unknown: 'Sin confirmar',
}
const STATUS_COLORS: Record<string, string> = {
  alive: '#22C55E', critical: '#EF4444', deceased: '#94A3B8', unknown: '#D4A017',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: v } = await admin
    .from('victims')
    .select('status, physical_description, found_location, estimated_age, is_minor')
    .eq('id', id).eq('is_minor', false).single()

  if (!v) return { title: 'RescateVZ' }

  const desc = `${STATUS_LABELS[v.status] ?? v.status} · ${v.found_location}${v.estimated_age ? ` · ~${v.estimated_age} años` : ''}. ${(v.physical_description || '').slice(0, 120)}`
  const ogImage = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/${id}`

  return {
    title: '¿Reconoces a esta persona? — RescateVZ',
    description: desc,
    openGraph: {
      title: '¿Reconoces a esta persona? — RescateVZ',
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Persona buscada' }],
      siteName: 'RescateVZ',
    },
    twitter: {
      card: 'summary_large_image',
      title: '¿Reconoces a esta persona? — RescateVZ',
      description: desc,
      images: [ogImage],
    },
  }
}

export default async function CompartirPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: v } = await admin
    .from('victims')
    .select('id, status, physical_description, found_location, estimated_age, is_minor')
    .eq('id', id).eq('is_minor', false).single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rescate-vz.com'
  const shareUrl = `${appUrl}/compartir/${id}`
  const whatsappText = encodeURIComponent(`¿La reconoces? Persona ${STATUS_LABELS[v?.status ?? 'unknown'] ?? ''} encontrada en ${v?.found_location ?? 'Venezuela'}.\n\nDescripción: ${(v?.physical_description ?? '').slice(0, 200)}\n\nSi tienes información entra a: ${shareUrl}`)

  const statusColor = STATUS_COLORS[v?.status ?? 'unknown'] ?? '#D4A017'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0f1a2e', color: '#F0F4FF' }}>

      {/* Franja bandera */}
      <div className="fixed top-0 left-0 right-0 flex h-2">
        <div className="flex-[2]" style={{ background: '#FFCC00' }} />
        <div className="flex-[1]" style={{ background: '#003893' }} />
        <div className="flex-[1]" style={{ background: '#CF142B' }} />
      </div>

      <div className="w-full max-w-lg mt-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <img src="/favicon.svg" alt="RescateVZ" className="w-8 h-8" />
          <span className="font-bold text-lg" style={{ fontFamily: 'Manrope, sans-serif', color: '#D4A017' }}>RescateVZ</span>
        </div>

        {!v ? (
          <div className="text-center py-12" style={{ color: '#64748B' }}>
            <p>Este perfil no está disponible o ha sido eliminado.</p>
            <Link href="/buscar" className="mt-4 inline-block underline" style={{ color: '#D4A017' }}>
              Ir a búsqueda
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
              ¿Reconoces a esta persona?
            </h1>

            {/* Card */}
            <div className="rounded-2xl p-6 mb-6"
              style={{ background: '#1e2d4a', border: `2px solid ${statusColor}40` }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                  {STATUS_LABELS[v.status] ?? v.status}
                </span>
                {v.estimated_age && (
                  <span className="text-sm" style={{ color: '#94A3B8' }}>~{v.estimated_age} años</span>
                )}
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: '#d0d8f0' }}>
                {v.physical_description}
              </p>

              <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#D4A017' }} />
                Encontrado/a en: <span style={{ color: '#F0F4FF', fontWeight: 600 }}>{v.found_location}</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>share</span>
                Compartir por WhatsApp
              </a>

              <button onClick={() => navigator.clipboard?.writeText(shareUrl)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
                style={{ background: 'rgba(212,160,23,0.10)', color: '#FCD34D', border: '1px solid rgba(212,160,23,0.25)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>link</span>
                Copiar enlace
              </button>

              <Link href="/buscar"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
                style={{ background: '#DC2626', color: '#fff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>manage_search</span>
                Tengo información — buscar en la base de datos
              </Link>
            </div>

            <p className="text-xs text-center mt-6" style={{ color: '#475569' }}>
              Este enlace no contiene el nombre de la persona por privacidad.
              Los datos completos solo se comparten con familiares verificados.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
