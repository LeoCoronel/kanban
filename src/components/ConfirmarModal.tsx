import { Boton } from './ui/Boton'
import { Modal } from './ui/Modal'

interface Props {
  titulo: string
  mensaje: string
  etiqueta: string
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmarModal({ titulo, mensaje, etiqueta, onConfirmar, onCancelar }: Props) {
  return (
    <Modal
      titulo={titulo}
      onCerrar={onCancelar}
      pie={
        <>
          <Boton onClick={onCancelar}>Cancelar</Boton>
          <Boton variante="peligro" onClick={onConfirmar}>
            {etiqueta}
          </Boton>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{mensaje}</p>
    </Modal>
  )
}
