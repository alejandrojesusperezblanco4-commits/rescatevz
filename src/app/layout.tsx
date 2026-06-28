import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RescateVZ — Registro de víctimas',
  description: 'Plataforma de registro y búsqueda de víctimas del terremoto en Venezuela',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
