import { CornerLeftUp, Lock, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { ESCALA_ESFUERZO, ESTADOS, ESTADOS_SPRINT, PRIORIDADES, VERSIONES } from '@/lib/constantes'
import { useDatos } from '@/lib/useDatos'
import type {
  Criterio,
  Estado,
  Historia,
  NuevaHistoria,
  Prioridad,
  TipoTarjeta,
  Version,
} from '@/lib/tipos'
import {
  iniciales,
  recorrido,
  siguienteCodigo,
  siguienteCodigoTarea,
  tareasDe,
  titulo,
} from '@/lib/util'
import { ConfirmarModal } from './ConfirmarModal'
import { InsigniaPaso } from './Insignias'
import { Boton } from './ui/Boton'
import { AreaTexto, Campo, Entrada, Selector } from './ui/Campo'
import { Modal } from './ui/Modal'

interface Props {
  /** Si viene, se edita; si no, se crea una tarjeta nueva. */
  historia?: Historia
  /** Crear una tarea de esta user story (abre con el tipo Tarea y la US ya elegida). */
  padre?: Historia
  onCerrar: () => void
}

const ESCALA = ['1', '2', '3', '4', '5']
/** Orden de una tarjeta nueva (mismo criterio que antes: marca de tiempo). */
const ordenNuevo = () => Date.now() % 1_000_000_000
const porCodigo = (a: Historia, b: Historia) =>
  a.codigo.localeCompare(b.codigo, 'es', { numeric: true })

export function HistoriaModal({ historia, padre, onCerrar }: Props) {
  const {
    historias,
    sprints,
    epicas,
    trazas,
    crearHistoria,
    actualizarHistoria,
    eliminarHistoria,
  } = useDatos()
  const editando = Boolean(historia)

  const [tipo, setTipo] = useState<TipoTarjeta>(historia?.tipo ?? (padre ? 'tarea' : 'historia'))
  const [codigo, setCodigo] = useState(
    historia?.codigo ??
      (tipo === 'tarea' ? siguienteCodigoTarea(historias) : siguienteCodigo(historias)),
  )
  const [padreId, setPadreId] = useState(historia?.historia_padre_id ?? padre?.id ?? '')
  const [version, setVersion] = useState<Version>(historia?.version ?? 'MVP')
  const [descripcion, setDescripcion] = useState(historia?.descripcion ?? '')
  const [texto, setTexto] = useState(
    historia?.historia ?? (tipo === 'tarea' ? '' : 'Como , quiero , para .'),
  )
  const [criterios, setCriterios] = useState<Criterio[]>(historia?.criterios ?? [])
  const [nuevoCriterio, setNuevoCriterio] = useState('')
  const [notas, setNotas] = useState(historia?.notas ?? '')
  const [valor, setValor] = useState(historia?.valor?.toString() ?? '3')
  const [esfuerzo, setEsfuerzo] = useState(historia?.esfuerzo?.toString() ?? '3')
  // Tarjetas viejas con 4 u otro valor fuera de Fibonacci: se muestran tal cual hasta que se reestimen.
  const esfuerzoFueraDeEscala =
    historia?.esfuerzo != null &&
    !(ESCALA_ESFUERZO as readonly number[]).includes(historia.esfuerzo)
  const [prioridad, setPrioridad] = useState<Prioridad>(historia?.prioridad ?? 'Media')
  const [responsable, setResponsable] = useState(historia?.responsable ?? '')
  const [sprintId, setSprintId] = useState(historia?.sprint_id ?? '')
  const [epicaId, setEpicaId] = useState(historia?.epica_id ?? padre?.epica_id ?? '')
  const [estado, setEstado] = useState<Estado>(
    historia?.estado && historia.estado !== 'backlog' ? historia.estado : 'por_hacer',
  )
  const [guardando, setGuardando] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  /** Tarjeta abierta encima de esta: una tarea, la US padre, o una tarea nueva. */
  const [sub, setSub] = useState<string | 'nueva' | null>(null)

  const esHistoria = tipo === 'historia'
  const usPadre = historias.find((h) => h.id === padreId && h.tipo === 'historia')
  const sprintActual = sprints.find((s) => s.id === historia?.sprint_id)
  const bloqueada = sprintActual?.estado === 'cerrado'
  const opcionesSprint = sprints.filter((s) => s.estado !== 'cerrado')
  const responsables = [...new Set(historias.map((h) => h.responsable).filter(Boolean))]
  const pasos = historia ? recorrido(historia, sprints, trazas) : []
  const hijas = historia && esHistoria ? tareasDe(historia, historias).sort(porCodigo) : []
  const hijasHechas = hijas.filter((t) => t.estado === 'hecho').length

  // Una tarea vive en el sprint de su US: el sprint efectivo sale de la US.
  const sprintEfectivo = esHistoria ? sprintId : (usPadre?.sprint_id ?? '')
  const nombreSprint = (id: string | null | undefined) =>
    sprints.find((s) => s.id === id)?.nombre ?? 'Sin sprint (backlog)'

  // US elegibles como padre: las que no están en un sprint cerrado (más la actual, si lo está).
  const cerrados = new Set(sprints.filter((s) => s.estado === 'cerrado').map((s) => s.id))
  const opcionesPadre = historias
    .filter(
      (h) =>
        h.tipo === 'historia' &&
        h.id !== historia?.id &&
        (h.id === padreId || !h.sprint_id || !cerrados.has(h.sprint_id)),
    )
    .sort(porCodigo)

  const criteriosHechos = criterios.filter((c) => c.hecho).length
  const estadoMostrado = sprintEfectivo && !bloqueada ? estado : (historia?.estado ?? 'backlog')
  const pendientes =
    esHistoria && estadoMostrado === 'hecho'
      ? {
          tareas: hijas.filter((t) => t.estado !== 'hecho').length,
          criterios: criterios.length - criteriosHechos,
        }
      : null

  function cambiarTipo(t: TipoTarjeta) {
    setTipo(t)
    if (!editando)
      setCodigo(t === 'tarea' ? siguienteCodigoTarea(historias) : siguienteCodigo(historias))
    if (t === 'historia') setPadreId('')
  }

  function cambiarPadre(id: string) {
    setPadreId(id)
    const us = historias.find((h) => h.id === id)
    if (us) setEpicaId(us.epica_id ?? '')
  }

  // ── Checklist de criterios ──
  function guardarCriterios(lista: Criterio[]) {
    setCriterios(lista)
    // Tildar se guarda al instante, sin tener que tocar Guardar.
    if (editando && esHistoria) void actualizarHistoria(historia!.id, { criterios: lista })
  }
  function agregarCriterio() {
    const t = nuevoCriterio.trim()
    if (!t) return
    setCriterios((cs) => [...cs, { texto: t, hecho: false }])
    setNuevoCriterio('')
  }
  function alTeclearCriterio(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      agregarCriterio()
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return setErrorForm('El código es obligatorio.')
    if (!descripcion.trim() && !texto.trim())
      return setErrorForm('Completá la descripción o el texto de la tarjeta.')
    if (!editando && historias.some((h) => h.codigo === codigo.trim()))
      return setErrorForm(`Ya existe una tarjeta con el código ${codigo.trim()}.`)
    if (!esHistoria && !usPadre)
      return setErrorForm('Elegí la user story a la que pertenece la tarea.')

    const comunes: Partial<NuevaHistoria> = {
      codigo: codigo.trim(),
      tipo,
      descripcion: descripcion.trim(),
      historia: texto.trim(),
      notas: notas.trim(),
      responsable: responsable.trim(),
      epica_id: epicaId || null,
    }
    const datos: Partial<NuevaHistoria> = esHistoria
      ? {
          ...comunes,
          version,
          prioridad,
          valor: Number(valor),
          esfuerzo: Number(esfuerzo),
          criterios: [
            ...criterios,
            ...(nuevoCriterio.trim() ? [{ texto: nuevoCriterio.trim(), hecho: false }] : []),
          ],
          historia_padre_id: null,
        }
      : {
          // La tarea hereda versión y prioridad de su US y no lleva valor, esfuerzo ni criterios.
          ...comunes,
          version: usPadre!.version,
          prioridad: usPadre!.prioridad,
          valor: null,
          esfuerzo: null,
          criterios: [],
          historia_padre_id: usPadre!.id,
        }
    if (!bloqueada) {
      datos.sprint_id = sprintEfectivo || null
      datos.estado = sprintEfectivo ? estado : 'backlog'
    }

    setGuardando(true)
    const ok = editando
      ? await actualizarHistoria(historia!.id, datos)
      : await crearHistoria({ ...(datos as NuevaHistoria), orden: ordenNuevo() })
    setGuardando(false)
    if (ok) onCerrar()
  }

  async function borrar() {
    setGuardando(true)
    const ok = await eliminarHistoria(historia!.id)
    setGuardando(false)
    if (ok) onCerrar()
  }

  // Tarjeta abierta encima: el formulario de esta queda intacto mientras tanto.
  if (sub) {
    const abierta = sub === 'nueva' ? undefined : historias.find((h) => h.id === sub)
    if (sub === 'nueva' && historia) {
      return <HistoriaModal padre={historia} onCerrar={() => setSub(null)} />
    }
    if (abierta) {
      return <HistoriaModal key={abierta.id} historia={abierta} onCerrar={() => setSub(null)} />
    }
  }

  if (confirmarBorrado) {
    return (
      <ConfirmarModal
        titulo={`Eliminar ${historia!.codigo}`}
        mensaje={`Esta acción no se puede deshacer. La tarjeta se elimina para todo el equipo.${
          hijas.length
            ? ` También se eliminan sus ${hijas.length} ${hijas.length === 1 ? 'tarea' : 'tareas'}.`
            : ''
        }`}
        etiqueta="Eliminar"
        onConfirmar={borrar}
        onCancelar={() => setConfirmarBorrado(false)}
      />
    )
  }

  const tituloModal = editando
    ? esHistoria
      ? 'Editar historia'
      : 'Editar tarea'
    : padre
      ? `Nueva tarea de ${padre.codigo}`
      : esHistoria
        ? 'Nueva historia de usuario'
        : 'Nueva tarea'

  return (
    <Modal
      ancho="lg"
      eyebrow={editando ? historia!.codigo : 'Nueva tarjeta'}
      titulo={tituloModal}
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
          <Selector
            value={tipo}
            onChange={(e) => cambiarTipo(e.target.value as TipoTarjeta)}
            disabled={Boolean(padre) || hijas.length > 0}
          >
            <option value="historia">Historia de usuario</option>
            <option value="tarea">Tarea</option>
          </Selector>
        </Campo>

        {!esHistoria && (
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Campo
              etiqueta="User story"
              ayuda="La tarea hereda versión, prioridad y sprint de la historia, y no suma esfuerzo."
            >
              <Selector
                value={padreId}
                onChange={(e) => cambiarPadre(e.target.value)}
                disabled={Boolean(padre)}
                required
              >
                <option value="">Elegí una user story…</option>
                {opcionesPadre.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.codigo} · {titulo(h)}
                  </option>
                ))}
              </Selector>
            </Campo>
            {usPadre && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                <span>
                  {usPadre.version} · Prioridad {usPadre.prioridad} ·{' '}
                  {nombreSprint(usPadre.sprint_id)}
                </span>
                {editando && (
                  <button
                    type="button"
                    onClick={() => setSub(usPadre.id)}
                    className="foco inline-flex items-center gap-1 rounded-md text-text-secondary underline hover:text-text-primary"
                  >
                    <CornerLeftUp size={12} strokeWidth={1.5} aria-hidden /> Abrir {usPadre.codigo}
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        <Campo
          etiqueta="Descripción corta"
          className="md:col-span-2"
          ayuda="Es el título de la tarjeta."
        >
          <Entrada value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Campo>
        <Campo etiqueta={esHistoria ? 'Historia' : 'Detalle'} className="md:col-span-2">
          <AreaTexto value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} />
        </Campo>

        {esHistoria && (
          <>
            <Campo etiqueta="Versión">
              <Selector value={version} onChange={(e) => setVersion(e.target.value as Version)}>
                {VERSIONES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Prioridad">
              <Selector
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Valor de negocio (1-5)">
              <Selector value={valor} onChange={(e) => setValor(e.target.value)}>
                {ESCALA.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </Selector>
            </Campo>
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

            <section
              className="flex flex-col gap-2 md:col-span-2"
              aria-label="Criterios de aceptación"
            >
              <h3 className="flex items-center justify-between text-sm font-medium text-text-secondary">
                Criterios de aceptación
                {criterios.length > 0 && (
                  <span className="text-code text-xs text-text-muted tabular-nums">
                    {criteriosHechos}/{criterios.length}
                  </span>
                )}
              </h3>
              {criterios.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {criterios.map((c, i) => (
                    <li
                      key={i}
                      className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-bg-raised"
                    >
                      <input
                        type="checkbox"
                        checked={c.hecho}
                        onChange={() =>
                          guardarCriterios(
                            criterios.map((x, j) => (j === i ? { ...x, hecho: !x.hecho } : x)),
                          )
                        }
                        aria-label={`Criterio cumplido: ${c.texto}`}
                        className="foco mt-0.5 size-4 shrink-0 accent-accent-fill"
                      />
                      <span
                        className={`flex-1 text-sm ${c.hecho ? 'text-text-muted line-through' : 'text-text-primary'}`}
                      >
                        {c.texto}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCriterios(criterios.filter((_, j) => j !== i))}
                        aria-label={`Quitar criterio: ${c.texto}`}
                        className="foco rounded-md p-0.5 text-text-muted hover:text-text-primary"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Entrada
                  value={nuevoCriterio}
                  onChange={(e) => setNuevoCriterio(e.target.value)}
                  onKeyDown={alTeclearCriterio}
                  placeholder="Agregar un criterio y Enter"
                  aria-label="Nuevo criterio de aceptación"
                />
                <Boton onClick={agregarCriterio} disabled={!nuevoCriterio.trim()}>
                  <Plus size={16} strokeWidth={1.5} /> Agregar
                </Boton>
              </div>
              {editando && (
                <p className="text-xs text-text-muted">
                  Tildar se guarda al instante; agregar o quitar, al tocar Guardar.
                </p>
              )}
            </section>
          </>
        )}

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

        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <Campo etiqueta="Sprint" ayuda={!esHistoria ? 'El de su user story.' : undefined}>
            <Selector
              value={sprintEfectivo}
              onChange={(e) => setSprintId(e.target.value)}
              disabled={bloqueada || !esHistoria}
            >
              {bloqueada || !esHistoria ? (
                <option value={sprintEfectivo}>
                  {bloqueada ? sprintActual?.nombre : nombreSprint(sprintEfectivo)}
                </option>
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
              value={estadoMostrado}
              onChange={(e) => setEstado(e.target.value as Estado)}
              disabled={bloqueada || !sprintEfectivo}
            >
              {!sprintEfectivo && !bloqueada && <option value="backlog">{ESTADOS.backlog}</option>}
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

        {pendientes && (pendientes.tareas > 0 || pendientes.criterios > 0) && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg border border-state-warn bg-state-warn-bg p-3 text-sm text-state-warn md:col-span-2"
          >
            <TriangleAlert size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              Esta historia está en Hecho pero le{' '}
              {pendientes.tareas + pendientes.criterios === 1 ? 'queda' : 'quedan'}{' '}
              {[
                pendientes.tareas > 0 &&
                  `${pendientes.tareas} ${pendientes.tareas === 1 ? 'tarea sin terminar' : 'tareas sin terminar'}`,
                pendientes.criterios > 0 &&
                  `${pendientes.criterios} ${pendientes.criterios === 1 ? 'criterio sin tildar' : 'criterios sin tildar'}`,
              ]
                .filter(Boolean)
                .join(' y ')}
              . Podés guardar igual.
            </span>
          </p>
        )}

        {editando && esHistoria && (
          <section className="flex flex-col gap-2 md:col-span-2" aria-label="Tareas de la historia">
            <h3 className="flex items-center justify-between text-sm font-medium text-text-secondary">
              <span>
                Tareas
                {hijas.length > 0 && (
                  <span className="text-code ml-2 text-xs text-text-muted tabular-nums">
                    {hijasHechas}/{hijas.length}
                  </span>
                )}
              </span>
              <Boton onClick={() => setSub('nueva')} compacto>
                <Plus size={14} strokeWidth={1.5} /> Agregar tarea
              </Boton>
            </h3>
            {hijas.length === 0 ? (
              <p className="text-sm text-text-muted">
                Todavía no tiene tareas. Dividila en tareas para repartir el trabajo; el esfuerzo se
                sigue contando en la historia.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-strong">
                {hijas.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSub(t.id)}
                      className="foco flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-bg-raised"
                    >
                      <span className="text-code w-12 shrink-0 text-text-muted">{t.codigo}</span>
                      <span
                        className={`min-w-0 flex-1 truncate ${t.estado === 'hecho' ? 'text-text-muted line-through' : 'text-text-primary'}`}
                      >
                        {titulo(t)}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted">{ESTADOS[t.estado]}</span>
                      {t.responsable && (
                        <span
                          title={t.responsable}
                          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg-raised text-xs font-medium text-text-secondary"
                        >
                          {iniciales(t.responsable)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

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
