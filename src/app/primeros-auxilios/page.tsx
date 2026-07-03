import Link from 'next/link'
import { GUIAS, SEVERIDAD_CONFIG } from '@/data/primeros-auxilios'

export default function PrimerosauxiliosPage() {
  const criticos = GUIAS.filter(g => g.severidad === 'critico')
  const urgentes = GUIAS.filter(g => g.severidad === 'urgente')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      <header className="px-6 py-4 flex items-center justify-between"
        style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
            style={{ background: '#1e2d4a', border: '1.5px solid #D4A017', color: '#D4A017' }}>
            RV
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>Primeros auxilios</span>
          <span className="hidden sm:block text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(212,160,23,0.1)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.2)' }}>
            Funciona offline
          </span>
        </div>
        <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: '#94A3B8' }}>
          ← Inicio
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex gap-3 p-4 rounded-xl mb-10"
          style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
          <span className="material-symbols-outlined shrink-0" style={{ color: '#D4A017' }}>signal_wifi_off</span>
          <p className="text-sm" style={{ color: '#d0d8f0' }}>
            <strong style={{ color: '#D4A017' }}>Funciona sin internet.</strong> Guarda esta página ahora para
            acceder sin conexión. Estas guías son de orientación — siempre sigue las instrucciones del personal médico en campo.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
            style={{ color: '#DC2626' }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Situaciones críticas — actúa en segundos
          </h2>
          <div className="space-y-3">
            {criticos.map(g => <GuiaCard key={g.slug} guia={g} />)}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
            style={{ color: '#D4A017' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#D4A017' }} />
            Situaciones urgentes
          </h2>
          <div className="space-y-3">
            {urgentes.map(g => <GuiaCard key={g.slug} guia={g} />)}
          </div>
        </section>
      </main>
    </div>
  )
}

function GuiaCard({ guia }: { guia: typeof GUIAS[number] }) {
  const cfg = SEVERIDAD_CONFIG[guia.severidad]
  const isCritico = guia.severidad === 'critico'
  return (
    <Link href={`/primeros-auxilios/${guia.slug}`}
      className="flex items-center gap-4 rounded-xl p-4 transition-all group hover:brightness-110"
      style={{ background: '#1e2d4a', border: `1px solid ${isCritico ? 'rgba(220,38,38,0.25)' : 'rgba(36,51,86,0.5)'}` }}>
      <span className="text-3xl shrink-0">{guia.icono}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold" style={{ color: '#F0F4FF' }}>{guia.titulo}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm line-clamp-2" style={{ color: '#94A3B8' }}>{guia.resumen}</p>
      </div>
      <span className="text-xl shrink-0 transition-transform group-hover:translate-x-1" style={{ color: '#64748B' }}>›</span>
    </Link>
  )
}
