# RescateVZ

App humanitaria de emergencia para el terremoto de Venezuela (M7.2 + M7.5, 24 junio 2026).

Permite a rescatistas registrar víctimas encontradas, a familias buscar a sus seres queridos y a personal médico actualizar el estado clínico — todo desde el móvil, con soporte offline, un agente de WhatsApp/SMS para quien no tenga acceso al navegador, e integración con las principales plataformas de desaparecidos de Venezuela.

**Producción:** https://kind-balance-production-5137.up.railway.app

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, PWA) |
| Base de datos / Auth | Supabase (PostgreSQL + RLS) |
| Estilos | Tailwind CSS v4 + Google Fonts |
| Iconos | Material Symbols Outlined (Google) |
| Mapas | Leaflet + OpenStreetMap |
| Agente IA | OpenRouter → `anthropic/claude-haiku-4.5` (texto + visión) |
| WhatsApp | WAHA (WhatsApp HTTP API) |
| SMS | Twilio |
| QR | `qrcode` (generación server-side) |
| Deploy | Railway |
| Lenguaje | TypeScript |

---

## Sistema de diseño

### Paleta oficial

| Token | Color | Uso |
|---|---|---|
| `--background` | `#1a2744` | Fondo de página — azul marino profundo |
| `--surface` | `#1e2d4a` | Cards, paneles, inputs |
| Surface 2 | `#162040` | Header, footer, elementos más oscuros |
| `--accent` | `#D4A017` | Ámbar dorado — **única CTA activa**. Botones primarios, links de acción, estados activos en nav |
| `--alert` | `#DC2626` | Rojo — **solo alertas críticas**. Banner de emergencia, estado crítico, alertas admin |
| Verde estado | `#22C55E` | "Con vida confirmada" únicamente |
| Lila menores | `#A855F7` | Badge "Menor" — protección especial |
| Gris estado | `#64748B` | "Fallecido" |
| `--foreground` | `#F0F4FF` | Texto principal |
| `--muted` | `#94A3B8` | Texto secundario, labels, metadata |
| `--border` | `rgba(36,51,86,0.5)` | Bordes de cards |
| Bandera VZ | `#FFD700 / #003893 / #CF142B` | Franja decorativa de 3px — no usar como fondo |

### Tipografía

| Fuente | Uso |
|---|---|
| **Manrope** (400–800) | Headlines, números de stats, logos, títulos de sección |
| **Inter** (400–600) | Cuerpo, descripciones, labels, metadata |
| **Material Symbols Outlined** | Todos los iconos UI — reemplaza emojis |

Cargadas vía Google Fonts en `src/app/layout.tsx`.

### Principios

- **Ámbar como única CTA** — el color `#D4A017` es el único que indica acción. Nada más debe llamar la atención más que los botones ámbar.
- **Rojo solo para emergencias** — no usar `red` para botones de registro, solo para alertas críticas y estados de riesgo de vida.
- **Cards sobre oscuro** — `#1e2d4a` sobre `#1a2744`. Sin `bg-white` ni `bg-gray-50`.
- **Borde izquierdo como indicador de estado** — stat cards con `border-left: 3px solid [color]` según el tipo de dato.
- **Material Symbols en lugar de emojis** — más consistentes, escalables, con soporte de `font-variation-settings` para FILL y weight.
- **No glassmorphism, no gradientes decorativos** — diseño plano con jerarquía de luminosidad tonal.

### Override global CSS (`src/app/globals.css`)

Para migrar gradualmente páginas que aún usan clases Tailwind de modo claro, `globals.css` incluye overrides globales que convierten automáticamente las clases antiguas:

```css
.bg-gray-50  → #1a2744   /* fondo de página */
.bg-white    → #1e2d4a   /* cards */
.text-gray-900 → #F0F4FF /* texto primario */
.text-gray-500 → #7c8db5 /* texto muted */
.border-gray-200 → rgba(36,51,86,0.5)
/* inputs forzados a dark automáticamente */
```

Esto permite que páginas no migradas individualmente adopten el tema oscuro sin modificaciones.

---

## Setup local

```bash
git clone https://github.com/alejandrojesusperezblanco4-commits/rescatevz.git
cd rescatevz
npm install
cp .env.example .env.local   # rellenar variables (ver sección de env vars)
npm run dev
```

```bash
npm run dev      # servidor de desarrollo en http://localhost:3000
npm run build    # build de producción (incluye chequeo TypeScript)
npm run start    # ejecutar el build localmente
npm run lint     # ESLint
```

---

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # solo server — nunca NEXT_PUBLIC_

# App
NEXT_PUBLIC_APP_URL=                # URL base sin barra final (ej. https://rescatevz.org)

# Twilio (SMS / WhatsApp oficial)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER=

# OpenRouter (agente IA + visión biométrica)
OPENROUTER_API_KEY=

# WAHA (WhatsApp HTTP API)
WAHA_API_URL=
WAHA_API_KEY=
WAHA_SESSION=rescatevz

# Venezuela Reporta (escritura — solicitar en ayuda@venezuelareporta.org)
VENEZUELAREPORTA_API_KEY=           # opcional; sin él solo funciona la lectura
```

---

## Roles y acceso

| Rol | Quién | Puede |
|---|---|---|
| `admin` | Coordinadores | Todo — aprobar staff, ver menores, gestionar ubicaciones, sincronización |
| `rescuer` | Rescatistas | Registrar víctimas + matching biométrico (tras verificación admin) |
| `medical` | Personal médico | Registrar + actualizar estado clínico + biométrico (tras verificación) |
| `family` | Familiares | Buscar y solicitar acceso a perfil de víctima (caduca 48 h) |

`rescuer` y `medical` empiezan con `is_verified = false`. Un admin los aprueba en `/verificacion`.

Para convertir un usuario en admin (UUID desde Supabase → Authentication → Users):

```sql
UPDATE public.profiles SET role = 'admin', is_verified = TRUE WHERE id = 'UUID';
```

Para registrar el teléfono del admin en el agente WhatsApp:

```sql
UPDATE public.profiles SET phone = '+34XXXXXXXXX' WHERE email = 'tu@email.com';
```

---

## Páginas (18 rutas)

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Todos | Landing dark — headline impactante, 4 action cards horizontales con Material Symbols, stat counters animados, trust strip, footer con franja venezolana |
| `/login` | Todos | Formulario dark — card navy, inputs oscuros, CTA ámbar |
| `/registro` | Todos | Registro de cuenta con selección de rol |
| `/dashboard` | Autenticados | Panel oscuro: 5 stat cards con borde de color, alertas admin, lista víctimas con avatares, hospitales con barras de capacidad |
| `/victimas` | Staff | Lista con filtros (estado, ubicación, menor, texto) |
| `/victimas/nueva` | Staff verificado | Formulario de registro + fotos |
| `/victima/[id]` | Staff + familiar aprobado | Perfil completo + actualizar estado médico + QR + compartir + biométrico |
| `/buscar` | Todos | Búsqueda pública segura (sin menores) + reporte de menores |
| `/mis-solicitudes` | Family | Estado de sus peticiones de acceso |
| `/mapa-publico` | Todos | Mapa Leaflet con hospitales y refugios — sidebar dark con barras de capacidad y Material Symbols |
| `/primeros-auxilios` | Todos | Índice de 8 guías offline — header consistente, cards dark con borde rojo en críticos, badge offline |
| `/primeros-auxilios/[slug]` | Todos | RCP, hemorragia, shock, aplastamiento, fracturas, quemaduras, inconsciencia, asfixia |
| `/solicitudes` | Admin | Aprobar / rechazar acceso familiar |
| `/verificacion` | Admin | Verificar rescatistas y médicos pendientes |
| `/menores` | Admin | Panel de reportes de menores desaparecidos |
| `/ubicaciones` | Admin | Añadir / editar / activar hospitales y refugios |
| `/sincronizacion` | Admin | Cruzar víctimas contra Venezuela Reporta |
| `/whatsapp` | Todos | Instrucciones del bot y número de contacto |
| `/guia` | Todos | Guía de uso por rol |

---

## Navegación autenticada (`Header.tsx`)

El header compartido de páginas autenticadas muestra un máximo de 5–6 items por rol:

| Rol | Nav visible |
|---|---|
| `admin` | Dashboard · Víctimas · Buscar · Mapa · Solicitudes · Verificar |
| `rescuer` / `medical` | Dashboard · Víctimas · Buscar · Mapa |
| `family` | Dashboard · Buscar · Mapa · Mis solicitudes |

El botón **"Registrar"** (ámbar) aparece inline en el header para staff verificado y admin, para acceso rápido al formulario de víctimas sin navegar al dashboard.

---

## API endpoints

### Webhooks de mensajería

#### `POST /api/twilio/webhook`
Webhook público para SMS y WhatsApp oficial vía Twilio. Valida firma Twilio, identifica al remitente por `profiles.phone` y ejecuta el agente IA. El cliente Supabase se instancia dentro del handler para evitar errores de build.

#### `POST /api/waha/webhook`
Webhook público para WhatsApp vía WAHA (motor NOWEB). Procesa eventos `message` y `message.any`, ignora mensajes propios (`fromMe: true`) y ejecuta el mismo agente IA que Twilio.

### Agente IA web

#### `POST /api/chat`
Chat flotante en la landing. Acepta `{ message, history }`. Identifica al usuario autenticado por cookie de sesión Supabase. Staff no verificado actúa como `family`. Devuelve `{ reply: string }`.

### Fotos privadas

#### `GET /api/victima/[id]/fotos`
Genera signed URLs temporales (300 s) para las fotos de una víctima almacenadas en el bucket privado `victim-photos`. Requiere sesión autenticada con acceso RLS a esa víctima. Nunca expone rutas de storage directamente.

### Importación de datos

#### `POST /api/public/submit-victim`
Endpoint para importación masiva de víctimas vía CSV. Requiere staff verificado. Acepta array de registros y los inserta usando el cliente admin (service role), saltando RLS de forma controlada.

### Interoperabilidad

#### `GET /api/pfif/feed`
Exporta las víctimas adultas registradas en formato **PFIF 1.3** (People Finder Interchange Format), el estándar de Google Person Finder. Público, sin autenticación. Parámetros opcionales:
- `min_entry_date` — ISO 8601, filtra por `updated_at`
- `max_results` — máximo 500 (default 500)

Respuesta: `application/atom+xml` con caché de 5 minutos.

#### `POST /api/sync/venezuelareporta`
Cruza víctimas propias contra la API pública de [Venezuela Reporta](https://venezuelareporta.org). Solo admins. Body:
- `{ batch: true }` — compara las últimas 50 víctimas adultas con nombre
- `{ victimId: "uuid" }` — compara una víctima específica

Busca en `/api/v1/personas` (desaparecidos) y `/api/v1/ingresos` (ingresos hospitalarios). Devuelve coincidencias por nombre para revisión humana.

### Biométrico

#### `POST /api/biometrico/comparar`
Matching facial con Claude Haiku 4.5 Vision. Solo staff verificado. Body: `{ victimId: "uuid" }`.

Flujo:
1. Obtiene la foto de la víctima de referencia (signed URL)
2. Obtiene las 15 víctimas adultas más recientes con fotos (signed URLs)
3. Envía todas las imágenes a Claude Vision en un único request multimodal
4. Parsea el JSON devuelto: `{ coincidencias: [{ indice, confianza, razon }] }`
5. Retorna solo coincidencias con confianza `alta` o `media`

Respuesta: `{ matches: BiometricoMatch[], totalCandidatos: number }`

> Los resultados son sugerencias — requieren revisión humana antes de cualquier acción.

---

## Agente IA (RAG)

Ubicado en `src/lib/agent/`. Funciona idéntico por WhatsApp (WAHA), SMS (Twilio) y web (chat flotante).

### Intents reconocidos

| Intent | Acción |
|---|---|
| `REGISTER_VICTIM` | Extrae datos en JSON con LLM e inserta en Supabase |
| `SEARCH_PERSON` | Llama a `search_victims_public` RPC (adultos sin datos sensibles) |
| `FIRST_AID` | RAG sobre las 8 guías de primeros auxilios estáticas |
| `LOCATION_INFO` | Consulta `locations` activas y devuelve lista con ocupación |
| `HELP` | Menú contextual según rol del usuario |
| `OTHER` | Respuesta libre con el LLM usando el system prompt de emergencia |

### Módulos

| Archivo | Descripción |
|---|---|
| `src/lib/agent/index.ts` | Orquestador principal — clasificación de intents y dispatch |
| `src/lib/agent/openrouter.ts` | Cliente OpenRouter con soporte de texto e imágenes (`imagePart`, `textPart`) |
| `src/lib/agent/rag.ts` | Retrieval de guías de primeros auxilios + búsqueda de víctimas + creación |
| `src/lib/agent/waha.ts` | Cliente WAHA: `sendMessage`, `extractPhone`, `normalizeChatId` |

---

## Integración Venezuela Reporta

Cliente tipado en `src/lib/venezuelareporta.ts` para la [API pública](https://venezuelareporta.org/api-abierta) de Venezuela Reporta.

| Función | Endpoint | Descripción |
|---|---|---|
| `buscarPersonas(query, limit?)` | `GET /api/v1/personas` | Busca desaparecidos por nombre, cédula o ciudad |
| `buscarIngresos(query, limit?)` | `GET /api/v1/ingresos` | Busca en listas de ingresos hospitalarios |
| `obtenerSitios(tipo?)` | `GET /api/v1/sitios` | Hospitales, refugios, centros de acopio |
| `publicarVictima(apiKey, data)` | `POST /api/v1/personas` | Publica una víctima (requiere API key de escritura) |

Lectura pública sin autenticación. Para escritura, solicitar key en `ayuda@venezuelareporta.org`.

---

## Compartir y QR (`VictimaCompartir`)

En cada perfil de víctima (`/victima/[id]`), para cualquier usuario con acceso:

- **WhatsApp** — enlace `wa.me/?text=...` con nombre, estado, ubicación y URL del perfil
- **Telegram** — enlace `t.me/share/url?...`
- **Copiar enlace** — `navigator.clipboard` con confirmación visual
- **QR** — generado server-side con `qrcode` en azul marino `#1a2744`. Al expandirlo aparece botón "Imprimir ficha QR" que abre una ventana de impresión con ficha lista para pegar en la cama del hospital.

---

## Matching biométrico (`BiometricoPanel`)

Visible en el perfil de víctima solo para staff verificado cuando la víctima tiene fotos.

1. Clic en "Buscar similares"
2. Llama a `POST /api/biometrico/comparar`
3. Claude Vision compara la foto contra hasta 15 víctimas adultas recientes con fotos
4. Muestra coincidencias con etiqueta de confianza (alta / media) y razón textual
5. Cada coincidencia enlaza al perfil de la víctima candidata para revisión

**Limitación actual:** Claude Vision es un modelo de propósito general, no un sistema especializado de reconocimiento facial. Para escalar a miles de víctimas, se puede migrar a AWS Rekognition (`IndexFaces` + `SearchFacesByImage`).

---

## Guías de primeros auxilios (offline)

8 guías SSG en `/primeros-auxilios/[slug]`, generadas en build time. Funcionan sin conexión una vez cacheadas por el service worker.

| Slug | Guía |
|---|---|
| `rcp` | Reanimación cardiopulmonar |
| `hemorragia` | Control de hemorragias |
| `shock` | Tratamiento del shock |
| `aplastamiento` | Síndrome de aplastamiento |
| `fracturas` | Inmovilización de fracturas |
| `quemaduras` | Quemaduras y escaldaduras |
| `inconsciencia` | Persona inconsciente / posición lateral |
| `asfixia` | Maniobra de Heimlich y asfixia |

---

## Supabase — esquema

Seis tablas en `supabase/schema.sql`:

| Tabla | Descripción |
|---|---|
| `profiles` | Extiende `auth.users`. Campos: `role`, `is_verified`, `phone`, `cedula`, `cedula_photo_url`, `selfie_url` |
| `victims` | Entidad principal. `is_minor` controla visibilidad. `photo_urls TEXT[]` almacena rutas privadas |
| `locations` | Hospitales y refugios con coordenadas, capacidad y ocupación actual |
| `access_requests` | Solicitudes de acceso familiar. Caducan 48 h tras aprobación. Campo `id_document_type` (cédula / acta de nacimiento) |
| `audit_log` | Append-only — solo INSERT, sin UPDATE/DELETE permitido por RLS |
| `minor_inquiries` | Reportes de menores. Requiere sesión autenticada + documento de identidad adjunto |

Funciones SQL (SECURITY DEFINER): `current_user_role()`, `is_admin()`, `is_verified_staff()`, `search_victims_public(p_query TEXT)`.

Migraciones: añadir al final de `supabase/schema.sql` con cabecera de comentario, ejecutar en Supabase SQL Editor.

---

## Privacidad — reglas críticas

- **Fotos de víctimas** — almacenadas como rutas privadas en `victim-photos` (bucket no público). Siempre servidas via signed URLs desde `/api/victima/[id]/fotos`. Nunca llamar a `getPublicUrl` sobre fotos de víctimas.
- **Menores** (`is_minor = true`) — invisibles en búsqueda pública. La función `search_victims_public` (SECURITY DEFINER con columnas fijas) impide cualquier leak. Nunca consultar `victims` directamente desde un endpoint público.
- **Acceso familiar** — RLS exige `access_requests.status = 'approved'` AND `expires_at > NOW()`. Sin eso, el familiar no puede leer la fila aunque conozca el UUID.
- **Teléfonos** — nunca se exponen por API (Venezuela Reporta tiene la misma política).
- **Matching biométrico** — solo staff verificado. Resultados son sugerencias privadas, no se exponen públicamente.

---

## Supabase clients — tres clientes, nunca mezclar

| Archivo | Cuándo usar |
|---|---|
| `src/lib/supabase/client.ts` | Componentes `'use client'` — usa `createBrowserClient` |
| `src/lib/supabase/server.ts` | Server Components y server actions — lee cookies |
| `src/lib/supabase/admin.ts` | Route handlers que necesitan bypassear RLS — usa `SUPABASE_SERVICE_ROLE_KEY` |

Nunca importar `admin.ts` desde un componente cliente. Nunca añadir `NEXT_PUBLIC_` al service role key.

---

## Agente WhatsApp (WAHA)

El servicio WAHA corre como contenedor separado en Railway (`waha-production-8a86.up.railway.app`).

Para reconectar la sesión:
1. Dashboard WAHA → Sessions → crear sesión `rescatevz`
2. Webhook: `{APP_URL}/api/waha/webhook` + eventos `message` y `session.status`
3. Create & Start → escanear QR **inmediatamente**
4. No abrir WhatsApp en el teléfono después de escanear

Variables necesarias en el servicio WAHA de Railway: `WAHA_API_KEY`, `WAHA_SESSION`.

---

## Mapas (`MapaRescate`)

`src/components/MapaRescate.tsx` es un componente cliente que importa Leaflet de forma dinámica (SSR-safe). Siempre debe envolverse en `src/components/MapaClientWrapper.tsx` cuando se usa desde un Server Component — `ssr: false` no está permitido directamente en Server Components en Next.js 16.

---

## Deploy

```bash
railway up --service rescatevz
```

Railway construye automáticamente desde el directorio raíz. No requiere Dockerfile. El comando `start` en `package.json` ejecuta `next start`.

Variables de entorno gestionadas desde Railway → Project → Service → Variables.

---

## Equipo

| Persona | GitHub | Área |
|---|---|---|
| Alejandro | alejandrojesusperezblanco4-commits | Arquitectura, backend, Supabase, infra Railway, agente IA, integraciones, diseño |
| Amir | amiralimustafap-source | Frontend, seguridad, búsqueda pública, panel menores, acceso familiar |

---

## Pendiente (próximos sprints)

- [ ] Dominio propio (rescatevz.org o similar)
- [ ] Migrar resto de páginas internas al nuevo tema dark (solicitudes, verificacion, victima/[id], registro)
- [ ] Notificaciones push a familias cuando se aprueba su solicitud
- [ ] Publicar víctimas automáticamente en Venezuela Reporta al registrarlas (requiere API key de escritura)
- [ ] Migrar matching biométrico a AWS Rekognition para escalar a miles de víctimas
- [ ] Timeline de víctima — historial de movimientos entre ubicaciones
- [ ] Realtime en dashboard y lista de víctimas (Supabase Realtime)
- [ ] Export CSV para coordinadores
- [ ] Upload de listas hospitalarias por la comunidad
