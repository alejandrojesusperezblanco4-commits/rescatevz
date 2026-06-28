'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/types'
import { Suspense } from 'react'

const REGISTRO_ROLES: UserRole[] = ['family', 'rescuer', 'medical', 'ngo']

function RegistroForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const rolParam     = searchParams.get('rol') as UserRole | null

  const [rol, setRol]         = useState<UserRole>(rolParam || 'family')
  const [fullName, setFullName] = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [cedula, setCedula]   = useState('')
  const [orgName, setOrgName] = useState('')   // nombre de la ONG/organización
  const [error, setError]     = useState('')
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
        data: {
          full_name: rol === 'ngo' ? (orgName.trim() || fullName) : fullName,
          role: rol,
          cedula,
        },
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

  const needsVerification = rol !== 'family'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold text-white">RV</div>
              <span className="font-bold text-xl text-gray-900">RescateVZ</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
            <form onSubmit={handleRegister} className="space-y-4">

              {/* Selector de rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soy…</label>
                <div className="grid grid-cols-2 gap-2">
                  {REGISTRO_ROLES.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRol(r)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors text-left leading-tight ${
                        rol === r
                          ? r === 'ngo'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                      }`}
                    >
                      {r === 'family'  && '👨‍👩‍👧 '}
                      {r === 'rescuer' && '🦺 '}
                      {r === 'medical' && '🩺 '}
                      {r === 'ngo'     && '📦 '}
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{ROLE_DESCRIPTIONS[rol]}</p>
              </div>

              {needsVerification && (
                <div className={`border text-xs px-3 py-2 rounded-lg ${
                  rol === 'ngo'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  {rol === 'ngo'
                    ? 'Tu cuenta quedará en revisión. Un administrador la verificará para que puedas publicar tu centro de acopio en el mapa.'
                    : 'Tu cuenta quedará en revisión hasta que un administrador la verifique. Puedes navegar pero no podrás registrar víctimas aún.'}
                </div>
              )}

              {/* Nombre de organización (solo NGO) */}
              {rol === 'ngo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la ONG / organización</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ej: Cruz Roja Venezolana — Chacao"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {rol === 'ngo' ? 'Nombre del coordinador/a' : 'Nombre completo'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Tu nombre y apellido"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de cédula</label>
                <input
                  type="text"
                  required
                  value={cedula}
                  onChange={e => setCedula(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="V-12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors ${
                  rol === 'ngo' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-red-600 hover:underline font-medium">
                Iniciar sesión
              </Link>
            </p>
          </div>
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
