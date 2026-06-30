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
    { label: 'Personas registradas', value: totalVictims || 0, color: '', borderColor: '#D4A017' },
    { label: 'Con vida confirmada', value: alive || 0, color: '', borderColor: '#D4A017' },
    { label: 'Centros activos', value: locations || 0, color: '', borderColor: '#D4A017' },
    { label: 'Menores protegidos', value: minors || 0, color: '', borderColor: '#D4A017' },
  ]

  return (
    <div style={{ background: '#1a2744', color: '#d8e2ff', fontFamily: "'Inter', sans-serif" }} className="min-h-screen flex flex-col overflow-x-hidden">

      {/* 1. Banner emergencia */}
      <div className="w-full text-white py-2 px-6 text-center z-[100] relative"
        style={{ background: '#DC2626' }}>
        <p className="font-bold uppercase flex items-center justify-center gap-3"
          style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>error</span>
          EMERGENCIA ACTIVA — Terremotos M7.2 + M7.5 · Venezuela · 24 junio 2026 — Más de 50.000 personas sin paradero conocido
        </p>
      </div>

      {/* 2. Header / Navbar */}
      <header className="w-full sticky top-0 z-50"
        style={{ background: '#1a2a46', borderBottom: '1px solid rgba(69,70,77,0.6)' }}>
        <nav className="flex justify-between items-center px-6 py-4 w-full max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center font-black text-xs"
                style={{ background: '#D4A017', color: '#1a2744' }}>
                RV
              </div>
              <span className="font-bold text-lg" style={{ fontFamily: "'Manrope', sans-serif", color: '#d8e2ff' }}>
                RescateVZ
              </span>
            </div>
            <div className="hidden md:flex gap-6">
              <Link href="/guia" className="font-medium transition-colors hover:text-yellow-400"
                style={{ color: '#c5c6ce' }}>
                Guía de uso
              </Link>
              <Link href="/whatsapp" className="font-medium transition-colors hover:text-yellow-400"
                style={{ color: '#c5c6ce' }}>
                Bot WhatsApp
              </Link>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/login"
              className="hidden md:block px-4 py-2 font-bold rounded-lg transition-all hover:brightness-110"
              style={{ color: '#d8e2ff' }}>
              Iniciar sesión
            </Link>
            <Link href="/registro"
              className="px-6 py-2 font-bold rounded-lg transition-all hover:brightness-110 active:opacity-80 uppercase"
              style={{ background: '#D4A017', color: '#402d00', fontSize: '14px', letterSpacing: '0.02em' }}>
              REPORTAR EMERGENCIA
            </Link>
          </div>
        </nav>
      </header>

      <main className="w-full max-w-[1280px] mx-auto px-6">

        {/* 3. Hero */}
        <section className="py-16 md:py-24 text-center">
          <h1 className="mb-6 max-w-3xl mx-auto"
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '48px',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              fontWeight: 800,
              color: '#d8e2ff',
            }}>
            Venezuela, te buscamos.
          </h1>
          <p className="max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#c5c6ce', fontSize: '16px' }}>
            Registra a quien encontraste. Busca a quien perdiste. Coordina el rescate.{' '}
            <br className="hidden md:block" />
            Plataforma oficial de enlace humanitario en tiempo real.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/buscar"
              className="px-8 py-4 rounded-lg font-bold flex items-center gap-2 transition-all"
              style={{
                background: '#D4A017',
                color: '#402d00',
                boxShadow: '0 0 0 0 rgba(212,160,23,0.3)',
              }}
              onMouseEnter={undefined}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>person_search</span>
              INICIAR BÚSQUEDA
            </Link>
            <Link href="/primeros-auxilios"
              className="px-8 py-4 rounded-lg font-bold transition-all hover:brightness-110"
              style={{ border: '2px solid #8f9098', color: '#d8e2ff' }}>
              GUÍA DE SUPERVIVENCIA
            </Link>
          </div>
        </section>

        {/* 4. Stat Counters */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <StatsCounter stats={stats} />
        </section>

        {/* 5. Action Cards 2x2 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          <Link href="/registro?rol=rescuer"
            className="group p-8 rounded-xl border flex gap-6 items-start transition-all cursor-pointer"
            style={{
              background: '#0f1f3b',
              borderColor: '#45464d',
            }}>
            <div className="p-4 rounded-lg shrink-0" style={{ background: '#352500', color: '#f6be39' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>construction</span>
            </div>
            <div>
              <h3 className="mb-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
                Soy rescatista
              </h3>
              <p className="mb-4" style={{ color: '#c5c6ce', fontSize: '16px', lineHeight: 1.6 }}>
                Registra víctimas desde campo o por WhatsApp. Herramientas para brigadas y voluntarios.
              </p>
              <div className="px-6 py-2 rounded font-bold uppercase text-sm inline-block"
                style={{ background: '#D4A017', color: '#402d00' }}>
                Registrar Hallazgo
              </div>
            </div>
          </Link>

          <Link href="/buscar"
            className="group p-8 rounded-xl border flex gap-6 items-start transition-all cursor-pointer hover:border-[#D4A017]"
            style={{ background: '#0f1f3b', borderColor: '#45464d' }}>
            <div className="p-4 rounded-lg shrink-0" style={{ background: '#352500', color: '#f6be39' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>search</span>
            </div>
            <div>
              <h3 className="mb-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
                Busco a alguien
              </h3>
              <p className="mb-4" style={{ color: '#c5c6ce', fontSize: '16px', lineHeight: 1.6 }}>
                Encuentra a un familiar en hospitales y refugios activos. Base de datos unificada nacional.
              </p>
              <span className="font-bold text-sm uppercase tracking-wider group-hover:underline"
                style={{ color: '#D4A017' }}>
                Consultar Registro →
              </span>
            </div>
          </Link>

          <Link href="/mapa-publico"
            className="group p-8 rounded-xl border flex gap-6 items-start transition-all cursor-pointer hover:border-[#D4A017]"
            style={{ background: '#0f1f3b', borderColor: '#45464d' }}>
            <div className="p-4 rounded-lg shrink-0" style={{ background: '#352500', color: '#f6be39' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>map</span>
            </div>
            <div>
              <h3 className="mb-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
                Ver el mapa
              </h3>
              <p className="mb-4" style={{ color: '#c5c6ce', fontSize: '16px', lineHeight: 1.6 }}>
                Hospitales y refugios con capacidad en tiempo real. Zonas de riesgo y corredores seguros.
              </p>
              <span className="font-bold text-sm uppercase tracking-wider group-hover:underline"
                style={{ color: '#D4A017' }}>
                Abrir Mapa Crítico →
              </span>
            </div>
          </Link>

          <Link href="/primeros-auxilios"
            className="group p-8 rounded-xl border flex gap-6 items-start transition-all cursor-pointer hover:border-[#D4A017]"
            style={{ background: '#0f1f3b', borderColor: '#45464d' }}>
            <div className="p-4 rounded-lg shrink-0" style={{ background: '#352500', color: '#f6be39' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>medical_services</span>
            </div>
            <div>
              <h3 className="mb-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
                Primeros auxilios
              </h3>
              <p className="mb-4" style={{ color: '#c5c6ce', fontSize: '16px', lineHeight: 1.6 }}>
                Protocolos offline: RCP, hemorragias, shock, fracturas. Descarga la guía rápida ahora.
              </p>
              <span className="font-bold text-sm uppercase tracking-wider group-hover:underline"
                style={{ color: '#D4A017' }}>
                Ver Protocolos →
              </span>
            </div>
          </Link>
        </section>

        {/* 6. Trust section */}
        <section className="py-16" style={{ borderTop: '1px solid #45464d' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { icon: 'security', title: 'Privacidad ante todo', desc: 'Datos encriptados. Solo personal autorizado y familiares directos pueden ver detalles sensibles.' },
              { icon: 'signal_wifi_off', title: 'Funciona sin internet', desc: 'Tecnología de sincronización asíncrona para zonas con baja o nula cobertura celular.' },
              { icon: 'chat', title: 'Bot de WhatsApp', desc: 'Reporta y busca a través de nuestro bot oficial. Bajo consumo de datos y máxima rapidez.' },
            ].map(item => (
              <div key={item.icon} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ background: '#263552', color: '#f6be39' }}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h4 className="font-bold mb-2"
                  style={{ fontFamily: "'Manrope', sans-serif", fontSize: '24px', lineHeight: 1.2, color: '#d8e2ff' }}>
                  {item.title}
                </h4>
                <p className="px-4" style={{ color: '#c5c6ce', fontSize: '14px' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="w-full mt-24 pt-16 pb-0 overflow-hidden"
        style={{ background: '#000d28', borderTop: '4px solid #D4A017' }}>
        <div className="max-w-[1280px] mx-auto px-6 pb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full flex items-center justify-center font-black"
                style={{ background: '#D4A017', color: '#402d00' }}>
                RV
              </div>
              <span className="font-bold text-lg" style={{ fontFamily: "'Manrope', sans-serif" }}>RescateVZ</span>
            </div>
            <p className="max-w-sm text-sm" style={{ color: '#c5c6ce' }}>
              © 2026 RescateVZ. Plataforma de Coordinación Humanitaria de Emergencia.<br />
              Desarrollado para la resiliencia venezolana.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2">
            {[['Protocolos', '/primeros-auxilios'], ['Privacidad', '/guia'], ['Contacto', '/whatsapp'], ['Soporte', '/guia']].map(([label, href]) => (
              <Link key={label} href={href}
                className="uppercase hover:text-yellow-400 transition-colors"
                style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#c5c6ce' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="w-full h-1 flex">
          <div className="h-full flex-[2]" style={{ background: '#FFCC00' }} />
          <div className="h-full flex-[1]" style={{ background: '#00247D' }} />
          <div className="h-full flex-[1]" style={{ background: '#CF142B' }} />
        </div>
      </footer>
    </div>
  )
}
