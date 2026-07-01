'use client'

import { useEffect, useState } from 'react'

const FRASES = [
  'Registra a quien encontraste.',
  'Busca a quien perdiste.',
  'Coordina el rescate.',
  'Identifica con visión IA.',
  'Conecta familias en tiempo real.',
]

export default function RotatingText() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % FRASES.length)
        setVisible(true)
      }, 400)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      style={{
        display: 'inline-block',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        color: '#D4A017',
        fontStyle: 'italic',
      }}
    >
      {FRASES[idx]}
    </span>
  )
}
