import { ArrowUpRightIcon } from './Icons'

interface SectionHeadingProps {
  index: string
  title: string
  count?: number
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeading({
  index,
  title,
  count,
  actionLabel,
  onAction,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div className="section-heading-main">
        <span className="section-index">{index}</span>
        <h2>{title}</h2>
        {typeof count === 'number' && <span className="section-count">{count}</span>}
      </div>
      {actionLabel && onAction && (
        <button type="button" className="text-action" onClick={onAction}>
          {actionLabel}
          <ArrowUpRightIcon size={14} />
        </button>
      )}
    </div>
  )
}
