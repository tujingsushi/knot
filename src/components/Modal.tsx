import { useEffect, useRef, type ReactNode } from 'react'
import { getKeyboardHeight } from '../lib/keyboardInset'

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
    const dialog = dialogRef.current
    if (!dialog) return
    const viewport = window.visualViewport
    const baselineHeight = window.innerHeight
    let frame = 0
    let keyboardOpen = false
    let scrollTimer = 0
    let nativeKeyboardHeight = getKeyboardHeight()

    const scrollFocusedIntoView = () => {
      const focused = document.activeElement
      if (!(focused instanceof HTMLElement) || !dialog.contains(focused)) return
      if (
        focused instanceof HTMLInputElement ||
        focused instanceof HTMLTextAreaElement ||
        focused instanceof HTMLSelectElement
      ) {
        focused.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }

    const updateKeyboardInset = () => {
      frame = 0
      const layoutHeight = window.innerHeight
      const visualHeight = viewport?.height ?? layoutHeight
      const offsetTop = viewport?.offsetTop ?? 0
      const visualInset = Math.max(0, Math.round(layoutHeight - visualHeight - offsetTop))
      const layoutResized = layoutHeight < baselineHeight - 80
      const nativeInset = layoutResized ? 0 : nativeKeyboardHeight
      const inset = Math.max(visualInset, nativeInset)
      const active = inset > 80
      dialog.style.setProperty('--keyboard-inset', `${active ? inset : 0}px`)
      dialog.classList.toggle('keyboard-open', active)

      if (active && !keyboardOpen) {
        const focused = document.activeElement
        if (focused instanceof HTMLElement && dialog.contains(focused)) {
          window.setTimeout(() => {
            if (dialog.open) {
              focused.scrollIntoView({ block: 'center', behavior: 'smooth' })
            }
          }, 180)
        }
      }
      keyboardOpen = active
    }

    const scheduleUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateKeyboardInset)
    }

    const onViewportResize = () => {
      scheduleUpdate()
      if (scrollTimer) window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(scrollFocusedIntoView, 220)
    }

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (scrollTimer) window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(scrollFocusedIntoView, 240)
    }

    const onKeyboardEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ height?: number }>).detail
      nativeKeyboardHeight = Math.max(
        0,
        detail?.height ?? getKeyboardHeight(),
      )
      onViewportResize()
    }

    updateKeyboardInset()
    viewport?.addEventListener('resize', onViewportResize)
    viewport?.addEventListener('scroll', scheduleUpdate)
    window.addEventListener('resize', onViewportResize)
    window.addEventListener('knot:keyboard', onKeyboardEvent)
    dialog.addEventListener('focusin', onFocusIn)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      if (scrollTimer) window.clearTimeout(scrollTimer)
      viewport?.removeEventListener('resize', onViewportResize)
      viewport?.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', onViewportResize)
      window.removeEventListener('knot:keyboard', onKeyboardEvent)
      dialog.removeEventListener('focusin', onFocusIn)
      dialog.style.removeProperty('--keyboard-inset')
      dialog.classList.remove('keyboard-open')
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
