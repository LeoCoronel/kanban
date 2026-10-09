export type Version = 'MVP' | 'Release 2' | 'Futuro' | 'Fuera de alcance'
export type Prioridad = 'Alta' | 'Media' | 'Baja'
export type Estado = 'backlog' | 'por_hacer' | 'en_progreso' | 'en_revision' | 'hecho'
export type EstadoSprint = 'planificado' | 'activo' | 'cerrado'
export type TipoTarjeta = 'historia' | 'tarea'

export interface Historia {
  id: string
  codigo: string
  tipo: TipoTarjeta
  version: Version
  historia: string
  descripcion: string
  valor: number | null
  esfuerzo: number | null
  prioridad: Prioridad
  criterios: string[]
  notas: string
  estado: Estado
  sprint_id: string | null
  responsable: string
  orden: number
  created_at: string
  updated_at: string
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

export type NuevaHistoria = Omit<Historia, 'id' | 'created_at' | 'updated_at'>
export type NuevoSprint = Omit<Sprint, 'id' | 'created_at' | 'cerrado_en'>

export interface Repo {
  modo: 'supabase' | 'local'
  listar(): Promise<{ historias: Historia[]; sprints: Sprint[] }>
  crearHistoria(h: NuevaHistoria): Promise<void>
  actualizarHistorias(ids: string[], patch: Partial<NuevaHistoria>): Promise<void>
  eliminarHistoria(id: string): Promise<void>
  crearSprint(s: NuevoSprint): Promise<void>
  actualizarSprint(id: string, patch: Partial<Sprint>): Promise<void>
  importarSemilla(): Promise<void>
  suscribir(alCambiar: () => void): () => void
}
