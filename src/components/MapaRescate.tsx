'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { Location, Structure } from '@/lib/types'
import { HABITABILITY_HEX, HABITABILITY_LABELS, STRUCTURE_TYPE_LABELS } from '@/lib/types'

interface MapaRescateProps {
  locations: Location[]
  structures?: Structure[]
}

// Escapa texto introducido por el usuario antes de inyectarlo en el HTML
// del popup de Leaflet (los reportes de estructuras vienen de rescatistas).
function esc(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

export default function MapaRescate({ locations, structures = [] }: MapaRescateProps) {
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

      // Estructuras evaluadas: marcador cuadrado con el color del semáforo.
      structures.forEach(st => {
        if (st.lat == null || st.lng == null) return
        const color = HABITABILITY_HEX[st.habitability]
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background: ${color};
            color: white;
            border-radius: 6px;
            width: 28px; height: 28px;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <span style="font-size: 13px;">🏢</span>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -28],
        })

        const typeLabel = st.structure_type ? STRUCTURE_TYPE_LABELS[st.structure_type] : 'Estructura'
        const notes = st.assessment_notes || st.report_notes

        const popupContent = `
          <div style="min-width: 180px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; color: #111827; font-size: 14px;">${esc(st.name)}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em;">${typeLabel}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 9999px; background: ${color}; display: inline-block;"></span>
              <span style="font-size: 12px; font-weight: 600; color: ${color};">${HABITABILITY_LABELS[st.habitability]}</span>
            </div>
            ${st.address ? `<div style="font-size: 12px; color: #374151; margin-top: 6px;">${esc(st.address)}</div>` : ''}
            ${notes ? `<div style="font-size: 12px; color: #6B7280; margin-top: 4px;">${esc(notes)}</div>` : ''}
          </div>
        `

        L.marker([st.lat, st.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent, { maxWidth: 260 })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [locations, structures])

  return (
    <div
      ref={mapRef}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      className="rounded-xl overflow-hidden"
    />
  )
}
