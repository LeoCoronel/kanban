import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarraFiltros } from '@/components/BarraFiltros'
import { Encabezado } from '@/components/Encabezado'
import { Cargando, Vacio } from '@/components/Estados'
import { HistoriaModal } from '@/components/HistoriaModal'
import { InsigniaEpica, InsigniaPrioridad, InsigniaVersion } from '@/components/Insignias'
import { Boton } from '@/components/ui/Boton'
import { Selector } from '@/components/ui/Campo'
import { ESTADOS, PESO_PRIORIDAD, VERSIONES } from '@/lib/constantes'
import type { Historia, TipoTarjeta } from '@/lib/tipos'
import { useDatos } from '@/lib/useDatos'
import { FILTROS_VACIOS, filtrar, padreDe, sumaEsfuerzo, titulo } from '@/lib/util'

type Clave = 'codigo' | 'version' | 'prioridad' | 'valor' | 'esfuerzo'

const COLUMNAS: { clave: Clave | null; etiqueta: string; alinear?: 'r' }[] = [
  { clave: 'codigo', etiqueta: 'ID' },
  { clave: null, etiqueta: 'Descripción' },
  { clave: null, etiqueta: 'US' },
  { clave: 'version', etiqueta: 'Versión' },
  { clave: 'prioridad', etiqueta: 'Prioridad' },
  { clave: 'valor', etiqueta: 'Valor', alinear: 'r' },
  { clave: 'esfuerzo', etiqueta: 'Esf.', alinear: 'r' },
  { clave: null, etiqueta: 'Épica' },
  { clave: null, etiqueta: 'Sprint' },
  { clave: null, etiqueta: 'Estado' },
  { clave: null, etiqueta: 'Responsable' },
]

function comparar(a: Historia, b: Historia, clave: Clave): number {
  switch (clave) {
    case 'prioridad':
      return PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad]
    case 'version':
      return VERSIONES.indexOf(a.version) - VERSIONES.indexOf(b.version)
    case 'valor':
    case 'esfuerzo':
      return (a[clave] ?? 0) - (b[clave] ?? 0)
    default:
      return a.codigo.localeCompare(b.codigo, 'es', { numeric: true })
  }
}

export function Backlog() {
  const { historias, sprints, epicas, cargando } = useDatos()
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [orden, setOrden] = useState<{ clave: Clave; asc: boolean }>({ clave: 'codigo', asc: true })
  const [abierta, setAbierta] = useState<string | 'nueva' | null>(null)
  const [tipo, setTipo] = useState<'' | TipoTarjeta>('')

  const responsables = useMemo(
    () => [...new Set(historias.map((h) => h.responsable).filter(Boolean))].sort(),
    [historias],
  )
  const filas = useMemo(() => {
    const f = filtrar(historias, filtros).filter((h) => !tipo || h.tipo === tipo)
    return f.sort((a, b) => (orden.asc ? 1 : -1) * comparar(a, b, orden.clave))
  }, [historias, filtros, orden, tipo])

  if (cargando) return <Cargando />
  const epicaDe = (id: string | null) => epicas.find((e) => e.id === id)
  const nombreSprint = (id: string | null) => sprints.find((s) => s.id === id)?.nombre ?? '—'
  const editando = historias.find((h) => h.id === abierta)
  const codigoPadre = (h: Historia) => padreDe(h, historias)?.codigo

  function ordenarPor(clave: Clave) {
    setOrden((o) => ({ clave, asc: o.clave === clave ? !o.asc : true }))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-(--layout-margin) py-6">
      <Encabezado
        eyebrow="Product backlog"
        titulo="Historias de usuario"
        acciones={
          <Boton variante="primario" onClick={() => setAbierta('nueva')}>
            <Plus size={16} strokeWidth={1.5} /> Nueva historia
          </Boton>
        }
      />
      <div className="flex flex-wrap items-start gap-2">
        <Selector
          aria-label="Filtrar por tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as '' | TipoTarjeta)}
          className="w-auto"
        >
          <option value="">Historias y tareas</option>
          <option value="historia">Solo historias</option>
          <option value="tarea">Solo tareas</option>
        </Selector>
        <div className="min-w-0 flex-1">
          <BarraFiltros filtros={filtros} onCambiar={setFiltros} responsables={responsables} />
        </div>
      </div>
      <p className="text-code text-xs text-text-muted tabular-nums">
        {filas.length} de {historias.length} tarjetas · esfuerzo {sumaEsfuerzo(filas)}
      </p>

      {filas.length === 0 ? (
        <Vacio titulo="No hay tarjetas que coincidan">
          <p className="text-sm text-text-muted">Probá cambiando o limpiando los filtros.</p>
        </Vacio>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-strong bg-bg-surface">
          <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-strong">
                {COLUMNAS.map((c) => {
                  const activa = c.clave && orden.clave === c.clave
                  return (
                    <th
                      key={c.etiqueta}
                      scope="col"
                      aria-sort={activa ? (orden.asc ? 'ascending' : 'descending') : undefined}
                      className={`px-3 py-2 ${c.alinear === 'r' ? 'text-right' : ''}`}
                    >
                      {c.clave ? (
                        <button
                          type="button"
                          onClick={() => ordenarPor(c.clave!)}
                          className="foco text-eyebrow inline-flex items-center gap-1 rounded-md hover:text-text-primary"
                        >
                          {c.etiqueta}
                          {activa && (orden.asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </button>
                      ) : (
                        <span className="text-eyebrow">{c.etiqueta}</span>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filas.map((h) => (
                <tr
                  key={h.id}
                  onClick={() => setAbierta(h.id)}
                  className="h-(--size-row) cursor-pointer border-b border-border-subtle last:border-0 hover:bg-bg-raised"
                >
                  <td className="px-3">
                    <button
                      type="button"
                      onClick={() => setAbierta(h.id)}
                      className="foco text-code rounded-md text-text-secondary"
                    >
                      {h.codigo}
                    </button>
                  </td>
                  <td className="max-w-80 truncate px-3 text-text-primary" title={titulo(h)}>
                    {titulo(h)}
                  </td>
                  <td className="text-code px-3 text-text-secondary">
                    {codigoPadre(h) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setAbierta(h.historia_padre_id)
                        }}
                        className="foco rounded-md hover:text-text-primary"
                        title="Abrir la user story"
                      >
                        {codigoPadre(h)}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3">
                    {h.tipo === 'historia' ? <InsigniaVersion version={h.version} /> : '—'}
                  </td>
                  <td className="px-3">
                    {h.tipo === 'historia' ? <InsigniaPrioridad prioridad={h.prioridad} /> : '—'}
                  </td>
                  <td className="text-code px-3 text-right tabular-nums">
                    {h.tipo === 'historia' ? (h.valor ?? '—') : '—'}
                  </td>
                  <td className="text-code px-3 text-right tabular-nums">
                    {h.tipo === 'historia' ? (h.esfuerzo ?? '—') : '—'}
                  </td>
                  <td className="px-3">
                    {epicaDe(h.epica_id) ? <InsigniaEpica epica={epicaDe(h.epica_id)!} /> : '—'}
                  </td>
                  <td className="px-3 text-text-secondary">{nombreSprint(h.sprint_id)}</td>
                  <td className="px-3 text-text-secondary">{ESTADOS[h.estado]}</td>
                  <td className="px-3 text-text-secondary">{h.responsable || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abierta === 'nueva' && <HistoriaModal onCerrar={() => setAbierta(null)} />}
      {editando && (
        <HistoriaModal key={editando.id} historia={editando} onCerrar={() => setAbierta(null)} />
      )}
    </div>
  )
}
