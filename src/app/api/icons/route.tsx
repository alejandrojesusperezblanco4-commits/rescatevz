import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const size = parseInt(searchParams.get('size') || '192')

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size * 0.2,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: size * 0.35,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            letterSpacing: '-2px',
          }}
        >
          RV
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
