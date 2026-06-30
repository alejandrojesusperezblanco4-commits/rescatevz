import Link from 'next/link'

export default function GuiaPage() {
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
          <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>Guía de uso</span>
        </div>
        <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: '#94A3B8' }}>← Inicio</Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-10">

        {/* Intro */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Qué es RescateVZ?</h1>
          <p className="text-gray-600">
            Plataforma segura para registrar y localizar víctimas del terremoto. Conecta a rescatistas en campo,
            personal médico y familias que buscan a sus seres queridos — con protección especial para menores de edad.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <RolChip icon="🦺" label="Rescatista" color="orange" />
            <RolChip icon="🩺" label="Personal médico" color="blue" />
            <RolChip icon="👨‍👩‍👧" label="Familiar" color="green" />
            <RolChip icon="⚙️" label="Administrador" color="gray" />
          </div>
        </div>

        {/* Rescatistas */}
        <Section
          icon="🦺"
          title="Para rescatistas en campo"
          color="orange"
          steps={[
            { n: 1, text: 'Regístrate en /registro seleccionando "Soy rescatista". Necesitas tu número de cédula.' },
            { n: 2, text: 'Espera la aprobación de un administrador (menos de 2 horas). Recibirás acceso completo.' },
            { n: 3, text: 'Ve a "Registrar víctima" y completa el formulario: descripción física, estado de salud, lugar encontrado, hospital actual y foto.' },
            { n: 4, text: 'Si no tienes internet, usa el bot de WhatsApp: escribe al número dedicado describiendo la víctima en lenguaje natural.' },
            { n: 5, text: 'Si la persona es menor de edad, marca la casilla "Menor de edad". El perfil quedará oculto al público automáticamente.' },
          ]}
          tips={[
            'No necesitas saber el nombre — la descripción física es suficiente.',
            'Puedes subir varias fotos por registro.',
            'Cada registro queda guardado con tu identificación para trazabilidad.',
          ]}
        />

        {/* Médicos */}
        <Section
          icon="🩺"
          title="Para personal médico y enfermeros"
          color="blue"
          steps={[
            { n: 1, text: 'Regístrate seleccionando "Personal médico". El hospital o coordinador médico puede validar tu acceso.' },
            { n: 2, text: 'Una vez verificado, accede a la lista de víctimas desde "Víctimas" en el menú.' },
            { n: 3, text: 'Abre el perfil de cualquier víctima y haz clic en "Actualizar estado médico" para cambiar el estado, el hospital asignado o añadir notas clínicas.' },
            { n: 4, text: 'Solo tú y los administradores pueden ver y actualizar perfiles de menores de edad.' },
            { n: 5, text: 'Usa "Reportes de menores" en el menú para revisar solicitudes de familias que buscan a niños.' },
          ]}
          tips={[
            'Las fotos de víctimas nunca son públicas — solo el personal autorizado puede verlas.',
            'Cada actualización queda registrada en el historial de auditoría.',
          ]}
        />

        {/* Familias */}
        <Section
          icon="👨‍👩‍👧"
          title="Para familias que buscan a alguien"
          color="green"
          steps={[
            { n: 1, text: 'Ve a "Buscar familiar" (no necesitas cuenta). Escribe el nombre o descripción física de la persona.' },
            { n: 2, text: 'Si hay coincidencia, verás el hospital o refugio donde está — sin fotos ni datos personales todavía.' },
            { n: 3, text: 'Haz clic en "Ver detalles" y sube una foto de tu cédula de identidad para verificar quién eres.' },
            { n: 4, text: 'Un administrador revisará tu solicitud en menos de 2 horas y te dará acceso temporal al perfil completo (48 horas).' },
            { n: 5, text: 'Si buscas a un menor de edad, usa el botón especial "Reportar caso de menor" — no aparecen en la búsqueda pública por protección.' },
          ]}
          tips={[
            'Regístrate para recibir alertas cuando haya actualizaciones del familiar que buscas.',
            'El acceso a fotos expira en 48 horas — vuelve a solicitarlo si necesitas más tiempo.',
            'Nunca habrá contacto directo entre rescatistas y familias — todo pasa por el sistema.',
          ]}
        />

        {/* Bot WhatsApp */}
        <Section
          icon="📱"
          title="Bot de WhatsApp para rescatistas"
          color="purple"
          steps={[
            { n: 1, text: 'Tu número de teléfono debe estar registrado en tu perfil de RescateVZ.' },
            { n: 2, text: 'Escribe al número de RescateVZ desde tu WhatsApp. Envía "AYUDA" para ver los comandos.' },
            { n: 3, text: 'Para registrar una víctima, simplemente descríbela en lenguaje natural: "Encontré a un hombre de 50 años, camisa roja, vivo, en la Av. Libertador".' },
            { n: 4, text: 'El agente entiende lenguaje natural, extrae los datos y confirma el registro con un ID.' },
            { n: 5, text: 'También puedes preguntar por protocolos de primeros auxilios: "cómo hago RCP" o "qué hago con una hemorragia".' },
          ]}
          tips={[
            'Funciona aunque tengas mala señal — solo necesitas datos móviles básicos para WhatsApp.',
            'No uses comandos fijos — habla normal.',
          ]}
        />

        {/* Admins */}
        <Section
          icon="⚙️"
          title="Para administradores"
          color="gray"
          steps={[
            { n: 1, text: 'Desde "Verificar staff" aprueba o rechaza solicitudes de rescatistas y médicos.' },
            { n: 2, text: 'Desde "Solicitudes" revisa y aprueba peticiones de familias para ver perfiles completos. Verifica la cédula antes de aprobar.' },
            { n: 3, text: 'Desde "Reportes de menores" gestiona manualmente los casos de niños desaparecidos.' },
            { n: 4, text: 'Desde "Ubicaciones" añade nuevos hospitales y refugios al mapa — necesitas las coordenadas (clic derecho en Google Maps).' },
            { n: 5, text: 'El audit log registra cada acción sensible. Está disponible directamente en Supabase → Table Editor → audit_log.' },
          ]}
          tips={[
            'Para dar acceso de admin a alguien: Supabase → SQL Editor → UPDATE profiles SET role = \'admin\' WHERE email = \'correo@ejemplo.com\'',
            'Las aprobaciones de acceso familiar expiran en 48 horas automáticamente.',
          ]}
        />

        {/* Primeros auxilios */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h2 className="font-bold text-green-900 text-lg mb-2">🩺 Guías de primeros auxilios</h2>
          <p className="text-green-800 text-sm mb-4">
            8 protocolos validados disponibles sin internet una vez cacheados: RCP, hemorragias, shock, síndrome de aplastamiento,
            fracturas, quemaduras, pérdida de consciencia y obstrucción de vía aérea.
          </p>
          <Link
            href="/primeros-auxilios"
            className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Ver guías →
          </Link>
        </div>

        {/* Contacto */}
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Problemas o preguntas? Contacta al equipo de RescateVZ en{' '}
            <a href="mailto:alejandrojesusperezblanco4@gmail.com" className="text-red-600 hover:underline font-medium">
              alejandrojesusperezblanco4@gmail.com
            </a>
          </p>
        </div>

      </main>
    </div>
  )
}

function RolChip({ icon, label, color }: { icon: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-200 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <div className={`rounded-lg px-3 py-2 text-center text-xs font-medium ${colors[color]}`}>
      <div className="text-xl mb-0.5">{icon}</div>
      {label}
    </div>
  )
}

function Section({ icon, title, color, steps, tips }: {
  icon: string
  title: string
  color: string
  steps: { n: number; text: string }[]
  tips: string[]
}) {
  const colors: Record<string, string> = {
    orange: 'border-orange-200 bg-orange-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    gray: 'border-gray-200 bg-gray-50',
    purple: 'border-purple-200 bg-purple-50',
  }
  const titleColors: Record<string, string> = {
    orange: 'text-orange-900', blue: 'text-blue-900',
    green: 'text-green-900', gray: 'text-gray-900', purple: 'text-purple-900',
  }
  const stepColors: Record<string, string> = {
    orange: 'bg-orange-600', blue: 'bg-blue-600',
    green: 'bg-green-600', gray: 'bg-gray-600', purple: 'bg-purple-600',
  }
  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <h2 className={`font-bold text-xl mb-5 ${titleColors[color]}`}>{icon} {title}</h2>
      <ol className="space-y-3 mb-5">
        {steps.map(s => (
          <li key={s.n} className="flex items-start gap-3">
            <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 ${stepColors[color]}`}>
              {s.n}
            </span>
            <p className="text-sm text-gray-800 leading-relaxed">{s.text}</p>
          </li>
        ))}
      </ol>
      {tips.length > 0 && (
        <div className="border-t border-black/10 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Consejos</p>
          <ul className="space-y-1">
            {tips.map((t, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 shrink-0">→</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
