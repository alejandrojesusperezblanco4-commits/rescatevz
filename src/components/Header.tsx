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
    { href: '/dashboard', label: 'Inicio', roles: ['admin', 'rescuer', 'medical', 'family'] },
    { href: '/victimas/nueva', label: 'Registrar víctima', roles: ['admin', 'rescuer', 'medical'] },
    { href: '/buscar', label: 'Buscar familiar', roles: ['admin', 'rescuer', 'medical', 'family'] },
    { href: '/mapa-publico', label: 'Mapa', roles: ['admin', 'rescuer', 'medical', 'family'] },
    { href: '/solicitudes', label: 'Solicitudes', roles: ['admin'] },
  ] as const

  const visibleNav = nav.filter(n => (n.roles as readonly string[]).includes(profile.role))

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base shrink-0">
            <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold">RV</div>
            RescateVZ
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {visibleNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  pathname === item.href
                    ? 'bg-white/15 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-gray-300">{profile.full_name}</span>
            <span className="text-xs text-gray-500">{ROLE_LABELS[profile.role]}</span>
          </div>
          {!profile.is_verified && profile.role !== 'family' && (
            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Pendiente verificación</span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md"
          >
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
            className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors shrink-0 ${
              pathname === item.href
                ? 'bg-white/15 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
