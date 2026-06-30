import Link from 'next/link'
import { GUIAS, SEVERIDAD_CONFIG } from '@/data/primeros-auxilios'
import PublicShell from '@/components/PublicShell'

export default function PrimerosauxiliosPage() {
  const criticos = GUIAS.filter(g => g.severidad === 'critico')
  const urgentes = GUIAS.filter(g => g.severidad === 'urgente')

  return (
    <PublicShell title="Primeros auxilios" mainClassName="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-xl shrink-0">📵</span>
        <p className="text-sm text-amber-200">
          <strong>Funciona sin internet.</strong> Guarda esta página ahora para acceder sin conexión.
          Estas guías son de orientación — siempre sigue las instrucciones del personal médico en campo.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
          🔴 Situaciones críticas — actúa en segundos
        </h2>
        <div className="space-y-3">
          {criticos.map(g => (
            <GuiaCard key={g.slug} guia={g} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">
          🟠 Situaciones urgentes
        </h2>
        <div className="space-y-3">
          {urgentes.map(g => (
            <GuiaCard key={g.slug} guia={g} />
          ))}
        </div>
      </section>
    </PublicShell>
  )
}

function GuiaCard({ guia }: { guia: typeof GUIAS[number] }) {
  const cfg = SEVERIDAD_CONFIG[guia.severidad]
  return (
    <Link
      href={`/primeros-auxilios/${guia.slug}`}
      className="flex items-center gap-4 border border-white/10 hover:border-white/30 rounded-xl p-4 transition-colors group"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <span className="text-3xl shrink-0">{guia.icono}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-white group-hover:text-red-400 transition-colors">
            {guia.titulo}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2">{guia.resumen}</p>
      </div>
      <span className="text-gray-600 group-hover:text-gray-400 text-xl shrink-0">›</span>
    </Link>
  )
}
