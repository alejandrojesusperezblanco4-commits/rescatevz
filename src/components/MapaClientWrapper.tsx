'use client'

import dynamic from 'next/dynamic'
import type { Location, Structure } from '@/lib/types'

const MapaRescate = dynamic(() => import('./MapaRescate'), { ssr: false })

export default function MapaClientWrapper({
  locations,
  structures = [],
}: {
  locations: Location[]
  structures?: Structure[]
}) {
  return <MapaRescate locations={locations} structures={structures} />
}
