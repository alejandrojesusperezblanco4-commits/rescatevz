'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RISK_LEVEL_META } from '@/data/riesgos-epidemicos'

const LEVELS = ['bajo', 'medio', 'alto', 'critico'] as const

export default function SaludAdminPanel({ currentLevel }: { currentLevel: string }) {
  const router = useRouter()
  const [level, setLevel] = useState(currentLevel)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Alerta de salud
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishedOk, setPublishedOk] = useState(false)
  const [publishError, setPublishError] = useState('')

  async function saveLevel() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'epidemic_risk_level', value: level }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  async function publishAlerta() {
    if (!title.trim() || !content.trim()) return
    setPublishing(true); setPublishError('')
    const supabase = await import('@/lib/supabase/client').then(m => m.createClient())
    const { error } = await supabase.from('news_posts').insert({
      title: title.trim(),
      content: content.trim(),
      category: 'alerta',
      is_published: true,
    })
    if (error) {
      setPublishError(error.message)
      setPublishing(false)
    } else {
      setPublishedOk(true)
      setTitle('')
      setContent('')
      setPublishing(false)
      setTimeout(() => setPublishedOk(false), 4000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Nivel de riesgo */}
      <div className="rounded-xl p-5" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
        <h2 className="font-bold mb-4" style={{ color: '#F0F4FF' }}>Nivel de riesgo epidemiológico</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {LEVELS.map(l => {
            const m = RISK_LEVEL_META[l]
            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="py-3 px-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 flex flex-col items-center gap-1"
                style={level === l
                  ? { background: m.bg, border: `2px solid ${m.color}`, color: m.color }
                  : { background: '#162040', border: '2px solid rgba(36,51,86,0.5)', color: '#475569' }
                }>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>
                  {m.icon}
                </span>
                {m.label}
              </button>
            )
          })}
        </div>
        <button
          onClick={saveLevel}
          disabled={saving || level === currentLevel}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: '#D4A017', color: '#1a2744' }}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar nivel de riesgo'}
        </button>
      </div>

      {/* Nueva alerta de salud */}
      <div className="rounded-xl p-5" style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
        <h2 className="font-bold mb-4" style={{ color: '#F0F4FF' }}>
          Publicar alerta sanitaria
        </h2>
        <p className="text-xs mb-4" style={{ color: '#64748B' }}>
          Las alertas aparecen en la sección de Salud pública y en el Tablón de noticias (categoría Alerta).
        </p>

        {publishedOk && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
            style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', color: '#86EFAC' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Alerta publicada correctamente
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Brote de leptospirosis en Petare"
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#94A3B8' }}>Contenido</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe la situación, síntomas específicos, medidas de prevención y recursos disponibles…"
              rows={4}
              className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
              style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.7)', color: '#F0F4FF' }}
            />
          </div>
          {publishError && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5' }}>
              {publishError}
            </div>
          )}
          <button
            onClick={publishAlerta}
            disabled={publishing || !title.trim() || !content.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#DC2626', color: '#fff' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
              {publishing ? 'progress_activity' : 'warning'}
            </span>
            {publishing ? 'Publicando…' : 'Publicar alerta'}
          </button>
        </div>
      </div>
    </div>
  )
}
