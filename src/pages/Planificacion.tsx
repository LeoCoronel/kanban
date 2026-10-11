import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarraFiltros } from '@/components/BarraFiltros'
import { Columna } from '@/components/Columna'
import { Encabezado } from '@/components/Encabezado'
import { Cargando } from '@/components/Estados'
import { HistoriaModal } from '@/components/HistoriaModal'
import { InsigniaSprint } from '@/components/Insignias'
import { SprintModal } from '@/components/SprintModal'
import { TarjetaVista } from '@/components/Tarjeta'
import { Boton } from '@/components/ui/Boton'
import type { Historia } from '@/lib/tipos'
import { useDatos } from '@/lib/useDatos'
import { FILTROS_VACIOS, filtrar, porPrioridadYOrden, rangoFechas, sumaEsfuerzo } from '@/lib/util'

export function Planificacion() {
  const { historias, sprints, cargando, moverHistoria } = useDatos()
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [nuevoSprint, setNuevoSprint] = useState(false)
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

  // Sprints en los que todavía se puede planificar: el activo primero y luego los planificados.
  const abiertos = sprints
    .filter((s) => s.estado !== 'cerrado')
    .sort(
      (a, b) =>
        Number(b.estado === 'activo') - Number(a.estado === 'activo') ||
        a.created_at.localeCompare(b.created_at),
    )
  const sinAsignar = visibles.filter((h) => h.sprint_id === null).sort(porPrioridadYOrden)

  function alSoltar(e: DragEndEvent) {
    setArrastrada(null)
    const h = historias.find((x) => x.id === e.active.id)
    const destinoId = e.over?.id as string | undefined
    if (!h || !destinoId?.startsWith('plan:')) return
    const sprintId = destinoId.slice(5)
    if (sprintId === 'backlog') {
      if (h.sprint_id !== null) void moverHistoria(h.id, { sprint_id: null, estado: 'backlog' })
    } else if (h.sprint_id !== sprintId) {
      void moverHistoria(h.id, { sprint_id: sprintId, estado: 'por_hacer' })
    }
  }

  if (cargando) return <Cargando />
  const editando = historias.find((h) => h.id === abierta)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 px-(--layout-margin) py-6">
      <Encabezado
        eyebrow="Planificación"
        titulo="Qué se trabaja en cada sprint"
        acciones={
          <Boton variante="primario" onClick={() => setNuevoSprint(true)}>
            <Plus size={16} strokeWidth={1.5} /> Nuevo sprint
          </Boton>
        }
      />
      <p className="-mt-2 max-w-2xl text-sm text-text-secondary">
        Arrastrá tarjetas desde{' '}
        <strong className="font-medium text-text-primary">Sin asignar</strong> al sprint donde las
        vas a trabajar. Cada columna suma el esfuerzo para que veas la carga. Para sacar una tarjeta
        de un sprint, volvela a Sin asignar.
      </p>
      <BarraFiltros filtros={filtros} onCambiar={setFiltros} responsables={responsables} />

      <DndContext
        sensors={sensores}
        onDragStart={(e: DragStartEvent) =>
          setArrastrada(historias.find((h) => h.id === e.active.id) ?? null)
        }
        onDragEnd={alSoltar}
        onDragCancel={() => setArrastrada(null)}
      >
        <div className="-mx-(--layout-margin) min-h-0 flex-1 overflow-x-auto px-(--layout-margin) pb-2">
          <div className="flex h-full gap-(--layout-gutter)">
            <Columna
              id="plan:backlog"
              titulo="Sin asignar"
              subtitulo={`Esfuerzo: ${sumaEsfuerzo(sinAsignar)}`}
              historias={sinAsignar}
              soltable
              arrastrable
              vacio="No quedan tarjetas sin sprint."
              onAbrir={setAbierta}
            />
            {abiertos.map((s) => {
              const hs = visibles.filter((h) => h.sprint_id === s.id).sort(porPrioridadYOrden)
              const fechas = rangoFechas(s)
              return (
                <Columna
                  key={s.id}
                  id={`plan:${s.id}`}
                  titulo={s.nombre}
                  subtitulo={`Esfuerzo: ${sumaEsfuerzo(hs)}${fechas ? ` · ${fechas}` : ''}`}
                  extra={<InsigniaSprint estado={s.estado} />}
                  historias={hs}
                  soltable
                  arrastrable
                  mostrarEstado={s.estado === 'activo'}
                  vacio="Arrastrá tarjetas acá."
                  onAbrir={setAbierta}
                />
              )
            })}
            {abiertos.length === 0 && (
              <section className="flex h-full w-72 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong p-6 text-center">
                <p className="text-sm text-text-secondary">
                  Todavía no hay sprints para planificar. Creá uno y empezá a asignar tarjetas.
                </p>
                <Boton onClick={() => setNuevoSprint(true)}>Nuevo sprint</Boton>
              </section>
            )}
          </div>
        </div>
        <DragOverlay>
          {arrastrada && <TarjetaVista historia={arrastrada} arrastrando />}
        </DragOverlay>
      </DndContext>

      {nuevoSprint && <SprintModal onCerrar={() => setNuevoSprint(false)} />}
      {editando && (
        <HistoriaModal key={editando.id} historia={editando} onCerrar={() => setAbierta(null)} />
      )}
    </div>
  )
}
