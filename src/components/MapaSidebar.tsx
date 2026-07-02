'use client'

import { useState } from 'react'
import type { Location } from '@/lib/types'

interface MapaSidebarProps {
  hospitals: Location[]
  shelters: Location[]
}

function LocationCard({ location }: { location: Location }) {
  const isHospital = location.type === 'hospital'
  const pct = location.capacity ? Math.round((location.current_occupancy / location.capacity) * 100) : null
  const barColor = pct === null ? '#D4A017' : pct > 90 ? '#DC2626' : pct > 70 ? '#D4A017' : '#22C55E'
  return (
    <div className="rounded-lg p-3 transition-all hover:brightness-110"
      style={{ background: '#162040', border: '1px solid rgba(36,51,86,0.5)' }}>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-base mt-0.5" style={{ color: '#94A3B8' }}>
          {isHospital ? 'local_hospital' : 'cottage'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight" style={{ color: '#F0F4FF' }}>{location.name}</p>
          {location.address && (
            <p className="text-xs mt-0.5 truncate" style={{ color: '#64748B' }}>{location.address}</p>
          )}
          {pct !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#94A3B8' }}>{location.current_occupancy}/{location.capacity}</span>
                <span style={{ color: barColor }}>{pct}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
              </div>
            </div>
          )}
          {location.victim_count !== undefined && location.victim_count > 0 && (
            <span className="text-xs mt-1 inline-block" style={{ color: '#DC2626' }}>
              {location.victim_count} registrado{location.victim_count > 1 ? 's' : ''}
            </span>
          )}
          {location.phone && (
            <a href={`tel:${location.phone}`} className="text-xs hover:underline mt-1 block" style={{ color: '#D4A017' }}>
              {location.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function SidebarContent({ hospitals, shelters }: MapaSidebarProps) {
  return (
    <div className="p-4">
      <div className="flex gap-4 mb-5 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#DC2626' }} />
          <span style={{ color: '#94A3B8' }}>Hospitales ({hospitals.length})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6' }} />
          <span style={{ color: '#94A3B8' }}>Refugios ({shelters.length})</span>
        </span>
      </div>

      {hospitals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
            Hospitales activos
          </h2>
          <div className="space-y-2">
            {hospitals.map(loc => <LocationCard key={loc.id} location={loc} />)}
          </div>
        </div>
      )}

      {shelters.length > 0 && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
            Refugios activos
          </h2>
          <div className="space-y-2">
            {shelters.map(loc => <LocationCard key={loc.id} location={loc} />)}
          </div>
        </div>
      )}

      {hospitals.length === 0 && shelters.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: '#64748B' }}>Cargando ubicaciones…</p>
      )}
    </div>
  )
}

export default function MapaSidebar({ hospitals, shelters }: MapaSidebarProps) {
  const [open, setOpen] = useState(false)
  const total = hospitals.length + shelters.length

  return (
    <>
      {/* Desktop: sidebar fija */}
      <div className="hidden lg:block w-80 overflow-y-auto"
        style={{ background: '#1e2d4a', borderLeft: '1px solid rgba(36,51,86,0.5)' }}>
        <SidebarContent hospitals={hospitals} shelters={shelters} />
      </div>

      {/* Móvil: botón flotante + drawer desde abajo */}
      <div className="lg:hidden">
        {/* Botón para abrir */}
        <button
          onClick={() => setOpen(true)}
          className="fixed z-30 flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-all hover:brightness-110 active:scale-95"
          style={{
            bottom: 'calc(4.5rem + env(safe-area-inset-bottom) + 1rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e2d4a',
            color: '#F0F4FF',
            border: '1px solid rgba(212,160,23,0.4)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#D4A017' }}>location_on</span>
          Ver ubicaciones ({total})
        </button>

        {/* Overlay */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl overflow-hidden transition-transform"
          style={{
            background: '#1e2d4a',
            border: '1px solid rgba(36,51,86,0.7)',
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Handle + header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0"
            style={{ borderBottom: '1px solid rgba(36,51,86,0.5)' }}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div className="flex items-center justify-between px-4 py-2 shrink-0">
            <span className="font-semibold text-sm" style={{ color: '#F0F4FF' }}>
              Hospitales y refugios activos
            </span>
            <button onClick={() => setOpen(false)}
              className="text-sm px-2 py-1 rounded-md"
              style={{ color: '#94A3B8' }}>
              ✕
            </button>
          </div>

          {/* Contenido scrollable */}
          <div className="overflow-y-auto flex-1">
            <SidebarContent hospitals={hospitals} shelters={shelters} />
          </div>
        </div>
      </div>
    </>
  )
}
