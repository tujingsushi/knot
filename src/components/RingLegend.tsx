import { URGENCY_LEGEND, URGENCY_META } from '../lib/urgency'

interface RingLegendProps {
  doneCount: number
  ideaCount: number
  doneIdeaCount?: number
}

export function RingLegend({
  doneCount,
  ideaCount,
  doneIdeaCount = 0,
}: RingLegendProps) {
  return (
    <div className="urgency-legend" aria-label="时间图例">
      {URGENCY_LEGEND.map((tone) => (
        <span className="urgency-legend-item" key={tone}>
          <i
            className="urgency-legend-dot"
            style={{ backgroundColor: URGENCY_META[tone].color }}
            aria-hidden="true"
          />
          {URGENCY_META[tone].label}
        </span>
      ))}
      {doneCount > 0 && (
        <span className="urgency-legend-item">
          <i
            className="urgency-legend-dot"
            style={{ backgroundColor: URGENCY_META.done.color }}
            aria-hidden="true"
          />
          已完成
        </span>
      )}
      {ideaCount > 0 && (
        <span className="urgency-legend-item">
          <i className="ring-idea-legend" aria-hidden="true" />
          想法
        </span>
      )}
      {doneIdeaCount > 0 && (
        <span className="urgency-legend-item">
          <i className="ring-idea-legend is-done" aria-hidden="true" />
          已实现想法
        </span>
      )}
    </div>
  )
}
