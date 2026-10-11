import { Copy, Infinity as Infinito, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmarModal } from '@/components/ConfirmarModal'
import { Encabezado } from '@/components/Encabezado'
import { EpicaModal } from '@/components/EpicaModal'
import { Cargando, Vacio } from '@/components/Estados'
import { HistoriaModal } from '@/components/HistoriaModal'
import { InsigniaEpica } from '@/components/Insignias'
import { TarjetasPorSprintModal } from '@/components/TarjetasPorSprintModal'
import { Boton } from '@/components/ui/Boton'
import { ESTADOS } from '@/lib/constantes'
import type { Epica } from '@/lib/tipos'
import { useDatos } from '@/lib/useDatos'
import { sumaEsfuerzo, titulo } from '@/lib/util'

export function Epicas() {
  const { epicas, historias, sprints, cargando, eliminarEpica } = useDatos()
  const [editando, setEditando] = useState<Epica | 'nueva' | null>(null)
  const [porSprint, setPorSprint] = useState<Epica | null>(null)
  const [borrando, setBorrando] = useState<Epica | null>(null)
  const [tarjeta, setTarjeta] = useState<string | null>(null)

  if (cargando) return <Cargando />
  const abierta = historias.find((h) => h.id === tarjeta)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-(--layout-margin) py-6">
      <Encabezado
        eyebrow="Agrupación de tarjetas"
        titulo="Épicas"
        acciones={
          <Boton variante="primario" onClick={() => setEditando('nueva')}>
            <Plus size={16} strokeWidth={1.5} /> Nueva épica
          </Boton>
        }
      />
      <p className="max-w-2xl text-sm text-text-secondary">
        Una épica junta tarjetas de un mismo tema, estén en el sprint que estén. Las{' '}
        <strong className="font-medium text-text-primary">transversales</strong> (como la
        documentación) se trabajan en todos los sprints: podés crear una tarjeta de la épica en cada
        sprint de una vez.
      </p>

      {epicas.length === 0 ? (
        <Vacio titulo="Todavía no hay épicas">
          <p className="text-sm text-text-muted">Creá la primera para agrupar tarjetas.</p>
        </Vacio>
      ) : (
        <ul className="grid gap-(--layout-gutter) lg:grid-cols-2">
          {epicas.map((e) => {
            const hs = historias.filter((h) => h.epica_id === e.id)
            const hechas = hs.filter((h) => h.estado === 'hecho')
            const pct = hs.length ? Math.round((hechas.length / hs.length) * 100) : 0
            const sinSprint = hs.filter((h) => h.sprint_id === null)
            return (
              <li
                key={e.id}
                className="flex flex-col gap-3 rounded-xl border border-border-strong bg-bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-text-primary">{e.nombre}</h2>
                    <InsigniaEpica epica={{ nombre: 'Épica', tono: e.tono }} />
                    {e.transversal && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-bg-raised px-1.5 py-0.5 text-xs font-medium text-text-secondary">
                        <Infinito size={12} strokeWidth={1.5} aria-hidden />
                        Transversal
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Boton compacto variante="fantasma" onClick={() => setEditando(e)}>
                      <Pencil size={14} strokeWidth={1.5} /> Editar
                    </Boton>
                    <Boton
                      compacto
                      variante="fantasma"
                      aria-label={`Eliminar ${e.nombre}`}
                      onClick={() => setBorrando(e)}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </Boton>
                  </div>
                </div>

                {e.descripcion && <p className="text-sm text-text-secondary">{e.descripcion}</p>}

                <div>
                  <div className="mb-1 flex justify-between text-xs text-text-muted">
                    <span className="tabular-nums">
                      {hechas.length} de {hs.length} hechas
                    </span>
                    <span className="text-code tabular-nums">
                      esfuerzo {sumaEsfuerzo(hechas)}/{sumaEsfuerzo(hs)}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Avance de ${e.nombre}`}
                    className="h-2 overflow-hidden rounded-full bg-bg-raised"
                  >
                    <div className="h-full bg-state-ok" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {hs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sprints
                      .map((s) => ({ s, n: hs.filter((h) => h.sprint_id === s.id) }))
                      .filter((x) => x.n.length > 0)
                      .map(({ s, n }) => (
                        <span
                          key={s.id}
                          className="text-code rounded-md border border-border-strong bg-bg-raised px-1.5 py-0.5 text-xs text-text-secondary"
                        >
                          {s.nombre}: {n.filter((h) => h.estado === 'hecho').length}/{n.length}
                        </span>
                      ))}
                    {sinSprint.length > 0 && (
                      <span className="text-code rounded-md border border-dashed border-border-strong px-1.5 py-0.5 text-xs text-text-muted">
                        Sin sprint: {sinSprint.length}
                      </span>
                    )}
                  </div>
                )}

                {e.transversal && (
                  <Boton compacto onClick={() => setPorSprint(e)} className="self-start">
                    <Copy size={14} strokeWidth={1.5} /> Crear una tarjeta por sprint
                  </Boton>
                )}

                <details>
                  <summary className="foco cursor-pointer rounded-md text-sm text-text-secondary hover:text-text-primary">
                    Ver tarjetas ({hs.length})
                  </summary>
                  {hs.length === 0 ? (
                    <p className="mt-2 text-sm text-text-muted">
                      Asignala desde el detalle de cada tarjeta.
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
                      {hs.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => setTarjeta(h.id)}
                            className="foco flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-bg-raised"
                          >
                            <span className="text-code w-16 shrink-0 text-text-muted">
                              {h.codigo}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-text-primary">
                              {titulo(h)}
                            </span>
                            <span className="hidden shrink-0 text-xs text-text-muted sm:block">
                              {sprints.find((s) => s.id === h.sprint_id)?.nombre ?? 'Sin sprint'}
                            </span>
                            <span className="shrink-0 text-xs text-text-muted">
                              {ESTADOS[h.estado]}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              </li>
            )
          })}
        </ul>
      )}

      {editando && (
        <EpicaModal
          epica={editando === 'nueva' ? undefined : editando}
          onCerrar={() => setEditando(null)}
        />
      )}
      {porSprint && (
        <TarjetasPorSprintModal epica={porSprint} onCerrar={() => setPorSprint(null)} />
      )}
      {borrando && (
        <ConfirmarModal
          titulo={`Eliminar ${borrando.nombre}`}
          mensaje="Las tarjetas de esta épica no se borran: quedan sin épica. Esta acción no se puede deshacer."
          etiqueta="Eliminar épica"
          onCancelar={() => setBorrando(null)}
          onConfirmar={async () => {
            await eliminarEpica(borrando.id)
            setBorrando(null)
          }}
        />
      )}
      {abierta && (
        <HistoriaModal key={abierta.id} historia={abierta} onCerrar={() => setTarjeta(null)} />
      )}
    </div>
  )
}
