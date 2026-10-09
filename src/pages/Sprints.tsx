import { Flag, Pencil, Play, Plus } from 'lucide-react'
import { useState } from 'react'
import { CerrarSprintModal } from '@/components/CerrarSprintModal'
import { Encabezado } from '@/components/Encabezado'
import { Cargando, Vacio } from '@/components/Estados'
import { HistoriaModal } from '@/components/HistoriaModal'
import { InsigniaSprint } from '@/components/Insignias'
import { SprintModal } from '@/components/SprintModal'
import { Boton } from '@/components/ui/Boton'
import { ESTADOS } from '@/lib/constantes'
import type { Sprint } from '@/lib/tipos'
import { useDatos } from '@/lib/useDatos'
import { fechaCorta, rangoFechas, sumaEsfuerzo, titulo } from '@/lib/util'

const PESO_ESTADO = { activo: 0, planificado: 1, cerrado: 2 }

export function Sprints() {
  const { sprints, historias, sprintActivo, cargando, iniciarSprint } = useDatos()
  const [editando, setEditando] = useState<Sprint | 'nuevo' | null>(null)
  const [cerrando, setCerrando] = useState<Sprint | null>(null)
  const [tarjeta, setTarjeta] = useState<string | null>(null)

  if (cargando) return <Cargando />

  const ordenados = [...sprints].sort(
    (a, b) =>
      PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado] ||
      (b.cerrado_en ?? b.created_at).localeCompare(a.cerrado_en ?? a.created_at),
  )
  const abierta = historias.find((h) => h.id === tarjeta)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-(--layout-margin) py-6">
      <Encabezado
        eyebrow="Iteraciones"
        titulo="Sprints"
        acciones={
          <Boton variante="primario" onClick={() => setEditando('nuevo')}>
            <Plus size={16} strokeWidth={1.5} /> Nuevo sprint
          </Boton>
        }
      />

      {ordenados.length === 0 ? (
        <Vacio titulo="Todavía no hay sprints">
          <p className="text-sm text-text-muted">Creá el primero para empezar a planificar.</p>
        </Vacio>
      ) : (
        <ul className="grid gap-(--layout-gutter) lg:grid-cols-2">
          {ordenados.map((s) => {
            const hs = historias.filter((h) => h.sprint_id === s.id)
            const hechas = hs.filter((h) => h.estado === 'hecho')
            const pct = hs.length ? Math.round((hechas.length / hs.length) * 100) : 0
            return (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-border-strong bg-bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-text-primary">{s.nombre}</h2>
                    <InsigniaSprint estado={s.estado} />
                  </div>
                  <div className="flex gap-2">
                    {s.estado !== 'cerrado' && (
                      <Boton compacto variante="fantasma" onClick={() => setEditando(s)}>
                        <Pencil size={14} strokeWidth={1.5} /> Editar
                      </Boton>
                    )}
                    {s.estado === 'planificado' && (
                      <Boton
                        compacto
                        disabled={Boolean(sprintActivo)}
                        title={sprintActivo ? 'Cerrá el sprint activo primero' : undefined}
                        onClick={() => void iniciarSprint(s.id)}
                      >
                        <Play size={14} strokeWidth={1.5} /> Iniciar
                      </Boton>
                    )}
                    {s.estado === 'activo' && (
                      <Boton compacto variante="primario" onClick={() => setCerrando(s)}>
                        <Flag size={14} strokeWidth={1.5} /> Cerrar sprint
                      </Boton>
                    )}
                  </div>
                </div>

                {s.objetivo && <p className="text-sm text-text-secondary">{s.objetivo}</p>}
                {(rangoFechas(s) || s.cerrado_en) && (
                  <p className="text-code text-xs text-text-muted">
                    {[rangoFechas(s), s.cerrado_en && `cerrado el ${fechaCorta(s.cerrado_en)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}

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
                    aria-label={`Avance de ${s.nombre}`}
                    className="h-2 overflow-hidden rounded-full bg-bg-raised"
                  >
                    <div className="h-full bg-state-ok" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <details className="group">
                  <summary className="foco cursor-pointer rounded-md text-sm text-text-secondary hover:text-text-primary">
                    Ver tarjetas ({hs.length})
                  </summary>
                  {hs.length === 0 ? (
                    <p className="mt-2 text-sm text-text-muted">Sin tarjetas asignadas.</p>
                  ) : (
                    <ul className="mt-2 flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
                      {hs.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => setTarjeta(h.id)}
                            className="foco flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-bg-raised"
                          >
                            <span className="text-code w-14 shrink-0 text-text-muted">
                              {h.codigo}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-text-primary">
                              {titulo(h)}
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
        <SprintModal
          sprint={editando === 'nuevo' ? undefined : editando}
          onCerrar={() => setEditando(null)}
        />
      )}
      {cerrando && <CerrarSprintModal sprint={cerrando} onCerrar={() => setCerrando(null)} />}
      {abierta && (
        <HistoriaModal key={abierta.id} historia={abierta} onCerrar={() => setTarjeta(null)} />
      )}
    </div>
  )
}
