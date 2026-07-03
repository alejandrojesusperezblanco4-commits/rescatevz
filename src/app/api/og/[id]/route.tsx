import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  alive:    { label: 'CON VIDA',    color: '#22C55E', bg: 'rgba(34,197,94,0.2)' },
  critical: { label: 'HERIDO/CRÍTICO', color: '#EF4444', bg: 'rgba(239,68,68,0.2)' },
  deceased: { label: 'FALLECIDO',   color: '#94A3B8', bg: 'rgba(148,163,184,0.2)' },
  unknown:  { label: 'SIN CONFIRMAR', color: '#D4A017', bg: 'rgba(212,160,23,0.2)' },
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: victim } = await admin
    .from('victims')
    .select('status, physical_description, found_location, estimated_age, is_minor')
    .eq('id', id)
    .eq('is_minor', false) // nunca exponer menores
    .single()

  if (!victim) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#1a2744', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#94A3B8', fontSize: 24 }}>Perfil no disponible</span>
      </div>,
      { width: 1200, height: 630 }
    )
  }

  const cfg = STATUS_CFG[victim.status] ?? STATUS_CFG.unknown
  const desc = (victim.physical_description || '').slice(0, 160)
  const loc = (victim.found_location || '').slice(0, 60)

  return new ImageResponse(
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      background: '#0f1a2e', fontFamily: 'sans-serif', position: 'relative',
    }}>
      {/* Franjas bandera arriba */}
      <div style={{ display: 'flex', height: 8, width: '100%' }}>
        <div style={{ flex: 2, background: '#FFCC00' }} />
        <div style={{ flex: 1, background: '#003893' }} />
        <div style={{ flex: 1, background: '#CF142B' }} />
      </div>

      {/* Contenido */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 64px', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#D4A017', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
              RescateVZ
            </span>
            <span style={{ color: '#475569', fontSize: 14, marginTop: 2 }}>
              rescate-vz.com · Plataforma humanitaria Venezuela 2026
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', padding: '8px 20px',
            background: cfg.bg, borderRadius: 32,
            border: `2px solid ${cfg.color}`,
          }}>
            <span style={{ color: cfg.color, fontSize: 20, fontWeight: 800 }}>{cfg.label}</span>
          </div>
        </div>

        {/* Título */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 700 }}>
            ¿Reconoces a esta persona?
          </span>
          {victim.estimated_age && (
            <span style={{ color: '#94A3B8', fontSize: 16 }}>
              Edad aproximada: {victim.estimated_age} años
            </span>
          )}
        </div>

        {/* Descripción */}
        <div style={{
          display: 'flex', background: 'rgba(36,51,86,0.5)',
          borderRadius: 16, padding: '24px 32px',
          borderLeft: `4px solid ${cfg.color}`,
          flex: 1,
        }}>
          <span style={{ color: '#d0d8f0', fontSize: 22, lineHeight: 1.5 }}>
            {desc}{desc.length < (victim.physical_description || '').length ? '…' : ''}
          </span>
        </div>

        {/* Ubicación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A017' }} />
          <span style={{ color: '#94A3B8', fontSize: 18 }}>
            Encontrado/a en: <span style={{ color: '#F0F4FF', fontWeight: 600 }}>{loc}</span>
          </span>
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(212,160,23,0.10)', borderRadius: 16, padding: '20px 32px',
          border: '1px solid rgba(212,160,23,0.3)',
        }}>
          <span style={{ color: '#F0F4FF', fontSize: 20, fontWeight: 700 }}>
            Si la reconoces, entra a rescate-vz.com/buscar
          </span>
          <span style={{ color: '#D4A017', fontSize: 20, fontWeight: 800 }}>→</span>
        </div>
      </div>

      {/* Franjas bandera abajo */}
      <div style={{ display: 'flex', height: 8, width: '100%' }}>
        <div style={{ flex: 1, background: '#CF142B' }} />
        <div style={{ flex: 1, background: '#003893' }} />
        <div style={{ flex: 2, background: '#FFCC00' }} />
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
