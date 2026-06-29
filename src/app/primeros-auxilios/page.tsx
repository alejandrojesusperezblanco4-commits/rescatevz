import Link from 'next/link'
import { GUIAS, SEVERIDAD_CONFIG } from '@/data/primeros-auxilios'

export default function PrimerosauxiliosPage() {
  const criticos = GUIAS.filter(g => g.severidad === 'critico')
  const urgentes = GUIAS.filter(g => g.severidad === 'urgente')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm">RV</div>
          <span className="font-bold text-lg">Primeros auxilios</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Inicio</Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3">
          <span className="text-xl shrink-0">📵</span>
          <p className="text-sm text-amber-800">
            <strong>Funciona sin internet.</strong> Guarda esta página ahora para acceder sin conexión.
            Estas guías son de orientación — siempre sigue las instrucciones del personal médico en campo.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">
            🔴 Situaciones críticas — actúa en segundos
          </h2>
          <div className="space-y-3">
            {criticos.map(g => (
              <GuiaCard key={g.slug} guia={g} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">
            🟠 Situaciones urgentes
          </h2>
          <div className="space-y-3">
            {urgentes.map(g => (
              <GuiaCard key={g.slug} guia={g} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function GuiaCard({ guia }: { guia: typeof GUIAS[number] }) {
  const cfg = SEVERIDAD_CONFIG[guia.severidad]
  return (
    <Link
      href={`/primeros-auxilios/${guia.slug}`}
      className="flex items-center gap-4 bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-colors group"
    >
      <span className="text-3xl shrink-0">{guia.icono}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
            {guia.titulo}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">{guia.resumen}</p>
      </div>
      <span className="text-gray-300 group-hover:text-gray-500 text-xl shrink-0">›</span>
    </Link>
  )
}
