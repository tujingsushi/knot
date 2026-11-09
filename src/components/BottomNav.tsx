import type { TabKey } from '../types'
import { BandsIcon, PlusIcon, SparkIcon } from './Icons'

interface BottomNavProps {
  activeTab: TabKey
  onChange: (tab: TabKey) => void
  onCreate: () => void
}

const items: Array<{ key: TabKey; label: string; icon: typeof BandsIcon }> = [
  { key: 'plans', label: '规划', icon: BandsIcon },
  { key: 'ideas', label: '想法', icon: SparkIcon },
]

export function BottomNav({ activeTab, onChange, onCreate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主要导航">
      <div className="bottom-nav-inner">
        {items.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              type="button"
              className={`nav-item${active ? ' is-active' : ''}`}
              onClick={() => onChange(key)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="nav-icon">
                <Icon size={23} />
                {active && <span className="nav-dot" aria-hidden="true" />}
              </span>
              <span className="nav-label">{label}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="nav-add"
          onClick={onCreate}
          aria-label="新建"
        >
          <span className="nav-add-icon">
            <PlusIcon size={19} />
          </span>
          <span className="nav-label">新建</span>
        </button>
      </div>
    </nav>
  )
}
