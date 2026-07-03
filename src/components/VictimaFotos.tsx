'use client'

import { useState } from 'react'
import PhotoLightbox from './PhotoLightbox'

interface VictimaFotosProps {
  photoUrls: string[]
}

export default function VictimaFotos({ photoUrls }: VictimaFotosProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photoUrls.length === 0) return null

  const MAX_VISIBLE = 3
  const visible = photoUrls.slice(0, MAX_VISIBLE)
  const extra = photoUrls.length - MAX_VISIBLE

  return (
    <>
      <div className={`grid gap-2 mb-5 ${photoUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {visible.map((url, i) => {
          const isLast = i === MAX_VISIBLE - 1 && extra > 0
          return (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="relative overflow-hidden rounded-lg transition-all hover:brightness-110 hover:scale-[1.02]"
              style={{ height: photoUrls.length === 1 ? '200px' : '120px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              {isLast && extra > 0 && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(15,26,46,0.75)' }}>
                  <span className="text-lg font-bold" style={{ color: '#F0F4FF' }}>+{extra}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photoUrls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => i !== null ? (i - 1 + photoUrls.length) % photoUrls.length : 0)}
          onNext={() => setLightboxIndex(i => i !== null ? (i + 1) % photoUrls.length : 0)}
        />
      )}
    </>
  )
}
