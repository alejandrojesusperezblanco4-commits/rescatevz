import { NextResponse } from 'next/server'
import { fetchSismosVenezuela } from '@/lib/usgs'

export const revalidate = 300

export async function GET() {
  try {
    const sismos = await fetchSismosVenezuela(4.0, 10)
    return NextResponse.json({ sismos })
  } catch {
    return NextResponse.json({ sismos: [], error: 'No se pudo contactar USGS' }, { status: 502 })
  }
}
