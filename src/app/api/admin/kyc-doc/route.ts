import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/admin/kyc-doc?userId=...
// Admin only — genera signed URL temporal para la foto de cédula del perfil
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = getAdmin()
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 })

  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  const { data: profile } = await admin.from('profiles').select('cedula_photo_url').eq('id', userId).single()
  if (!profile?.cedula_photo_url) {
    return NextResponse.json({ error: 'Este usuario no tiene foto de cédula' }, { status: 404 })
  }

  const { data: signed, error } = await admin.storage
    .from('access-docs')
    .createSignedUrl(profile.cedula_photo_url, 300)

  if (error || !signed) {
    return NextResponse.json({ error: 'No se pudo generar URL' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
