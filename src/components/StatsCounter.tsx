'use client'

import { useEffect, useRef, useState } from 'react'

interface Stat {
  label: string
  value: number
  color: string
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className={`text-3xl sm:text-4xl font-black tabular-nums ${s.color}`}>
            {s.prefix}<Counter target={s.value} />{s.suffix}
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center leading-tight">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
