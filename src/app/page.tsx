import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatsCounter from '@/components/StatsCounter'

export default async function LandingPage() {
  const supabase = await createClient()
  const [
    { count: totalVictims },
    { count: alive },
    { count: locations },
    { count: minors },
  ] = await Promise.all([
    supabase.from('victims').select('*', { count: 'exact', head: true }),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'alive'),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('is_minor', true),
  ])

  const stats = [
    { label: 'Víctimas registradas', value: totalVictims || 0, color: 'text-white' },
    { label: 'Con vida confirmada', value: alive || 0, color: 'text-green-400' },
    { label: 'Centros activos', value: locations || 0, color: 'text-blue-400' },
    { label: 'Menores protegidos', value: minors || 0, color: 'text-yellow-400' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117', color: '#FFFFFF' }}>
      {/* Franja bandera venezolana */}
      <div className="flex h-1 w-full">
        <div className="flex-1" style={{ background: '#FFD700' }} />
        <div className="flex-1" style={{ background: '#003893' }} />
        <div className="flex-1" style={{ background: '#CF142B' }} />
      </div>

      {/* Banner emergencia */}
      <div className="text-center py-2 text-xs font-semibold tracking-widest uppercase px-4"
        style={{ background: '#CF142B', color: '#FFFFFF' }}>
        🚨 Emergencia activa — Terremotos Venezuela 24 jun 2026 — +50.000 desaparecidos
      </div>

      {/* Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white"
            style={{ background: '#CF142B' }}>
            RV
          </div>
          <span className="font-bold text-lg tracking-tight">RescateVZ</span>
          <span className="hidden sm:block text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">
            Venezuela 2026
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/guia" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
            Guía
          </Link>
          <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
            Entrar
          </Link>
          <Link href="/registro"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{ background: '#CF142B', color: '#FFFFFF' }}>
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        {/* Hero section */}
        <section className="flex flex-col items-center justify-center text-center px-4 pt-16 pb-12">
          {/* Estrella de Venezuela sutil */}
          <div className="text-5xl mb-6 opacity-80">⭐</div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4 max-w-3xl">
            Venezuela,{' '}
            <span style={{ color: '#FFD700' }}>te buscamos</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-xl">
            Plataforma segura para registrar víctimas, localizar hospitales y reunir familias separadas por el terremoto.
          </p>

          {/* Stats en tiempo real */}
          <div className="w-full max-w-3xl mb-16">
            <StatsCounter stats={stats} />
          </div>

          {/* Tarjetas de acceso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
            <ActionCard
              href="/registro?rol=rescuer"
              icon="🦺"
              title="Soy rescatista"
              desc="Registra víctimas rescatadas desde campo"
              accent="#CF142B"
            />
            <ActionCard
              href="/buscar"
              icon="🔍"
              title="Busco a alguien"
              desc="Encuentra a un familiar en hospitales y refugios"
              accent="#003893"
            />
            <ActionCard
              href="/mapa-publico"
              icon="🗺️"
              title="Ver el mapa"
              desc="Hospitales y refugios activos con capacidad"
              accent="#1D4ED8"
            />
            <ActionCard
              href="/primeros-auxilios"
              icon="🩺"
              title="Primeros auxilios"
              desc="Protocolos offline: RCP, hemorragias, shock…"
              accent="#16A34A"
            />
          </div>
        </section>

        {/* Franja informativa */}
        <section className="border-t border-white/10 py-10 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <InfoBlock
              icon="🔒"
              title="Privacidad ante todo"
              desc="Los menores están ocultos al público. El acceso a fotos requiere verificación de identidad."
            />
            <InfoBlock
              icon="📵"
              title="Funciona sin internet"
              desc="Las guías de primeros auxilios y el mapa se cachean localmente para usarse en campo."
            />
            <InfoBlock
              icon="💬"
              title="Bot de WhatsApp"
              desc="Registra víctimas enviando un mensaje de voz. Nuestro agente IA extrae los datos automáticamente."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-0.5 w-6">
            <div className="flex-1" style={{ background: '#FFD700' }} />
            <div className="flex-1" style={{ background: '#003893' }} />
            <div className="flex-1" style={{ background: '#CF142B' }} />
          </div>
          <span className="text-xs text-gray-500">RescateVZ — Plataforma humanitaria · Venezuela 2026</span>
          <div className="flex h-0.5 w-6">
            <div className="flex-1" style={{ background: '#CF142B' }} />
            <div className="flex-1" style={{ background: '#003893' }} />
            <div className="flex-1" style={{ background: '#FFD700' }} />
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Los datos de menores son confidenciales y solo accesibles por personal autorizado.{' '}
          <Link href="/guia" className="hover:text-gray-400 underline">Guía de uso</Link>
          {' · '}
          <Link href="/whatsapp" className="hover:text-gray-400 underline">Bot WhatsApp</Link>
        </p>
      </footer>
    </div>
  )
}

function ActionCard({ href, icon, title, desc, accent }: {
  href: string; icon: string; title: string; desc: string; accent: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col text-left p-5 rounded-xl border border-white/10 transition-all hover:border-white/30 hover:scale-[1.02]"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="font-bold text-base mb-1 text-white">{title}</h2>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
      <div className="mt-3 h-0.5 w-8 rounded-full transition-all group-hover:w-full" style={{ background: accent }} />
    </Link>
  )
}

function InfoBlock({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-sm text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed max-w-xs">{desc}</p>
    </div>
  )
}
