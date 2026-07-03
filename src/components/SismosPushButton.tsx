'use client'

import { useState } from 'react'

export default function SismosPushButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle')
  const [endpoint, setEndpoint] = useState<string | null>(null)

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('denied'); return
    }
    setState('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('denied'); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })
      setEndpoint(sub.endpoint)
      setState('done')
    } catch { setState('denied') }
  }

  async function unsubscribe() {
    if (!endpoint) return
    await fetch('/api/push/unsubscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    })
    setEndpoint(null)
    setState('idle')
  }

  if (state === 'done') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-5"
        style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#22C55E', fontVariationSettings: "'FILL' 1" }}>
            notifications_active
          </span>
          <span className="text-sm" style={{ color: '#86EFAC' }}>
            Recibirás alertas sísmicas automáticamente
          </span>
        </div>
        <button onClick={unsubscribe}
          className="text-xs transition-all hover:opacity-70"
          style={{ color: '#475569' }}>
          Cancelar
        </button>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm"
        style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.3)', color: '#D4A017' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>notifications_off</span>
        Activa las notificaciones del navegador para recibir alertas sísmicas.
      </div>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={state === 'loading'}
      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60"
      style={{ background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.4)', color: '#D4A017' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
        {state === 'loading' ? 'progress_activity' : 'notifications'}
      </span>
      {state === 'loading' ? 'Activando…' : 'Activar alertas sísmicas'}
    </button>
  )
}
