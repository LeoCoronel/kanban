import { CalendarRange, KanbanSquare, Layers, ListChecks, Repeat } from 'lucide-react'

export type Ruta = 'tablero' | 'backlog' | 'planificacion' | 'sprints' | 'epicas'

const ITEMS: { ruta: Ruta; etiqueta: string; icono: typeof KanbanSquare }[] = [
  { ruta: 'tablero', etiqueta: 'Tablero', icono: KanbanSquare },
  { ruta: 'backlog', etiqueta: 'Backlog', icono: ListChecks },
  { ruta: 'planificacion', etiqueta: 'Plan', icono: CalendarRange },
  { ruta: 'sprints', etiqueta: 'Sprints', icono: Repeat },
  { ruta: 'epicas', etiqueta: 'Épicas', icono: Layers },
]

/** Barra inferior en mobile, riel lateral desde tablet. */
export function Nav({ actual }: { actual: Ruta }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 flex h-(--nav-bottom) items-stretch border-t border-border-strong bg-bg-surface md:static md:h-auto md:w-(--nav-rail) md:shrink-0 md:flex-col md:items-center md:gap-1 md:border-t-0 md:border-r md:py-4"
    >
      <span
        aria-hidden
        className="mb-4 hidden size-10 items-center justify-center rounded-lg bg-accent-fill text-sm font-semibold text-white md:flex"
      >
        BV
      </span>
      {ITEMS.map(({ ruta, etiqueta, icono: Icono }) => {
        const activo = ruta === actual
        return (
          <a
            key={ruta}
            href={`#/${ruta}`}
            aria-current={activo ? 'page' : undefined}
            className={`foco flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium md:size-14 md:flex-none md:rounded-lg ${
              activo
                ? 'bg-accent-subtle text-red-200'
                : 'text-text-muted hover:bg-bg-raised hover:text-text-primary'
            }`}
          >
            <Icono size={20} strokeWidth={1.5} aria-hidden />
            {etiqueta}
          </a>
        )
      })}
    </nav>
  )
}
