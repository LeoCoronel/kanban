import { useMemo, useState } from 'react'
import { useDatos } from '@/lib/useDatos'
import type { Epica, NuevaHistoria } from '@/lib/tipos'
import { codigosEpica } from '@/lib/util'
import { InsigniaSprint } from './Insignias'
import { Boton } from './ui/Boton'
import { AreaTexto, Campo } from './ui/Campo'
import { Modal } from './ui/Modal'

/** Crea una tarjeta de la épica en cada sprint elegido (los que todavía no la tienen). */
export function TarjetasPorSprintModal({
  epica,
  onCerrar,
}: {
  epica: Epica
  onCerrar: () => void
}) {
  const { sprints, historias, crearHistorias } = useDatos()

  const candidatos = useMemo(
    () =>
      sprints
        .filter((s) => s.estado !== 'cerrado')
        .map((s) => ({
          sprint: s,
          yaTiene: historias.some(
            (h) => h.epica_id === epica.id && h.sprint_id === s.id && h.tipo === 'tarea',
          ),
        })),
    [sprints, historias, epica.id],
  )

  const [elegidos, setElegidos] = useState<Set<string>>(
    () => new Set(candidatos.filter((c) => !c.yaTiene).map((c) => c.sprint.id)),
  )
  const [detalle, setDetalle] = useState('')
  const [guardando, setGuardando] = useState(false)

  const aCrear = candidatos.filter((c) => elegidos.has(c.sprint.id))
  const codigos = codigosEpica(epica, historias, aCrear.length)

  function alternar(id: string) {
    setElegidos((prev) => {
      const sig = new Set(prev)
      if (sig.has(id)) sig.delete(id)
      else sig.add(id)
      return sig
    })
  }

  async function crear() {
    const base = Date.now() % 1_000_000_000
    const tarjetas: NuevaHistoria[] = aCrear.map((c, i) => ({
      codigo: codigos[i],
      tipo: 'tarea',
      version: 'MVP',
      historia: detalle.trim(),
      descripcion: `${epica.nombre} · ${c.sprint.nombre}`,
      valor: null,
      esfuerzo: null,
      prioridad: 'Media',
      criterios: [],
      notas: '',
      estado: 'por_hacer',
      sprint_id: c.sprint.id,
      epica_id: epica.id,
      responsable: '',
      orden: base + i,
    }))
    setGuardando(true)
    const ok = await crearHistorias(tarjetas)
    setGuardando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal
      titulo={`Una tarjeta de ${epica.nombre} por sprint`}
      eyebrow="Épica transversal"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" onClick={crear} disabled={guardando || aCrear.length === 0}>
            {guardando
              ? 'Creando…'
              : `Crear ${aCrear.length} tarjeta${aCrear.length === 1 ? '' : 's'}`}
          </Boton>
        </>
      }
    >
      {candidatos.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No hay sprints activos ni planificados. Creá uno desde Sprints o Planificación y volvé
          acá.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Se crea una tarea en cada sprint marcado, ya asignada a ese sprint y a la épica. Los que
            ya tienen una tarjeta de esta épica vienen desmarcados.
          </p>
          <ul className="flex flex-col gap-2">
            {candidatos.map(({ sprint, yaTiene }) => (
              <li key={sprint.id}>
                <label className="foco flex cursor-pointer items-center gap-3 rounded-lg border border-border-strong bg-bg-raised p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={elegidos.has(sprint.id)}
                    onChange={() => alternar(sprint.id)}
                    className="size-4 accent-accent-fill"
                  />
                  <span className="flex-1 text-text-primary">{sprint.nombre}</span>
                  {yaTiene && <span className="text-xs text-text-muted">ya tiene una</span>}
                  <InsigniaSprint estado={sprint.estado} />
                </label>
              </li>
            ))}
          </ul>
          <Campo etiqueta="Detalle (opcional)" ayuda="Se copia en todas las tarjetas nuevas.">
            <AreaTexto value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={3} />
          </Campo>
        </div>
      )}
    </Modal>
  )
}
