'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

interface Location {
  id: string
  name: string
  type: string
}

interface VictimasFiltersProps {
  locations: Location[]
  currentEstado: string
  currentUbicacion: string
  currentMenor: boolean
  currentQ: string
  canSeeMenors: boolean
}

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'alive', label: '✅ Con vida' },
  { value: 'critical', label: '🟠 Estado crítico' },
  { value: 'deceased', label: '⚫ Fallecido' },
  { value: 'unknown', label: '❓ Desconocido' },
]

export default function VictimasFilters({
  locations,
  currentEstado,
  currentUbicacion,
  currentMenor,
  currentQ,
  canSeeMenors,
}: VictimasFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams()
    if (key !== 'estado' && currentEstado) params.set('estado', currentEstado)
    if (key !== 'ubicacion' && currentUbicacion) params.set('ubicacion', currentUbicacion)
    if (key !== 'menor' && currentMenor) params.set('menor', 'true')
    if (key !== 'q' && currentQ) params.set('q', currentQ)
    if (value) params.set(key, value)
    // Reset paginación al filtrar
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, currentEstado, currentUbicacion, currentMenor, currentQ])

  const hayFiltros = currentEstado || currentUbicacion || currentMenor || currentQ

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 space-y-3">
      {/* Búsqueda texto */}
      <input
        type="search"
        defaultValue={currentQ}
        placeholder="Buscar por nombre, descripción física o lugar hallado…"
        onChange={e => {
          const val = e.target.value
          if (val.length === 0 || val.length >= 2) update('q', val)
        }}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      />

      <div className="flex flex-wrap gap-2">
        {/* Estado */}
        <select
          value={currentEstado}
          onChange={e => update('estado', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {ESTADOS.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>

        {/* Ubicación */}
        <select
          value={currentUbicacion}
          onChange={e => update('ubicacion', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 flex-1 min-w-[180px]"
        >
          <option value="">Todos los hospitales y refugios</option>
          {locations.filter(l => l.type === 'hospital').length > 0 && (
            <optgroup label="🏥 Hospitales">
              {locations.filter(l => l.type === 'hospital').map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </optgroup>
          )}
          {locations.filter(l => l.type === 'shelter').length > 0 && (
            <optgroup label="🏕️ Refugios">
              {locations.filter(l => l.type === 'shelter').map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Solo menores */}
        {canSeeMenors && (
          <button
            onClick={() => update('menor', currentMenor ? '' : 'true')}
            className={`px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
              currentMenor
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
            }`}
          >
            👶 Solo menores
          </button>
        )}

        {/* Limpiar */}
        {hayFiltros && (
          <button
            onClick={() => router.push(pathname)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
