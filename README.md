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
- **Ver qué necesitan los centros** de acopio y refugios en `/donaciones`
- **Compartir la búsqueda** en WhatsApp o Instagram con una card generada automáticamente
- **Hablar con el agente de IA** mediante el chat flotante que aparece en todas las páginas
- **Suscribirse a notificaciones push** — el móvil avisa si aparece la persona que buscas

### Familiar (cuenta gratuita, acceso inmediato)
Todo lo anterior más:
- Solicitar acceso al perfil completo de una víctima registrada — aporta tu documento de identidad y tu parentesco, un administrador lo revisa y aprueba
- Recibir un **email automático** cuando te aprueben o rechacen el acceso
- Seguir el estado de tus solicitudes en `/mis-solicitudes`
- Ver fotos, estado médico, ubicación exacta y código QR del familiar encontrado

### Rescatista (requiere aprobación de admin)
Todo lo anterior más:
- **Registrar víctimas** desde campo con fotos, descripción física, estado, ubicación, si es menor de edad
- **Importar listas de papel** con IA — fotografía una lista manuscrita y extrae automáticamente a todas las personas
- Reportar edificios para inspección de ingenieros
- Acceder a la lista completa de víctimas registradas con filtros

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
- Gestionar hospitales y refugios (añadir, editar, activar) y **publicar sus necesidades de donaciones**
- Ver panel de reportes de menores
- Sincronizar víctimas contra Venezuela Reporta y otras plataformas nacionales
- **Importar listas de campo masivamente** desde fotos con visión IA
- **Exportar CSV** con toda la base de datos
- Ver **analytics** — evolución de registros, distribución por estado, zonas calientes
- Exportar datos en formato PFIF (estándar internacional Google Person Finder)
- Publicar noticias y alertas en el tablón público

---

## Funcionalidades principales

### Lector de documentos de campo con IA
Los rescatistas fotografían listas manuscritas o impresas — formularios de hospital, censos de refugio, partes de rescate. La IA extrae nombre, cédula, edad, estado y ubicación de cada persona automáticamente. El operador revisa y confirma antes de ingresar. Soporta múltiples fotos en lote, procesadas una a una para no saturar el sistema.

### Compartir para búsqueda en redes sociales
Cada perfil de víctima genera una card de 1200×630px con la descripción física, estado de salud y ubicación. Al compartir el enlace en Instagram, WhatsApp o Twitter aparece la preview con la imagen — sin nombre ni foto de la víctima por privacidad. Diseño con la bandera venezolana y CTA directo a la búsqueda.

### Muro de donaciones en tiempo real
Los coordinadores de hospitales, refugios y centros de acopio publican qué necesitan (agua, medicamentos, ropa, generadores…) con nivel de urgencia. Aparece en `/donaciones`, página pública sin login, con teléfono de contacto directo por cada centro.

### Dashboard en tiempo real
El panel de administración muestra los contadores de víctimas actualizándose en vivo (Supabase Realtime) sin recargar la página. Un punto verde pulsante indica que la conexión está activa. El tab de "Solicitudes" en la barra móvil muestra un badge rojo con el número de solicitudes pendientes.

### Analytics para coordinadores
Panel con gráficos SVG de: registros por día (últimos 14 días), solicitudes familiares por día, distribución por estado (con vida / crítico / fallecido / sin confirmar) y top 6 zonas de hallazgo. Datos en tiempo real desde la base de datos.

### Export CSV
Descarga toda la base de datos en un archivo CSV con todos los campos excepto fotos. Los menores aparecen como `[MENOR — datos protegidos]`. Disponible para administradores desde el dashboard de herramientas o desde la página de Analytics.

### Notificaciones push
Los usuarios que buscan a un familiar pueden suscribirse para recibir notificaciones push en el móvil. Cuando un rescatista registra una nueva persona, el sistema notifica automáticamente a todos los suscriptores. Botón de cancelación disponible en cualquier momento.

### Registro de víctimas
El formulario está optimizado para campo: fotos, descripción física, estado de salud, ubicación en hospital o refugio, si es menor de edad. Los menores quedan protegidos — no aparecen en búsquedas públicas, solo los ve el staff verificado y el familiar aprobado.

### Búsqueda pública
Cualquier persona puede buscar sin cuenta. La búsqueda es por nombre o descripción y devuelve solo la ubicación y el estado — sin datos sensibles — para proteger la privacidad de las víctimas.

### Acceso familiar verificado
Para ver fotos, estado médico y datos completos de una víctima, el familiar sube su cédula o acta de nacimiento. Un admin revisa y aprueba. El acceso dura 48 horas y se renueva si se necesita. Al aprobar o rechazar, el familiar recibe un **email automático** desde noreply@rescate-vz.com.

### Perfil de víctima con QR y lightbox
Cada víctima tiene una ficha con código QR que se puede imprimir y pegar en la cama del hospital. Las fotos se pueden ampliar en un lightbox fullscreen con navegación por flechas y cierre con ESC. Se puede compartir por WhatsApp y generar una card para Instagram con un clic.

### Matching biométrico con IA
Los rescatistas pueden comparar la foto de una víctima sin identificar contra las últimas víctimas registradas con fotos usando visión artificial. No reemplaza la identificación formal pero ayuda a descartar o señalar coincidencias posibles.

### Mapa en tiempo real
Hospitales y refugios activos con capacidad actual, porcentaje de ocupación y teléfono de contacto. Las estructuras evaluadas por ingenieros aparecen con chinchetas de color (verde / amarillo / rojo). Funciona en móvil sin necesidad de instalar nada.

### Guías de primeros auxilios offline
Ocho protocolos (RCP, hemorragias, shock, aplastamiento, fracturas, quemaduras, inconsciencia, asfixia) disponibles sin conexión una vez cargados. Pueden usarse en campo sin señal.

### Agente de IA integrado
Un asistente disponible 24/7 mediante el chat flotante de la web. Puede buscar personas, orientar en primeros auxilios e informar sobre hospitales activos.

### Semáforo de habitabilidad de estructuras
Los ingenieros y arquitectos voluntarios evalúan edificios con un semáforo:
- 🟢 **Verde** — habitable, sin daños estructurales
- 🟡 **Amarillo** — uso restringido, acceso controlado
- 🔴 **Rojo** — no habitable, riesgo de colapso

### Sincronización con plataformas nacionales
La plataforma puede sincronizarse con Venezuela Reporta (40.000+ registros) para cruzar víctimas. La sección de colaboradoras en la landing enlaza a Venezuela Te Busca, Desaparecidos Terremoto Venezuela, SOS Venezuela 2026, Terremoto Venezuela y RedQuipu.

### Feed de actividad en tiempo real
La landing muestra un feed de actividad reciente (anonimizado) — zonas donde se han registrado personas en las últimas horas. Se actualiza cada 45 segundos sin recargar la página.

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
4. Al aprobar, puedes registrar víctimas, actualizar estados e importar listas de campo

### Si eres ingeniero o arquitecto
1. Regístrate como **Ingeniero/Arquitecto** en `/registro`
2. Al ser aprobado, accedes al panel de estructuras en `/estructuras`
3. Evalúa edificios reportados o añade nuevos con el semáforo de habitabilidad

### Si coordinas un centro de acopio, hospital o refugio
1. Contacta al equipo para obtener acceso de administrador
2. En `/ubicaciones` puedes publicar qué necesita tu centro en `/donaciones`
3. Las familias y voluntarios verán tus necesidades en tiempo real

### Si eres administrador de una organización
Escribe a **alejandrojesusperezblanco4@gmail.com** para coordinar acceso y roles de administrador para tu equipo.

---

## Privacidad y seguridad

- Las **fotos de víctimas** nunca son públicas. Solo se sirven mediante enlaces firmados que expiran en 5 minutos
- Los **menores** son completamente invisibles en búsquedas públicas. La base de datos los oculta a nivel de servidor, no solo en la interfaz
- El **acceso familiar** expira automáticamente a las 48 horas
- Las **cédulas** extraídas por OCR se enmascaran (`****1234`) antes de guardarse
- Los **documentos de identidad** de familias solo son accesibles por el propietario o un administrador (RLS en storage)
- Los **headers de seguridad** están activos en todas las rutas: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Toda acción sensible queda registrada en un **log de auditoría** inmutable
- La base de datos aplica **Row Level Security** — cada usuario solo puede ver y modificar lo que su rol permite, directamente en el motor de base de datos

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 — App Router, PWA, ISR, Edge runtime para OG images |
| Base de datos | Supabase — PostgreSQL + Row Level Security + Auth + Realtime + Storage |
| Estilos | Tailwind CSS v4 |
| Mapas | Leaflet + OpenStreetMap |
| Agente IA | OpenRouter → `anthropic/claude-haiku-4.5` (texto + visión) |
| OG Images | `next/og` — ImageResponse para cards de Instagram |
| Email | Resend — `noreply@rescate-vz.com` |
| Push | Web Push API + VAPID keys |
| QR | `qrcode` (server-side) |
| Deploy | Railway (región US West) |
| DNS | Cloudflare (DNS only) |
| Lenguaje | TypeScript estricto |

### Roles en base de datos
`admin` · `rescuer` · `medical` · `family` · `engineer`

### Tablas principales
`profiles` · `victims` · `locations` · `access_requests` · `audit_log` · `minor_inquiries` · `structures` · `news_posts` · `push_subscriptions`

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
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

---

## Rutas principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Landing con stats en vivo, feed de actividad, features, colaboradoras |
| `/buscar` | Público | Búsqueda de familiares + push notifications + compartir |
| `/mapa-publico` | Público | Mapa con hospitales, refugios y estructuras |
| `/donaciones` | Público | Qué necesitan los centros de acopio |
| `/compartir/[id]` | Público | Card para compartir en redes sociales |
| `/noticias` | Público | Tablón de noticias del coordinador |
| `/primeros-auxilios` | Público | 8 guías offline |
| `/dashboard` | Autenticado | Panel principal con Realtime |
| `/victimas` | Staff | Lista con filtros |
| `/victimas/nueva` | Staff verificado | Registro de víctima |
| `/victima/[id]` | Staff + familiar aprobado | Perfil completo + lightbox |
| `/estructuras` | Staff | Semáforo de habitabilidad |
| `/sincronizacion` | Admin | Lector de documentos + sync Venezuela Reporta |
| `/ubicaciones` | Admin | Gestión de centros + publicar donaciones |
| `/admin/analytics` | Admin | Gráficos y estadísticas |
| `/admin/noticias` | Admin | Publicar noticias |
| `/solicitudes` | Admin | Solicitudes de acceso familiar |
| `/verificacion` | Admin | Aprobar staff |
| `/menores` | Admin | Reportes de menores |

---

## Equipo

Desarrollado en respuesta de emergencia al terremoto de Venezuela del 24 de junio de 2026.

**Alejandro** — Arquitectura, backend, Supabase, deploy, coordinación  
**Amir** — Frontend, seguridad, roles, evaluación de estructuras, segundo administrador

---

*RescateVZ es software libre de uso humanitario. Si representas una organización de rescate, Cruz Roja, Protección Civil o cualquier entidad de respuesta a emergencias en Venezuela y quieres integrarte o escalar la plataforma, escríbenos.*
