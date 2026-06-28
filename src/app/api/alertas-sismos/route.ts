import { NextResponse } from 'next/server'

export const revalidate = 120  // Next.js ISR: cachea 2 min para no saturar USGS

export interface SismoEvent {
  id: string
  magnitude: number
  place: string
  time: number        // ms epoch
  tsunami: boolean
  alert: 'green' | 'yellow' | 'orange' | 'red' | null
  url: string
  lat: number
  lng: number
  depth: number       // km
}

export interface AlertasResponse {
  events: SismoEvent[]
  fetchedAt: string
  hasTsunami: boolean
  source: string
  sourceUrl: string
}

export async function GET() {
  try {
    // Últimos 7 días — suficiente para ver la secuencia de réplicas
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10)

    // Bounding box: Venezuela + Caribe (incluye toda la cuenca)
    const params = new URLSearchParams({
      format:         'geojson',
      minmagnitude:   '4.5',
      starttime:      since,
      minlatitude:    '0',
      maxlatitude:    '25',
      minlongitude:   '-90',
      maxlongitude:   '-55',
      orderby:        'time',
      limit:          '20',
    })

    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`,
      { next: { revalidate: 120 } }
    )

    if (!res.ok) throw new Error(`USGS ${res.status}`)

    const data = await res.json()

    const events: SismoEvent[] = (data.features ?? []).map((f: any) => ({
      id:        f.id,
      magnitude: Number(f.properties.mag?.toFixed(1)),
      place:     f.properties.place ?? '',
      time:      f.properties.time,
      tsunami:   f.properties.tsunami === 1,
      alert:     f.properties.alert ?? null,
      url:       f.properties.url ?? 'https://earthquake.usgs.gov',
      lat:       Number(f.geometry.coordinates[1].toFixed(3)),
      lng:       Number(f.geometry.coordinates[0].toFixed(3)),
      depth:     Number(f.geometry.coordinates[2].toFixed(1)),
    }))

    const response: AlertasResponse = {
      events,
      fetchedAt:  new Date().toISOString(),
      hasTsunami: events.some(e => e.tsunami),
      source:     'USGS Earthquake Hazards Program',
      sourceUrl:  'https://earthquake.usgs.gov',
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { events: [], fetchedAt: new Date().toISOString(), hasTsunami: false,
        source: 'USGS Earthquake Hazards Program', sourceUrl: 'https://earthquake.usgs.gov',
        error: 'No se pudo obtener datos sísmicos en este momento.' },
      { status: 502 }
    )
  }
}
