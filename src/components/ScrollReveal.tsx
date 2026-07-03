'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
  className?: string
  style?: React.CSSProperties
}

export default function ScrollReveal({
  children, delay = 0, direction = 'up', className = '', style,
}: ScrollRevealProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => setVisible(true), delay)
          observer.disconnect()
          return () => clearTimeout(t)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  const offsets: Record<string, string> = {
    up:    'translateY(28px)',
    left:  'translateX(-28px)',
    right: 'translateX(28px)',
    none:  'none',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : offsets[direction],
        transition: `opacity 0.65s ease, transform 0.65s ease`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
