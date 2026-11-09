import { useEffect, useRef, type ReactNode } from 'react'

let bodyLockCount = 0

function lockBody() {
  bodyLockCount += 1
  if (bodyLockCount === 1) document.body.classList.add('modal-open')
}

function unlockBody() {
  bodyLockCount = Math.max(0, bodyLockCount - 1)
  if (bodyLockCount === 0) document.body.classList.remove('modal-open')
}

interface ModalProps {
  open: boolean
  onClose: () => void
  label: string
  className?: string
  closeOnBackdrop?: boolean
  children: ReactNode
}

export function Modal({
  open,
  onClose,
  label,
  className = '',
  closeOnBackdrop = true,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    lockBody()
    return () => unlockBody()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className}`.trim()}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom

        if (!closeOnBackdrop) {
          if (outside) {
            const active = document.activeElement
            if (
              active instanceof HTMLInputElement ||
              active instanceof HTMLTextAreaElement
            ) {
              active.blur()
            }
          }
          return
        }

        if (outside) onClose()
      }}
    >
      {children}
    </dialog>
  )
}
