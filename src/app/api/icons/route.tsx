import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const size = parseInt(searchParams.get('size') || '192')

  const r = size / 2
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: 'flex', borderRadius: size * 0.22, overflow: 'hidden', background: '#1a2744' }}>
        {/* Franjas bandera venezolana */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: '#CF0A2C' }} />
          <div style={{ flex: 1, background: '#002F7F' }} />
          <div style={{ flex: 1, background: '#FFCC00' }} />
        </div>
        {/* Overlay oscuro semitransparente para legibilidad */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26,39,68,0.45)' }} />
        {/* Texto RV */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: size * 0.38, fontWeight: 900,
          fontFamily: 'sans-serif', letterSpacing: '-2px',
        }}>
          RV
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
