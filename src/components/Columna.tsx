import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { Historia } from '@/lib/tipos'
import { TarjetaArrastrable } from './Tarjeta'

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

export function Columna({
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
