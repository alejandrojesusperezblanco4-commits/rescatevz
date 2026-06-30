'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

const ROL_DESCRIPTIONS: Record<string, string> = {
  family:  'Busco a un familiar desaparecido. Podré solicitar acceso a registros tras verificar mi identidad.',
  rescuer: 'Soy voluntario o rescatista activo en campo. Podré registrar víctimas tras aprobación de un administrador.',
  medical: 'Soy médico, enfermero o personal de salud. Podré actualizar el estado médico de víctimas.',
}

function RegistroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rolParam = searchParams.get('rol') as UserRole | null

  const [rol, setRol] = useState<UserRole>(rolParam || 'family')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cedula, setCedula] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: rol, cedula } },
    })
    if (error) {
      setError(error.message)
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

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
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
              Crear cuenta
            </h1>
          </div>

          <div className="rounded-xl p-8" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)' }}>
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Selector de rol */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Soy…</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['family', 'rescuer', 'medical'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRol(r)}
                      className="py-2 px-3 text-xs font-semibold rounded-lg border transition-all"
                      style={rol === r
                        ? { background: '#D4A017', color: '#1a2744', borderColor: '#D4A017' }
                        : { background: 'transparent', color: '#94A3B8', borderColor: 'rgba(36,51,86,0.7)' }
                      }
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: '#64748B' }}>{ROL_DESCRIPTIONS[rol]}</p>
              </div>

              {rol !== 'family' && (
                <div className="text-xs px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', color: '#FCD34D' }}>
                  Tu cuenta quedará en revisión hasta que un administrador la verifique.
                </div>
              )}

              {[
                { label: 'Nombre completo', type: 'text', value: fullName, setter: setFullName, placeholder: 'Tu nombre y apellido', required: true },
                { label: 'Número de cédula', type: 'text', value: cedula, setter: setCedula, placeholder: 'V-12345678', required: true },
                { label: 'Correo electrónico', type: 'email', value: email, setter: setEmail, placeholder: 'tu@correo.com', required: true },
                { label: 'Contraseña', type: 'password', value: password, setter: setPassword, placeholder: 'Mínimo 8 caracteres', required: true, minLength: 8 },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#94A3B8' }}>{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    minLength={f.minLength}
                    value={f.value}
                    onChange={e => f.setter(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-3 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: '#D4A017', color: '#1a2744' }}>
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-medium hover:underline" style={{ color: '#D4A017' }}>
                Iniciar sesión
              </Link>
            </p>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#475569' }}>
            <Link href="/" className="hover:text-gray-400">← Volver al inicio</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  )
}
