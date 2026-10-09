import { Database } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Aviso } from './components/Estados'
import { Nav, type Ruta } from './components/Nav'
import { DatosProvider } from './lib/DatosProvider'
import { useDatos } from './lib/useDatos'
import { Backlog } from './pages/Backlog'
import { Sprints } from './pages/Sprints'
import { Tablero } from './pages/Tablero'

function rutaActual(): Ruta {
  const r = window.location.hash.replace(/^#\/?/, '')
  return r === 'backlog' || r === 'sprints' ? r : 'tablero'
}

function Shell() {
  const [ruta, setRuta] = useState<Ruta>(rutaActual)
  const { modo, error, limpiarError } = useDatos()

  useEffect(() => {
    const alCambiar = () => setRuta(rutaActual())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  return (
    <div className="flex h-full flex-col md:flex-row">
      <Nav actual={ruta} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col pb-(--nav-bottom)">
        {modo === 'local' && (
          <p className="flex items-center gap-2 border-b border-state-info bg-state-info-bg px-(--layout-margin) py-2 text-xs text-state-info">
            <Database size={14} strokeWidth={1.5} aria-hidden />
            Modo demo: los datos se guardan solo en este navegador. Configurá Supabase para
            compartirlos con el equipo.
          </p>
        )}
        {error && (
          <div className="px-(--layout-margin) pt-4">
            <Aviso mensaje={error} onCerrar={limpiarError} />
          </div>
        )}
        <div className="min-h-0 flex-1">
          {ruta === 'tablero' && <Tablero />}
          {ruta === 'backlog' && <Backlog />}
          {ruta === 'sprints' && <Sprints />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <DatosProvider>
      <Shell />
    </DatosProvider>
  )
}
