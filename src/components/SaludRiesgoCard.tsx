'use client'

import { useState } from 'react'
import type { RiesgoEpidemico } from '@/data/riesgos-epidemicos'

const NIVEL_META: Record<string, { color: string; bg: string; label: string }> = {
  critico: { color: '#DC2626', bg: 'rgba(220,38,38,0.12)', label: 'Crítico' },
  alto:    { color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'Alto' },
  medio:   { color: '#D4A017', bg: 'rgba(212,160,23,0.12)', label: 'Medio' },
}

export default function SaludRiesgoCard({ riesgo }: { riesgo: RiesgoEpidemico }) {
  const [open, setOpen] = useState(false)
  const meta = NIVEL_META[riesgo.nivel] ?? NIVEL_META.medio

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: '#1e2d4a', border: '1px solid rgba(36,51,86,0.6)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left transition-all hover:brightness-110">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: meta.bg }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: meta.color, fontVariationSettings: "'FILL' 1" }}>
            {riesgo.icono}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm" style={{ color: '#F0F4FF' }}>{riesgo.nombre}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs line-clamp-1" style={{ color: '#64748B' }}>{riesgo.descripcion}</p>
        </div>
        <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px', color: '#475569', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(36,51,86,0.6)' }}>
          <p className="text-sm leading-relaxed mt-3 mb-4" style={{ color: '#94A3B8' }}>
            {riesgo.descripcion}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: meta.color }}>
                Síntomas
              </p>
              <ul className="flex flex-col gap-1.5">
                {riesgo.sintomas.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#94A3B8' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: meta.color }}>•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#22C55E' }}>
                Prevención
              </p>
              <ul className="flex flex-col gap-1.5">
                {riesgo.prevencion.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#94A3B8' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: '#22C55E' }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 px-3 py-2.5 rounded-lg"
            style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}>
            <p className="text-xs font-bold mb-1" style={{ color: meta.color }}>
              Cuándo buscar atención médica
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              {riesgo.cuando_buscar_atencion}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
