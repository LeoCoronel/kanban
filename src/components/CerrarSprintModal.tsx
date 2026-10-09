import { useState } from 'react'
import { useDatos } from '@/lib/useDatos'
import type { Sprint } from '@/lib/tipos'
import { Boton } from './ui/Boton'
import { Modal } from './ui/Modal'

export function CerrarSprintModal({ sprint, onCerrar }: { sprint: Sprint; onCerrar: () => void }) {
  const { historias, sprints, cerrarSprint } = useDatos()
  const delSprint = historias.filter((h) => h.sprint_id === sprint.id)
  const hechas = delSprint.filter((h) => h.estado === 'hecho').length
  const pendientes = delSprint.length - hechas
  const planificados = sprints.filter((s) => s.estado === 'planificado')

  const [destino, setDestino] = useState<string>('backlog')
  const [guardando, setGuardando] = useState(false)

  async function confirmar() {
    setGuardando(true)
    const ok = await cerrarSprint(sprint.id, destino)
    setGuardando(false)
    if (ok) onCerrar()
  }

  const opciones = [
    { valor: 'backlog', texto: 'Devolverlas al backlog' },
    ...planificados.map((s) => ({ valor: s.id, texto: `Pasarlas a ${s.nombre}` })),
  ]

  return (
    <Modal
      titulo={`Cerrar ${sprint.nombre}`}
      eyebrow="Cierre de sprint"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" onClick={confirmar} disabled={guardando}>
            {guardando ? 'Cerrando…' : 'Cerrar sprint'}
          </Boton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Se completaron <span className="text-code text-text-primary">{hechas}</span> de{' '}
          <span className="text-code text-text-primary">{delSprint.length}</span> tarjetas. El
          sprint pasa a una columna propia del tablero con todas sus tarjetas, y ya no se puede
          modificar.
        </p>
        {pendientes > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-text-primary">
              ¿Qué hacemos con las {pendientes} sin terminar?
            </legend>
            {opciones.map((o) => (
              <label
                key={o.valor}
                className={`foco flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                  destino === o.valor
                    ? 'border-2 border-accent-text bg-accent-subtle/40 text-text-primary'
                    : 'border-border-strong bg-bg-raised text-text-secondary'
                }`}
              >
                <input
                  type="radio"
                  name="destino"
                  value={o.valor}
                  checked={destino === o.valor}
                  onChange={() => setDestino(o.valor)}
                  className="accent-accent-fill"
                />
                {o.texto}
              </label>
            ))}
          </fieldset>
        ) : (
          <p className="text-sm text-state-ok">No quedan tarjetas pendientes.</p>
        )}
      </div>
    </Modal>
  )
}
