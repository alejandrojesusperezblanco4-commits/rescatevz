import Link from 'next/link'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+1 (número pendiente)'

export default function WhatsappPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>

      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold text-sm">RV</div>
          <span className="font-bold text-lg">Registro por WhatsApp</span>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-white">← Inicio</Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 flex gap-3">
          <span className="text-2xl shrink-0">📱</span>
          <div>
            <p className="font-semibold text-green-800">Para rescatistas sin acceso a internet</p>
            <p className="text-sm text-green-700 mt-0.5">
              Si estás en campo sin WiFi, puedes registrar víctimas enviando un WhatsApp o SMS
              al número de RescateVZ. Solo necesitas datos móviles básicos.
            </p>
          </div>
        </div>

        {/* Número */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Número de WhatsApp / SMS</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900 tracking-wide">{WHATSAPP_NUMBER}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Guarda este número en tus contactos como "RescateVZ"
          </p>
        </div>

        {/* Requisito */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Requisito previo</p>
          <p className="text-sm text-amber-700">
            Tu número de teléfono debe estar registrado en tu perfil de RescateVZ y tu cuenta debe
            estar verificada por un administrador. Si no lo has hecho,{' '}
            <Link href="/registro?rol=rescuer" className="underline font-medium">regístrate aquí</Link>.
          </p>
        </div>

        {/* Formato */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Formato del mensaje</h2>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm mb-4">
            V nombre | descripción | estado | lugar | hospital
          </div>

          <div className="space-y-3">
            <Campo nombre="nombre" descripcion='Nombre de la víctima. Si se desconoce, escribe "sin nombre"' />
            <Campo nombre="descripción" descripcion="Características físicas: complexión, cabello, ropa, señas particulares" />
            <Campo nombre="estado" descripcion="vivo · critico · fallecido · desconocido" />
            <Campo nombre="lugar" descripcion="Calle, sector o zona donde fue encontrada" />
            <Campo nombre="hospital" descripcion="Nombre (parcial) del hospital o refugio actual. Opcional." />
          </div>
        </div>

        {/* Ejemplos */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Ejemplos</h2>
          <div className="space-y-4">
            <Ejemplo
              titulo="Persona identificada, con vida"
              mensaje="V Juan Pérez | hombre 40 años camisa azul jeans | vivo | Calle El Paraíso entre Rosales y Sta Rosa | Hospital Universitario"
            />
            <Ejemplo
              titulo="Persona desconocida, estado crítico"
              mensaje="V sin nombre | mujer aprox 60 años cabello blanco vestido floreado | critico | Ave Libertador frente al CC Sambil | Pérez Carreño"
            />
            <Ejemplo
              titulo="Solo nombre y descripción (mínimo)"
              mensaje="V María González | mujer joven 25 años pelo negro corto cicatriz en mejilla derecha | desconocido"
            />
          </div>
        </div>

        {/* Respuesta del bot */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Qué recibirás de respuesta</h2>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 font-mono text-sm text-gray-700 whitespace-pre-line">
{`✅ Víctima registrada
ID: A1B2C3D4
Nombre: Juan Pérez
Estado: ✅ Con vida
Lugar: Calle El Paraíso
Hospital: Hospital Universitario de Caracas

Ver: rescatevz.up.railway.app/victima/...`}
          </div>
        </div>

        {/* Comandos */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-bold text-gray-900 mb-3">Otros comandos</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono shrink-0">AYUDA</code>
              <p className="text-sm text-gray-600">Muestra el formato de registro</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Campo({ nombre, descripcion }: { nombre: string; descripcion: string }) {
  return (
    <div className="flex items-start gap-3">
      <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-mono shrink-0 mt-0.5">{nombre}</code>
      <p className="text-sm text-gray-600">{descripcion}</p>
    </div>
  )
}

function Ejemplo({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{titulo}</p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 font-mono text-xs text-green-800 break-all">
        {mensaje}
      </div>
    </div>
  )
}
