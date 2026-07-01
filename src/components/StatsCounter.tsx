'use client'

import { useEffect, useRef, useState } from 'react'

interface Stat {
  label: string
  value: number
  color: string
  borderColor?: string
  prefix?: string
  suffix?: string
  icon?: string
  iconColor?: string
}

function Counter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
          else setCount(target)
        }
        requestAnimationFrame(tick)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString('es-VE')}</span>
}

export default function StatsCounter({ stats }: { stats: Stat[] }) {
  return (
    <>
      {stats.map((s, i) => {
        const accent = s.borderColor ?? '#D4A017'
        return (
          <div
            key={i}
            className="p-6 rounded-xl flex flex-col gap-3 transition-all hover:brightness-110"
            style={{
              background: '#1a2a46',
              border: `1px solid rgba(69,70,77,0.6)`,
              borderLeft: `3px solid ${accent}`,
            }}
          >
            {s.icon && (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '32px', color: s.iconColor ?? accent, fontVariationSettings: "'FILL' 1" }}
              >
                {s.icon}
              </span>
            )}
            <p className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: '42px', lineHeight: 1, fontWeight: 800, color: '#f6be39' }}>
              {s.prefix}<Counter target={s.value} />{s.suffix}
            </p>
            <p className="uppercase" style={{ fontSize: '11px', letterSpacing: '0.08em', fontWeight: 500, color: '#c5c6ce' }}>
              {s.label}
            </p>
          </div>
        )
      })}
    </>
  )
}
