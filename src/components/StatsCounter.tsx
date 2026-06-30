'use client'

import { useEffect, useRef, useState } from 'react'

interface Stat {
  label: string
  value: number
  color: string
  borderColor?: string
  prefix?: string
  suffix?: string
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
      {stats.map((s, i) => (
        <div
          key={i}
          className="p-6 rounded-lg"
          style={{
            background: '#1a2a46',
            boxShadow: `-3px 0 0 0 ${s.borderColor ?? '#D4A017'}`,
            border: '1px solid rgba(69,70,77,0.6)',
          }}
        >
          <p className="mb-2 uppercase" style={{ fontSize: '11px', letterSpacing: '0.08em', fontWeight: 500, color: '#c5c6ce' }}>
            {s.label}
          </p>
          <p className="tabular-nums" style={{ fontFamily: "'Manrope', sans-serif", fontSize: '48px', lineHeight: 1, fontWeight: 800, color: '#f6be39' }}>
            {s.prefix}<Counter target={s.value} />{s.suffix}
          </p>
        </div>
      ))}
    </>
  )
}
