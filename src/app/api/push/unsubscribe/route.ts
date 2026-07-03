import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// DELETE /api/push/unsubscribe
// Body: { endpoint: string }
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()

  const { endpoint } = await req.json() as { endpoint: string }
  if (!endpoint) return NextResponse.json({ error: 'endpoint requerido' }, { status: 400 })

  const admin = getAdmin()

  // Solo puede borrar su propia suscripción (por endpoint) o si es admin
  const query = admin.from('push_subscriptions').delete().eq('endpoint', endpoint)

  // Si está autenticado, restringe al usuario propio
  if (user) {
    await admin.from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .or(`user_id.eq.${user.id},user_id.is.null`)
  } else {
    // Sin sesión: solo borra si no tiene user_id (suscripción anónima)
    await admin.from('push_subscriptions').delete().eq('endpoint', endpoint).is('user_id', null)
  }

  return NextResponse.json({ ok: true })
}
