import { createContext } from 'react'
import type { Estado, Historia, NuevaHistoria, NuevoSprint, Sprint } from './tipos'

export interface Destino {
  sprint_id: string | null
  estado: Estado
}

export interface Datos {
  modo: 'supabase' | 'local'
  historias: Historia[]
  sprints: Sprint[]
  sprintActivo: Sprint | undefined
  cargando: boolean
  error: string | null
  limpiarError: () => void
  crearHistoria: (h: NuevaHistoria) => Promise<boolean>
  actualizarHistoria: (id: string, patch: Partial<NuevaHistoria>) => Promise<boolean>
  moverHistoria: (id: string, destino: Destino) => Promise<void>
  eliminarHistoria: (id: string) => Promise<boolean>
  crearSprint: (s: NuevoSprint) => Promise<boolean>
  actualizarSprint: (id: string, patch: Partial<Sprint>) => Promise<boolean>
  iniciarSprint: (id: string) => Promise<boolean>
  /** Cierra el sprint; las tarjetas sin terminar vuelven al backlog o pasan al sprint indicado. */
  cerrarSprint: (id: string, destinoPendientes: 'backlog' | string) => Promise<boolean>
  importarSemilla: () => Promise<boolean>
}

export const DatosContexto = createContext<Datos | null>(null)
