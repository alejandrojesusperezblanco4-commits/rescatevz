import type { Metadata } from 'next'
import './globals.css'
import ChatWidget from '@/components/ChatWidget'

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
    <html lang="es" className="h-full dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
        <ChatWidget />
      </body>
    </html>
  )
}
