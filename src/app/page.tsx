import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatsCounter from '@/components/StatsCounter'
import ActivityFeed from '@/components/ActivityFeed'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ayuda:     { bg: 'rgba(34,197,94,0.12)',  text: '#86EFAC', label: 'Ayuda' },
  corredor:  { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD', label: 'Corredor' },
  recursos:  { bg: 'rgba(212,160,23,0.12)', text: '#FCD34D', label: 'Recursos' },
  alerta:    { bg: 'rgba(220,38,38,0.12)',  text: '#FCA5A5', label: 'Alerta' },
  general:   { bg: 'rgba(100,116,139,0.12)',text: '#CBD5E1', label: 'General' },
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'hace menos de 1h'
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

export default async function LandingPage() {
  const supabase = await createClient()

  const [
    { count: totalVictims },
    { count: alive },
    { count: locations },
    { count: minors },
    { count: familiasReunidas },
    { data: latestNews },
  ] = await Promise.all([
    supabase.from('victims').select('*', { count: 'exact', head: true }),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('status', 'alive'),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('victims').select('*', { count: 'exact', head: true }).eq('is_minor', true),
    supabase.from('access_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('news_posts').select('id, title, category, published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(3),
  ])

  const stats = [
    { label: 'Personas registradas', value: totalVictims || 0, color: '', borderColor: '#D4A017', icon: 'group', iconColor: '#D4A017' },
    { label: 'Con vida confirmada',   value: alive || 0,        color: '', borderColor: '#22C55E', icon: 'favorite', iconColor: '#22C55E' },
    { label: 'Centros activos',       value: locations || 0,    color: '', borderColor: '#3B82F6', icon: 'home_work', iconColor: '#3B82F6' },
    { label: 'Menores protegidos',    value: minors || 0,       color: '', borderColor: '#A855F7', icon: 'child_care', iconColor: '#A855F7' },
  ]

  return (
    <div style={{ background: '#1a2744', color: '#d8e2ff', fontFamily: "'Inter', sans-serif" }} className="min-h-screen flex flex-col overflow-x-hidden">

      {/* ── Banner emergencia ── */}
      <div className="w-full text-white py-2 px-6 text-center z-[100] relative"
        style={{ background: '#DC2626' }}>
        <p className="font-bold uppercase flex items-center justify-center gap-2"
          style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>error</span>
          EMERGENCIA ACTIVA — Terremotos M7.2 + M7.5 · Venezuela · 24 junio 2026 — Más de 50.000 personas sin paradero
        </p>
      </div>

      {/* ── Header ── */}
      <header className="w-full sticky top-0 z-50"
        style={{ background: 'rgba(26,39,68,0.95)', borderBottom: '1px solid rgba(69,70,77,0.6)', backdropFilter: 'blur(12px)' }}>
        <nav className="flex justify-between items-center px-6 py-4 w-full max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="RescateVZ" className="h-8 w-8" />
              <span className="font-bold text-lg" style={{ fontFamily: "'Manrope', sans-serif", color: '#d8e2ff' }}>
                RescateVZ
              </span>
            </div>
            <div className="hidden md:flex gap-6">
              {[['Noticias', '/noticias'], ['Guía', '/guia'], ['Primeros auxilios', '/primeros-auxilios']].map(([label, href]) => (
                <Link key={label} href={href} className="font-medium transition-colors hover:text-yellow-400" style={{ color: '#c5c6ce' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 font-bold rounded-lg transition-all hover:brightness-110" style={{ color: '#d8e2ff' }}>
              Iniciar sesión
            </Link>
            <Link href="/registro"
              className="px-5 py-2 font-bold rounded-lg transition-all hover:brightness-110 active:scale-95"
              style={{ background: '#D4A017', color: '#402d00', fontSize: '14px' }}>
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      <main className="w-full max-w-[1280px] mx-auto px-6">

        {/* ── Hero ── */}
        <section className="py-20 md:py-28 text-center relative">
          {/* Dot grid background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(212,160,23,0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
          }} />

          {/* Badge pulsante */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)' }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#DC2626' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FCA5A5' }}>
              Emergencia activa · Venezuela 2026
            </span>
          </div>

          <h1 className="mb-6 max-w-3xl mx-auto relative"
            style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: 800 }}>
            Venezuela,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #f6be39 0%, #D4A017 50%, #ffdd70 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              te buscamos.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#c5c6ce', fontSize: '17px' }}>
            Registra a quien encontraste. Busca a quien perdiste. Coordina el rescate.
            <br className="hidden md:block" />
            Plataforma humanitaria en tiempo real — abierta, sin registro previo.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Link href="/buscar"
              className="px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-95"
              style={{
                background: '#D4A017',
                color: '#402d00',
                boxShadow: '0 0 24px rgba(212,160,23,0.35), 0 4px 12px rgba(0,0,0,0.3)',
              }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
              INICIAR BÚSQUEDA
            </Link>
            <Link href="/primeros-auxilios"
              className="px-8 py-4 rounded-xl font-bold transition-all hover:brightness-110 hover:border-[#D4A017]"
              style={{ border: '2px solid rgba(143,144,152,0.5)', color: '#d8e2ff' }}>
              GUÍA DE SUPERVIVENCIA
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm mt-1" style={{ color: '#64748B' }}>
            {alive !== null && alive > 0 && (
              <span><span style={{ color: '#22C55E', fontWeight: 600 }}>{alive.toLocaleString('es-VE')}</span> con vida confirmada</span>
            )}
            {familiasReunidas !== null && familiasReunidas > 0 && (
              <span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>family_restroom</span>
                {' '}<span style={{ color: '#D4A017', fontWeight: 600 }}>{familiasReunidas.toLocaleString('es-VE')}</span> familias ya encontraron respuesta
              </span>
            )}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#64748B' }}>
              En vivo · actualizado en tiempo real
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCounter stats={stats} />
          </div>
        </section>

        {/* ── Feed de actividad ── */}
        <ActivityFeed />

        {/* ── Últimas noticias ── */}
        {latestNews && latestNews.length > 0 && (
          <section className="mb-16 rounded-2xl p-6"
            style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ fontFamily: "'Manrope', sans-serif", color: '#F0F4FF' }}>
                Últimas actualizaciones
              </h2>
              <Link href="/noticias" className="text-xs font-medium hover:underline" style={{ color: '#D4A017' }}>
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {latestNews.map(post => {
                const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.general
                return (
                  <Link key={post.id} href="/noticias"
                    className="block p-4 rounded-xl transition-all hover:brightness-110"
                    style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2 font-medium"
                      style={{ background: cat.bg, color: cat.text }}>
                      {cat.label}
                    </span>
                    <p className="text-sm font-medium leading-snug mb-1" style={{ color: '#F0F4FF' }}>
                      {post.title}
                    </p>
                    <p className="text-xs" style={{ color: '#475569' }}>
                      {timeAgo(post.published_at)}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Action Cards ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {[
            {
              href: '/registro?rol=rescuer',
              icon: 'construction',
              title: 'Soy rescatista',
              desc: 'Registra víctimas desde campo. Formulario optimizado para móvil y chat IA integrado.',
              cta: 'Registrar Hallazgo',
              ctaBg: '#D4A017',
              ctaColor: '#402d00',
            },
            {
              href: '/buscar',
              icon: 'manage_search',
              title: 'Busco a alguien',
              desc: 'Encuentra a un familiar en hospitales y refugios activos. Base de datos unificada nacional.',
              cta: 'Consultar Registro →',
              ctaBg: 'transparent',
              ctaColor: '#D4A017',
            },
            {
              href: '/mapa-publico',
              icon: 'location_on',
              title: 'Ver el mapa',
              desc: 'Hospitales y refugios con capacidad en tiempo real. Zonas de riesgo y corredores seguros.',
              cta: 'Abrir Mapa →',
              ctaBg: 'transparent',
              ctaColor: '#D4A017',
            },
            {
              href: '/primeros-auxilios',
              icon: 'medical_services',
              title: 'Primeros auxilios',
              desc: 'Protocolos offline: RCP, hemorragias, shock, fracturas. Descarga la guía rápida.',
              cta: 'Ver Protocolos →',
              ctaBg: 'transparent',
              ctaColor: '#D4A017',
            },
          ].map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="group p-8 rounded-2xl flex gap-6 items-start transition-all duration-200 hover:border-[#D4A017] hover:scale-[1.01]"
              style={{ background: '#0f1f3b', border: '1px solid rgba(69,70,77,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
              <div className="p-4 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: 'rgba(212,160,23,0.1)', color: '#f6be39', border: '1px solid rgba(212,160,23,0.2)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>
                  {card.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="mb-2 flex items-center gap-2"
                  style={{ fontFamily: "'Manrope', sans-serif", fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>
                  {card.title}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#D4A017' }}>→</span>
                </h3>
                <p className="mb-4 text-sm leading-relaxed" style={{ color: '#c5c6ce' }}>
                  {card.desc}
                </p>
                <span
                  className="px-4 py-2 rounded-lg font-bold text-sm inline-block transition-all"
                  style={{ background: card.ctaBg, color: card.ctaColor, border: card.ctaBg === 'transparent' ? '1px solid rgba(212,160,23,0.3)' : 'none' }}>
                  {card.cta}
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* ── Cómo funciona ── */}
        <section className="mb-24" style={{ borderTop: '1px solid rgba(69,70,77,0.4)', paddingTop: '5rem' }}>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4A017' }}>
              Plataforma completa
            </p>
            <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#F0F4FF', lineHeight: 1.1 }}>
              ¿Cómo funciona RescateVZ?
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              Cada rol tiene acceso a las herramientas que necesita. El sistema conecta el campo con las familias de forma segura y verificada.
            </p>
          </div>

          {/* Flujo de 3 pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14 relative">
            {/* línea conectora en desktop */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px" style={{ background: 'rgba(212,160,23,0.3)' }} />
            {[
              { n: '01', icon: 'person_add', title: 'Se registra', desc: 'Un rescatista o médico encuentra a una persona y la registra desde su móvil en segundos, con foto y ubicación.' },
              { n: '02', icon: 'manage_search', title: 'La familia busca', desc: 'Un familiar busca por nombre o descripción. El sistema muestra coincidencias sin exponer datos sensibles.' },
              { n: '03', icon: 'family_restroom', title: 'Se reencuentran', desc: 'El familiar solicita acceso verificado. El coordinador aprueba y ambos quedan conectados.' },
            ].map(step => (
              <div key={step.n} className="flex flex-col items-center text-center p-6 rounded-2xl"
                style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 relative"
                  style={{ background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>
                    {step.icon}
                  </span>
                  <span className="absolute -top-2 -right-2 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ background: '#D4A017', color: '#1a2744' }}>{step.n}</span>
                </div>
                <h3 className="font-bold mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#F0F4FF' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Cards por rol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: 'construction', role: 'Rescatista', accent: '#DC2626',
                bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)',
                features: [
                  'Registra personas desde campo en segundos',
                  'Sube fotos para identificación biométrica',
                  'Importa listas de papel con visión IA',
                  'Reporta estructuras dañadas al mapa',
                  'Chat IA con protocolos de emergencia',
                ],
              },
              {
                icon: 'medical_services', role: 'Médico / Sanitario', accent: '#22C55E',
                bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)',
                features: [
                  'Accede a perfiles completos de víctimas',
                  'Actualiza estado médico en tiempo real',
                  'Coordina traslados entre centros activos',
                  'Gestiona menores con protección especial',
                  'Vista completa del mapa con ocupación',
                ],
              },
              {
                icon: 'group', role: 'Familiar', accent: '#D4A017',
                bg: 'rgba(212,160,23,0.08)', border: 'rgba(212,160,23,0.25)',
                features: [
                  'Busca por nombre o descripción física',
                  'Recibe notificación push si aparece tu búsqueda',
                  'Solicita acceso verificado al perfil completo',
                  'Comparte la búsqueda por WhatsApp',
                  'Guías de primeros auxilios disponibles offline',
                ],
              },
              {
                icon: 'apartment', role: 'Ingeniero / Arquitecto', accent: '#3B82F6',
                bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)',
                features: [
                  'Evalúa habitabilidad con semáforo verde/amarillo/rojo',
                  'Los resultados se publican en el mapa en tiempo real',
                  'Referencia con mapa satelital de daños NASA',
                  'Gestiona el registro de estructuras inspeccionadas',
                ],
              },
              {
                icon: 'shield_person', role: 'Coordinador / Admin', accent: '#A855F7',
                bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)',
                features: [
                  'Dashboard en tiempo real (Supabase Realtime)',
                  'Verifica identidad de rescatistas y médicos',
                  'Importa datos de Venezuela Reporta y documentos',
                  'Publica noticias y alertas oficiales',
                  'Gestiona accesos de familias con audit log completo',
                ],
              },
              {
                icon: 'smart_toy', role: 'Asistente IA', accent: '#F97316',
                bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)',
                features: [
                  'Disponible 24/7 para cualquier usuario',
                  'Busca personas por nombre o descripción',
                  'Guía con protocolos de primeros auxilios',
                  'Informa sobre hospitales y refugios activos',
                  'Lee y extrae datos de fotos de documentos',
                ],
              },
            ].map(r => (
              <div key={r.role} className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${r.accent}22`, border: `1px solid ${r.accent}44` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: r.accent, fontVariationSettings: "'FILL' 1" }}>
                      {r.icon}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#F0F4FF' }}>
                    {r.role}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {r.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#94A3B8' }}>
                      <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: '14px', color: r.accent, fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust section ── */}
        <section className="py-16" style={{ borderTop: '1px solid rgba(69,70,77,0.4)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {[
              { icon: 'lock', title: 'Privacidad ante todo', desc: 'Datos encriptados. Solo personal autorizado y familiares directos pueden ver detalles sensibles. Los menores nunca aparecen en búsqueda pública.' },
              { icon: 'wifi_off', title: 'Funciona sin conexión', desc: 'Las guías de primeros auxilios y el mapa se cachean localmente. Trabaja en campo sin señal y sincroniza cuando regreses.' },
              { icon: 'smart_toy', title: 'IA disponible 24/7', desc: 'Asistente inteligente integrado para registrar víctimas, buscar personas y consultar protocolos médicos en cualquier momento.' },
            ].map(item => (
              <div key={item.icon} className="flex flex-col items-center group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{ background: 'rgba(212,160,23,0.1)', color: '#f6be39', border: '1px solid rgba(212,160,23,0.2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>
                    {item.icon}
                  </span>
                </div>
                <h4 className="font-bold mb-3" style={{ fontFamily: "'Manrope', sans-serif", fontSize: '20px', lineHeight: 1.2, color: '#d8e2ff' }}>
                  {item.title}
                </h4>
                <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full mt-16 pt-12 pb-0 overflow-hidden"
        style={{ background: '#000d28', borderTop: '3px solid #D4A017' }}>
        <div className="max-w-[1280px] mx-auto px-6 pb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="RescateVZ" className="h-9 w-9" />
              <span className="font-bold text-lg" style={{ fontFamily: "'Manrope', sans-serif" }}>RescateVZ</span>
            </div>
            <p className="max-w-sm text-sm" style={{ color: '#94A3B8' }}>
              © 2026 RescateVZ. Plataforma de Coordinación Humanitaria.<br />
              Proyecto de código abierto para la resiliencia venezolana.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            {[['Primeros auxilios', '/primeros-auxilios'], ['Guía de uso', '/guia'], ['Mapa de emergencia', '/mapa-publico'], ['Noticias', '/noticias']].map(([label, href]) => (
              <Link key={label} href={href}
                className="uppercase hover:text-yellow-400 transition-colors"
                style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#64748B' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        {/* Franja bandera venezolana */}
        <div className="w-full h-1 flex">
          <div className="h-full flex-[2]" style={{ background: '#FFCC00' }} />
          <div className="h-full flex-[1]" style={{ background: '#00247D' }} />
          <div className="h-full flex-[1]" style={{ background: '#CF142B' }} />
        </div>
      </footer>
    </div>
  )
}
