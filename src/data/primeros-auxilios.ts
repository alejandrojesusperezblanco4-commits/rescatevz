export type Severidad = 'critico' | 'urgente' | 'importante'

export interface Paso {
  texto: string
  alerta?: string   // advertencia en ese paso específico
}

export interface Guia {
  slug: string
  titulo: string
  icono: string
  severidad: Severidad
  resumen: string
  advertencia_inicial?: string
  pasos: Paso[]
  no_hacer: string[]
  cuando_llamar_emergencias: string
}

export const GUIAS: Guia[] = [
  {
    slug: 'rcp',
    titulo: 'Reanimación Cardiopulmonar (RCP)',
    icono: '❤️',
    severidad: 'critico',
    resumen: 'Para personas que no respiran y no tienen pulso. Actúa en los primeros 4 minutos.',
    advertencia_inicial: 'Llama a emergencias ANTES de iniciar. Si hay otra persona contigo, una llama y otra hace RCP simultáneamente.',
    pasos: [
      { texto: 'Verifica que el entorno sea seguro: sin escombros en caída, sin cables eléctricos.' },
      { texto: 'Sacude los hombros de la víctima y grita "¿Me escuchas?". Si no responde, pide ayuda.' },
      { texto: 'Coloca a la víctima boca arriba sobre una superficie firme y plana.' },
      { texto: 'Inclina la cabeza hacia atrás levantando el mentón para abrir la vía aérea. Mira, escucha y siente si respira durante 10 segundos.' },
      { texto: 'Si no respira: entrelaza las manos sobre el centro del pecho (entre los pezones). Brazos rectos.', alerta: 'Profundidad mínima 5 cm. Ritmo: 100–120 compresiones por minuto (una por segundo).' },
      { texto: 'Da 30 compresiones continuas sin parar.' },
      { texto: 'Si estás capacitado: tapa la nariz, sella la boca y da 2 ventilaciones de 1 segundo cada una. El pecho debe elevarse.' },
      { texto: 'Repite el ciclo: 30 compresiones → 2 ventilaciones. Si no sabes ventilar, haz solo compresiones continuas.' },
      { texto: 'Continúa hasta que llegue ayuda profesional, la víctima respire, o estés agotado sin poder continuar.' },
    ],
    no_hacer: [
      'No mover a la víctima si sospechas lesión en columna (a menos que el entorno sea peligroso)',
      'No interrumpir las compresiones más de 10 segundos',
      'No hacer RCP a alguien que está consciente o respira',
    ],
    cuando_llamar_emergencias: 'Inmediatamente — antes o durante el RCP.',
  },
  {
    slug: 'hemorragia',
    titulo: 'Control de hemorragias',
    icono: '🩸',
    severidad: 'critico',
    resumen: 'Una hemorragia grave puede ser mortal en menos de 3 minutos. La presión directa es el método principal.',
    advertencia_inicial: 'Si la herida es en el cuello o tórax, NO apliques torniquete. Solo presión directa y traslado urgente.',
    pasos: [
      { texto: 'Protégete: usa guantes si los tienes, o una bolsa plástica. Evita el contacto directo con la sangre.' },
      { texto: 'Aplica presión directa y firme sobre la herida con tela limpia, ropa o gasa doblada.' },
      { texto: 'Mantén la presión sin soltar. No retires el apósito aunque se empape — agrega más material encima.', alerta: 'Retirar el apósito destruye el coágulo que se está formando.' },
      { texto: 'Eleva la extremidad herida por encima del nivel del corazón si no sospechas fractura.' },
      { texto: 'Presiona durante al menos 10 minutos continuos sin soltar.' },
      {
        texto: 'Si la hemorragia es en un brazo o pierna y la presión no la controla en 5 minutos: aplica torniquete.',
        alerta: 'Torniquete solo en extremidades. Colócalo 5 cm por encima de la herida, bien apretado. ANOTA LA HORA de colocación sobre la piel del paciente.',
      },
    ],
    no_hacer: [
      'No quitar el torniquete una vez colocado — solo personal médico puede retirarlo',
      'No usar torniquete en cuello, axila o ingle',
      'No dejar la herida sin presión para "ver cómo va"',
    ],
    cuando_llamar_emergencias: 'Siempre en hemorragias que no se controlan en 5 minutos o heridas profundas.',
  },
  {
    slug: 'shock',
    titulo: 'Reconocimiento y manejo del shock',
    icono: '⚡',
    severidad: 'critico',
    resumen: 'El shock ocurre cuando el cuerpo no recibe suficiente sangre. Común en víctimas de aplastamiento o hemorragia.',
    pasos: [
      { texto: 'Reconoce los signos: piel pálida, fría y sudorosa; pulso rápido y débil; respiración rápida; confusión o somnolencia; sed intensa; labios azulados.' },
      { texto: 'Llama a emergencias inmediatamente.' },
      { texto: 'Acuesta a la víctima en un lugar seguro y plano.' },
      { texto: 'Eleva las piernas 30 cm si no hay lesión en columna, pelvis o piernas. Esto ayuda a que la sangre llegue al cerebro.', alerta: 'Si sospechas fractura de columna: NO muevas las piernas.' },
      { texto: 'Abriga a la víctima con lo que tengas. El frío empeora el shock.' },
      { texto: 'Afloja ropa ajustada: corbatas, cinturones, botones del cuello.' },
      { texto: 'Habla con la víctima constantemente. La tranquilidad reduce el pánico y el consumo de oxígeno.' },
      { texto: 'Controla cualquier hemorragia activa con presión directa.' },
      { texto: 'Monitorea la respiración. Si deja de respirar, inicia RCP.' },
    ],
    no_hacer: [
      'No dar agua, comida ni medicamentos por la boca — puede aspirarlos',
      'No dejar a la víctima sola',
      'No aplicar calor directo (bolsas de agua caliente)',
    ],
    cuando_llamar_emergencias: 'Al primer signo de shock. Es una emergencia que requiere suero intravenoso.',
  },
  {
    slug: 'aplastamiento',
    titulo: 'Síndrome de aplastamiento',
    icono: '🏗️',
    severidad: 'critico',
    resumen: 'Específico para víctimas atrapadas bajo escombros. Liberar bruscamente puede causar paro cardíaco por liberación de toxinas.',
    advertencia_inicial: 'CRÍTICO: si la víctima lleva más de 1 hora atrapada, NO la liberes sin coordinarlo con personal médico. La liberación brusca puede ser fatal.',
    pasos: [
      { texto: 'Establece comunicación verbal con la víctima. Tranquilízala y evalúa su estado de consciencia.' },
      { texto: 'Llama a emergencias médicas ANTES de cualquier maniobra de rescate.' },
      { texto: 'Si la víctima está consciente y puede tragar: ofrécele agua en pequeños sorbos (ayuda a preparar los riñones para la liberación).' },
      { texto: 'Informa al equipo médico cuánto tiempo lleva atrapada y qué partes del cuerpo están comprimidas.' },
      { texto: 'Si el entorno es peligroso y hay riesgo inminente de colapso: libera a la víctima con cuidado manteniendo la columna alineada.' },
      { texto: 'Al liberar: prepárate para RCP inmediato. El corazón puede colapsar en los primeros minutos tras la liberación por la entrada de potasio al torrente sanguíneo.' },
      { texto: 'Cubre las extremidades afectadas con vendas o tela sin elevarlas.' },
    ],
    no_hacer: [
      'No liberar bruscamente si lleva más de 1 hora sin coordinación médica',
      'No elevar las extremidades aplastadas',
      'No aplicar torniquete preventivo sin indicación médica',
    ],
    cuando_llamar_emergencias: 'Antes de cualquier maniobra. El síndrome de aplastamiento requiere tratamiento hospitalario urgente (suero IV, diálisis).',
  },
  {
    slug: 'fracturas',
    titulo: 'Fracturas e inmovilización',
    icono: '🦴',
    severidad: 'urgente',
    resumen: 'Inmovilizar correctamente previene lesiones adicionales. Ante duda de fractura de columna: no mover.',
    advertencia_inicial: 'Si la víctima tiene dolor en cuello o espalda, o no siente sus piernas/brazos: trátala como fractura de columna y NO la muevas salvo peligro inminente.',
    pasos: [
      { texto: 'Evalúa: deformidad visible, dolor al tocar la zona, imposibilidad de mover la extremidad, hinchazón o moretones rápidos.' },
      { texto: 'No intentes enderezar ni recolocar el hueso. Inmoviliza en la posición en que está.' },
      { texto: 'Inmoviliza usando lo que tengas: tablas de madera, ramas, periódicos doblados o cartón. Fíjalos con tiras de tela.', alerta: 'La férula debe abarcar la articulación por encima y por debajo de la fractura.' },
      { texto: 'Asegúrate de que la inmovilización no corte la circulación: verifica que los dedos no se pongan azules o fríos.' },
      { texto: 'Si hay herida abierta (fractura expuesta): cubre el hueso con tela limpia húmeda. No intentes introducirlo.' },
      { texto: 'Eleva la extremidad fracturada si es posible para reducir la hinchazón.' },
      { texto: 'Aplica frío (hielo envuelto en tela, nunca directo) sobre la zona si hay inflamación.' },
    ],
    no_hacer: [
      'No mover a la víctima si sospechas fractura de columna',
      'No retirar cuerpos extraños incrustados en la herida',
      'No dejar la extremidad sin inmovilizar para el traslado',
    ],
    cuando_llamar_emergencias: 'En fractura de columna, pelvis, fémur o fractura expuesta — siempre.',
  },
  {
    slug: 'quemaduras',
    titulo: 'Quemaduras',
    icono: '🔥',
    severidad: 'urgente',
    resumen: 'Enfriar con agua es el primer paso. Nunca usar hielo, pasta dental ni mantequilla.',
    pasos: [
      { texto: 'Aleja a la víctima de la fuente de calor. Apaga las llamas con tela o tirándola al suelo y haciéndola rodar.' },
      { texto: 'Enfría la quemadura con agua fría corriente durante 20 minutos mínimo. Hazlo aunque ya hayan pasado varios minutos.', alerta: 'El agua debe ser fría, no helada. El hielo empeora la lesión.' },
      { texto: 'Retira ropa y joyas de la zona quemada mientras el agua corre, SALVO que estén adheridas a la piel.' },
      { texto: 'Cubre con tela limpia no adherente (gasa, paño limpio). Si no tienes, deja al aire.' },
      { texto: 'Calcula la extensión: si cubre más del 10% del cuerpo (una palma de mano ≈ 1%), es una quemadura grave.' },
      { texto: 'Mantén abrigada a la víctima (las quemaduras extensas provocan hipotermia).' },
    ],
    no_hacer: [
      'No usar hielo, mantequilla, pasta dental, aceite ni cremas',
      'No reventar ampollas',
      'No despegar ropa adherida a la piel',
      'No envolver apretado',
    ],
    cuando_llamar_emergencias: 'Quemaduras en cara, manos, genitales o articulaciones. Quemaduras que cubren más del 10% del cuerpo. Cualquier quemadura en niños o ancianos.',
  },
  {
    slug: 'inconsciencia',
    titulo: 'Pérdida de consciencia',
    icono: '😶',
    severidad: 'urgente',
    resumen: 'Evalúa rápido si respira. Si respira: posición lateral de seguridad. Si no respira: RCP inmediato.',
    pasos: [
      { texto: 'Sacude los hombros y llama a la víctima. Si no responde, pide ayuda a alguien cercano.' },
      { texto: 'Abre la vía aérea: inclina la cabeza hacia atrás con una mano en la frente y eleva el mentón con dos dedos.' },
      { texto: 'Escucha, mira y siente si respira durante 10 segundos máximo.' },
      { texto: 'SI RESPIRA: colócala en posición lateral de seguridad — boca abajo en el lado izquierdo, rodilla superior flexionada, brazo superior bajo la mejilla. Esto evita que se atragante con vómito.', alerta: 'No uses la posición lateral si sospechas fractura de columna.' },
      { texto: 'SI NO RESPIRA: inicia RCP inmediatamente (ver guía de RCP).' },
      { texto: 'Monitorea la respiración cada 2 minutos hasta que llegue ayuda.' },
    ],
    no_hacer: [
      'No dar agua ni comida a una persona inconsciente',
      'No dejarla boca arriba si respira (riesgo de atragantamiento)',
      'No dar palmadas fuertes en la espalda para "despertarla"',
    ],
    cuando_llamar_emergencias: 'Siempre que una persona pierda la consciencia.',
  },
  {
    slug: 'asfixia',
    titulo: 'Obstrucción de vía aérea (atragantamiento)',
    icono: '🫁',
    severidad: 'critico',
    resumen: 'Si la persona no puede hablar, toser ni respirar: actúa de inmediato. El cerebro aguanta 4 minutos sin oxígeno.',
    pasos: [
      { texto: 'Pregunta "¿Te estás atragantando?". Si la persona puede hablar o toser con fuerza: anímala a seguir tosiendo. No intervengas.' },
      { texto: 'Si NO puede hablar, toser ni respirar: inclínala hacia adelante y da 5 golpes firmes en la espalda entre los omóplatos con el talón de tu mano.', alerta: 'Los golpes deben ser secos y fuertes, no palmadas suaves.' },
      { texto: 'Si los golpes no funcionan: maniobra de Heimlich. Ponte detrás de la víctima. Rodea su cintura con tus brazos. Coloca el puño justo encima del ombligo. Cúbrelo con la otra mano y empuja hacia adentro y arriba con fuerza. Repite 5 veces.' },
      { texto: 'Alterna 5 golpes en espalda + 5 compresiones abdominales hasta que el objeto salga o la persona pierda la consciencia.' },
      { texto: 'Si pierde la consciencia: recuéstala en el suelo e inicia RCP. Antes de cada ventilación, mira dentro de la boca: si ves el objeto, retíralo con un dedo en gancho.' },
      { texto: 'EN BEBÉS (menores de 1 año): boca abajo sobre tu antebrazo, cabeza más baja que el pecho. 5 golpes en la espalda. Luego boca arriba: 5 compresiones con 2 dedos en el centro del pecho. Nunca Heimlich en bebés.' },
    ],
    no_hacer: [
      'No hacer Heimlich a bebés menores de 1 año',
      'No intentar sacar el objeto con los dedos a ciegas (puedes empujarlo más adentro)',
      'No animar a la persona a beber agua para bajar el objeto',
    ],
    cuando_llamar_emergencias: 'Inmediatamente si no se despeja en los primeros intentos o si pierde la consciencia.',
  },
]

export function getGuia(slug: string): Guia | undefined {
  return GUIAS.find(g => g.slug === slug)
}

export const SEVERIDAD_CONFIG = {
  critico: { label: 'CRÍTICO', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-600' },
  urgente: { label: 'URGENTE', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-500' },
  importante: { label: 'IMPORTANTE', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-500' },
}
