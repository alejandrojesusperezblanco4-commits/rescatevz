# RescateVZ

**Plataforma humanitaria de coordinación de emergencia — Terremoto Venezuela 2026**

Sitio en producción: **https://rescate-vz.com**

---

## Qué es esto

El 24 de junio de 2026 Venezuela sufrió dos terremotos consecutivos (M7.2 y M7.5). En las horas siguientes, más de 50.000 personas quedaron sin paradero conocido. Las familias buscaban a sus seres queridos en hospitales, refugios y escombros sin ningún sistema centralizado que conectara a quienes encontraban personas con quienes las buscaban.

RescateVZ es esa conexión.

Es una aplicación web gratuita que permite a rescatistas registrar a cada persona que encuentran, a familias buscarlas por nombre o descripción, a médicos actualizar su estado clínico, y a ingenieros evaluar si los edificios son seguros. Todo en tiempo real, desde cualquier teléfono.

---

## Para quién es y qué puede hacer cada uno

### Cualquier persona (sin cuenta)
- **Buscar** a un familiar por nombre, descripción física o ubicación en `/buscar`
- **Ver el mapa** de hospitales y refugios activos con capacidad en tiempo real en `/mapa-publico`
- **Consultar guías de primeros auxilios** offline (RCP, hemorragias, fracturas, shock, quemaduras...) en `/primeros-auxilios`
- **Hablar con el agente de IA** mediante el chat flotante que aparece en todas las páginas

### Familiar (cuenta gratuita, acceso inmediato)
Todo lo anterior más:
- Solicitar acceso al perfil completo de una víctima registrada — aporta tu documento de identidad y tu parentesco, un administrador lo revisa y aprueba
- Recibir un **email automático** cuando te aprueben o rechacen el acceso
- Seguir el estado de tus solicitudes en `/mis-solicitudes`
- Ver fotos, estado médico, ubicación exacta y código QR del familiar encontrado

### Rescatista (requiere aprobación de admin)
Todo lo anterior más:
- **Registrar víctimas** desde campo con fotos, descripción física, estado, ubicación, si es menor de edad
- Reportar edificios para inspección de ingenieros
- Acceder a la lista completa de víctimas registradas con filtros
- Usar el **agente de IA por SMS** para registrar por texto sin necesidad de abrir la app

### Personal médico (requiere aprobación de admin)
Todo lo anterior más:
- Actualizar el **estado clínico** de cualquier víctima (con vida / estado crítico / fallecido)
- Añadir notas médicas al perfil de cada paciente

### Ingeniero / Arquitecto (requiere aprobación de admin)
Todo lo anterior más:
- Evaluar la **habitabilidad de estructuras** con semáforo verde / amarillo / rojo
- Ver estructuras reportadas por rescatistas pendientes de análisis
- Las evaluaciones aparecen en el **mapa público** para que todos sepan qué edificios son seguros

### Administrador
Control total:
- Aprobar o rechazar cuentas de rescatistas, médicos e ingenieros
- Aprobar o rechazar solicitudes de acceso familiar
- Gestionar hospitales y refugios (añadir, editar, activar)
- Ver panel de reportes de menores
- Sincronizar víctimas contra Venezuela Reporta (46.000+ registros nacionales)
- Exportar datos en formato PFIF (estándar internacional Google Person Finder)
- Importar listas hospitalarias en CSV masivo

---

## Funcionalidades principales

### Registro de víctimas
El formulario está optimizado para campo: fotos, descripción física, estado de salud, ubicación en hospital o refugio, si es menor de edad. Los menores quedan protegidos — no aparecen en búsquedas públicas, solo los ve el staff verificado y el familiar aprobado.

### Búsqueda pública
Cualquier persona puede buscar sin cuenta. La búsqueda es por nombre o descripción y devuelve solo la ubicación y el estado — sin datos sensibles — para proteger la privacidad de las víctimas.

### Acceso familiar verificado
Para ver fotos, estado médico y datos completos de una víctima, el familiar sube su cédula o acta de nacimiento. Un admin revisa y aprueba. El acceso dura 48 horas y se renueva si se necesita. Al aprobar o rechazar, el familiar recibe un **email automático** desde noreply@rescate-vz.com.

### Perfil de víctima con QR
Cada víctima tiene una ficha con código QR que se puede imprimir y pegar en la cama del hospital. Cualquier rescatista o familiar con el link o el QR puede acceder al perfil (con los permisos correspondientes). También se puede compartir por WhatsApp y Telegram con un clic.

### Matching biométrico con IA
Los rescatistas pueden comparar la foto de una víctima sin identificar contra las últimas víctimas registradas con fotos usando visión artificial (Claude Haiku). No reemplaza la identificación formal pero ayuda a descartar o señalar coincidencias posibles con una nota de confianza alta / media.

### Mapa en tiempo real
Hospitales y refugios activos con capacidad actual, porcentaje de ocupación y teléfono de contacto. Las estructuras evaluadas por ingenieros aparecen con chinchetas de color (verde / amarillo / rojo). Funciona en móvil sin necesidad de instalar nada.

### Guías de primeros auxilios offline
Ocho protocolos (RCP, hemorragias, shock, aplastamiento, fracturas, quemaduras, inconsciencia, asfixia) disponibles sin conexión una vez cargados. Pueden usarse en campo sin señal.

### Agente de IA integrado
Un asistente disponible 24/7 mediante el chat flotante de la web o por SMS. Puede registrar víctimas por texto natural ("encontré a un hombre de unos 50 años inconsciente en el hospital de Caracas"), buscar personas y orientar en primeros auxilios.

### Semáforo de habitabilidad de estructuras
Los ingenieros y arquitectos voluntarios evalúan edificios con un semáforo:
- 🟢 **Verde** — habitable, sin daños estructurales
- 🟡 **Amarillo** — uso restringido, acceso controlado
- 🔴 **Rojo** — no habitable, riesgo de colapso

Los rescatistas pueden reportar estructuras sospechosas para que un ingeniero las evalúe. Todo aparece en el mapa.

### Integración con Venezuela Reporta
La plataforma puede sincronizarse con Venezuela Reporta (venezolana, 46.000+ registros) para cruzar víctimas y evitar duplicados a escala nacional.

### Exportación PFIF
Los datos se pueden exportar en formato estándar People Finder Interchange Format, el estándar internacional usado por Google Person Finder y Cruz Roja para intercambio de datos de emergencia.

---

## Cómo empezar

### Si eres familiar buscando a alguien
1. Ve a **https://rescate-vz.com/buscar** — no necesitas cuenta
2. Busca por nombre o descripción
3. Si aparece, haz clic en "Solicitar acceso" para ver el perfil completo
4. Crea una cuenta gratuita como **Familiar**, sube tu cédula y describe tu parentesco
5. Un administrador revisa tu solicitud — recibirás un email con el resultado

### Si eres rescatista o personal médico
1. Ve a **https://rescate-vz.com/registro**
2. Crea una cuenta como **Rescatista** o **Personal médico**
3. Tu cuenta queda en revisión hasta que un administrador la apruebe
4. Al aprobar, puedes registrar víctimas y actualizar estados

### Si eres ingeniero o arquitecto
1. Regístrate como **Ingeniero/Arquitecto** en **/registro**
2. Al ser aprobado, accedes al panel de estructuras en **/estructuras**
3. Evalúa edificios reportados o añade nuevos con el semáforo de habitabilidad

### Si eres administrador de una organización
Escribe a **alejandrojesusperezblanco4@gmail.com** para coordinar acceso y roles de administrador para tu equipo.

---

## Privacidad y seguridad

- Las **fotos de víctimas** nunca son públicas. Solo se sirven mediante enlaces firmados que expiran en 5 minutos
- Los **menores** son completamente invisibles en búsquedas públicas. La base de datos los oculta a nivel de servidor, no solo en la interfaz
- El **acceso familiar** expira automáticamente a las 48 horas
- Toda acción sensible (verificar staff, aprobar acceso, crear víctimas) queda registrada en un **log de auditoría** inmutable
- La base de datos aplica **Row Level Security** — cada usuario solo puede ver y modificar lo que su rol permite, directamente en el motor de base de datos

---

## Stack técnico (para desarrolladores)

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 — App Router, PWA, SSG para guías offline |
| Base de datos | Supabase — PostgreSQL + Row Level Security + Auth |
| Estilos | Tailwind CSS v4 |
| Mapas | Leaflet + OpenStreetMap |
| Agente IA | OpenRouter → `anthropic/claude-haiku-4.5` (texto + visión) |
| Email | Resend — `noreply@rescate-vz.com` |
| QR | `qrcode` (generación server-side en azul marino) |
| Deploy | Railway (región US West) |
| Lenguaje | TypeScript estricto |

### Roles en base de datos
`admin` · `rescuer` · `medical` · `family` · `engineer`

### Tablas principales
`profiles` · `victims` · `locations` · `access_requests` · `audit_log` · `minor_inquiries` · `structures`

### Variables de entorno requeridas
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
OPENROUTER_API_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER
```

---

## Equipo

Desarrollado en 72 horas como respuesta de emergencia al terremoto de Venezuela del 24 de junio de 2026.

**Alejandro** — Arquitectura, backend, Supabase, deploy, coordinación  
**Amir** — Frontend, seguridad, roles, evaluación de estructuras

---

*RescateVZ es software libre de uso humanitario. Si representas una organización de rescate, Cruz Roja, Protección Civil o cualquier entidad de respuesta a emergencias en Venezuela y quieres integrarte o escalar la plataforma, escríbenos.*
