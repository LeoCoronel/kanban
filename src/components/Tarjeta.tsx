import { useDraggable } from '@dnd-kit/core'
import { ESTADOS } from '@/lib/constantes'
import type { Historia } from '@/lib/tipos'
import { iniciales, titulo } from '@/lib/util'
import { InsigniaPrioridad, InsigniaVersion } from './Insignias'

interface VistaProps {
  historia: Historia
  mostrarEstado?: boolean
  arrastrando?: boolean
}

export function TarjetaVista({ historia: h, mostrarEstado, arrastrando }: VistaProps) {
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
      <div className="flex items-center justify-between gap-2">
        {h.tipo === 'historia' ? <InsigniaVersion version={h.version} /> : <span />}
        <div className="flex items-center gap-2">
          {h.valor != null && h.esfuerzo != null && (
            <span
              className="text-code text-xs text-text-muted tabular-nums"
              title="Valor · Esfuerzo"
            >
              V{h.valor} · E{h.esfuerzo}
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
