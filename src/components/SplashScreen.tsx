import { useEffect, useState } from 'react'
import { LogoMark } from './Icons'

const QUOTES = [
  '不能听命于自己者，就要受命于他人。',
  '每一个不曾起舞的日子，都是对生命的辜负。',
  '对未来真正的慷慨，是把一切献给现在。',
  '对待生命你不妨大胆冒险一点，因为好歹你要失去它。',
]

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [quote] = useState(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
  )
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), 2600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(onDone, 420)
    return () => window.clearTimeout(timer)
  }, [leaving, onDone])

  return (
    <div
      className={`splash-screen${leaving ? ' is-leaving' : ''}`}
      onClick={() => setLeaving(true)}
      role="status"
      aria-label="结绳开屏"
    >
      <div className="splash-inner">
        <span className="splash-mark">
          <LogoMark size={52} />
        </span>
        <p className="splash-brand">结绳</p>
        <p className="splash-sub">KNOT</p>
        <span className="splash-rule" aria-hidden="true" />
        <blockquote className="splash-quote">「{quote}」</blockquote>
      </div>
      <p className="splash-foot">把远方拆成今天</p>
    </div>
  )
}
