export interface Sismo {
  usgsId: string
  magnitude: number
  place: string
  occurredAt: string
  lat: number
  lng: number
  depth: number
  url: string
}

const VENEZUELA_LAT = 10.48
const VENEZUELA_LNG = -66.90
const RADIUS_KM = 600

export async function fetchSismosVenezuela(minMag = 4.0, limit = 10): Promise<Sismo[]> {
  const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query')
  url.searchParams.set('format', 'geojson')
  url.searchParams.set('minmagnitude', String(minMag))
  url.searchParams.set('latitude', String(VENEZUELA_LAT))
  url.searchParams.set('longitude', String(VENEZUELA_LNG))
  url.searchParams.set('maxradiuskm', String(RADIUS_KM))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('orderby', 'time')

  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`USGS error ${res.status}`)

  const json = await res.json()
  return (json.features ?? []).map((f: USGSFeature) => ({
    usgsId: f.id,
    magnitude: f.properties.mag,
    place: f.properties.place,
    occurredAt: new Date(f.properties.time).toISOString(),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    depth: f.geometry.coordinates[2],
    url: f.properties.url,
  }))
}

interface USGSFeature {
  id: string
  properties: { mag: number; place: string; time: number; url: string }
  geometry: { coordinates: [number, number, number] }
}
