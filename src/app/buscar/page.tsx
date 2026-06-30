import BusquedaFamiliar from '@/components/BusquedaFamiliar'

export default function BuscarPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a2744', color: '#F0F4FF' }}>
      <div className="text-white text-center py-2 text-xs font-semibold uppercase tracking-widest"
        style={{ background: '#DC2626' }}>
        🚨 EMERGENCIA ACTIVA — Terremotos Venezuela · 24 jun 2026
      </div>
      <BusquedaFamiliar />
    </div>
  )
}
