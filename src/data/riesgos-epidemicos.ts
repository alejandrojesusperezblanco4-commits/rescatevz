export interface RiesgoEpidemico {
  id: string
  nombre: string
  icono: string
  nivel: 'critico' | 'alto' | 'medio'
  descripcion: string
  sintomas: string[]
  prevencion: string[]
  cuando_buscar_atencion: string
}

export const RIESGOS_EPIDEMICOS: RiesgoEpidemico[] = [
  {
    id: 'colera',
    nombre: 'Cólera',
    icono: 'water_drop',
    nivel: 'critico',
    descripcion: 'Infección bacteriana transmitida por agua o alimentos contaminados con Vibrio cholerae. Frecuente tras terremotos por ruptura de sistemas de agua potable.',
    sintomas: [
      'Diarrea acuosa abundante y repentina ("agua de arroz")',
      'Vómitos repetidos',
      'Deshidratación severa en pocas horas',
      'Calambres musculares',
      'Piel arrugada y ojos hundidos',
    ],
    prevencion: [
      'Beber solo agua hervida o tratada con cloro (1 gota por litro)',
      'No consumir agua de ríos, quebradas o pozos sin tratar',
      'Lavar frutas y verduras con agua segura',
      'Lavarse las manos con jabón antes de comer y después del baño',
      'No consumir mariscos o pescado crudo',
    ],
    cuando_buscar_atencion: 'Al primer síntoma de diarrea abundante. El cólera puede matar por deshidratación en horas.',
  },
  {
    id: 'leptospirosis',
    nombre: 'Leptospirosis',
    icono: 'pest_control_rodent',
    nivel: 'critico',
    descripcion: 'Infección bacteriana transmitida por la orina de animales (principalmente ratas) en agua o lodo. Muy frecuente tras inundaciones y movimiento de escombros.',
    sintomas: [
      'Fiebre alta súbita (39–40°C)',
      'Dolor de cabeza intenso',
      'Dolor muscular severo (especialmente pantorrillas)',
      'Ojos rojos (conjuntivitis)',
      'Escalofríos y vómitos',
      'En casos graves: ictericia (piel amarilla), daño renal',
    ],
    prevencion: [
      'Usar botas de goma y guantes al manejar escombros o agua estancada',
      'No caminar descalzo en lodo o agua de inundación',
      'Cubrir heridas antes de trabajar en zonas afectadas',
      'Controlar plagas de roedores en refugios',
      'Lavar y desinfectar heridas inmediatamente tras contacto con agua sucia',
    ],
    cuando_buscar_atencion: 'Si tienes fiebre alta después de contacto con agua de inundación o lodo. Tratamiento antibiótico temprano es clave.',
  },
  {
    id: 'fiebre-tifoidea',
    nombre: 'Fiebre Tifoidea',
    icono: 'local_drink',
    nivel: 'alto',
    descripcion: 'Infección por Salmonella typhi, transmitida por agua o alimentos contaminados con heces humanas. Riesgo alto cuando los sistemas de saneamiento colapsan.',
    sintomas: [
      'Fiebre que sube progresivamente durante 1–2 semanas',
      'Dolor abdominal y distensión',
      'Diarrea o estreñimiento',
      'Erupción cutánea rosada en el abdomen (manchas rosas)',
      'Debilidad y cansancio extremo',
      'Confusión mental en casos avanzados',
    ],
    prevencion: [
      'Beber solo agua tratada o hervida',
      'No consumir alimentos de vendedores ambulantes en zonas afectadas',
      'Lavado riguroso de manos después del baño',
      'Manejo seguro de excretas y residuos humanos',
    ],
    cuando_buscar_atencion: 'Si la fiebre persiste más de 3 días o aparece dolor abdominal intenso. Sin tratamiento puede causar perforación intestinal.',
  },
  {
    id: 'hepatitis-a',
    nombre: 'Hepatitis A',
    icono: 'sick',
    nivel: 'alto',
    descripcion: 'Infección viral del hígado por consumo de agua o alimentos contaminados. Se propaga rápidamente en condiciones de hacinamiento sin saneamiento.',
    sintomas: [
      'Náuseas y vómitos',
      'Pérdida del apetito',
      'Cansancio extremo',
      'Fiebre moderada',
      'Color amarillo en piel y ojos (ictericia)',
      'Orina oscura y heces claras',
    ],
    prevencion: [
      'Agua segura y hervida para beber y cocinar',
      'Higiene estricta de manos',
      'No consumir mariscos, especialmente crudos',
      'Vacunación (si hay disponibilidad en los centros de salud)',
    ],
    cuando_buscar_atencion: 'Si aparece coloración amarilla en piel u ojos, especialmente en niños o personas mayores.',
  },
  {
    id: 'tetanos',
    nombre: 'Tétanos',
    icono: 'healing',
    nivel: 'alto',
    descripcion: 'Infección bacteriana grave por heridas contaminadas con tierra o escombros. Alta mortalidad sin tratamiento. Común en rescatistas y víctimas con heridas abiertas.',
    sintomas: [
      'Rigidez en la mandíbula ("trismus" — no puede abrir la boca)',
      'Rigidez en cuello y espalda',
      'Espasmos musculares dolorosos',
      'Dificultad para tragar',
      'Convulsiones',
    ],
    prevencion: [
      'Limpiar y desinfectar inmediatamente cualquier herida con escombros o tierra',
      'Aplicar vacuna antitetánica si no está al día (disponible en centros de salud)',
      'Usar guantes y botas en zonas de rescate',
      'Cubrir heridas con vendas limpias y cambiarlas regularmente',
    ],
    cuando_buscar_atencion: 'Cualquier herida profunda con tierra o metal oxidado requiere atención médica urgente para evaluar vacunación.',
  },
  {
    id: 'infecciones-respiratorias',
    nombre: 'Infecciones respiratorias',
    icono: 'air',
    nivel: 'medio',
    descripcion: 'Gripe, neumonía y otras infecciones respiratorias se propagan fácilmente en refugios con hacinamiento, ventilación pobre, y personas debilitadas o con heridas.',
    sintomas: [
      'Tos persistente',
      'Fiebre y escalofríos',
      'Dificultad para respirar',
      'Dolor en el pecho al respirar',
      'Expectoración con sangre o color verde/amarillo',
    ],
    prevencion: [
      'Ventilar los espacios de refugio regularmente',
      'Cubrir boca y nariz al toser o estornudar',
      'Separar a personas enfermas de las sanas en los refugios',
      'Lavado de manos frecuente',
      'Mantener a personas mayores y niños alejados de enfermos',
    ],
    cuando_buscar_atencion: 'Si hay dificultad para respirar, labios azulados, o fiebre alta en niños o personas mayores.',
  },
]

export const RISK_LEVEL_META: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  bajo:    { label: 'BAJO',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   icon: 'check_circle' },
  medio:   { label: 'MEDIO',   color: '#D4A017', bg: 'rgba(212,160,23,0.12)', border: 'rgba(212,160,23,0.35)', icon: 'warning' },
  alto:    { label: 'ALTO',    color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', icon: 'emergency' },
  critico: { label: 'CRÍTICO', color: '#DC2626', bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.35)',  icon: 'crisis_alert' },
}
