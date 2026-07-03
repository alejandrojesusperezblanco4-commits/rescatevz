# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build — also runs TypeScript type check
npm run start    # Run the production build locally
npm run lint     # ESLint
```

No test suite is configured. Verify correctness by running `npm run build` (catches all TS errors) and testing in the browser.

## Stack

- **Next.js 16** (App Router) — **breaking changes from Next.js 13/14**. Read `node_modules/next/dist/docs/` before touching routing or middleware. `middleware` was renamed to `proxy` — the auth gate lives in `src/proxy.ts`, not `src/middleware.ts`.
- **Tailwind CSS v4** — configured via `src/app/globals.css` with `@import "tailwindcss"`, no `tailwind.config.js`.
- **Supabase** — auth, PostgreSQL, and storage.
- **Railway** — production host. Deploy: `railway up --service rescatevz`.

## Supabase client usage — three clients, never mix them

| File | When to use |
|---|---|
| `src/lib/supabase/client.ts` | `'use client'` components only — uses `createBrowserClient` |
| `src/lib/supabase/server.ts` | Server Components and server actions — reads cookies |
| `src/lib/supabase/admin.ts` | API route handlers that must bypass RLS — uses `SUPABASE_SERVICE_ROLE_KEY` |

**Never import `admin.ts` from a client component.** Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.

The admin client is used in two places: `src/app/api/victima/[id]/fotos/route.ts` (sign photo URLs after RLS check) and `src/app/api/twilio/webhook/route.ts` (write victims without a session). Both initialize it inside the handler, not at module level, so the env var is available at runtime.

## Auth and roles

`src/proxy.ts` guards all routes. Public paths are listed in the `publicPaths` array — add new public API routes or pages there. Authenticated routes redirect to `/login`; logged-in users redirect away from `/login` and `/registro`.

Four roles (`admin`, `rescuer`, `medical`, `family`) are stored in `public.profiles.role`. Rescuers and medical staff start with `is_verified = false` and can only register victims after an admin approves them via `/verificacion`.

RLS enforces all access at the database level. Never rely solely on UI conditionals for security.

## Key privacy rules — do not break these

- **Photos** are stored as private storage paths (not public URLs) in `victims.photo_urls`. Always serve them via signed URLs from `src/app/api/victima/[id]/fotos/route.ts`. Never call `getPublicUrl` on victim photos.
- **Minors** (`is_minor = true`) are invisible in public search. The `search_victims_public` SQL function (SECURITY DEFINER) enforces this — never query `victims` directly from a public endpoint.
- **Family access** to a victim profile is gated by `access_requests` with `status = 'approved'` and `expires_at > NOW()`. The RLS policy `"victims: leer (familiar aprobado)"` enforces this.
- **Audit log** (`public.audit_log`) is append-only. Log all sensitive actions: victim creation/update, staff verification, access approvals.

## Database schema overview

Five tables in `supabase/schema.sql`:
- `profiles` — extends `auth.users`; role + verification state
- `victims` — core entity; `is_minor` flag gates visibility
- `locations` — hospitals and shelters with coordinates
- `access_requests` — family requests to view a victim profile; expires after 48h when approved
- `audit_log` — immutable event log; no UPDATE/DELETE policies

Helper SQL functions (SECURITY DEFINER): `current_user_role()`, `is_admin()`, `is_verified_staff()`, `search_victims_public(p_query TEXT)`.

Schema migrations live at the bottom of `supabase/schema.sql` — add new migrations there as comments with a header, then run them in Supabase SQL Editor.

## Static content

First-aid guides (`src/data/primeros-auxilios.ts`) are bundled as static data — no database queries. The 8 guides render as SSG pages at `/primeros-auxilios/[slug]`. They work offline once cached.

## Maps

`src/components/MapaRescate.tsx` is a client component that imports Leaflet dynamically (SSR-safe). It must always be wrapped in `src/components/MapaClientWrapper.tsx` when used from a Server Component — `ssr: false` is not allowed directly in Server Components in Next.js 16.

## WhatsApp / Twilio webhook

`POST /api/twilio/webhook` is public (listed in `proxy.ts`). It validates the Twilio signature, looks up the sender by `profiles.phone`, and creates victims using the admin Supabase client. The Supabase client must be instantiated inside the handler function, not at module level, to avoid build-time errors from missing env vars.

## Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # server-only, never NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL                # used in webhook replies
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER
```

## Nota para Amir (2026-07-03)

Hola Amir — Alejandro me pidió auditar analytics y el mapa público, esto es lo que cambió (commits `659fad9`, `57581c0`, `7091d2f`, todos en `master`):

- **Analytics** (`AnalyticsPanel.tsx`): el backend (`api/admin/analytics/route.ts`) ya calculaba `fallecidosPorDia`, `deceased`, `deceased24h` y `mortalityRate` desde tu commit `5b193a6`, pero el panel nunca se actualizó para mostrarlos. Ya están visibles (3 KPIs + gráfico de barras nuevo).
- **Ocupación real de hospitales/refugios**: `locations.current_occupancy` siempre estaba en 0 — se creaba así y no había forma de editarlo. Añadí un trigger en Postgres (`recalc_location_occupancy` + `trg_victims_sync_occupancy`, al final de `supabase/schema.sql`) que lo sincroniza automáticamente con el conteo real de `victims.current_location_id` (excluyendo fallecidos) en cada INSERT/UPDATE/DELETE de víctimas. Ya está aplicado en Supabase, no hace falta que hagas nada ahí.
- **Descubrimiento importante para ti** (dado que construiste `structures`, el semáforo de habitabilidad y el mapa NASA): al verificar el trigger encontré que **0 de las 66.483 víctimas tienen `current_location_id` asignado** — el desplegable "Hospital o refugio actual" en `VictimaForm.tsx` existía pero era opcional y nadie lo estaba usando. Lo hice obligatorio (commit `7091d2f`), probado end-to-end. Pero esto significa que la ocupación seguirá en 0 en la práctica hasta que se registren víctimas nuevas con ubicación — los datos históricos (los 64k importados de Venezuela Reporta) no tienen y no tendrán ubicación real a menos que se haga un matching manual/heurístico contra `found_location`.
- **Pendiente que dejé sin tocar**: `ActualizarVictimaForm.tsx` (el formulario de edición) todavía tiene el mismo desplegable como opcional — podría servir para ir asignando ubicación retroactiva a víctimas existentes si alguien quiere pulirlo.
- **Aparte, arreglé un build roto en Railway**: `package-lock.json` había quedado inconsistente (faltaban entradas de `@emnapi/*`, dependencias transitivas de `sharp`) tras instalar `web-push`. Si alguna vez ves que Railway falla con "npm ci can only install packages when... are in sync", la solución es `rm -rf node_modules package-lock.json && npm install` desde cero (no basta con `npm install` sobre un `node_modules` ya poblado).

— Claude (con Alejandro)
