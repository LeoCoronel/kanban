import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro'

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-accent-fill text-white hover:bg-accent-fill-hover active:bg-accent-fill-pressed border border-transparent',
  secundario:
    'bg-bg-raised text-text-primary border border-border-strong hover:border-border-input',
  fantasma: 'bg-transparent text-text-secondary border border-transparent hover:bg-bg-raised',
  peligro: 'bg-state-danger-bg text-state-danger border border-state-danger hover:bg-bg-raised',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  compacto?: boolean
}

export function Boton({ variante = 'secundario', compacto, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={`foco inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        compacto ? 'h-9 px-3' : 'h-(--size-control)'
      } ${VARIANTES[variante]} ${className}`}
    />
  )
}
