import backlog from '../data/backlog.json'
import type { NuevaEpica, NuevaHistoria, NuevoSprint, Prioridad, Version } from './tipos'

interface FilaBacklog {
  codigo: string
  version: string
  historia: string
  descripcion: string
  valor: number
  esfuerzo: number
  prioridad: string
  criterios: string[]
  notas: string
  orden: number
}

/** Entregables del Sprint 0 (las páginas del archivo de Figma). */
const TAREAS_SPRINT_0: { codigo: string; descripcion: string; historia: string }[] = [
  {
    codigo: 'S0-01',
    descripcion: 'Design System',
    historia: 'Tokens de color, tipografía, espaciado y radios del sistema de diseño centralBV.',
  },
  {
    codigo: 'S0-02',
    descripcion: 'Componentes',
    historia: 'Componentes base de la interfaz (botones, formularios, badges, navegación).',
  },
  {
    codigo: 'S0-03',
    descripcion: 'Flujos',
    historia: 'Flujos de usuario de las funcionalidades del MVP.',
  },
  {
    codigo: 'S0-04',
    descripcion: 'DER',
    historia: 'Diagrama entidad-relación de la base de datos.',
  },
  {
    codigo: 'S0-05',
    descripcion: 'Presentación',
    historia: 'Presentación de cierre del Sprint 0.',
  },
]

/** Épica transversal: se trabaja en todos los sprints. */
export function epicaDocumentacion(): NuevaEpica {
  return {
    nombre: 'Documentación',
    descripcion: 'Documentación del proyecto. Se trabaja en cada sprint.',
    tono: 'info',
    transversal: true,
  }
}

export function sprint0(): NuevoSprint {
  return {
    nombre: 'Sprint 0',
    objetivo: 'Definir diseño, flujos y modelo de datos antes de empezar a desarrollar.',
    fecha_inicio: null,
    fecha_fin: null,
    estado: 'activo',
  }
}

export function tareasSprint0(): Omit<NuevaHistoria, 'sprint_id'>[] {
  return TAREAS_SPRINT_0.map((t, i) => ({
    codigo: t.codigo,
    tipo: 'tarea',
    version: 'MVP',
    historia: t.historia,
    descripcion: t.descripcion,
    valor: null,
    esfuerzo: null,
    prioridad: 'Alta',
    criterios: [],
    notas: '',
    estado: 'hecho',
    epica_id: null,
    responsable: '',
    orden: i,
  }))
}

export function historiasIniciales(): NuevaHistoria[] {
  return (backlog as FilaBacklog[]).map((f) => ({
    codigo: f.codigo,
    tipo: 'historia',
    version: f.version as Version,
    historia: f.historia,
    descripcion: f.descripcion,
    valor: f.valor,
    esfuerzo: f.esfuerzo,
    prioridad: f.prioridad as Prioridad,
    criterios: f.criterios,
    notas: f.notas,
    estado: 'backlog',
    sprint_id: null,
    epica_id: null,
    responsable: '',
    orden: 100 + f.orden,
  }))
}
