'use client'

import { useEffect } from 'react'

export default function PWARegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        // Verificar actualizaciones cada vez que el usuario navega
        reg.update()
      })
      .catch(() => {
        // SW no crítico — falla silenciosamente
      })
  }, [])

  return null
}
