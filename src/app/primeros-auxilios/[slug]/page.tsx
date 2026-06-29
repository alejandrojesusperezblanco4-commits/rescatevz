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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <Link href="/primeros-auxilios" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          ← Volver
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm">RV</div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Título */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{guia.icono}</span>
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{guia.titulo}</h1>
          <p className="text-gray-600 mt-1">{guia.resumen}</p>
        </div>

        {/* Advertencia inicial */}
        {guia.advertencia_inicial && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl mb-6">
            <p className="text-sm font-semibold text-red-800">⚠️ {guia.advertencia_inicial}</p>
          </div>
        )}

        {/* Pasos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Pasos a seguir</h2>
          <ol className="space-y-4">
            {guia.pasos.map((paso, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-gray-800 leading-relaxed">{paso.texto}</p>
                  {paso.alerta && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-amber-800 font-medium">⚠️ {paso.alerta}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* No hacer */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <h2 className="font-bold text-red-800 mb-3">❌ No hagas esto</h2>
          <ul className="space-y-2">
            {guia.no_hacer.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                <span className="text-sm text-red-800">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cuándo llamar */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
          <h2 className="font-bold text-blue-800 mb-1">📞 Cuándo llamar a emergencias</h2>
          <p className="text-sm text-blue-800">{guia.cuando_llamar_emergencias}</p>
        </div>

        {/* Navegación entre guías */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Otras guías</p>
          <div className="grid grid-cols-2 gap-2">
            {GUIAS.filter(g => g.slug !== guia.slug).map(g => (
              <Link
                key={g.slug}
                href={`/primeros-auxilios/${g.slug}`}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
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
