import {
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronsUp,
  Clock,
  Layers,
  Lock,
  Minus,
  Play,
  Rocket,
  Target,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import type { Epica, EstadoSprint, Prioridad, Version } from '@/lib/tipos'
import type { PasoSprint } from '@/lib/util'
import { Insignia, type Tono } from './ui/Insignia'

export function InsigniaPrioridad({ prioridad }: { prioridad: Prioridad }) {
  if (prioridad === 'Alta')
    return (
      <Insignia tono="danger" icono={ChevronsUp}>
        Alta
      </Insignia>
    )
  if (prioridad === 'Media')
    return (
      <Insignia tono="warn" icono={Minus}>
        Media
      </Insignia>
    )
  return (
    <Insignia tono="info" icono={ChevronDown}>
      Baja
    </Insignia>
  )
}

export function InsigniaVersion({ version }: { version: Version }) {
  if (version === 'MVP')
    return (
      <Insignia tono="acento" icono={Target}>
        MVP
      </Insignia>
    )
  if (version === 'Release 2')
    return (
      <Insignia tono="info" icono={Rocket}>
        Release 2
      </Insignia>
    )
  if (version === 'Futuro')
    return (
      <Insignia tono="neutro" icono={Clock}>
        Futuro
      </Insignia>
    )
  return (
    <Insignia tono="neutro" icono={Ban}>
      Fuera de alcance
    </Insignia>
  )
}

export function InsigniaSprint({ estado }: { estado: EstadoSprint }) {
  if (estado === 'activo')
    return (
      <Insignia tono="ok" icono={CheckCircle2}>
        Activo
      </Insignia>
    )
  if (estado === 'cerrado')
    return (
      <Insignia tono="neutro" icono={Lock}>
        Cerrado
      </Insignia>
    )
  return (
    <Insignia tono="info" icono={Clock}>
      Planificado
    </Insignia>
  )
}

const PASOS: Record<PasoSprint, { tono: Tono; icono: LucideIcon; texto: string }> = {
  hecha: { tono: 'ok', icono: CheckCircle2, texto: 'Hecha' },
  arrastrada: { tono: 'warn', icono: ArrowRight, texto: 'Arrastrada' },
  devuelta: { tono: 'danger', icono: Undo2, texto: 'Al backlog' },
  en_curso: { tono: 'acento', icono: Play, texto: 'En curso' },
  planificada: { tono: 'info', icono: Clock, texto: 'Planificada' },
  sin_detalle: { tono: 'neutro', icono: Minus, texto: 'Sin detalle' },
}

export function InsigniaPaso({ paso }: { paso: PasoSprint }) {
  const { tono, icono, texto } = PASOS[paso]
  return (
    <Insignia tono={tono} icono={icono}>
      {texto}
    </Insignia>
  )
}

export function InsigniaEpica({ epica }: { epica: Pick<Epica, 'nombre' | 'tono'> }) {
  return (
    <Insignia tono={epica.tono} icono={Layers}>
      {epica.nombre}
    </Insignia>
  )
}
