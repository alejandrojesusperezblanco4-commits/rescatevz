'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Location, LocationType, VictimStatusCounts } from '@/lib/types'

type FilterType = LocationType | 'all'

const FILTER_OPTIONS: { value: FilterType; label: string; emoji: string; color: string }[] = [
  { value: 'all',                label: 'Todos',      emoji: '📍', color: '#374151' },
  { value: 'hospital',           label: 'Hospitales', emoji: '🏥', color: '#DC2626' },
  { value: 'shelter',            label: 'Refugios',   emoji: '🏕️', color: '#2563EB' },
  { value: 'collapsed_building', label: 'Derrumbes',  emoji: '🏚️', color: '#D97706' },
]

interface MarkerConfig {
  color: string
  emoji: string
  label: string
  shape: 'pin' | 'square'
}

function getMarkerConfig(type: LocationType): MarkerConfig {
  switch (type) {
    case 'hospital':           return { color: '#DC2626', emoji: '🏥', label: 'Hospital',            shape: 'pin' }
    case 'shelter':            return { color: '#2563EB', emoji: '🏕️', label: 'Refugio',             shape: 'pin' }
    case 'collapsed_building': return { color: '#D97706', emoji: '🏚️', label: 'Edificio derrumbado', shape: 'square' }
    default:                   return { color: '#6B7280', emoji: '📍', label: 'Ubicación',           shape: 'pin' }
  }
}

function buildVictimSection(counts: VictimStatusCounts): string {
  const total = counts.alive + counts.critical + counts.deceased + counts.missing + counts.unknown
  if (total === 0) return ''

  const rows = [
    counts.alive    > 0 ? `<div style="color:#166534;">✓ Con vida: <b>${counts.alive}</b></div>`          : '',
    counts.critical > 0 ? `<div style="color:#9A3412;">⚠ Estado crítico: <b>${counts.critical}</b></div>` : '',
    counts.deceased > 0 ? `<div style="color:#374151;">✗ Fallecidos: <b>${counts.deceased}</b></div>`     : '',
    counts.missing  > 0 ? `<div style="color:#6B21A8;">? Desaparecidos: <b>${counts.missing}</b></div>`   : '',
    counts.unknown  > 0 ? `<div style="color:#854D0E;">· Sin identificar: <b>${counts.unknown}</b></div>` : '',
  ].filter(Boolean).join('')

  return `
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;">
      <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">
        Personas registradas (${total})
      </div>
      <div style="font-size:12px;display:flex;flex-direction:column;gap:2px;">${rows}</div>
    </div>`
}

function buildPopupContent(loc: Location, cfg: MarkerConfig): string {
  const occupancy = loc.capacity
    ? `<div style="font-size:12px;color:#6B7280;margin-top:4px;">Capacidad: ${loc.current_occupancy}/${loc.capacity}</div>`
    : ''

  const victimSection = loc.victim_counts
    ? buildVictimSection(loc.victim_counts)
    : (loc.victim_count && loc.victim_count > 0
        ? `<div style="font-size:12px;color:#DC2626;font-weight:600;margin-top:4px;">Registradas: ${loc.victim_count}</div>`
        : '')

  const phone = loc.phone
    ? `<div style="font-size:12px;color:#2563EB;margin-top:4px;">📞 ${loc.phone}</div>`
    : ''

  return `
    <div style="min-width:210px;font-family:system-ui,sans-serif;">
      <div style="font-weight:600;color:#111827;font-size:14px;">${loc.name}</div>
      <div style="font-size:11px;color:${cfg.color};margin-top:2px;text-transform:uppercase;letter-spacing:.05em;font-weight:600;">
        ${cfg.emoji} ${cfg.label}
      </div>
      ${loc.address ? `<div style="font-size:12px;color:#374151;margin-top:6px;">${loc.address}</div>` : ''}
      ${occupancy}${victimSection}${phone}
    </div>`
}

export default function MapaRescate({ locations }: { locations: Location[] }) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const lRef           = useRef<any>(null)
  const markersRef     = useRef<any[]>([])
  const locRef         = useRef(locations)
  locRef.current = locations

  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const filterRef = useRef<FilterType>('all')

  const hasCollapsed = locations.some(l => l.type === 'collapsed_building')

  const renderMarkers = useCallback(() => {
    const L   = lRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    markersRef.current.forEach((m: any) => m.remove())
    markersRef.current = []

    locRef.current
      .filter(loc => filterRef.current === 'all' || loc.type === filterRef.current)
      .forEach(loc => {
        const cfg      = getMarkerConfig(loc.type)
        const isSquare = cfg.shape === 'square'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${cfg.color};color:white;
            border-radius:${isSquare ? '6px' : '50% 50% 50% 0'};
            transform:${isSquare ? 'none' : 'rotate(-45deg)'};
            width:34px;height:34px;
            display:flex;align-items:center;justify-content:center;
            border:2px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
          "><span style="transform:${isSquare ? 'none' : 'rotate(45deg)'};font-size:15px;">${cfg.emoji}</span></div>`,
          iconSize:    [34, 34],
          iconAnchor:  [17, 34],
          popupAnchor: [0, -38],
        })

        const marker = L.marker([loc.lat, loc.lng], { icon })
          .bindPopup(buildPopupContent(loc, cfg), { maxWidth: 270 })
          .addTo(map)

        markersRef.current.push(marker)
      })
  }, []) // only reads from refs — safe

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css')

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([10.48, -66.9], 11)
      mapInstanceRef.current = map
      lRef.current = L

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      renderMarkers()
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        lRef.current = null
        markersRef.current = []
      }
    }
  }, [renderMarkers])

  useEffect(() => {
    filterRef.current = activeFilter
    renderMarkers()
  }, [activeFilter, renderMarkers])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        className="rounded-xl overflow-hidden"
      />

      {/* Filtros flotantes sobre el mapa */}
      <div
        style={{ position: 'absolute', bottom: '24px', left: '12px', zIndex: 1000 }}
        className="flex flex-col gap-1.5"
      >
        {FILTER_OPTIONS
          .filter(opt => opt.value !== 'collapsed_building' || hasCollapsed)
          .map(opt => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              style={{
                background:   activeFilter === opt.value ? opt.color : 'white',
                color:        activeFilter === opt.value ? 'white' : '#374151',
                border:       `2px solid ${opt.color}`,
                borderRadius: '6px',
                padding:      '4px 10px',
                fontSize:     '12px',
                fontWeight:   600,
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          '4px',
                boxShadow:    '0 1px 4px rgba(0,0,0,0.2)',
                whiteSpace:   'nowrap',
              }}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
      </div>
    </div>
  )
}
