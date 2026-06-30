import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import Header from '@/components/Header'
import Link from 'next/link'

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  ayuda:     { label: 'Ayuda internacional', icon: 'volunteer_activism', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  corredor:  { label: 'Corredor humanitario', icon: 'route',             color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  recursos:  { label: 'Recursos disponibles', icon: 'inventory',         color: '#D4A017', bg: 'rgba(212,160,23,0.12)' },
  alerta:    { label: 'Alerta',               icon: 'warning',           color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  general:   { label: 'General',              icon: 'newspaper',         color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export const revalidate = 60

export default async function NoticiasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const { data: posts } = await supabase
    .from('news_posts')
    .select('id, title, content, category, source_url, created_at, author:profiles(full_name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>

      {profile ? (
        <Header profile={profile as Profile} />
      ) : (
        <header className="px-6 py-3 flex items-center justify-between"
          style={{ background: '#162040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="RescateVZ" className="w-7 h-7" />
            <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>RescateVZ</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/buscar" className="text-sm" style={{ color: '#94A3B8' }}>Buscar familiar</Link>
            <Link href="/login" className="text-sm font-bold" style={{ color: '#D4A017' }}>Entrar</Link>
          </div>
        </header>
      )}

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Tablón de noticias
            </h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              Información verificada por coordinadores de RescateVZ
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Link href="/admin/noticias"
              className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: '#D4A017', color: '#1a2744' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
              Gestionar
            </Link>
          )}
        </div>

        {/* Leyenda de categorías */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(CATEGORY_META).map(([key, m]) => (
            <span key={key} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ background: m.bg, color: m.color }}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{m.icon}</span>
              {m.label}
            </span>
          ))}
        </div>

        {(!posts || posts.length === 0) ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl block mb-4" style={{ color: '#334155' }}>
              newspaper
            </span>
            <p className="font-medium" style={{ color: '#475569' }}>No hay publicaciones todavía</p>
            <p className="text-sm mt-1" style={{ color: '#334155' }}>
              Los coordinadores publicarán actualizaciones sobre ayuda y recursos aquí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post: any) => {
              const meta = CATEGORY_META[post.category] || CATEGORY_META.general
              return (
                <article key={post.id} className="rounded-xl p-5"
                  style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: meta.bg }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: meta.color }}>
                        {meta.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                        <span className="text-xs" style={{ color: '#475569' }}>
                          {timeAgo(post.created_at)}
                        </span>
                      </div>
                      <h2 className="font-bold text-base mb-2 leading-snug" style={{ color: '#F0F4FF' }}>
                        {post.title}
                      </h2>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#94A3B8' }}>
                        {post.content}
                      </p>
                      {post.source_url && (
                        <a href={post.source_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs mt-3 hover:underline"
                          style={{ color: '#D4A017' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>open_in_new</span>
                          Ver fuente
                        </a>
                      )}
                      <p className="text-xs mt-3" style={{ color: '#334155' }}>
                        Publicado por {(post.author as any)?.full_name?.split(' ')[0] || 'Coordinador'}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
