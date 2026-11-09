import type { ToastMessage } from '../hooks/useToast'

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null
  return (
    <div
      key={toast.id}
      className={`toast toast-${toast.tone}`}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <span className="toast-mark" aria-hidden="true" />
      <span>{toast.text}</span>
    </div>
  )
}
