import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type Tono = 'ok' | 'warn' | 'danger' | 'info' | 'neutro' | 'acento'

const TONOS: Record<Tono, string> = {
  ok: 'bg-state-ok-bg border-state-ok text-state-ok',
  warn: 'bg-state-warn-bg border-state-warn text-state-warn',
  danger: 'bg-state-danger-bg border-state-danger text-state-danger',
  info: 'bg-state-info-bg border-state-info text-state-info',
  neutro: 'bg-bg-raised border-border-strong text-text-secondary',
  acento: 'bg-accent-subtle border-accent-text text-red-200',
}

/** Badge del design system: fondo tenue, borde 1 px, ícono + texto (nunca solo color). */
export function Insignia({
  tono,
  icono: Icono,
  children,
}: {
  tono: Tono
  icono: LucideIcon
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONOS[tono]}`}
    >
      <Icono size={12} strokeWidth={1.5} aria-hidden />
      {children}
    </span>
  )
}
