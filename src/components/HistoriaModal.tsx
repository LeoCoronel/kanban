import { Lock, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ESCALA_ESFUERZO, ESTADOS, ESTADOS_SPRINT, PRIORIDADES, VERSIONES } from '@/lib/constantes'
import { useDatos } from '@/lib/useDatos'
import type { Estado, Historia, NuevaHistoria, Prioridad, TipoTarjeta, Version } from '@/lib/tipos'
import { recorrido, siguienteCodigo } from '@/lib/util'
import { ConfirmarModal } from './ConfirmarModal'
import { InsigniaPaso } from './Insignias'
import { Boton } from './ui/Boton'
import { AreaTexto, Campo, Entrada, Selector } from './ui/Campo'
import { Modal } from './ui/Modal'

interface Props {
  /** Si viene, se edita; si no, se crea una historia nueva. */
  historia?: Historia
  onCerrar: () => void
}

const ESCALA = ['1', '2', '3', '4', '5']

export function HistoriaModal({ historia, onCerrar }: Props) {
  const { historias, sprints, epicas, trazas, crearHistoria, actualizarHistoria, eliminarHistoria } =
    useDatos()
  const editando = Boolean(historia)

  const [codigo, setCodigo] = useState(historia?.codigo ?? siguienteCodigo(historias))
  const [tipo, setTipo] = useState<TipoTarjeta>(historia?.tipo ?? 'historia')
  const [version, setVersion] = useState<Version>(historia?.version ?? 'MVP')
  const [descripcion, setDescripcion] = useState(historia?.descripcion ?? '')
  const [texto, setTexto] = useState(historia?.historia ?? 'Como , quiero , para .')
  const [criterios, setCriterios] = useState((historia?.criterios ?? []).join('\n'))
  const [notas, setNotas] = useState(historia?.notas ?? '')
  const [valor, setValor] = useState(historia?.valor?.toString() ?? '3')
  const [esfuerzo, setEsfuerzo] = useState(historia?.esfuerzo?.toString() ?? '3')
  // Tarjetas viejas con 4 u otro valor fuera de Fibonacci: se muestran tal cual hasta que se reestimen.
  const esfuerzoFueraDeEscala =
    historia?.esfuerzo != null && !(ESCALA_ESFUERZO as readonly number[]).includes(historia.esfuerzo)
  const [prioridad, setPrioridad] = useState<Prioridad>(historia?.prioridad ?? 'Media')
  const [responsable, setResponsable] = useState(historia?.responsable ?? '')
  const [sprintId, setSprintId] = useState(historia?.sprint_id ?? '')
  const [epicaId, setEpicaId] = useState(historia?.epica_id ?? '')
  const [estado, setEstado] = useState<Estado>(
    historia?.estado && historia.estado !== 'backlog' ? historia.estado : 'por_hacer',
  )
  const [guardando, setGuardando] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  const sprintActual = sprints.find((s) => s.id === historia?.sprint_id)
  const bloqueada = sprintActual?.estado === 'cerrado'
  const opcionesSprint = sprints.filter((s) => s.estado !== 'cerrado')
  const responsables = [...new Set(historias.map((h) => h.responsable).filter(Boolean))]
  const esHistoria = tipo === 'historia'
  const pasos = historia ? recorrido(historia, sprints, trazas) : []

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return setErrorForm('El código es obligatorio.')
    if (!descripcion.trim() && !texto.trim())
      return setErrorForm('Completá la descripción o el texto de la historia.')
    if (!editando && historias.some((h) => h.codigo === codigo.trim()))
      return setErrorForm(`Ya existe una tarjeta con el código ${codigo.trim()}.`)

    const datos: Partial<NuevaHistoria> = {
      codigo: codigo.trim(),
      tipo,
      version,
      descripcion: descripcion.trim(),
      historia: texto.trim(),
      criterios: criterios
        .split('\n')
        .map((c) => c.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean),
      notas: notas.trim(),
      valor: esHistoria ? Number(valor) : null,
      esfuerzo: Number(esfuerzo),
      prioridad,
      responsable: responsable.trim(),
      epica_id: epicaId || null,
    }
    if (!bloqueada) {
      datos.sprint_id = sprintId || null
      datos.estado = sprintId ? estado : 'backlog'
    }

    setGuardando(true)
    const ok = editando
      ? await actualizarHistoria(historia!.id, datos)
      : await crearHistoria({ ...(datos as NuevaHistoria), orden: Date.now() % 1_000_000_000 })
    setGuardando(false)
    if (ok) onCerrar()
  }

  async function borrar() {
    setGuardando(true)
    const ok = await eliminarHistoria(historia!.id)
    setGuardando(false)
    if (ok) onCerrar()
  }

  if (confirmarBorrado) {
    return (
      <ConfirmarModal
        titulo={`Eliminar ${historia!.codigo}`}
        mensaje="Esta acción no se puede deshacer. La tarjeta se elimina para todo el equipo."
        etiqueta="Eliminar"
        onConfirmar={borrar}
        onCancelar={() => setConfirmarBorrado(false)}
      />
    )
  }

  return (
    <Modal
      ancho="lg"
      eyebrow={editando ? historia!.codigo : 'Nueva tarjeta'}
      titulo={editando ? 'Editar historia' : 'Nueva historia de usuario'}
      onCerrar={onCerrar}
      pie={
        <>
          {editando && (
            <Boton variante="peligro" onClick={() => setConfirmarBorrado(true)} className="mr-auto">
              <Trash2 size={16} strokeWidth={1.5} /> Eliminar
            </Boton>
          )}
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form="form-historia" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Boton>
        </>
      }
    >
      <form id="form-historia" onSubmit={guardar} className="grid gap-4 md:grid-cols-2">
        <Campo etiqueta="Código">
          <Entrada
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="text-code"
          />
        </Campo>
        <Campo etiqueta="Tipo">
          <Selector value={tipo} onChange={(e) => setTipo(e.target.value as TipoTarjeta)}>
            <option value="historia">Historia de usuario</option>
            <option value="tarea">Tarea</option>
          </Selector>
        </Campo>

        <Campo
          etiqueta="Descripción corta"
          className="md:col-span-2"
          ayuda="Es el título de la tarjeta."
        >
          <Entrada value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Campo>
        <Campo etiqueta="Historia" className="md:col-span-2">
          <AreaTexto value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} />
        </Campo>

        <Campo etiqueta="Versión">
          <Selector value={version} onChange={(e) => setVersion(e.target.value as Version)}>
            {VERSIONES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Selector>
        </Campo>
        <Campo etiqueta="Prioridad">
          <Selector value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
            {PRIORIDADES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Selector>
        </Campo>

        {esHistoria && (
          <Campo etiqueta="Valor de negocio (1-5)">
            <Selector value={valor} onChange={(e) => setValor(e.target.value)}>
              {ESCALA.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </Selector>
          </Campo>
        )}
        <Campo etiqueta="Esfuerzo (1, 2, 3, 5, 8)" ayuda="Story points en escala Fibonacci.">
          <Selector value={esfuerzo} onChange={(e) => setEsfuerzo(e.target.value)}>
            {esfuerzoFueraDeEscala && <option value={esfuerzo}>{esfuerzo} (reestimar)</option>}
            {ESCALA_ESFUERZO.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Selector>
        </Campo>

        <Campo etiqueta="Criterios de aceptación" className="md:col-span-2" ayuda="Uno por línea.">
          <AreaTexto value={criterios} onChange={(e) => setCriterios(e.target.value)} rows={5} />
        </Campo>
        <Campo etiqueta="Notas" className="md:col-span-2">
          <AreaTexto value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
        </Campo>

        <Campo
          etiqueta="Épica"
          ayuda="Agrupa tarjetas de un mismo tema, aunque estén en distintos sprints."
        >
          <Selector value={epicaId} onChange={(e) => setEpicaId(e.target.value)}>
            <option value="">Sin épica</option>
            {epicas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
                {e.transversal ? ' (transversal)' : ''}
              </option>
            ))}
          </Selector>
        </Campo>

        <Campo etiqueta="Responsable">
          <Entrada
            list="responsables"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Nombre"
          />
          <datalist id="responsables">
            {responsables.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Sprint">
            <Selector
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              disabled={bloqueada}
            >
              {bloqueada ? (
                <option value={sprintId}>{sprintActual?.nombre}</option>
              ) : (
                <>
                  <option value="">Sin sprint (backlog)</option>
                  {opcionesSprint.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                      {s.estado === 'activo' ? ' (activo)' : ''}
                    </option>
                  ))}
                </>
              )}
            </Selector>
          </Campo>
          <Campo etiqueta="Estado">
            <Selector
              value={sprintId && !bloqueada ? estado : (historia?.estado ?? 'backlog')}
              onChange={(e) => setEstado(e.target.value as Estado)}
              disabled={bloqueada || !sprintId}
            >
              {!sprintId && !bloqueada && <option value="backlog">{ESTADOS.backlog}</option>}
              {(bloqueada ? (['backlog', ...ESTADOS_SPRINT] as Estado[]) : ESTADOS_SPRINT).map(
                (s) => (
                  <option key={s} value={s}>
                    {ESTADOS[s]}
                  </option>
                ),
              )}
            </Selector>
          </Campo>
        </div>

        {pasos.length > 0 && (
          <section className="md:col-span-2" aria-label="Recorrido por sprints">
            <h3 className="mb-2 text-sm font-medium text-text-primary">Recorrido por sprints</h3>
            <ul className="flex flex-wrap gap-2">
              {pasos.map(({ sprint, paso }) => (
                <li key={sprint.id} className="flex items-center gap-2 text-sm text-text-secondary">
                  {sprint.nombre} <InsigniaPaso paso={paso} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {bloqueada && (
          <p className="flex items-center gap-2 text-sm text-text-muted md:col-span-2">
            <Lock size={14} strokeWidth={1.5} aria-hidden />
            Pertenece a un sprint cerrado: podés editar el contenido, pero no moverla.
          </p>
        )}
        {errorForm && (
          <p role="alert" className="text-sm text-state-danger md:col-span-2">
            {errorForm}
          </p>
        )}
      </form>
    </Modal>
  )
}
