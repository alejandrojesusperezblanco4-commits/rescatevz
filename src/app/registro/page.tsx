'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { Suspense } from 'react'
import PublicShell from '@/components/PublicShell'

const ROL_DESCRIPTIONS: Record<string, string> = {
  family: 'Busco a un familiar desaparecido. Podré solicitar acceso a registros tras verificar mi identidad.',
  rescuer: 'Soy voluntario o rescatista activo en campo. Podré registrar víctimas tras aprobación de un administrador.',
  medical: 'Soy médico, enfermero o personal de salud. Podré actualizar el estado médico de víctimas.',
  engineer: 'Soy ingeniero o arquitecto. Evaluaré la habitabilidad de estructuras con un semáforo tras la aprobación de un administrador.',
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
      options: {
        data: { full_name: fullName, role: rol, cedula },
      },
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
    <PublicShell mainClassName="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="text-sm text-gray-400 mt-1">Únete a la red de rescate de Venezuela</p>
        </div>

        <div className="rounded-xl border border-white/10 p-8" style={{ background: '#161B22' }}>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Rol selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Soy…</label>
              <div className="grid grid-cols-2 gap-2">
                {(['family', 'rescuer', 'medical', 'engineer'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRol(r)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      rol === r
                        ? 'text-white border-transparent'
                        : 'bg-white/5 text-gray-300 border-white/15 hover:border-white/30'
                    }`}
                    style={rol === r ? { background: '#CF142B' } : undefined}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{ROL_DESCRIPTIONS[rol]}</p>
            </div>

            {rol !== 'family' && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs px-3 py-2 rounded-lg">
                Tu cuenta quedará en revisión hasta que un administrador la verifique. Puedes navegar pero no podrás registrar víctimas aún.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/15 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CF142B] focus:border-transparent"
                placeholder="Tu nombre y apellido"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Número de cédula</label>
              <input
                type="text"
                required
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                className="w-full bg-white/5 border border-white/15 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CF142B] focus:border-transparent"
                placeholder="V-12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/15 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CF142B] focus:border-transparent"
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/15 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CF142B] focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-medium py-2.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: '#CF142B' }}
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  )
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  )
}
