import type { Estado, Prioridad, TonoEpica, Version } from './tipos'

export const VERSIONES: Version[] = ['MVP', 'Release 2', 'Futuro', 'Fuera de alcance']
export const PRIORIDADES: Prioridad[] = ['Alta', 'Media', 'Baja']
export const PESO_PRIORIDAD: Record<Prioridad, number> = { Alta: 0, Media: 1, Baja: 2 }

export const ESTADOS: Record<Estado, string> = {
  backlog: 'Backlog',
  por_hacer: 'Por hacer',
  en_progreso: 'En progreso',
  en_revision: 'En revisión',
  hecho: 'Hecho',
}

/** Columnas del sprint activo, en orden. */
export const ESTADOS_SPRINT: Exclude<Estado, 'backlog'>[] = [
  'por_hacer',
  'en_progreso',
  'en_revision',
  'hecho',
]

export const TONOS_EPICA: { valor: TonoEpica; nombre: string }[] = [
  { valor: 'acento', nombre: 'Rojo' },
  { valor: 'info', nombre: 'Azul' },
  { valor: 'ok', nombre: 'Verde' },
  { valor: 'warn', nombre: 'Amarillo' },
  { valor: 'neutro', nombre: 'Gris' },
]

/** Escala de esfuerzo: Fibonacci (story points). */
export const ESCALA_ESFUERZO = [1, 2, 3, 5, 8] as const
