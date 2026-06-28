import BusquedaFamiliar from '@/components/BusquedaFamiliar'

export default function BuscarPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        Emergencia activa — Terremotos Venezuela 24 de junio 2026
      </div>
      <BusquedaFamiliar />
    </div>
  )
}
