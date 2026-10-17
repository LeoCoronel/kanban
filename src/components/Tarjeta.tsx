import { useDraggable } from '@dnd-kit/core'
import { Repeat } from 'lucide-react'
import { ESTADOS } from '@/lib/constantes'
import type { Historia } from '@/lib/tipos'
import { useDatos } from '@/lib/useDatos'
import { iniciales, titulo } from '@/lib/util'
import { InsigniaEpica, InsigniaPrioridad, InsigniaVersion } from './Insignias'

interface VistaProps {
  historia: Historia
  mostrarEstado?: boolean
  arrastrando?: boolean
}

export function TarjetaVista({ historia: h, mostrarEstado, arrastrando }: VistaProps) {
  const { sprints, epicas } = useDatos()
  const sprint = sprints.find((s) => s.id === h.sprint_id)
  const epica = epicas.find((e) => e.id === h.epica_id)
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-bg-surface p-3 text-left ${
        arrastrando ? 'border-accent-text' : 'border-border-strong hover:border-border-input'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-code text-text-muted">{h.codigo}</span>
        <div className="flex items-center gap-1.5">
          {mostrarEstado && <span className="text-xs text-text-muted">{ESTADOS[h.estado]}</span>}
          {h.tipo === 'historia' && <InsigniaPrioridad prioridad={h.prioridad} />}
        </div>
      </div>
      <p className="line-clamp-2 text-sm font-medium text-text-primary">{titulo(h)}</p>
      {(h.tipo === 'historia' || epica) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {h.tipo === 'historia' && <InsigniaVersion version={h.version} />}
          {epica && <InsigniaEpica epica={epica} />}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex min-w-0 items-center gap-1 text-xs ${sprint ? 'text-text-secondary' : 'text-text-muted'}`}
          title={sprint ? `Sprint: ${sprint.nombre}` : 'Todavía sin sprint'}
        >
          <Repeat size={12} strokeWidth={1.5} aria-hidden className="shrink-0" />
          <span className="truncate">
            {sprint ? sprint.nombre : 'Sin sprint'}
            {sprint?.estado === 'planificado' && ' · plan'}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {h.esfuerzo != null && (
            <span
              className="text-code text-xs text-text-muted tabular-nums"
              title={h.valor != null ? 'Valor · Esfuerzo' : 'Esfuerzo'}
            >
              {h.valor != null && `V${h.valor} · `}E{h.esfuerzo}
            </span>
          )}
          {h.responsable && (
            <span
              title={h.responsable}
              className="flex size-6 items-center justify-center rounded-full border border-border-strong bg-bg-raised text-xs font-medium text-text-secondary"
            >
              {iniciales(h.responsable)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  historia: Historia
  arrastrable: boolean
  mostrarEstado?: boolean
  onAbrir: () => void
}

export function TarjetaArrastrable({ historia, arrastrable, mostrarEstado, onAbrir }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: historia.id,
    disabled: !arrastrable,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`${historia.codigo} ${titulo(historia)}. Abrir detalle`}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onAbrir()
      }}
      className={`foco relative touch-manipulation rounded-lg ${isDragging ? 'opacity-40' : ''}`}
    >
      <TarjetaVista historia={historia} mostrarEstado={mostrarEstado} />
    </div>
  )
}
