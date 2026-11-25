import { LogoMark, SlidersIcon } from './Icons'

interface AppHeaderProps {
  onHome: () => void
  onOpenSettings: () => void
}

export function AppHeader({ onHome, onOpenSettings }: AppHeaderProps) {
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={onHome} aria-label="回到规划页">
        <LogoMark size={31} />
        <span className="brand-name">结绳</span>
        <span className="brand-sub">KNOT</span>
      </button>
      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={onOpenSettings}
          aria-label="打开设置"
          title="设置"
        >
          <SlidersIcon size={21} />
        </button>
      </div>
    </header>
  )
}
