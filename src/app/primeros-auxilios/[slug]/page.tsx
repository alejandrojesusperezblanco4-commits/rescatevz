import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GUIAS, getGuia, SEVERIDAD_CONFIG } from '@/data/primeros-auxilios'

export function generateStaticParams() {
  return GUIAS.map(g => ({ slug: g.slug }))
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guia = getGuia(slug)
  if (!guia) notFound()

  const cfg = SEVERIDAD_CONFIG[guia.severidad]
  const isCritico = guia.severidad === 'critico'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      <header className="px-6 py-3 flex items-center justify-between"
        style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/primeros-auxilios"
          className="flex items-center gap-1 text-sm transition-colors hover:text-white"
          style={{ color: '#94A3B8' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Volver
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs"
            style={{ background: '#1e2d4a', border: '1.5px solid #D4A017', color: '#D4A017' }}>
            RV
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {/* Encabezado de guía */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{guia.icono}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
            {guia.titulo}
          </h1>
          <p style={{ color: '#94A3B8' }}>{guia.resumen}</p>
        </div>

        {/* Advertencia inicial */}
        {guia.advertencia_inicial && (
          <div className="p-4 rounded-xl mb-6"
            style={{ background: 'rgba(220,38,38,0.10)', borderLeft: '4px solid #DC2626' }}>
            <p className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>
              ⚠️ {guia.advertencia_inicial}
            </p>
          </div>
        )}

        {/* Pasos */}
        <div className="rounded-xl p-6 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <h2 className="font-bold mb-5" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
            Pasos a seguir
          </h2>
          <ol className="space-y-5">
            {guia.pasos.map((paso, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: isCritico ? '#DC2626' : '#D4A017', color: isCritico ? '#fff' : '#1a2744' }}>
                  {i + 1}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm leading-relaxed" style={{ color: '#d0d8f0' }}>{paso.texto}</p>
                  {paso.alerta && (
                    <div className="mt-2 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
                      <p className="text-xs font-medium" style={{ color: '#FCD34D' }}>⚠️ {paso.alerta}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* No hacer */}
        <div className="rounded-xl p-5 mb-6"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <h2 className="font-bold mb-3" style={{ fontFamily: 'Manrope, sans-serif', color: '#FCA5A5' }}>
            ✗ No hagas esto
          </h2>
          <ul className="space-y-2">
            {guia.no_hacer.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0" style={{ color: '#DC2626' }}>✗</span>
                <span className="text-sm" style={{ color: '#FCA5A5' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cuándo llamar */}
        <div className="rounded-xl p-5 mb-10"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <h2 className="font-bold mb-1 flex items-center gap-2"
            style={{ fontFamily: 'Manrope, sans-serif', color: '#93C5FD' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>phone</span>
            Cuándo llamar a emergencias
          </h2>
          <p className="text-sm" style={{ color: '#93C5FD' }}>{guia.cuando_llamar_emergencias}</p>
        </div>

        {/* Otras guías */}
        <div style={{ borderTop: '1px solid rgba(36,51,86,0.5)', paddingTop: '1.5rem' }}>
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
            Otras guías
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GUIAS.filter(g => g.slug !== guia.slug).map(g => (
              <Link key={g.slug} href={`/primeros-auxilios/${g.slug}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:brightness-110"
                style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)', color: '#d0d8f0' }}>
                <span>{g.icono}</span>
                <span className="truncate">{g.titulo}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
