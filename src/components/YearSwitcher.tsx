import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

interface YearSwitcherProps {
  year: number
  currentYear: number
  onChange: (year: number) => void
}

export function YearSwitcher({ year, currentYear, onChange }: YearSwitcherProps) {
  return (
    <div className="year-switcher" aria-label="切换年份">
      <button
        type="button"
        className="year-arrow"
        onClick={() => onChange(year - 1)}
        aria-label="上一年"
      >
        <ChevronLeftIcon size={17} />
      </button>
      <button
        type="button"
        className="year-value"
        onClick={() => onChange(currentYear)}
        aria-label={`当前选择 ${year} 年，点击回到今年`}
      >
        {year}
      </button>
      <button
        type="button"
        className="year-arrow"
        onClick={() => onChange(year + 1)}
        aria-label="下一年"
      >
        <ChevronRightIcon size={17} />
      </button>
    </div>
  )
}
