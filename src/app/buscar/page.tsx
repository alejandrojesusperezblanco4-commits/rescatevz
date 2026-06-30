import Link from 'next/link'
import BusquedaFamiliar from '@/components/BusquedaFamiliar'
import PublicShell from '@/components/PublicShell'

export default function BuscarPage() {
  return (
    <PublicShell
      title="Buscar familiar"
      headerRight={
        <>
          <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
            Entrar
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
            ← Inicio
          </Link>
        </>
      }
    >
      <BusquedaFamiliar />
    </PublicShell>
  )
}
