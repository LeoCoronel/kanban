import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronsUp,
  Clock,
  Lock,
  Minus,
  Rocket,
  Target,
} from 'lucide-react'
import type { EstadoSprint, Prioridad, Version } from '@/lib/tipos'
import { Insignia } from './ui/Insignia'

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
