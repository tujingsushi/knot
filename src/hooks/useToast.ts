import { useCallback, useEffect, useRef, useState } from 'react'

export interface ToastMessage {
  id: number
  text: string
  tone: 'ink' | 'paper' | 'red'
}

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const timerRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const dismiss = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
    setToast(null)
  }, [])

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'ink') => {
    idRef.current += 1
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setToast({ id: idRef.current, text, tone })
    timerRef.current = window.setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, 2800)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  return { toast, showToast, dismiss }
}
