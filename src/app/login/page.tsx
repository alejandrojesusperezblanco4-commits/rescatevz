'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black"
                style={{ background: '#1e2d4a', border: '2px solid #D4A017', color: '#D4A017', fontFamily: 'Manrope, sans-serif' }}>
                RV
              </div>
              <span className="font-bold text-2xl" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
                RescateVZ
              </span>
            </Link>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
              Iniciar sesión
            </h1>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              Accede al panel de coordinación
            </p>
          </div>

          <div className="rounded-xl p-8" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)' }}>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94A3B8' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-3 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: '#D4A017', color: '#1a2744' }}>
                {loading ? 'Ingresando…' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="font-medium hover:brightness-110" style={{ color: '#D4A017' }}>
                Regístrate aquí
              </Link>
            </p>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#475569' }}>
            <Link href="/" className="hover:text-gray-400">← Volver al inicio</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
