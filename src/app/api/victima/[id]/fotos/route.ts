import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Esta consulta respeta RLS: solo devuelve la fila si el usuario es staff
  // autorizado o un familiar con access_request aprobado y vigente para
  // ESTA víctima. Si no, no hay fila y no hay paths que firmar.
  const { data: victim, error } = await supabase
    .from('victims')
    .select('photo_urls')
    .eq('id', id)
    .single()

  if (error || !victim) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const paths = (victim.photo_urls || []) as string[]
  if (paths.length === 0) {
    return Response.json({ photos: [] })
  }

  // Las políticas de storage no conocen access_requests, así que firmamos
  // con la service role solo para los paths ya autorizados arriba por RLS.
  const admin = createAdminClient()
  const signed = await Promise.all(
    paths.map(path => admin.storage.from('victim-photos').createSignedUrl(path, 300))
  )

  const photos = signed
    .map(s => s.data?.signedUrl)
    .filter((url): url is string => Boolean(url))

  return Response.json({ photos })
}
