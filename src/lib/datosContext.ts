import { createContext } from 'react'
import type {
  Epica,
  Estado,
  Historia,
  NuevaEpica,
  NuevaHistoria,
  NuevoSprint,
  Sprint,
  SprintHistoria,
} from './tipos'

export interface Destino {
  sprint_id: string | null
  estado: Estado
}

export interface Datos {
  modo: 'supabase' | 'local'
  historias: Historia[]
  sprints: Sprint[]
  epicas: Epica[]
  /** Foto de cada tarjeta al cerrar un sprint. */
  trazas: SprintHistoria[]
  sprintActivo: Sprint | undefined
  cargando: boolean
  error: string | null
  limpiarError: () => void
  /** Advertencia que no bloquea (ej.: US pasada a Hecho con tareas pendientes). */
  aviso: string | null
  limpiarAviso: () => void
  crearHistoria: (h: NuevaHistoria) => Promise<boolean>
  crearHistorias: (hs: NuevaHistoria[]) => Promise<boolean>
  /** Si es una user story, sus tareas heredan versión, prioridad y sprint. */
  actualizarHistoria: (id: string, patch: Partial<NuevaHistoria>) => Promise<boolean>
  /** Una US arrastra sus tareas; una tarea no puede salir del sprint de su US. */
  moverHistoria: (id: string, destino: Destino) => Promise<void>
  eliminarHistoria: (id: string) => Promise<boolean>
  crearSprint: (s: NuevoSprint) => Promise<boolean>
  actualizarSprint: (id: string, patch: Partial<Sprint>) => Promise<boolean>
  iniciarSprint: (id: string) => Promise<boolean>
  /** Cierra el sprint; las tarjetas sin terminar vuelven al backlog o pasan al sprint indicado. */
  cerrarSprint: (id: string, destinoPendientes: 'backlog' | string) => Promise<boolean>
  crearEpica: (e: NuevaEpica) => Promise<boolean>
  actualizarEpica: (id: string, patch: Partial<NuevaEpica>) => Promise<boolean>
  eliminarEpica: (id: string) => Promise<boolean>
  importarSemilla: () => Promise<boolean>
}

export const DatosContexto = createContext<Datos | null>(null)
