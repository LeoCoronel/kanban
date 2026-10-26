export type Version = 'MVP' | 'Release 2' | 'Futuro' | 'Fuera de alcance'
export type Prioridad = 'Alta' | 'Media' | 'Baja'
export type Estado = 'backlog' | 'por_hacer' | 'en_progreso' | 'en_revision' | 'hecho'
export type EstadoSprint = 'planificado' | 'activo' | 'cerrado'
export type TipoTarjeta = 'historia' | 'tarea'
export type TonoEpica = 'acento' | 'ok' | 'warn' | 'info' | 'neutro'

/** Un criterio de aceptación de la user story, tildable. */
export interface Criterio {
  texto: string
  hecho: boolean
}

export interface Historia {
  id: string
  codigo: string
  tipo: TipoTarjeta
  version: Version
  historia: string
  descripcion: string
  /** Solo user stories: las tareas no llevan valor de negocio. */
  valor: number | null
  /** Solo user stories: el esfuerzo se estima en la historia, no en sus tareas. */
  esfuerzo: number | null
  prioridad: Prioridad
  criterios: Criterio[]
  notas: string
  estado: Estado
  sprint_id: string | null
  epica_id: string | null
  /** Solo tareas: la user story a la que pertenecen. */
  historia_padre_id: string | null
  responsable: string
  orden: number
  created_at: string
  updated_at: string
}

/** Agrupa tarjetas de un mismo tema. Una épica transversal se trabaja en todos los sprints. */
export interface Epica {
  id: string
  nombre: string
  descripcion: string
  tono: TonoEpica
  transversal: boolean
  created_at: string
}

export interface Sprint {
  id: string
  nombre: string
  objetivo: string
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: EstadoSprint
  cerrado_en: string | null
  created_at: string
}

/** Cómo salió una tarjeta de un sprint al cerrarlo. */
export type ResultadoSprint = 'hecha' | 'arrastrada' | 'devuelta'

/** Foto de una tarjeta al cerrar un sprint: sirve para reconstruir por qué sprints pasó. */
export interface SprintHistoria {
  id: string
  sprint_id: string
  historia_id: string | null
  codigo: string
  estado_final: Estado
  resultado: ResultadoSprint
  destino_sprint_id: string | null
  created_at: string
}

export type NuevaHistoria = Omit<Historia, 'id' | 'created_at' | 'updated_at'>
export type NuevaSprintHistoria = Omit<SprintHistoria, 'id' | 'created_at'>
export type NuevoSprint = Omit<Sprint, 'id' | 'created_at' | 'cerrado_en'>
export type NuevaEpica = Omit<Epica, 'id' | 'created_at'>

export interface Repo {
  modo: 'supabase' | 'local'
  listar(): Promise<{
    historias: Historia[]
    sprints: Sprint[]
    epicas: Epica[]
    trazas: SprintHistoria[]
  }>
  registrarTrazas(trazas: NuevaSprintHistoria[]): Promise<void>
  crearHistorias(hs: NuevaHistoria[]): Promise<void>
  actualizarHistorias(ids: string[], patch: Partial<NuevaHistoria>): Promise<void>
  eliminarHistoria(id: string): Promise<void>
  crearSprint(s: NuevoSprint): Promise<void>
  actualizarSprint(id: string, patch: Partial<Sprint>): Promise<void>
  crearEpica(e: NuevaEpica): Promise<void>
  actualizarEpica(id: string, patch: Partial<NuevaEpica>): Promise<void>
  eliminarEpica(id: string): Promise<void>
  importarSemilla(): Promise<void>
  suscribir(alCambiar: () => void): () => void
}
