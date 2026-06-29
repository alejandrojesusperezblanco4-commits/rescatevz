'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Row {
  nombre: string
  descripcion: string
  estado: string
  edad: string
  lugar_encontrado: string
  hospital: string
  _valid: boolean
  _error?: string
}

interface Location { id: string; name: string; type: string }

const STATUS_MAP: Record<string, string> = {
  vivo: 'alive', alive: 'alive', 'con vida': 'alive',
  critico: 'critical', crítico: 'critical', critical: 'critical', grave: 'critical',
  fallecido: 'deceased', muerto: 'deceased', deceased: 'deceased',
  desconocido: 'unknown', unknown: 'unknown',
}

export default function ImportadorCSV({ locations, userId }: { locations: Location[]; userId: string }) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ ok: number; failed: number } | null>(null)

  function parseCSV(text: string): Row[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })

      const normalized = {
        nombre: row['nombre'] || row['name'] || '',
        descripcion: row['descripcion'] || row['descripción'] || row['description'] || row['physical_description'] || '',
        estado: row['estado'] || row['status'] || 'desconocido',
        edad: row['edad'] || row['age'] || '',
        lugar_encontrado: row['lugar_encontrado'] || row['lugar'] || row['location'] || row['found_location'] || '',
        hospital: row['hospital'] || row['refugio'] || row['shelter'] || '',
      }

      const mappedStatus = STATUS_MAP[normalized.estado.toLowerCase()] || 'unknown'
      const valid = !!normalized.descripcion && !!normalized.lugar_encontrado

      return {
        ...normalized,
        estado: mappedStatus,
        _valid: valid,
        _error: valid ? undefined : 'Falta descripción o lugar encontrado',
      }
    }).filter(r => r.descripcion || r.nombre)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCSV(text))
      setResults(null)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    setImporting(true)
    const supabase = createClient()
    let ok = 0; let failed = 0

    for (const row of rows.filter(r => r._valid)) {
      // Buscar hospital por nombre parcial
      const loc = locations.find(l =>
        row.hospital && l.name.toLowerCase().includes(row.hospital.toLowerCase())
      )

      const { error } = await supabase.from('victims').insert({
        created_by: userId,
        name: row.nombre || null,
        physical_description: row.descripcion,
        status: row.estado,
        found_location: row.lugar_encontrado,
        estimated_age: row.edad ? parseInt(row.edad) || null : null,
        is_minor: row.edad ? (parseInt(row.edad) < 18) : false,
        current_location_id: loc?.id || null,
        photo_urls: [],
        notes: 'Importado via CSV',
      })

      if (error) failed++
      else ok++
    }

    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'BULK_IMPORT_CSV',
      resource_type: 'victim',
      metadata: { imported: ok, failed },
    })

    setResults({ ok, failed })
    setImporting(false)
    router.refresh()
  }

  const validRows = rows.filter(r => r._valid)
  const invalidRows = rows.filter(r => !r._valid)

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona el archivo CSV</label>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFile}
          className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
        />
      </div>

      {rows.length > 0 && !results && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-600">
              <strong>{validRows.length}</strong> registros válidos · <strong className="text-red-600">{invalidRows.length}</strong> con errores
            </span>
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="ml-auto bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {importing ? `Importando...` : `Importar ${validRows.length} registros`}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['', 'Nombre', 'Descripción', 'Estado', 'Edad', 'Lugar encontrado', 'Hospital'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className={row._valid ? '' : 'bg-red-50'}>
                      <td className="px-3 py-2 text-center">
                        {row._valid ? '✅' : '❌'}
                      </td>
                      <td className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{row.nombre || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{row.descripcion}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          row.estado === 'alive' ? 'bg-green-100 text-green-700' :
                          row.estado === 'critical' ? 'bg-orange-100 text-orange-700' :
                          row.estado === 'deceased' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{row.estado}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{row.edad || '—'}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[150px] truncate">{row.lugar_encontrado}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{row.hospital || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p className="text-xs text-gray-400 text-center py-3">
                  Mostrando 50 de {rows.length} filas. Se importarán todas.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Importación completada</h2>
          <p className="text-gray-600">
            <strong className="text-green-600">{results.ok}</strong> registros importados ·{' '}
            <strong className="text-red-600">{results.failed}</strong> fallidos
          </p>
          <button onClick={() => { setRows([]); setResults(null) }}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline">
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
