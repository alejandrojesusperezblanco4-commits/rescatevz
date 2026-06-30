'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

interface HeaderProps {
  profile: Profile
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const nav = [
    { href: '/dashboard',       label: 'Dashboard',    roles: ['admin', 'rescuer', 'medical', 'family', 'engineer'] },
    { href: '/victimas',        label: 'Víctimas',     roles: ['admin', 'rescuer', 'medical'] },
    { href: '/estructuras',     label: 'Estructuras',  roles: ['admin', 'engineer', 'rescuer', 'medical'] },
    { href: '/buscar',          label: 'Buscar',       roles: ['admin', 'rescuer', 'medical', 'family', 'engineer'] },
    { href: '/mapa-publico',    label: 'Mapa',         roles: ['admin', 'rescuer', 'medical', 'family', 'engineer'] },
    { href: '/solicitudes',     label: 'Solicitudes',  roles: ['admin'] },
    { href: '/verificacion',    label: 'Verificar',    roles: ['admin'] },
    { href: '/mis-solicitudes', label: 'Mis solicitudes', roles: ['family'] },
  ] as const

  const visibleNav = nav.filter(n => (n.roles as readonly string[]).includes(profile.role))
  const canRegister = profile.role === 'admin' || (profile.is_verified && ['rescuer', 'medical'].includes(profile.role))

  return (
    <header className="sticky top-0 z-50" style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base shrink-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#1e2d4a', border: '1.5px solid #D4A017', color: '#D4A017', fontFamily: 'Manrope, sans-serif' }}
            >
              RV
            </div>
            <span style={{ color: '#F0F4FF', fontFamily: 'Manrope, sans-serif' }}>RescateVZ</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {visibleNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm px-3 py-1.5 rounded-md transition-colors"
                style={pathname === item.href
                  ? { color: '#D4A017', background: 'rgba(212,160,23,0.12)' }
                  : { color: '#94A3B8' }
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {canRegister && (
            <Link href="/victimas/nueva"
              className="hidden sm:flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-md transition-all hover:brightness-110"
              style={{ background: '#D4A017', color: '#1a2744' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>add</span>
              Registrar
            </Link>
          )}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs" style={{ color: '#F0F4FF' }}>{profile.full_name?.split(' ')[0]}</span>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: '#64748B' }}>
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
          {!profile.is_verified && profile.role !== 'family' && (
            <span className="hidden sm:block text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(212,160,23,0.15)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}>
              Pendiente
            </span>
          )}
          <button onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-md transition-colors hover:text-white"
            style={{ color: '#64748B', border: '1px solid rgba(255,255,255,0.1)' }}>
            Salir
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="sm:hidden flex overflow-x-auto gap-1 px-4 pb-2">
        {visibleNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors shrink-0"
            style={pathname === item.href
              ? { color: '#D4A017', background: 'rgba(212,160,23,0.12)' }
              : { color: '#64748B' }
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
