import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GUIAS, getGuia, SEVERIDAD_CONFIG } from '@/data/primeros-auxilios'
import PublicShell from '@/components/PublicShell'

export function generateStaticParams() {
  return GUIAS.map(g => ({ slug: g.slug }))
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guia = getGuia(slug)
  if (!guia) notFound()

  const cfg = SEVERIDAD_CONFIG[guia.severidad]

  return (
    <PublicShell
      headerRight={
        <Link href="/primeros-auxilios" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
          ← Volver
        </Link>
      }
      mainClassName="flex-1 max-w-2xl mx-auto w-full px-4 py-8"
    >
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
        <h1 className="text-2xl font-bold text-white">{guia.titulo}</h1>
        <p className="text-gray-400 mt-1">{guia.resumen}</p>
      </div>

      {/* Advertencia inicial */}
      {guia.advertencia_inicial && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl mb-6">
          <p className="text-sm font-semibold text-red-300">⚠️ {guia.advertencia_inicial}</p>
        </div>
      )}

      {/* Pasos */}
      <div className="rounded-xl border border-white/10 p-6 mb-6" style={{ background: '#161B22' }}>
        <h2 className="font-bold text-white mb-4">Pasos a seguir</h2>
        <ol className="space-y-4">
          {guia.pasos.map((paso, i) => (
            <li key={i} className="flex gap-4">
              <span
                className="flex-shrink-0 w-7 h-7 text-white rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: '#CF142B' }}
              >
                {i + 1}
              </span>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-gray-200 leading-relaxed">{paso.texto}</p>
                {paso.alerta && (
                  <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-200 font-medium">⚠️ {paso.alerta}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* No hacer */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-red-300 mb-3">❌ No hagas esto</h2>
        <ul className="space-y-2">
          {guia.no_hacer.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5 shrink-0">✗</span>
              <span className="text-sm text-red-200">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cuándo llamar */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 mb-8">
        <h2 className="font-bold text-blue-300 mb-1">📞 Cuándo llamar a emergencias</h2>
        <p className="text-sm text-blue-200">{guia.cuando_llamar_emergencias}</p>
      </div>

      {/* Navegación entre guías */}
      <div className="border-t border-white/10 pt-6">
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Otras guías</p>
        <div className="grid grid-cols-2 gap-2">
          {GUIAS.filter(g => g.slug !== guia.slug).map(g => (
            <Link
              key={g.slug}
              href={`/primeros-auxilios/${g.slug}`}
              className="flex items-center gap-2 border border-white/10 hover:border-white/30 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span>{g.icono}</span>
              <span className="truncate">{g.titulo}</span>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  )
}
