import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Emergency banner */}
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium px-4">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm">
            RV
          </div>
          <span className="font-bold text-lg">RescateVZ</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded font-medium transition-colors">
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conectamos familias con sus seres queridos
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Plataforma segura para registrar víctimas rescatadas, localizar hospitales y refugios, y reunir familias.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/registro?rol=rescuer"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl p-6 text-left transition-colors"
            >
              <div className="text-3xl mb-3">🦺</div>
              <h2 className="font-bold text-lg mb-1">Soy rescatista</h2>
              <p className="text-red-100 text-sm">Registra personas rescatadas con foto e información médica</p>
            </Link>

            <Link
              href="/buscar"
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-red-300 text-gray-900 rounded-xl p-6 text-left transition-colors"
            >
              <div className="text-3xl mb-3">🔍</div>
              <h2 className="font-bold text-lg mb-1">Busco a alguien</h2>
              <p className="text-gray-500 text-sm">Encuentra a un familiar entre los registrados en hospitales y refugios</p>
            </Link>

            <Link
              href="/mapa-publico"
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 text-gray-900 rounded-xl p-6 text-left transition-colors"
            >
              <div className="text-3xl mb-3">🗺️</div>
              <h2 className="font-bold text-lg mb-1">Ver el mapa</h2>
              <p className="text-gray-500 text-sm">Hospitales y refugios activos con capacidad disponible</p>
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-400">
            ¿Eres médico o enfermero?{' '}
            <Link href="/registro?rol=medical" className="text-red-600 hover:underline font-medium">
              Registrarse como personal médico
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 text-center py-4 text-xs">
        <p>RescateVZ — Plataforma humanitaria sin fines de lucro · Venezuela 2026</p>
        <p className="mt-1">Los datos de menores están protegidos y solo accesibles por personal autorizado.</p>
      </footer>
    </div>
  )
}
