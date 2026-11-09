import { LeafIcon } from './Icons'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? ' is-compact' : ''}`}>
      {!compact && (
        <div className="empty-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
        </div>
      )}
      <div className="empty-copy">
        <p className="empty-kicker">
          <LeafIcon size={15} />
          留白
        </p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {(actionLabel || secondaryLabel) && (
        <div className="empty-actions">
          {actionLabel && onAction && (
            <button type="button" className="button button-ink" onClick={onAction}>
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button type="button" className="button button-quiet" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
