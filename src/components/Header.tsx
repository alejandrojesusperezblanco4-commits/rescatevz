'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

interface HeaderProps {
  profile: Profile
}

// Tabs del bottom nav por rol
function getBottomTabs(role: string, canRegister: boolean) {
  const home  = { href: '/dashboard',       icon: 'home',          label: 'Inicio' }
  const victims = { href: '/victimas',       icon: 'groups',        label: 'Víctimas' }
  const search  = { href: '/buscar',         icon: 'person_search', label: 'Buscar' }
  const map     = { href: '/mapa-publico',   icon: 'map',           label: 'Mapa' }
  const requests= { href: '/solicitudes',    icon: 'pending_actions',label: 'Solicitudes' }
  const verify  = { href: '/verificacion',   icon: 'verified_user', label: 'Verificar' }
  const myReqs  = { href: '/mis-solicitudes',icon: 'pending_actions',label: 'Solicitudes' }
  const structs = { href: '/estructuras',    icon: 'apartment',     label: 'Estructuras' }

  const news = { href: '/noticias', icon: 'newspaper', label: 'Noticias' }

  if (role === 'admin')    return [home, victims, map, news, requests]
  if (role === 'rescuer')  return canRegister ? [home, victims, map, news] : [home, search, map, news]
  if (role === 'medical')  return [home, victims, map, news]
  if (role === 'family')   return [home, search, map, news]
  if (role === 'engineer') return [home, structs, map, news]
  return [home, search, map, news]
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

  const desktopNav = [
    { href: '/dashboard',       label: 'Dashboard',       roles: ['admin', 'rescuer', 'medical', 'family', 'engineer'] },
    { href: '/victimas',        label: 'Víctimas',        roles: ['admin', 'rescuer', 'medical'] },
    { href: '/estructuras',     label: 'Estructuras',     roles: ['admin', 'engineer', 'rescuer', 'medical'] },
    { href: '/buscar',          label: 'Buscar',          roles: ['admin', 'rescuer', 'medical', 'family', 'engineer'] },
    { href: '/mapa-publico',    label: 'Mapa',            roles: ['admin', 'rescuer', 'medical', 'family', 'engineer'] },
    { href: '/noticias',        label: 'Noticias',        roles: ['admin', 'rescuer', 'medical', 'family', 'engineer'] },
    { href: '/solicitudes',     label: 'Solicitudes',     roles: ['admin'] },
    { href: '/verificacion',    label: 'Verificar',       roles: ['admin'] },
    { href: '/mis-solicitudes', label: 'Mis solicitudes', roles: ['family'] },
  ] as const

  const visibleDesktopNav = desktopNav.filter(n => (n.roles as readonly string[]).includes(profile.role))
  const canRegister = profile.role === 'admin' || (profile.is_verified && ['rescuer', 'medical'].includes(profile.role))
  const bottomTabs = getBottomTabs(profile.role, canRegister)

  return (
    <>
      {/* ── Top header (todas las pantallas) ── */}
      <header className="sticky top-0 z-50" style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <img src="/favicon.svg" alt="RescateVZ" className="w-7 h-7" />
              <span className="font-bold text-base" style={{ color: '#F0F4FF', fontFamily: 'Manrope, sans-serif' }}>RescateVZ</span>
            </Link>
            {/* Nav desktop */}
            <nav className="hidden sm:flex items-center gap-1">
              {visibleDesktopNav.map(item => (
                <Link key={item.href} href={item.href}
                  className="text-sm px-3 py-1.5 rounded-md transition-colors"
                  style={pathname === item.href
                    ? { color: '#D4A017', background: 'rgba(212,160,23,0.12)' }
                    : { color: '#94A3B8' }
                  }>
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
            {!profile.is_verified && profile.role !== 'family' && profile.role !== 'admin' && (
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
      </header>

      {/* ── FAB móvil: Registrar víctima (solo staff verificado) ── */}
      {canRegister && (
        <Link href="/victimas/nueva"
          className="sm:hidden fixed z-40 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{
            bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
            right: '1rem',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#D4A017',
            color: '#1a2744',
            boxShadow: '0 4px 20px rgba(212,160,23,0.45)',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}>add</span>
        </Link>
      )}

      {/* ── Bottom tab bar móvil ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: '#0f1a2e',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(4rem + env(safe-area-inset-bottom))',
        }}>
        {bottomTabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:opacity-70"
              style={{ color: active ? '#D4A017' : '#475569', minWidth: 0 }}>
              <span className="material-symbols-outlined"
                style={{ fontSize: '22px', fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium truncate w-full text-center px-1">{tab.label}</span>
              {active && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full" style={{ background: '#D4A017' }} />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
