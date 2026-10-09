import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const BASE =
  'foco rounded-md border border-border-input bg-bg-raised px-3 text-base text-text-primary placeholder:text-text-muted disabled:opacity-50 md:text-sm'

const ancho = (c: string) => (/(^|\s)w-/.test(c) ? '' : 'w-full')

export function Campo({
  etiqueta,
  ayuda,
  children,
  className = '',
}: {
  etiqueta: string
  ayuda?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-text-secondary">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-text-muted">{ayuda}</span>}
    </label>
  )
}

export function Entrada({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...rest} className={`${BASE} ${ancho(className)} h-(--size-control) ${className}`} />
  )
}

export function Selector({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={`${BASE} ${ancho(className)} h-(--size-control) ${className}`} />
  )
}

export function AreaTexto({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${BASE} ${ancho(className)} min-h-24 py-2 ${className}`} />
}
