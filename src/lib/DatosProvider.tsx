import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DatosContexto, type Datos, type Destino } from './datosContext'
import { repo } from './repo'
import type { Epica, Historia, Sprint } from './tipos'

const mensaje = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado.')

export function DatosProvider({ children }: { children: ReactNode }) {
  const [historias, setHistorias] = useState<Historia[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [epicas, setEpicas] = useState<Epica[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      const d = await repo.listar()
      setHistorias(d.historias)
      setSprints(d.sprints)
      setEpicas(d.epicas)
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
      sprintActivo: sprints.find((s) => s.estado === 'activo'),
      cargando,
      error,
      limpiarError: () => setError(null),
      crearHistoria: (h) => ejecutar(() => repo.crearHistorias([h])),
      crearHistorias: (hs) => ejecutar(() => repo.crearHistorias(hs)),
      actualizarHistoria: (id, patch) => ejecutar(() => repo.actualizarHistorias([id], patch)),
      moverHistoria: async (id: string, destino: Destino) => {
        // Actualización optimista: la tarjeta se mueve ya, y se revierte sola si falla.
        setHistorias((hs) => hs.map((h) => (h.id === id ? { ...h, ...destino } : h)))
        await ejecutar(() => repo.actualizarHistorias([id], destino))
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
          const pendientes = historias
            .filter((h) => h.sprint_id === id && h.estado !== 'hecho')
            .map((h) => h.id)
          if (pendientes.length) {
            await repo.actualizarHistorias(
              pendientes,
              destinoPendientes === 'backlog'
                ? { sprint_id: null, estado: 'backlog' }
                : { sprint_id: destinoPendientes, estado: 'por_hacer' },
            )
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
    [historias, sprints, epicas, cargando, error, ejecutar],
  )

  return <DatosContexto.Provider value={valor}>{children}</DatosContexto.Provider>
}
