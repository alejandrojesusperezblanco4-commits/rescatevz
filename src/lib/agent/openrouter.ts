const BASE_URL = 'https://openrouter.ai/api/v1'
const MODEL = 'anthropic/claude-haiku-4.5'

type TextPart = { type: 'text'; text: string }
type ImagePart = { type: 'image_url'; image_url: { url: string } }
type ContentPart = TextPart | ImagePart

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

export function imagePart(url: string): ImagePart {
  return { type: 'image_url', image_url: { url } }
}

export function textPart(text: string): TextPart {
  return { type: 'text', text }
}

export async function chat(messages: Message[], opts?: { json?: boolean }): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://rescatevz.app',
      'X-Title': 'RescateVZ',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
      ...(opts?.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content as string
}
