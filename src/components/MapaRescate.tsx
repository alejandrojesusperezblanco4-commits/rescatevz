'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { Location } from '@/lib/types'

interface MapaRescateProps {
  locations: Location[]
}

export default function MapaRescate({ locations }: MapaRescateProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamically import Leaflet (SSR-safe)
    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css')

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([10.48, -66.9], 11)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      locations.forEach(loc => {
        const isHospital = loc.type === 'hospital'
        const color = isHospital ? '#DC2626' : '#2563EB'
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background: ${color};
            color: white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">
              ${isHospital ? '🏥' : '🏕️'}
            </span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -36],
        })

        const occupancyText = loc.capacity
          ? `<div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Capacidad: ${loc.current_occupancy}/${loc.capacity}</div>`
          : ''

        const victimText = loc.victim_count !== undefined
          ? `<div style="font-size: 12px; color: #DC2626; font-weight: 600; margin-top: 4px;">Víctimas registradas: ${loc.victim_count}</div>`
          : ''

        const popupContent = `
          <div style="min-width: 180px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; color: #111827; font-size: 14px;">${loc.name}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em;">
              ${isHospital ? 'Hospital' : 'Refugio'}
            </div>
            ${loc.address ? `<div style="font-size: 12px; color: #374151; margin-top: 6px;">${loc.address}</div>` : ''}
            ${occupancyText}
            ${victimText}
            ${loc.phone ? `<div style="font-size: 12px; color: #2563EB; margin-top: 4px;">📞 ${loc.phone}</div>` : ''}
          </div>
        `

        L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent, { maxWidth: 250 })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [locations])

  return (
    <div
      ref={mapRef}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      className="rounded-xl overflow-hidden"
    />
  )
}
