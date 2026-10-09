import { X } from 'lucide-react'
import { useEffect, useId, type ReactNode } from 'react'
import { Boton } from './Boton'

interface Props {
  titulo: string
  eyebrow?: string
  onCerrar: () => void
  children: ReactNode
  pie?: ReactNode
  ancho?: 'md' | 'lg'
}

export function Modal({ titulo, eyebrow, onCerrar, children, pie, ancho = 'md' }: Props) {
  const idTitulo = useId()

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclear)
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg-base/80 md:items-center md:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-xl border border-border-strong bg-bg-surface md:rounded-xl ${
          ancho === 'lg' ? 'md:max-w-3xl' : 'md:max-w-lg'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-subtle p-4 md:px-6">
          <div className="min-w-0">
            {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
            <h2 id={idTitulo} className="text-lg font-semibold text-text-primary">
              {titulo}
            </h2>
          </div>
          <Boton variante="fantasma" aria-label="Cerrar" onClick={onCerrar} className="w-10! px-0!">
            <X size={20} strokeWidth={1.5} />
          </Boton>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:px-6">{children}</div>
        {pie && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle p-4 md:px-6">
            {pie}
          </footer>
        )}
      </div>
    </div>
  )
}
