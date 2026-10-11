import { useState, type FormEvent } from 'react'
import { TONOS_EPICA } from '@/lib/constantes'
import { useDatos } from '@/lib/useDatos'
import type { Epica, TonoEpica } from '@/lib/tipos'
import { InsigniaEpica } from './Insignias'
import { Boton } from './ui/Boton'
import { AreaTexto, Campo, Entrada, Selector } from './ui/Campo'
import { Modal } from './ui/Modal'

export function EpicaModal({ epica, onCerrar }: { epica?: Epica; onCerrar: () => void }) {
  const { epicas, crearEpica, actualizarEpica } = useDatos()
  const [nombre, setNombre] = useState(epica?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(epica?.descripcion ?? '')
  const [tono, setTono] = useState<TonoEpica>(epica?.tono ?? 'acento')
  const [transversal, setTransversal] = useState(epica?.transversal ?? false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return setErrorForm('El nombre es obligatorio.')
    if (epicas.some((x) => x.id !== epica?.id && x.nombre.toLowerCase() === n.toLowerCase()))
      return setErrorForm('Ya existe una épica con ese nombre.')
    const datos = { nombre: n, descripcion: descripcion.trim(), tono, transversal }
    setGuardando(true)
    const ok = epica ? await actualizarEpica(epica.id, datos) : await crearEpica(datos)
    setGuardando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal
      titulo={epica ? 'Editar épica' : 'Nueva épica'}
      eyebrow="Épica"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form="form-epica" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Boton>
        </>
      }
    >
      <form id="form-epica" onSubmit={guardar} className="flex flex-col gap-4">
        <Campo etiqueta="Nombre">
          <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Campo>
        <Campo etiqueta="Descripción">
          <AreaTexto
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </Campo>
        <Campo etiqueta="Color">
          <Selector value={tono} onChange={(e) => setTono(e.target.value as TonoEpica)}>
            {TONOS_EPICA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nombre}
              </option>
            ))}
          </Selector>
        </Campo>
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          Así se ve en las tarjetas:{' '}
          <InsigniaEpica epica={{ nombre: nombre.trim() || 'Épica', tono }} />
        </div>
        <label className="foco flex cursor-pointer items-start gap-3 rounded-lg border border-border-strong bg-bg-raised p-3 text-sm">
          <input
            type="checkbox"
            checked={transversal}
            onChange={(e) => setTransversal(e.target.checked)}
            className="mt-0.5 size-4 accent-accent-fill"
          />
          <span>
            <span className="font-medium text-text-primary">Transversal</span>
            <span className="block text-text-muted">
              Se trabaja en todos los sprints (por ejemplo, la documentación). Después podés crear
              una tarjeta de esta épica en cada sprint de una sola vez.
            </span>
          </span>
        </label>
        {errorForm && (
          <p role="alert" className="text-sm text-state-danger">
            {errorForm}
          </p>
        )}
      </form>
    </Modal>
  )
}
