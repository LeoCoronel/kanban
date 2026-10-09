import { useState, type FormEvent } from 'react'
import { useDatos } from '@/lib/useDatos'
import type { Sprint } from '@/lib/tipos'
import { siguienteNombreSprint } from '@/lib/util'
import { Boton } from './ui/Boton'
import { AreaTexto, Campo, Entrada } from './ui/Campo'
import { Modal } from './ui/Modal'

export function SprintModal({ sprint, onCerrar }: { sprint?: Sprint; onCerrar: () => void }) {
  const { sprints, crearSprint, actualizarSprint } = useDatos()
  const [nombre, setNombre] = useState(sprint?.nombre ?? siguienteNombreSprint(sprints))
  const [objetivo, setObjetivo] = useState(sprint?.objetivo ?? '')
  const [inicio, setInicio] = useState(sprint?.fecha_inicio ?? '')
  const [fin, setFin] = useState(sprint?.fecha_fin ?? '')
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return setErrorForm('El nombre es obligatorio.')
    if (inicio && fin && fin < inicio)
      return setErrorForm('La fecha de fin no puede ser anterior a la de inicio.')
    const datos = {
      nombre: nombre.trim(),
      objetivo: objetivo.trim(),
      fecha_inicio: inicio || null,
      fecha_fin: fin || null,
    }
    setGuardando(true)
    const ok = sprint
      ? await actualizarSprint(sprint.id, datos)
      : await crearSprint({ ...datos, estado: 'planificado' })
    setGuardando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal
      titulo={sprint ? 'Editar sprint' : 'Nuevo sprint'}
      eyebrow="Sprint"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form="form-sprint" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Boton>
        </>
      }
    >
      <form id="form-sprint" onSubmit={guardar} className="flex flex-col gap-4">
        <Campo etiqueta="Nombre">
          <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Campo>
        <Campo etiqueta="Objetivo">
          <AreaTexto value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={3} />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Inicio">
            <Entrada type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Campo>
          <Campo etiqueta="Fin">
            <Entrada type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </Campo>
        </div>
        {errorForm && (
          <p role="alert" className="text-sm text-state-danger">
            {errorForm}
          </p>
        )}
      </form>
    </Modal>
  )
}
