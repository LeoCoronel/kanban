import { PESO_PRIORIDAD } from './constantes'
import type { Historia, Sprint } from './tipos'

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

export function sumaEsfuerzo(hs: Historia[]): number {
  return hs.reduce((acc, h) => acc + (h.esfuerzo ?? 0), 0)
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
}
export const FILTROS_VACIOS: Filtros = { texto: '', version: '', prioridad: '', responsable: '' }

export function filtrar(hs: Historia[], f: Filtros): Historia[] {
  const q = f.texto.trim().toLowerCase()
  return hs.filter((h) => {
    if (f.version && h.version !== f.version) return false
    if (f.prioridad && h.prioridad !== f.prioridad) return false
    if (f.responsable && h.responsable !== f.responsable) return false
    if (!q) return true
    return `${h.codigo} ${titulo(h)} ${h.historia} ${h.notas}`.toLowerCase().includes(q)
  })
}

export function rangoFechas(s: Pick<Sprint, 'fecha_inicio' | 'fecha_fin'>): string {
  if (!s.fecha_inicio && !s.fecha_fin) return ''
  return `${fechaCorta(s.fecha_inicio)} → ${fechaCorta(s.fecha_fin)}`
}
