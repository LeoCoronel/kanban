import { useMemo, useState } from 'react'
import { BarraFiltros } from '@/components/BarraFiltros'
import { Encabezado } from '@/components/Encabezado'
import { Cargando, Vacio } from '@/components/Estados'
import { HistoriaModal } from '@/components/HistoriaModal'
import { InsigniaPaso } from '@/components/Insignias'
import { useDatos } from '@/lib/useDatos'
import {
  FILTROS_VACIOS,
  filtrar,
  pasoEnSprint,
  porPrioridadYOrden,
  recorrido,
  titulo,
} from '@/lib/util'

export function Trazabilidad() {
  const { historias, sprints, trazas, cargando } = useDatos()
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [abierta, setAbierta] = useState<string | null>(null)

  const responsables = useMemo(
    () => [...new Set(historias.map((h) => h.responsable).filter(Boolean))].sort(),
    [historias],
  )
  const columnas = useMemo(
    () => [...sprints].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [sprints],
  )
  const filas = useMemo(
    () =>
      filtrar(historias, filtros)
        .map((h) => {
          const pasos = recorrido(h, sprints, trazas)
          return { h, arrastres: pasos.filter((p) => p.paso === 'arrastrada').length }
        })
        // Solo tarjetas que pasaron por algún sprint.
        .filter((f) => columnas.some((s) => pasoEnSprint(f.h, s, trazas)))
        .sort((a, b) => b.arrastres - a.arrastres || porPrioridadYOrden(a.h, b.h)),
    [historias, filtros, sprints, trazas, columnas],
  )

  if (cargando) return <Cargando />
  const editando = historias.find((h) => h.id === abierta)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 px-(--layout-margin) py-6">
      <Encabezado eyebrow="Trazabilidad" titulo="Por qué sprints pasó cada historia" />
      <p className="-mt-2 max-w-2xl text-sm text-text-secondary">
        Cada celda muestra cómo terminó la tarjeta en ese sprint. Las que más se arrastraron
        aparecen primero. Los sprints cerrados antes de existir esta vista figuran como{' '}
        <strong className="font-medium text-text-primary">Sin detalle</strong>.
      </p>
      <BarraFiltros filtros={filtros} onCambiar={setFiltros} responsables={responsables} />

      {filas.length === 0 ? (
        <Vacio titulo="Todavía no hay recorridos">
          <p className="text-sm text-text-muted">
            Asigná tarjetas a un sprint y cerralo para ver acá cómo salieron.
          </p>
        </Vacio>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border-strong bg-bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-bg-surface text-left text-xs text-text-muted">
              <tr className="border-b border-border-strong">
                <th scope="col" className="min-w-64 px-3 py-2 font-medium">
                  Tarjeta
                </th>
                {columnas.map((s) => (
                  <th key={s.id} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                    {s.nombre}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Arrastres
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filas.map(({ h, arrastres }) => (
                <tr key={h.id} className="hover:bg-bg-raised">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <button
                      type="button"
                      onClick={() => setAbierta(h.id)}
                      className="foco flex w-full items-center gap-3 rounded-md text-left"
                    >
                      <span className="text-code w-14 shrink-0 text-text-muted">{h.codigo}</span>
                      <span className="min-w-0 flex-1 truncate text-text-primary">{titulo(h)}</span>
                    </button>
                  </th>
                  {columnas.map((s) => {
                    const paso = pasoEnSprint(h, s, trazas)
                    return (
                      <td key={s.id} className="px-3 py-2">
                        {paso ? (
                          <InsigniaPaso paso={paso} />
                        ) : (
                          <span aria-label="No estuvo en este sprint" className="text-text-muted">
                            —
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-code px-3 py-2 text-right tabular-nums text-text-primary">
                    {arrastres}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <HistoriaModal key={editando.id} historia={editando} onCerrar={() => setAbierta(null)} />
      )}
    </div>
  )
}
