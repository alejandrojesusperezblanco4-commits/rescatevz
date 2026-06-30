const CACHE_NAME = 'rescatevz-v1'
const STATIC_CACHE = 'rescatevz-static-v1'

// Recursos a pre-cachear en install (guías SSG + shell mínimo)
const PRECACHE_URLS = [
  '/offline.html',
  '/primeros-auxilios',
  '/primeros-auxilios/rcp',
  '/primeros-auxilios/hemorragia',
  '/primeros-auxilios/shock',
  '/primeros-auxilios/aplastamiento',
  '/primeros-auxilios/fracturas',
  '/primeros-auxilios/quemaduras',
  '/primeros-auxilios/inconsciencia',
  '/primeros-auxilios/asfixia',
  '/guia',
]

// Rutas que NUNCA se cachean (autenticación, datos en tiempo real, APIs)
const NO_CACHE_PATTERNS = [
  /^\/api\//,
  /^\/dashboard/,
  /^\/victimas/,
  /^\/victima\//,
  /^\/solicitudes/,
  /^\/verificacion/,
  /^\/ubicaciones/,
  /^\/menores/,
  /^\/sincronizacion/,
  /^\/admin\//,
  /^\/mis-solicitudes/,
]

// ─── Install: pre-cachear recursos críticos ────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // no bloquear install si falla una URL
  )
})

// ─── Activate: limpiar caches viejos ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ─── Fetch: estrategia por tipo de recurso ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Solo interceptar GET del mismo origen
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) return

  // NUNCA cachear rutas de datos/auth
  if (NO_CACHE_PATTERNS.some(p => p.test(url.pathname))) return

  // Assets estáticos de Next.js → Cache-first forever
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Google Fonts → Cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Guías de primeros auxilios y guía general → Stale-while-revalidate
  // (SSG: seguro cachear, se actualizan rara vez)
  if (
    url.pathname.startsWith('/primeros-auxilios') ||
    url.pathname === '/guia' ||
    url.pathname === '/offline.html'
  ) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Landing pública → Stale-while-revalidate
  if (url.pathname === '/') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Resto de páginas públicas → Network-first, offline fallback
  if (url.pathname.startsWith('/buscar') || url.pathname.startsWith('/mapa-publico')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Por defecto → Network-first sin guardar en cache
  event.respondWith(fetch(request).catch(() => caches.match('/offline.html')))
})

// ─── Helpers ──────────────────────────────────────────────

async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Recurso no disponible offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached || fetchPromise || offlineFallback()
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || offlineFallback()
  }
}

async function offlineFallback() {
  const cached = await caches.match('/offline.html')
  return cached || new Response(
    '<h1>Sin conexión</h1><p>Abre /primeros-auxilios para las guías offline.</p>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}
