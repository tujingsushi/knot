import { Modal } from './Modal'
import { XIcon } from './Icons'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} label={title} className="confirm-dialog">
      <div className="confirm-head">
        <h2>{title}</h2>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="关闭">
          <XIcon size={19} />
        </button>
      </div>
      <p>{description}</p>
      <div className="confirm-actions">
        <button type="button" className="button button-quiet" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`button ${danger ? 'button-danger' : 'button-ink'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
