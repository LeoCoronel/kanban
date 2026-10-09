import { useContext } from 'react'
import { DatosContexto } from './datosContext'

export function useDatos() {
  const d = useContext(DatosContexto)
  if (!d) throw new Error('useDatos debe usarse dentro de <DatosProvider>')
  return d
}
