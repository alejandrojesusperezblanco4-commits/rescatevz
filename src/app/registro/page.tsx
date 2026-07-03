'use client'

import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

const ROL_DESCRIPTIONS: Record<string, string> = {
  family:   'Busco a un familiar desaparecido. Podré solicitar acceso a registros tras verificar mi identidad.',
  rescuer:  'Soy voluntario o rescatista activo en campo. Podré registrar víctimas tras aprobación de un administrador.',
  medical:  'Soy médico, enfermero o personal de salud. Podré actualizar el estado médico de víctimas.',
  engineer: 'Soy ingeniero o arquitecto. Evaluaré la habitabilidad de estructuras tras aprobación de un administrador.',
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

  // KYC — paso 2 para roles no-family
  const [step, setStep] = useState<'form' | 'kyc'>('form')
  const [userId, setUserId] = useState<string | null>(null)
  const [cedulaFile, setCedulaFile] = useState<File | null>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [kycError, setKycError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: rol, cedula } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Roles no-family deben subir foto de cédula
    if (rol !== 'family' && data.user) {
      setUserId(data.user.id)
      setStep('kyc')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleKyc(skip = false) {
    if (!userId) return
    if (!skip && !cedulaFile) { setKycError('Selecciona una foto de tu cédula'); return }
    setKycLoading(true); setKycError('')
    try {
      if (!skip && cedulaFile) {
        const supabase = createClient()
        const ext = cedulaFile.name.split('.').pop() || 'jpg'
        const path = `kyc/${userId}/cedula-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('access-docs')
          .upload(path, cedulaFile, { upsert: true })
        if (uploadError) throw uploadError
        await supabase.from('profiles').update({ cedula_photo_url: path }).eq('id', userId)
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setKycError(err instanceof Error ? err.message : 'Error al subir foto')
      setKycLoading(false)
    }
  }

  if (step === 'kyc') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
        <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
          style={{ background: '#DC2626' }}>
          🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>
                  badge
                </span>
              </div>
              <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Verificación de identidad
              </h1>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Sube una foto clara de tu cédula de identidad venezolana para que el administrador pueda verificarte.
              </p>
            </div>

            <div className="rounded-xl p-6 space-y-5" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.7)' }}>
              {/* Preview */}
              {cedulaFile && (
                <div className="relative rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(212,160,23,0.3)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(cedulaFile)}
                    alt="Vista previa cédula"
                    className="w-full max-h-48 object-cover"
                  />
                  <button
                    onClick={() => setCedulaFile(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#fff' }}>close</span>
                  </button>
                </div>
              )}

              {/* Upload area */}
              {!cedulaFile && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all hover:brightness-110"
                  style={{ border: '2px dashed rgba(212,160,23,0.4)', background: '#162040', minHeight: '140px', padding: '1.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#D4A017', fontVariationSettings: "'FILL' 0" }}>
                    add_a_photo
                  </span>
                  <p className="text-sm text-center" style={{ color: '#94A3B8' }}>
                    Toca para seleccionar foto de tu cédula
                    <br />
                    <span className="text-xs" style={{ color: '#475569' }}>JPG · PNG · WEBP</span>
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) setCedulaFile(e.target.files[0]); e.target.value = '' }}
              />

              {kycError && (
                <div className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
                  {kycError}
                </div>
              )}

              <button
                onClick={() => handleKyc(false)}
                disabled={kycLoading || !cedulaFile}
                className="w-full font-bold py-3 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: '#D4A017', color: '#1a2744' }}>
                {kycLoading ? 'Subiendo…' : 'Subir foto y continuar'}
              </button>

              <button
                onClick={() => handleKyc(true)}
                disabled={kycLoading}
                className="w-full py-2 text-sm transition-all hover:opacity-70"
                style={{ color: '#475569' }}>
                Omitir por ahora (puedes hacerlo después desde tu perfil)
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.svg" alt="RescateVZ" className="w-12 h-12" />
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
                <div className="grid grid-cols-2 gap-2">
                  {(['family', 'rescuer', 'medical', 'engineer'] as UserRole[]).map(r => (
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
                  Tu cuenta quedará en revisión hasta que un administrador la verifique. Se te pedirá foto de cédula.
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
                {loading ? 'Creando cuenta…' : rol !== 'family' ? 'Continuar →' : 'Crear cuenta'}
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
