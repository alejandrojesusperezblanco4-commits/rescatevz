'use client'

import { useEffect, useCallback } from 'react'

interface PhotoLightboxProps {
  photos: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function PhotoLightbox({ photos, index, onClose, onPrev, onNext }: PhotoLightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Imagen */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt={`Foto ${index + 1} de ${photos.length}`}
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl shadow-2xl"
        style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain' }}
      />

      {/* Cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-all hover:brightness-110"
        style={{ width: '40px', height: '40px', background: 'rgba(22,32,64,0.9)', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
      </button>

      {/* Contador */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
        style={{ background: 'rgba(22,32,64,0.9)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
        {index + 1} / {photos.length}
      </div>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all hover:brightness-110"
          style={{ width: '44px', height: '44px', background: 'rgba(22,32,64,0.9)', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>arrow_back</span>
        </button>
      )}

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all hover:brightness-110"
          style={{ width: '44px', height: '44px', background: 'rgba(22,32,64,0.9)', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>arrow_forward</span>
        </button>
      )}
    </div>
  )
}
