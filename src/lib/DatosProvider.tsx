import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DatosContexto, type Datos, type Destino } from './datosContext'
import { repo } from './repo'
import type {
  Epica,
  Historia,
  NuevaHistoria,
  NuevaSprintHistoria,
  Sprint,
  SprintHistoria,
} from './tipos'
import { padreDe, pendientesDe, tareasDe, textoPendientes } from './util'

const mensaje = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado.')

/** Cambios que una user story le pasa a sus tareas para que sigan en su mismo sprint. */
function cambiosDeTareas(
  us: Historia,
  patch: Partial<NuevaHistoria>,
  historias: Historia[],
): { ids: string[]; patch: Partial<NuevaHistoria> }[] {
  if (us.tipo !== 'historia') return []
  const hijas = tareasDe(us, historias)
  if (!hijas.length) return []
  const cambios: { ids: string[]; patch: Partial<NuevaHistoria> }[] = []

  const heredado: Partial<NuevaHistoria> = {}
  if (patch.version && patch.version !== us.version) heredado.version = patch.version
  if (patch.prioridad && patch.prioridad !== us.prioridad) heredado.prioridad = patch.prioridad
  if (Object.keys(heredado).length) cambios.push({ ids: hijas.map((t) => t.id), patch: heredado })

  if (patch.sprint_id !== undefined && patch.sprint_id !== us.sprint_id) {
    const sprint_id = patch.sprint_id
    if (sprint_id === null) {
      cambios.push({ ids: hijas.map((t) => t.id), patch: { sprint_id, estado: 'backlog' } })
    } else {
      // Las que estaban en el backlog entran como "Por hacer"; el resto conserva su estado.
      const enBacklog = hijas.filter((t) => t.estado === 'backlog').map((t) => t.id)
      const otras = hijas.filter((t) => t.estado !== 'backlog').map((t) => t.id)
      if (enBacklog.length)
        cambios.push({ ids: enBacklog, patch: { sprint_id, estado: 'por_hacer' } })
      if (otras.length) cambios.push({ ids: otras, patch: { sprint_id } })
    }
  }
  return cambios
}

export function DatosProvider({ children }: { children: ReactNode }) {
  const [historias, setHistorias] = useState<Historia[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [epicas, setEpicas] = useState<Epica[]>([])
  const [trazas, setTrazas] = useState<SprintHistoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      const d = await repo.listar()
      setHistorias(d.historias)
      setSprints(d.sprints)
      setEpicas(d.epicas)
      setTrazas(d.trazas)
    } catch (e) {
      setError(mensaje(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial: el setState ocurre dentro de los callbacks de la promesa.
    void repo
      .listar()
      .then((d) => {
        setHistorias(d.historias)
        setSprints(d.sprints)
        setEpicas(d.epicas)
        setTrazas(d.trazas)
      })
      .catch((e: unknown) => setError(mensaje(e)))
      .finally(() => setCargando(false))
    return repo.suscribir(() => void recargar())
  }, [recargar])

  const ejecutar = useCallback(
    async (fn: () => Promise<void>) => {
      try {
        await fn()
        await recargar()
        return true
      } catch (e) {
        setError(mensaje(e))
        await recargar()
        return false
      }
    },
    [recargar],
  )

  const valor = useMemo<Datos>(
    () => ({
      modo: repo.modo,
      historias,
      sprints,
      epicas,
      trazas,
      sprintActivo: sprints.find((s) => s.estado === 'activo'),
      cargando,
      error,
      limpiarError: () => setError(null),
      aviso,
      limpiarAviso: () => setAviso(null),
      crearHistoria: (h) => ejecutar(() => repo.crearHistorias([h])),
      crearHistorias: (hs) => ejecutar(() => repo.crearHistorias(hs)),
      actualizarHistoria: (id, patch) =>
        ejecutar(async () => {
          const h = historias.find((x) => x.id === id)
          await repo.actualizarHistorias([id], patch)
          if (h) {
            for (const c of cambiosDeTareas(h, patch, historias))
              await repo.actualizarHistorias(c.ids, c.patch)
          }
        }),
      moverHistoria: async (id: string, destino: Destino) => {
        const h = historias.find((x) => x.id === id)
        if (!h) return
        const us = padreDe(h, historias)
        if (us && destino.sprint_id !== us.sprint_id) {
          setError(
            `${h.codigo} es una tarea de ${us.codigo}: para cambiarla de sprint, mové la historia.`,
          )
          return
        }
        if (h.tipo === 'historia' && destino.estado === 'hecho' && h.estado !== 'hecho') {
          setAviso(textoPendientes(h.codigo, pendientesDe(h, historias)) || null)
        }
        const cambios = cambiosDeTareas(h, destino, historias)
        // Actualización optimista: la tarjeta (y sus tareas) se mueven ya; se revierte si falla.
        setHistorias((hs) =>
          hs.map((x) => {
            if (x.id === id) return { ...x, ...destino }
            const c = cambios.find((c) => c.ids.includes(x.id))
            return c ? { ...x, ...c.patch } : x
          }),
        )
        await ejecutar(async () => {
          await repo.actualizarHistorias([id], destino)
          for (const c of cambios) await repo.actualizarHistorias(c.ids, c.patch)
        })
      },
      eliminarHistoria: (id) => ejecutar(() => repo.eliminarHistoria(id)),
      crearSprint: (s) => ejecutar(() => repo.crearSprint(s)),
      actualizarSprint: (id, patch) => ejecutar(() => repo.actualizarSprint(id, patch)),
      iniciarSprint: (id) =>
        ejecutar(async () => {
          if (sprints.some((s) => s.estado === 'activo')) {
            throw new Error('Ya hay un sprint activo. Cerralo antes de iniciar otro.')
          }
          await repo.actualizarSprint(id, { estado: 'activo' })
        }),
      cerrarSprint: (id, destinoPendientes) =>
        ejecutar(async () => {
          const delSprint = historias.filter((h) => h.sprint_id === id)
          // Una tarea sigue a su US: si la US no terminó, la tarea viaja con ella aunque esté hecha.
          const terminada = (h: Historia) => {
            const us = padreDe(h, historias)
            return us && us.sprint_id === id ? us.estado === 'hecho' : h.estado === 'hecho'
          }
          const quedan = delSprint.filter((h) => !terminada(h))
          // La foto se guarda antes de mover nada: si falla, el sprint queda como estaba.
          const fotos: NuevaSprintHistoria[] = delSprint.map((h) => {
            const hecha = terminada(h)
            const destino = hecha || destinoPendientes === 'backlog' ? null : destinoPendientes
            return {
              sprint_id: id,
              historia_id: h.id,
              codigo: h.codigo,
              estado_final: h.estado,
              resultado: hecha ? 'hecha' : destino ? 'arrastrada' : 'devuelta',
              destino_sprint_id: destino,
            }
          })
          await repo.registrarTrazas(fotos)
          if (destinoPendientes === 'backlog') {
            if (quedan.length)
              await repo.actualizarHistorias(
                quedan.map((h) => h.id),
                { sprint_id: null, estado: 'backlog' },
              )
          } else {
            // Las tareas ya hechas de una US pendiente pasan de sprint sin perder su estado.
            const sinHacer = quedan.filter((h) => h.estado !== 'hecho').map((h) => h.id)
            const hechas = quedan.filter((h) => h.estado === 'hecho').map((h) => h.id)
            if (sinHacer.length)
              await repo.actualizarHistorias(sinHacer, {
                sprint_id: destinoPendientes,
                estado: 'por_hacer',
              })
            if (hechas.length)
              await repo.actualizarHistorias(hechas, { sprint_id: destinoPendientes })
          }
          await repo.actualizarSprint(id, {
            estado: 'cerrado',
            cerrado_en: new Date().toISOString(),
          })
        }),
      crearEpica: (e) => ejecutar(() => repo.crearEpica(e)),
      actualizarEpica: (id, patch) => ejecutar(() => repo.actualizarEpica(id, patch)),
      eliminarEpica: (id) => ejecutar(() => repo.eliminarEpica(id)),
      importarSemilla: () => ejecutar(() => repo.importarSemilla()),
    }),
    [historias, sprints, epicas, trazas, cargando, error, aviso, ejecutar],
  )

  return <DatosContexto.Provider value={valor}>{children}</DatosContexto.Provider>
}
