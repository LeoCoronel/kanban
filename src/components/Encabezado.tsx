import type { ReactNode } from 'react'

export function Encabezado({
  eyebrow,
  titulo,
  acciones,
}: {
  eyebrow: string
  titulo: string
  acciones?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-eyebrow">{eyebrow}</p>
        <h1 className="text-xl font-semibold text-text-primary md:text-2xl">{titulo}</h1>
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  )
}
