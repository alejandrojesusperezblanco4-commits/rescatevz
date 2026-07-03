import type { NextConfig } from 'next'

// CSP notas:
// - style-src necesita 'unsafe-inline' porque el código usa style={{}} inline extensamente.
// - script-src necesita 'unsafe-inline' para los scripts de hidratación de Next.js.
// - worker-src blob: necesario para el service worker generado en runtime.
// - connect-src incluye wss: para Supabase Realtime y earthquake.usgs.gov para sismos.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdnjs.cloudflare.com https://*.tile.openstreetmap.org https://images.unsplash.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://earthquake.usgs.gov",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy',   value: csp },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
