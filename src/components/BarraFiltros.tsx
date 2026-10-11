import { Search, X } from 'lucide-react'
import { PRIORIDADES, VERSIONES } from '@/lib/constantes'
import { useDatos } from '@/lib/useDatos'
import { FILTROS_VACIOS, SIN_EPICA, type Filtros } from '@/lib/util'
import { Boton } from './ui/Boton'
import { Entrada, Selector } from './ui/Campo'

interface Props {
  filtros: Filtros
  onCambiar: (f: Filtros) => void
  responsables: string[]
}

export function BarraFiltros({ filtros, onCambiar, responsables }: Props) {
  const { epicas } = useDatos()
  const hay = Object.values(filtros).some(Boolean)
  const set = (k: keyof Filtros, v: string) => onCambiar({ ...filtros, [k]: v })
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1 md:max-w-72">
        <Search
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
        />
        <Entrada
          type="search"
          aria-label="Buscar"
          placeholder="Buscar por ID o texto"
          value={filtros.texto}
          onChange={(e) => set('texto', e.target.value)}
          className="pl-9"
        />
      </div>
      <Selector
        aria-label="Filtrar por versión"
        value={filtros.version}
        onChange={(e) => set('version', e.target.value)}
        className="w-auto"
      >
        <option value="">Todas las versiones</option>
        {VERSIONES.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </Selector>
      <Selector
        aria-label="Filtrar por prioridad"
        value={filtros.prioridad}
        onChange={(e) => set('prioridad', e.target.value)}
        className="w-auto"
      >
        <option value="">Toda prioridad</option>
        {PRIORIDADES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </Selector>
      {epicas.length > 0 && (
        <Selector
          aria-label="Filtrar por épica"
          value={filtros.epica}
          onChange={(e) => set('epica', e.target.value)}
          className="w-auto"
        >
          <option value="">Todas las épicas</option>
          {epicas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
          <option value={SIN_EPICA}>Sin épica</option>
        </Selector>
      )}
      {responsables.length > 0 && (
        <Selector
          aria-label="Filtrar por responsable"
          value={filtros.responsable}
          onChange={(e) => set('responsable', e.target.value)}
          className="w-auto"
        >
          <option value="">Todo el equipo</option>
          {responsables.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Selector>
      )}
      {hay && (
        <Boton variante="fantasma" onClick={() => onCambiar(FILTROS_VACIOS)}>
          <X size={16} strokeWidth={1.5} /> Limpiar
        </Boton>
      )}
    </div>
  )
}
