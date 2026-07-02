'use client'

import { useState } from 'react'
import type { Sismo } from '@/lib/usgs'

export default function SismosAdminPanel({ sismo }: { sismo: Sismo }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'already' | 'error'>('idle')
  const [sent, setSent] = useState(0)

  async function notificar() {
    setState('loading')
    try {
      const res = await fetch('/api/sismos/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usgsId: sismo.usgsId,
          magnitude: sismo.magnitude,
          place: sismo.place,
          occurredAt: sismo.occurredAt,
        }),
      })
      const data = await res.json()
      if (data.alreadyNotified) { setState('already'); return }
      setSent(data.sent ?? 0)
      setState('done')
    } catch {
      setState('error')
    }
  }

  const mag = sismo.magnitude.toFixed(1)

  return (
    <div className="rounded-xl p-4 mb-5"
      style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.25)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#DC2626', fontVariationSettings: "'FILL' 1" }}>
          admin_panel_settings
        </span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#DC2626' }}>Admin</span>
      </div>

      {state === 'done' && (
        <p className="text-sm mb-3" style={{ color: '#86EFAC' }}>
          ✓ Notificación enviada a {sent} suscriptor{sent !== 1 ? 'es' : ''}.
        </p>
      )}
      {state === 'already' && (
        <p className="text-sm mb-3" style={{ color: '#D4A017' }}>
          Este sismo ya fue notificado anteriormente.
        </p>
      )}
      {state === 'error' && (
        <p className="text-sm mb-3" style={{ color: '#FCA5A5' }}>
          Error al enviar la notificación. Intenta de nuevo.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          Notificar sismo más reciente: <strong style={{ color: '#F0F4FF' }}>M{mag} — {sismo.place}</strong>
        </p>
        <button
          onClick={notificar}
          disabled={state === 'loading' || state === 'done' || state === 'already'}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center gap-1"
          style={{ background: '#DC2626', color: '#fff' }}>
          {state === 'loading'
            ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px' }}>progress_activity</span> Enviando…</>
            : <><span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>send</span> Notificar</>
          }
        </button>
      </div>
    </div>
  )
}
