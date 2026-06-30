import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Chrome compartido para todas las páginas públicas (pre-login), para que
 * coincidan con el diseño oscuro venezolano de la landing. No usa hooks ni
 * eventos, así que puede importarse tanto desde Server como Client Components.
 */

export function FlagStripe({ className = 'h-1' }: { className?: string }) {
  return (
    <div className={`flex w-full ${className}`}>
      <div className="flex-1" style={{ background: '#FFD700' }} />
      <div className="flex-1" style={{ background: '#003893' }} />
      <div className="flex-1" style={{ background: '#CF142B' }} />
    </div>
  )
}

export function EmergencyBanner() {
  return (
    <div
      className="text-center py-2 text-xs font-semibold tracking-widest uppercase px-4"
      style={{ background: '#CF142B', color: '#FFFFFF' }}
    >
      🚨 Emergencia activa — Terremotos Venezuela 24 jun 2026 — +50.000 desaparecidos
    </div>
  )
}

export function PublicHeader({ title, right }: { title?: string; right?: ReactNode }) {
  return (
    <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10">
      <Link href="/" className="flex items-center gap-3 group">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white"
          style={{ background: '#CF142B' }}
        >
          RV
        </div>
        <span className="font-bold text-lg tracking-tight group-hover:opacity-90">RescateVZ</span>
        {title && (
          <span className="hidden sm:block text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">
            {title}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-2">
        {right ?? (
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
            ← Inicio
          </Link>
        )}
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 py-6 px-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <FlagStripe className="h-0.5 w-6" />
        <span className="text-xs text-gray-500">RescateVZ — Plataforma humanitaria · Venezuela 2026</span>
        <div className="flex h-0.5 w-6">
          <div className="flex-1" style={{ background: '#CF142B' }} />
          <div className="flex-1" style={{ background: '#003893' }} />
          <div className="flex-1" style={{ background: '#FFD700' }} />
        </div>
      </div>
      <p className="text-xs text-gray-600">
        Los datos de menores son confidenciales y solo accesibles por personal autorizado.{' '}
        <Link href="/guia" className="hover:text-gray-400 underline">
          Guía de uso
        </Link>
        {' · '}
        <Link href="/whatsapp" className="hover:text-gray-400 underline">
          Bot WhatsApp
        </Link>
      </p>
    </footer>
  )
}

export default function PublicShell({
  title,
  headerRight,
  footer = false,
  mainClassName = 'flex-1 w-full',
  children,
}: {
  title?: string
  headerRight?: ReactNode
  footer?: boolean
  mainClassName?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117', color: '#FFFFFF' }}>
      <FlagStripe />
      <EmergencyBanner />
      <PublicHeader title={title} right={headerRight} />
      <main className={mainClassName}>{children}</main>
      {footer && <PublicFooter />}
    </div>
  )
}
