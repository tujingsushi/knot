import { useEffect, useState } from 'react'
import { todayISO } from '../lib/dates'

export function useToday(): string {
  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    const update = () => {
      const next = todayISO()
      setToday((current) => (current === next ? current : next))
    }
    const timer = window.setInterval(update, 60_000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') update()
    }
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return today
}
