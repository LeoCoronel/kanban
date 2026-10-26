import { PESO_PRIORIDAD } from './constantes'
import type { Criterio, Epica, Historia, Sprint, SprintHistoria } from './tipos'

/** Qué pasó con una tarjeta en un sprint. `sin_detalle`: sprint cerrado antes de existir la trazabilidad. */
export type PasoSprint =
  'hecha' | 'arrastrada' | 'devuelta' | 'en_curso' | 'planificada' | 'sin_detalle'

/** Paso de la tarjeta en el sprint, o null si no estuvo en él. */
export function pasoEnSprint(h: Historia, s: Sprint, trazas: SprintHistoria[]): PasoSprint | null {
  const t = trazas.find((x) => x.sprint_id === s.id && x.historia_id === h.id)
  if (t) return t.resultado
  if (h.sprint_id !== s.id) return null
  if (s.estado === 'activo') return 'en_curso'
  if (s.estado === 'planificado') return 'planificada'
  return 'sin_detalle'
}

/** Sprints por los que pasó la tarjeta, en orden cronológico. */
export function recorrido(
  h: Historia,
  sprints: Sprint[],
  trazas: SprintHistoria[],
): { sprint: Sprint; paso: PasoSprint }[] {
  return [...sprints]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .flatMap((sprint) => {
      const paso = pasoEnSprint(h, sprint, trazas)
      return paso ? [{ sprint, paso }] : []
    })
}

/** Título corto de la tarjeta: la descripción, o la acción ("quiero ...") de la historia. */
export function titulo(h: Pick<Historia, 'descripcion' | 'historia'>): string {
  if (h.descripcion.trim()) return h.descripcion.trim()
  const m = h.historia.match(/quiero\s+(.+?)(?:,?\s+para\s|$)/i)
  const t = (m?.[1] ?? h.historia).trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function siguienteCodigo(historias: Historia[]): string {
  const nums = historias
    .filter((h) => h.tipo === 'historia')
    .map((h) => Number(h.codigo.match(/^US(\d+)$/i)?.[1]))
    .filter((n) => Number.isFinite(n))
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return `US${String(n).padStart(2, '0')}`
}

export function siguienteNombreSprint(sprints: Sprint[]): string {
  const nums = sprints
    .map((s) => Number(s.nombre.match(/(\d+)\s*$/)?.[1]))
    .filter((n) => Number.isFinite(n))
  return `Sprint ${nums.length ? Math.max(...nums) + 1 : 1}`
}

export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

export function porPrioridadYOrden(a: Historia, b: Historia): number {
  return PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] || a.orden - b.orden
}

/** El esfuerzo se estima en la user story: las tareas no suman. */
export function sumaEsfuerzo(hs: Historia[]): number {
  return hs.filter((h) => h.tipo === 'historia').reduce((acc, h) => acc + (h.esfuerzo ?? 0), 0)
}

/** Tareas hijas de una user story. */
export function tareasDe(us: Pick<Historia, 'id'>, historias: Historia[]): Historia[] {
  return historias.filter((h) => h.historia_padre_id === us.id)
}

/** User story a la que pertenece una tarea (undefined si no tiene). */
export function padreDe(h: Historia, historias: Historia[]): Historia | undefined {
  return h.historia_padre_id ? historias.find((x) => x.id === h.historia_padre_id) : undefined
}

/** Próximo código libre de tarea: T34, T35... */
export function siguienteCodigoTarea(historias: Historia[]): string {
  const nums = historias
    .map((h) => Number(h.codigo.match(/^T(\d+)$/i)?.[1]))
    .filter((n) => Number.isFinite(n))
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return `T${String(n).padStart(2, '0')}`
}

/** Acepta el formato viejo (lista de textos) y el nuevo (checklist). */
export function normalizarCriterios(c: unknown): Criterio[] {
  if (!Array.isArray(c)) return []
  return c.flatMap((x): Criterio[] => {
    if (typeof x === 'string') return x.trim() ? [{ texto: x, hecho: false }] : []
    if (x && typeof x === 'object' && typeof (x as Criterio).texto === 'string')
      return [{ texto: (x as Criterio).texto, hecho: Boolean((x as Criterio).hecho) }]
    return []
  })
}

/** Lo que le falta a una user story para estar terminada (para avisar al pasarla a Hecho). */
export function pendientesDe(us: Historia, historias: Historia[]) {
  return {
    tareas: tareasDe(us, historias).filter((t) => t.estado !== 'hecho').length,
    criterios: us.criterios.filter((c) => !c.hecho).length,
  }
}

export function textoPendientes(codigo: string, p: { tareas: number; criterios: number }) {
  const partes = [
    p.tareas && `${p.tareas} ${p.tareas === 1 ? 'tarea sin terminar' : 'tareas sin terminar'}`,
    p.criterios &&
      `${p.criterios} ${p.criterios === 1 ? 'criterio sin tildar' : 'criterios sin tildar'}`,
  ].filter(Boolean)
  return partes.length ? `${codigo} pasó a Hecho con ${partes.join(' y ')}.` : ''
}

export function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export interface Filtros {
  texto: string
  version: string
  prioridad: string
  responsable: string
  epica: string
}
export const FILTROS_VACIOS: Filtros = {
  texto: '',
  version: '',
  prioridad: '',
  responsable: '',
  epica: '',
}

/** Valor del filtro de épica para tarjetas sin épica. */
export const SIN_EPICA = '__sin_epica'

export function filtrar(hs: Historia[], f: Filtros): Historia[] {
  const q = f.texto.trim().toLowerCase()
  const codigoPadre = (h: Historia) =>
    h.historia_padre_id ? (hs.find((x) => x.id === h.historia_padre_id)?.codigo ?? '') : ''
  return hs.filter((h) => {
    if (f.version && h.version !== f.version) return false
    if (f.prioridad && h.prioridad !== f.prioridad) return false
    if (f.responsable && h.responsable !== f.responsable) return false
    if (f.epica === SIN_EPICA ? h.epica_id !== null : f.epica && h.epica_id !== f.epica)
      return false
    if (!q) return true
    // Buscar "US01" también encuentra sus tareas.
    return `${h.codigo} ${codigoPadre(h)} ${titulo(h)} ${h.historia} ${h.notas}`
      .toLowerCase()
      .includes(q)
  })
}

export function rangoFechas(s: Pick<Sprint, 'fecha_inicio' | 'fecha_fin'>): string {
  if (!s.fecha_inicio && !s.fecha_fin) return ''
  return `${fechaCorta(s.fecha_inicio)} → ${fechaCorta(s.fecha_fin)}`
}

/** Prefijo de código para tarjetas de una épica: "Documentación" → "DOC". */
export function prefijoEpica(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
  return limpio.slice(0, 3) || 'EPI'
}

/** Genera n códigos libres con el formato DOC-01, DOC-02... */
export function codigosEpica(epica: Epica, historias: Historia[], n: number): string[] {
  const prefijo = prefijoEpica(epica.nombre)
  const usados = new Set(historias.map((h) => h.codigo))
  const codigos: string[] = []
  let i = 1
  while (codigos.length < n) {
    const c = `${prefijo}-${String(i).padStart(2, '0')}`
    if (!usados.has(c)) codigos.push(c)
    i++
  }
  return codigos
}
