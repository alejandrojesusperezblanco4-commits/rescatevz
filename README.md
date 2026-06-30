# RescateVZ

App humanitaria de emergencia para el terremoto de Venezuela (M7.2 + M7.5, 24 junio 2026).

Permite a rescatistas registrar víctimas, a familias buscar a sus seres queridos, y a personal médico actualizar el estado clínico — todo desde el móvil, con soporte offline y un agente de WhatsApp para quien no tenga acceso al navegador.

**Producción:** https://kind-balance-production-5137.up.railway.app

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, PWA) |
| Base de datos / Auth | Supabase (PostgreSQL + RLS) |
| Estilos | Tailwind CSS v4 |
| Mapas | Leaflet + OpenStreetMap |
| WhatsApp | WAHA (WhatsApp HTTP API) |
| SMS | Twilio |
| Agente IA | OpenRouter → `anthropic/claude-haiku-4.5` |
| Deploy | Railway |
| Lenguaje | TypeScript |

---

## Setup local

```bash
git clone https://github.com/alejandrojesusperezblanco4-commits/rescatevz.git
cd rescatevz
npm install
cp .env.example .env.local   # rellenar variables (ver abajo)
npm run dev
```

Comandos disponibles:

```bash
npm run dev      # servidor de desarrollo en http://localhost:3000
npm run build    # build de producción (incluye chequeo TypeScript)
npm run start    # ejecutar el build localmente
npm run lint     # ESLint
```

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # solo server — nunca NEXT_PUBLIC_

NEXT_PUBLIC_APP_URL=                # URL base de la app (sin barra final)

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER=

OPENROUTER_API_KEY=                 # para el agente RAG de WhatsApp
WAHA_API_URL=                       # URL del servicio WAHA
WAHA_API_KEY=
WAHA_SESSION=rescatevz
```

---

## Roles y acceso

| Rol | Quién | Puede |
|---|---|---|
| `admin` | Coordinadores | Todo. Aprobar staff, ver menores, gestionar ubicaciones |
| `rescuer` | Rescatistas | Registrar víctimas (tras verificación admin) |
| `medical` | Personal médico | Registrar + actualizar estado clínico (tras verificación) |
| `family` | Familiares | Buscar y solicitar acceso a perfil de víctima (caduca 48 h) |

`rescuer` y `medical` empiezan con `is_verified = false`. Un admin los verifica en `/verificacion`.

Para convertir un usuario en admin (UUID desde Supabase → Authentication → Users):

```sql
UPDATE public.profiles SET role = 'admin', is_verified = TRUE WHERE id = 'UUID';
```

---

## Rutas (17)

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Todos | Landing con accesos por rol |
| `/login` `/registro` | Todos | Auth Supabase |
| `/dashboard` | Autenticados | Stats en tiempo real + alertas admin |
| `/victimas` | Staff | Lista con filtros (estado, ubicación, menor, texto) |
| `/victimas/nueva` | Staff verificado | Formulario de registro + fotos |
| `/victima/[id]` | Staff + familiar aprobado | Perfil completo + actualización estado médico |
| `/buscar` | Todos | Búsqueda pública segura (sin menores) + reporte de menores |
| `/mis-solicitudes` | Family | Estado de sus peticiones de acceso |
| `/mapa-publico` | Todos | Mapa Leaflet con hospitales y refugios activos |
| `/primeros-auxilios` | Todos | Índice de 8 guías offline |
| `/primeros-auxilios/[slug]` | Todos | RCP, hemorragia, shock, aplastamiento, fracturas, quemaduras, inconsciencia, asfixia |
| `/solicitudes` | Admin | Aprobar / rechazar acceso familiar |
| `/verificacion` | Admin | Verificar rescatistas y personal médico pendientes |
| `/menores` | Admin | Panel de reportes de menores desaparecidos |
| `/ubicaciones` | Admin | Añadir / editar / activar hospitales y refugios |
| `/whatsapp` | Todos | Instrucciones del bot y número de contacto |
| `/guia` | Todos | Guía de uso por rol |

---

## Supabase — esquema

Cinco tablas en `supabase/schema.sql`:

| Tabla | Descripción |
|---|---|
| `profiles` | Extiende `auth.users`. Almacena `role`, `is_verified`, `phone` |
| `victims` | Entidad principal. `is_minor` controla visibilidad pública |
| `locations` | Hospitales y refugios con coordenadas |
| `access_requests` | Solicitudes familiares; caducan 48 h tras aprobación |
| `audit_log` | Log de eventos sensibles — solo INSERT, sin UPDATE/DELETE |
| `minor_inquiries` | Reportes de menores desaparecidos |

Funciones SQL auxiliares (SECURITY DEFINER): `current_user_role()`, `is_admin()`, `is_verified_staff()`, `search_victims_public(p_query TEXT)`.

Las migraciones se añaden al final de `supabase/schema.sql` como comentarios con cabecera, y se ejecutan en el SQL Editor de Supabase.

---

## Agente WhatsApp (WAHA + OpenRouter)

El servicio WAHA corre como contenedor separado en Railway (`waha-production-8a86.up.railway.app`).

El webhook está en `POST /api/waha/webhook`. El agente:
- Registra víctimas en lenguaje natural
- Responde búsquedas por nombre / cédula
- Envía guías de primeros auxilios
- Informa ubicaciones de hospitales y refugios activos

Para reconectar WAHA:
1. Dashboard WAHA → Sessions → crear sesión `rescatevz`
2. Añadir webhook: `{APP_URL}/api/waha/webhook` + eventos `message` y `session.status`
3. Create & Start → escanear QR inmediatamente
4. No abrir WhatsApp en el teléfono después de escanear

---

## Privacidad — reglas críticas

- **Fotos** se almacenan como rutas privadas en Supabase Storage. Siempre se sirven via signed URLs desde `/api/victima/[id]/fotos`. Nunca usar `getPublicUrl` en fotos de víctimas.
- **Menores** (`is_minor = true`) son invisibles en búsqueda pública. La función `search_victims_public` (SECURITY DEFINER) lo impone — nunca consultar `victims` directamente desde un endpoint público.
- **Acceso familiar** a un perfil requiere `access_requests.status = 'approved'` y `expires_at > NOW()`. Lo impone la política RLS `"victims: leer (familiar aprobado)"`.

---

## Equipo

| Persona | GitHub | Área |
|---|---|---|
| Alejandro | alejandrojesusperezblanco4-commits | Arquitectura, backend, Supabase, infra Railway |
| Amir | amiralimustafap-source | Frontend, seguridad, búsqueda pública, panel menores |

---

## Pendiente (próximos sprints)

- [ ] Dominio propio (rescatevz.org o similar)
- [ ] Notificaciones push a familias cuando se aprueba su solicitud
- [ ] Detección de duplicados de víctimas
- [ ] Integración Google Person Finder API
- [ ] Matching visual con IA (fotos de víctimas)
