'use client'

import { useState } from 'react'

interface Props {
  victimId: string
  victimName: string | null
  status: string
  foundLocation: string
  qrDataUrl: string
  victimUrl: string
}

const STATUS_ES: Record<string, string> = {
  alive: 'Con vida',
  critical: 'Estado crítico',
  deceased: 'Fallecido/a',
  unknown: 'Estado desconocido',
}

export default function VictimaCompartir({ victimId, victimName, status, foundLocation, qrDataUrl, victimUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  const nombreTexto = victimName || 'Persona sin identificar'
  const estadoTexto = STATUS_ES[status] || status

  const shareText = encodeURIComponent(
    `🆘 RescateVZ — Terremoto Venezuela\n\n` +
    `Persona encontrada: *${nombreTexto}*\n` +
    `Estado: ${estadoTexto}\n` +
    `Encontrada en: ${foundLocation}\n\n` +
    `Para ver el perfil completo o solicitar acceso como familiar:\n${victimUrl}`
  )

  async function copyLink() {
    await navigator.clipboard.writeText(victimUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function printQr() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>QR Víctima — RescateVZ</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 40px; }
          .card { border: 2px solid #333; padding: 24px; display: inline-block; border-radius: 12px; max-width: 280px; }
          h2 { font-size: 16px; margin: 0 0 4px; }
          p { font-size: 13px; color: #555; margin: 4px 0; }
          img { width: 200px; height: 200px; margin: 16px 0; }
          .id { font-size: 11px; color: #999; font-family: monospace; }
          .footer { font-size: 11px; color: #999; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>${nombreTexto}</h2>
          <p>${estadoTexto}</p>
          <p>${foundLocation}</p>
          <img src="${qrDataUrl}" alt="QR"/>
          <div class="id">ID: ${victimId.slice(0, 8).toUpperCase()}</div>
          <div class="footer">Escanea para ver perfil completo<br/>RescateVZ — Terremoto Venezuela 2026</div>
        </div>
        <script>window.onload = () => window.print()</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Compartir perfil</p>

      <div className="flex flex-wrap gap-2">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(victimUrl)}&text=${encodeURIComponent(`RescateVZ — ${nombreTexto} (${estadoTexto})`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
        </a>

        {/* Copiar enlace */}
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {copied ? '✓ Copiado' : 'Copiar enlace'}
        </button>

        {/* QR */}
        <button
          onClick={() => setShowQr(v => !v)}
          className="flex items-center gap-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          QR
        </button>
      </div>

      {showQr && (
        <div className="mt-4 flex flex-col items-start gap-3">
          <img src={qrDataUrl} alt="QR del perfil" className="w-36 h-36 border border-gray-200 rounded-lg" />
          <button
            onClick={printQr}
            className="text-sm text-blue-600 hover:underline"
          >
            Imprimir ficha QR →
          </button>
          <p className="text-xs text-gray-400">
            Escanear lleva al perfil. Familia debe estar registrada en RescateVZ para acceder.
          </p>
        </div>
      )}
    </div>
  )
}
