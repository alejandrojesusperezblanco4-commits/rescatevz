import Link from 'next/link'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+1 (número pendiente)'

export default function WhatsappPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      <header className="px-6 py-3 flex items-center justify-between"
        style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
            style={{ background: '#1e2d4a', border: '1.5px solid #D4A017', color: '#D4A017' }}>
            RV
          </div>
          <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>Registro por WhatsApp</span>
        </div>
        <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: '#94A3B8' }}>
          ← Inicio
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex gap-3 p-4 rounded-xl mb-8"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span className="material-symbols-outlined shrink-0" style={{ color: '#22C55E' }}>phone_android</span>
          <div>
            <p className="font-semibold text-sm mb-0.5" style={{ color: '#22C55E' }}>Para rescatistas sin acceso a internet</p>
            <p className="text-sm" style={{ color: '#d0d8f0' }}>
              Si estás en campo sin WiFi, puedes registrar víctimas enviando un WhatsApp o SMS.
              Solo necesitas datos móviles básicos.
            </p>
          </div>
        </div>

        {/* Número */}
        <div className="rounded-xl p-6 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <h2 className="font-bold mb-3" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
            Número de WhatsApp / SMS
          </h2>
          <div className="rounded-lg px-4 py-4 text-center"
            style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)' }}>
            <p className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Manrope, sans-serif', color: '#D4A017' }}>
              {WHATSAPP_NUMBER}
            </p>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: '#64748B' }}>
            Guarda este número en tus contactos como &quot;RescateVZ&quot;
          </p>
        </div>

        {/* Requisito */}
        <div className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#D4A017' }}>⚠️ Requisito previo</p>
          <p className="text-sm" style={{ color: '#d0d8f0' }}>
            Tu número de teléfono debe estar registrado en tu perfil y tu cuenta debe estar
            verificada por un administrador. Si no lo has hecho,{' '}
            <Link href="/registro?rol=rescuer" className="underline font-medium" style={{ color: '#D4A017' }}>
              regístrate aquí
            </Link>.
          </p>
        </div>

        {/* Formato */}
        <div className="rounded-xl p-6 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
            Formato del mensaje
          </h2>
          <div className="rounded-lg p-4 font-mono text-sm mb-5"
            style={{ background: '#0d1a2e', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
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
        <div className="rounded-xl p-6 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
            Ejemplos
          </h2>
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
        <div className="rounded-xl p-6 mb-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <h2 className="font-bold mb-3" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
            Qué recibirás de respuesta
          </h2>
          <pre className="rounded-lg p-4 font-mono text-xs overflow-x-auto"
            style={{ background: '#0d1a2e', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
{`✅ Víctima registrada
ID: A1B2C3D4
Nombre: Juan Pérez
Estado: ✅ Con vida
Lugar: Calle El Paraíso
Hospital: Hospital Universitario de Caracas

Ver: rescatevz.up.railway.app/victima/...`}
          </pre>
        </div>

        {/* Comandos */}
        <div className="rounded-xl p-6" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.5)' }}>
          <h2 className="font-bold mb-3" style={{ fontFamily: 'Manrope, sans-serif', color: '#F0F4FF' }}>
            Otros comandos
          </h2>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <code className="px-2 py-0.5 rounded text-sm font-mono shrink-0"
                style={{ background: 'rgba(212,160,23,0.12)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.2)' }}>
                AYUDA
              </code>
              <p className="text-sm" style={{ color: '#94A3B8' }}>Muestra el formato de registro</p>
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
      <code className="px-2 py-0.5 rounded text-xs font-mono shrink-0 mt-0.5"
        style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }}>
        {nombre}
      </code>
      <p className="text-sm" style={{ color: '#94A3B8' }}>{descripcion}</p>
    </div>
  )
}

function Ejemplo({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: '#64748B' }}>{titulo}</p>
      <div className="rounded-lg p-3 font-mono text-xs break-all"
        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: '#86EFAC' }}>
        {mensaje}
      </div>
    </div>
  )
}
