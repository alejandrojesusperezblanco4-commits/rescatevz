// Cliente para la API de WAHA (WhatsApp HTTP API)
// Docs: https://waha.devlike.pro/docs/how-to/send-messages/

function getWahaBase() {
  return process.env.WAHA_API_URL?.replace(/\/$/, '') || ''
}

function wahaHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.WAHA_API_KEY || '',
  }
}

export async function sendMessage(to: string, text: string): Promise<void> {
  const base = getWahaBase()
  if (!base) return

  // Normaliza el número: WAHA espera "5491234567890@c.us"
  const chatId = normalizeChatId(to)

  await fetch(`${base}/api/sendText`, {
    method: 'POST',
    headers: wahaHeaders(),
    body: JSON.stringify({
      chatId,
      text,
      session: 'Default',
    }),
  })
}

// WAHA envía el from como "5491234567890@c.us" — extraemos el número
export function extractPhone(from: string): string {
  return from.replace('@c.us', '').replace('@s.whatsapp.net', '').trim()
}

function normalizeChatId(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@c.us`
}
