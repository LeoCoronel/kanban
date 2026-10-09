import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Lock, Plus, Flag } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { BarraFiltros } from '@/components/BarraFiltros'
import { CerrarSprintModal } from '@/components/CerrarSprintModal'
import { Encabezado } from '@/components/Encabezado'
import { Cargando, Vacio } from '@/components/Estados'
import { HistoriaModal } from '@/components/HistoriaModal'
import { InsigniaSprint } from '@/components/Insignias'
import { TarjetaArrastrable, TarjetaVista } from '@/components/Tarjeta'
import { Boton } from '@/components/ui/Boton'
import { ESTADOS, ESTADOS_SPRINT } from '@/lib/constantes'
import type { Destino } from '@/lib/datosContext'
import type { Estado, Historia, Sprint } from '@/lib/tipos'
import { useDatos } from '@/lib/useDatos'
import {
  FILTROS_VACIOS,
  fechaCorta,
  filtrar,
  porPrioridadYOrden,
  rangoFechas,
  sumaEsfuerzo,
} from '@/lib/util'

interface ColumnaProps {
  id: string
  titulo: string
  subtitulo?: string
  extra?: ReactNode
  historias: Historia[]
  soltable: boolean
  arrastrable: boolean
  mostrarEstado?: boolean
  vacio: string
  onAbrir: (id: string) => void
}

function Columna({
  id,
  titulo,
  subtitulo,
  extra,
  historias,
  soltable,
  arrastrable,
  mostrarEstado,
  vacio,
  onAbrir,
}: ColumnaProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !soltable })
  return (
    <section
      ref={setNodeRef}
      aria-label={titulo}
      className={`flex h-full w-72 shrink-0 flex-col rounded-xl border bg-bg-base ${
        isOver && soltable ? 'border-2 border-accent-text' : 'border-border-strong'
      }`}
    >
      <header className="flex flex-col gap-1 border-b border-border-subtle p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            {titulo}
            <span className="text-code rounded-md bg-bg-raised px-1.5 text-xs text-text-secondary tabular-nums">
              {historias.length}
            </span>
          </h2>
          {extra}
        </div>
        {subtitulo && <p className="text-xs text-text-muted">{subtitulo}</p>}
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {historias.length === 0 ? (
          <p className="p-3 text-center text-xs text-text-muted">{vacio}</p>
        ) : (
          historias.map((h) => (
            <TarjetaArrastrable
              key={h.id}
              historia={h}
              arrastrable={arrastrable}
              mostrarEstado={mostrarEstado}
              onAbrir={() => onAbrir(h.id)}
            />
          ))
        )}
      </div>
    </section>
  )
}

export function Tablero() {
  const { historias, sprints, sprintActivo, cargando, moverHistoria, importarSemilla } = useDatos()
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [abierta, setAbierta] = useState<string | 'nueva' | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const [arrastrada, setArrastrada] = useState<Historia | null>(null)

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const responsables = useMemo(
    () => [...new Set(historias.map((h) => h.responsable).filter(Boolean))].sort(),
    [historias],
  )
  const visibles = useMemo(() => filtrar(historias, filtros), [historias, filtros])

  const backlog = visibles.filter((h) => h.sprint_id === null).sort(porPrioridadYOrden)
  const porSprint = (s: Sprint) => visibles.filter((h) => h.sprint_id === s.id)
  const planificados = sprints.filter((s) => s.estado === 'planificado')
  const cerrados = sprints
    .filter((s) => s.estado === 'cerrado')
    .sort((a, b) => (a.cerrado_en ?? '').localeCompare(b.cerrado_en ?? ''))

  function alEmpezar(e: DragStartEvent) {
    setArrastrada(historias.find((h) => h.id === e.active.id) ?? null)
  }

  function alSoltar(e: DragEndEvent) {
    setArrastrada(null)
    const h = historias.find((x) => x.id === e.active.id)
    const destinoId = e.over?.id as string | undefined
    if (!h || !destinoId) return
    let destino: Destino
    if (destinoId === 'backlog') destino = { sprint_id: null, estado: 'backlog' }
    else if (sprintActivo && destinoId.startsWith('sprint:'))
      destino = { sprint_id: sprintActivo.id, estado: destinoId.slice(7) as Estado }
    else return
    if (h.sprint_id === destino.sprint_id && h.estado === destino.estado) return
    void moverHistoria(h.id, destino)
  }

  if (cargando) return <Cargando />

  const hayDatos = historias.length > 0 || sprints.length > 0
  const editando = historias.find((h) => h.id === abierta)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 px-(--layout-margin) py-6">
      <Encabezado
        eyebrow="Tablero"
        titulo={sprintActivo ? sprintActivo.nombre : 'Sin sprint activo'}
        acciones={
          <>
            {sprintActivo && (
              <Boton onClick={() => setCerrando(true)}>
                <Flag size={16} strokeWidth={1.5} /> Cerrar sprint
              </Boton>
            )}
            <Boton variante="primario" onClick={() => setAbierta('nueva')}>
              <Plus size={16} strokeWidth={1.5} /> Nueva historia
            </Boton>
          </>
        }
      />
      {sprintActivo && (
        <p className="-mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <InsigniaSprint estado="activo" />
          {rangoFechas(sprintActivo) && (
            <span className="text-code">{rangoFechas(sprintActivo)}</span>
          )}
          {sprintActivo.objetivo && (
            <span className="text-text-muted">· {sprintActivo.objetivo}</span>
          )}
        </p>
      )}

      {!hayDatos ? (
        <Vacio titulo="Todavía no hay historias">
          <p className="max-w-sm text-sm text-text-muted">
            Podés cargar el backlog inicial (33 historias y el Sprint 0) o empezar de cero.
          </p>
          <Boton variante="primario" onClick={() => void importarSemilla()}>
            Cargar backlog inicial
          </Boton>
        </Vacio>
      ) : (
        <>
          <BarraFiltros filtros={filtros} onCambiar={setFiltros} responsables={responsables} />
          <DndContext
            sensors={sensores}
            onDragStart={alEmpezar}
            onDragEnd={alSoltar}
            onDragCancel={() => setArrastrada(null)}
          >
            <div className="-mx-(--layout-margin) min-h-0 flex-1 overflow-x-auto px-(--layout-margin) pb-2">
              <div className="flex h-full gap-(--layout-gutter)">
                <Columna
                  id="backlog"
                  titulo="Backlog"
                  subtitulo={`Esfuerzo total: ${sumaEsfuerzo(backlog)}`}
                  historias={backlog}
                  soltable
                  arrastrable
                  vacio="Sin tarjetas en el backlog."
                  onAbrir={setAbierta}
                />

                {sprintActivo ? (
                  ESTADOS_SPRINT.map((estado) => {
                    const hs = porSprint(sprintActivo).filter((h) => h.estado === estado)
                    return (
                      <Columna
                        key={estado}
                        id={`sprint:${estado}`}
                        titulo={ESTADOS[estado]}
                        subtitulo={`Esfuerzo: ${sumaEsfuerzo(hs)}`}
                        historias={hs}
                        soltable
                        arrastrable
                        vacio="Arrastrá tarjetas acá."
                        onAbrir={setAbierta}
                      />
                    )
                  })
                ) : (
                  <section className="flex h-full w-72 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong p-6 text-center">
                    <p className="text-sm text-text-secondary">
                      No hay un sprint activo. Iniciá uno desde la sección Sprints para armar el
                      tablero.
                    </p>
                    <a
                      href="#/sprints"
                      className="foco inline-flex h-(--size-control) items-center rounded-lg border border-border-strong bg-bg-raised px-4 text-sm font-medium text-text-primary hover:border-border-input"
                    >
                      Ir a Sprints
                    </a>
                  </section>
                )}

                {planificados.map((s) => (
                  <Columna
                    key={s.id}
                    id={`planificado:${s.id}`}
                    titulo={s.nombre}
                    subtitulo="Planificado"
                    historias={porSprint(s)}
                    soltable={false}
                    arrastrable={false}
                    mostrarEstado
                    vacio="Sin tarjetas asignadas."
                    onAbrir={setAbierta}
                  />
                ))}

                {cerrados.map((s) => {
                  const hs = porSprint(s)
                  return (
                    <Columna
                      key={s.id}
                      id={`cerrado:${s.id}`}
                      titulo={s.nombre}
                      subtitulo={
                        s.cerrado_en ? `Cerrado el ${fechaCorta(s.cerrado_en)}` : 'Cerrado'
                      }
                      extra={
                        <Lock
                          size={14}
                          strokeWidth={1.5}
                          className="text-text-muted"
                          aria-label="Sprint cerrado"
                        />
                      }
                      historias={hs}
                      soltable={false}
                      arrastrable={false}
                      mostrarEstado
                      vacio="Este sprint no tiene tarjetas."
                      onAbrir={setAbierta}
                    />
                  )
                })}
              </div>
            </div>
            <DragOverlay>
              {arrastrada && <TarjetaVista historia={arrastrada} arrastrando />}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {abierta === 'nueva' && <HistoriaModal onCerrar={() => setAbierta(null)} />}
      {editando && (
        <HistoriaModal key={editando.id} historia={editando} onCerrar={() => setAbierta(null)} />
      )}
      {cerrando && sprintActivo && (
        <CerrarSprintModal sprint={sprintActivo} onCerrar={() => setCerrando(false)} />
      )}
    </div>
  )
}
