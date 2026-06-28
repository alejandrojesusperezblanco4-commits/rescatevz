'use client'

import dynamic from 'next/dynamic'
import type { Location } from '@/lib/types'

const MapaRescate = dynamic(() => import('./MapaRescate'), { ssr: false })

export default function MapaClientWrapper({ locations }: { locations: Location[] }) {
  return <MapaRescate locations={locations} />
}
