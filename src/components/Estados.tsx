import { AlertTriangle, Loader2, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function Cargando() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 p-12 text-sm text-text-muted"
    >
      <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden />
      Cargando…
    </div>
  )
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong p-10 text-center">
      <Inbox size={28} strokeWidth={1.5} className="text-text-muted" aria-hidden />
      <p className="text-base font-medium text-text-primary">{titulo}</p>
      {children}
    </div>
  )
}

export function Aviso({ mensaje, onCerrar }: { mensaje: string; onCerrar: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-state-danger bg-state-danger-bg p-3 text-sm text-state-danger"
    >
      <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
      <p className="flex-1">{mensaje}</p>
      <button type="button" onClick={onCerrar} className="foco rounded-md underline">
        Cerrar
      </button>
    </div>
  )
}
