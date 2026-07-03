import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAgent } from '@/lib/agent'
import type { UserRole } from '@/lib/types'

export async function POST(request: NextRequest) {
  const { message, history } = await request.json()
  if (!message?.trim()) return NextResponse.json({ reply: '' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: UserRole | null = null
  let userId = 'web-anonymous'
  let userName = 'Usuario web'
  let isVerified = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, is_verified, full_name')
      .eq('id', user.id)
      .single()
    if (profile) {
      userRole = profile.role as UserRole
      userId = profile.id
      userName = profile.full_name || 'Usuario'
      isVerified = profile.is_verified
    }
  }

  // Staff no verificado actúa como familiar
  const effectiveRole: UserRole | null = (userRole && ['rescuer', 'medical'].includes(userRole) && !isVerified)
    ? 'family'
    : userRole

  try {
    const reply = await runAgent(message.trim(), {
      userId,
      userRole: effectiveRole,
      userName,
      phone: 'web',
    })
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat agent error:', err)
    return NextResponse.json({ reply: '❌ Error interno. Intenta de nuevo.' })
  }
}
