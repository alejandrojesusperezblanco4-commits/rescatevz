'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'ayuda',    label: 'Ayuda internacional',  icon: 'volunteer_activism' },
  { value: 'corredor', label: 'Corredor humanitario',  icon: 'route' },
  { value: 'recursos', label: 'Recursos disponibles',  icon: 'inventory' },
  { value: 'alerta',   label: 'Alerta',                icon: 'warning' },
  { value: 'general',  label: 'General',               icon: 'newspaper' },
]

const VERIFIED_SOURCES = [
  'Efecto Cocuyo',
  'El Pitazo',
  'VenePress',
  'FUNVISIS',
  'PAHO / OPS Venezuela',
  'Cruz Roja Venezolana',
  'ACNUR Venezuela',
  'Gobierno de Venezuela',
  'RescateVZ',
  'Otra fuente verificada',
]

interface Post {
  id: string
  title: string
  content: string
  category: string
  source_name: string
  source_url: string | null
  is_published: boolean
  expires_at: string | null
  created_at: string
}

const EMPTY_FORM = {
  title: '',
  content: '',
  category: 'general',
  source_name: '',
  source_url: '',
}

function hoursLeft(expires_at: string | null): number | null {
  if (!expires_at) return null
  return Math.max(0, Math.round((new Date(expires_at).getTime() - Date.now()) / 3_600_000))
}

export default function NoticiasPanel({ posts: initial, adminId }: { posts: Post[]; adminId: string }) {
  const router = useRouter()
  const [posts, setPosts] = useState(initial)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [renewing, setRenewing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim() || !form.source_name.trim()) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('news_posts')
      .insert({
        title:       form.title.trim(),
        content:     form.content.trim(),
        category:    form.category,
        source_name: form.source_name.trim(),
        source_url:  form.source_url.trim() || null,
        author_id:   adminId,
        is_published: false,
      })
      .select()
      .single()
    if (err || !data) { setError(err?.message || 'Error al guardar'); setSaving(false); return }
    setPosts(p => [data, ...p])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  async function handleToggle(post: Post) {
    setToggling(post.id)
    const supabase = createClient()
    const publishing = !post.is_published
    const updates: Record<string, unknown> = { is_published: publishing }
    // Al publicar, fijar caducidad a 48h desde ahora
    if (publishing) {
      updates.expires_at = new Date(Date.now() + 48 * 3_600_000).toISOString()
    }
    await supabase.from('news_posts').update(updates).eq('id', post.id)
    setPosts(p => p.map(x => x.id === post.id
      ? { ...x, is_published: publishing, expires_at: publishing ? updates.expires_at as string : x.expires_at }
      : x
    ))
    setToggling(null)
    router.refresh()
  }

  async function handleRenew(post: Post) {
    setRenewing(post.id)
    const supabase = createClient()
    const expires_at = new Date(Date.now() + 48 * 3_600_000).toISOString()
    await supabase.from('news_posts').update({ expires_at }).eq('id', post.id)
    setPosts(p => p.map(x => x.id === post.id ? { ...x, expires_at } : x))
    setRenewing(null)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('news_posts').delete().eq('id', id)
    setPosts(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  const published = posts.filter(p => p.is_published).length
  const drafts    = posts.filter(p => !p.is_published).length

  return (
    <div>
      {/* Stats + botón nueva */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-4 text-sm">
          <span style={{ color: '#22C55E' }}>● {published} publicadas</span>
          <span style={{ color: '#475569' }}>● {drafts} borradores</span>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg transition-all hover:brightness-110"
          style={{ background: '#D4A017', color: '#1a2744' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
            {showForm ? 'close' : 'add'}
          </span>
          {showForm ? 'Cancelar' : 'Nueva noticia'}
        </button>
      </div>

      {/* Formulario nueva noticia */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-6 flex flex-col gap-4"
          style={{ background: '#1e2d4a', border: '1px solid rgba(212,160,23,0.3)' }}>
          <h2 className="font-bold text-sm" style={{ color: '#D4A017' }}>Nueva publicación</h2>

          {/* Categoría */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: '#94A3B8' }}>Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, category: c.value }))}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={form.category === c.value
                    ? { background: '#D4A017', color: '#1a2744' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#64748B', border: '1px solid rgba(36,51,86,0.5)' }
                  }>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fuente — obligatoria */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#94A3B8' }}>
              Fuente verificada <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VERIFIED_SOURCES.map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, source_name: s }))}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={form.source_name === s
                    ? { background: '#1a2744', color: '#D4A017', border: '1px solid #D4A017' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#64748B', border: '1px solid rgba(36,51,86,0.5)' }
                  }>
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text" required value={form.source_name}
              onChange={e => setForm(f => ({ ...f, source_name: e.target.value }))}
              placeholder="O escribe el nombre de la fuente"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#94A3B8' }}>
              Título <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Cruz Roja entrega 500 kits médicos en Caracas"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {/* Contenido */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#94A3B8' }}>
              Contenido <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              required rows={4} value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Describe la noticia con todos los detalles relevantes: qué, dónde, cuándo, a quién contactar..."
              className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
            />
          </div>

          {/* URL fuente */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#94A3B8' }}>
              Enlace a la nota original{' '}
              <span style={{ color: '#475569' }}>(recomendado — pega la URL del artículo)</span>
            </label>
            <input
              type="url" value={form.source_url}
              onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
              placeholder="https://efectococuyo.com/..."
              className="w-full rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'rgba(220,38,38,0.1)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.3)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 font-bold py-2.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: '#1a2744', color: '#D4A017', border: '1px solid #D4A017' }}>
              {saving ? 'Guardando…' : 'Guardar borrador'}
            </button>
          </div>
          <p className="text-xs text-center" style={{ color: '#475569' }}>
            Al publicar caduca en 48h automáticamente — usa "Renovar" para extender.
          </p>
        </form>
      )}

      {/* Lista de posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: '#334155' }}>newspaper</span>
          <p style={{ color: '#475569' }}>No hay noticias todavía. Crea la primera.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => {
            const cat   = CATEGORIES.find(c => c.value === post.category) || CATEGORIES[4]
            const hours = hoursLeft(post.expires_at)
            const expired = hours !== null && hours === 0
            return (
              <div key={post.id} className="rounded-xl p-4"
                style={{
                  background: '#1e2d4a',
                  border: `1px solid ${expired ? 'rgba(220,38,38,0.4)' : post.is_published ? 'rgba(34,197,94,0.25)' : 'rgba(36,51,86,0.5)'}`,
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={expired
                          ? { background: 'rgba(220,38,38,0.12)', color: '#DC2626' }
                          : post.is_published
                            ? { background: 'rgba(34,197,94,0.12)', color: '#22C55E' }
                            : { background: 'rgba(148,163,184,0.12)', color: '#64748B' }
                        }>
                        {expired ? '⚠ Caducada' : post.is_published ? '● Publicada' : '○ Borrador'}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#475569' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{cat.icon}</span>
                        {cat.label}
                      </span>
                      {/* Fuente */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(212,160,23,0.1)', color: '#D4A017' }}>
                        {post.source_name}
                      </span>
                      {/* Tiempo restante */}
                      {post.is_published && hours !== null && hours > 0 && (
                        <span className="text-xs" style={{ color: hours < 6 ? '#F59E0B' : '#475569' }}>
                          caduca en {hours}h
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm mb-1 leading-snug" style={{ color: '#F0F4FF' }}>{post.title}</p>
                    <p className="text-xs line-clamp-2" style={{ color: '#64748B' }}>{post.content}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleToggle(post)} disabled={toggling === post.id}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                      style={post.is_published
                        ? { background: 'rgba(148,163,184,0.1)', color: '#94A3B8', border: '1px solid rgba(36,51,86,0.5)' }
                        : { background: '#22C55E', color: '#fff' }
                      }>
                      {toggling === post.id ? '…' : post.is_published ? 'Despublicar' : 'Publicar'}
                    </button>
                    {post.is_published && (
                      <button onClick={() => handleRenew(post)} disabled={renewing === post.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:brightness-110 disabled:opacity-60"
                        style={{ background: 'rgba(212,160,23,0.1)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}>
                        {renewing === post.id ? '…' : '↺ Renovar'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
                      style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}>
                      {deleting === post.id ? '…' : 'Borrar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
