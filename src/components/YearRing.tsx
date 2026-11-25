import type { Idea } from '../types'
import type { YearSegment } from '../lib/plans'
import { PALETTE } from '../lib/constants'
import {
  buildPlanRingArcs,
  fractionToAngle,
  getMonthTicks,
  pointOnCircle,
  todayFraction,
} from '../lib/ring'

interface YearRingProps {
  segments: YearSegment[]
  ideas: Idea[]
  year: number
  currentYear: number
  today: string
  onSelectPlan: (id: string) => void
  onSelectIdea: (idea: Idea) => void
}

const CENTER = 180
const IDEA_RADIUS = 61
const BODY_FONT =
  "'HarmonyOS Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif"
const DISPLAY_FONT =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Songti SC', 'Noto Serif CJK SC', STSong, SimSun, serif"

export function YearRing({
  segments,
  ideas,
  year,
  currentYear,
  today,
  onSelectPlan,
  onSelectIdea,
}: YearRingProps) {
  const arcs = buildPlanRingArcs(segments, today, 70, 158)
  const monthTicks = getMonthTicks(year)
  const isCurrentYear = year === currentYear
  const currentMonth = isCurrentYear ? Number(today.slice(5, 7)) : null
  const todayAngle = fractionToAngle(todayFraction(today, year))
  const todayPoint = pointOnCircle(CENTER, CENTER, 160, todayAngle)
  const activeCount = segments.filter((segment) => segment.plan.status === 'active').length
  const doneCount = segments.filter((segment) => segment.plan.status === 'done').length
  const yearIdeas = ideas
    .filter(
      (idea) =>
        Number(idea.date.slice(0, 4)) === year && idea.status !== 'archived',
    )
    .sort((a, b) => a.date.localeCompare(b.date))
  const activeIdeaCount = yearIdeas.filter((idea) => idea.status === 'active').length
  const doneIdeaCount = yearIdeas.filter((idea) => idea.status === 'done').length
  const ideaGroups: Array<{
    key: string
    label: string
    ideas: Idea[]
    x: number
    y: number
    hasActive: boolean
    hasDone: boolean
    first: Idea
  }> = []

  const ideasByMonth = new Map<number, Idea[]>()
  for (const idea of yearIdeas) {
    const month = Number(idea.date.slice(5, 7))
    const current = ideasByMonth.get(month) ?? []
    current.push(idea)
    ideasByMonth.set(month, current)
  }
  for (const [month, groupIdeas] of [...ideasByMonth.entries()].sort(
    ([a], [b]) => a - b,
  )) {
    const start = monthTicks[month - 1]?.fraction ?? 0
    const end = monthTicks[month]?.fraction ?? 1
    const point = pointOnCircle(
      CENTER,
      CENTER,
      IDEA_RADIUS,
      fractionToAngle((start + end) / 2),
    )
    ideaGroups.push({
      key: `idea-month-${month}`,
      label: `${month} 月`,
      ideas: groupIdeas,
      x: point.x,
      y: point.y,
      hasActive: groupIdeas.some((idea) => idea.status === 'active'),
      hasDone: groupIdeas.some((idea) => idea.status === 'done'),
      first: groupIdeas[0],
    })
  }

  return (
    <div className={`ring-block${segments.length === 0 && yearIdeas.length === 0 ? ' is-empty' : ''}`}>
      <div className="ring-stage">
        <svg
          className="year-ring"
          viewBox="0 0 360 360"
          role="img"
          aria-label={`${year} 年年轮，${activeCount} 条在路上的规划，${doneCount} 条已完成，${activeIdeaCount} 个进行中的想法，${doneIdeaCount} 个已实现的想法`}
        >
          <circle cx={CENTER} cy={CENTER} r={180} fill="transparent" />

          <circle
            cx={CENTER}
            cy={CENTER}
            r="158"
            fill="none"
            stroke={PALETTE.ink}
            strokeWidth="0.6"
            opacity="0.08"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r="114"
            fill="none"
            stroke={PALETTE.ink}
            strokeWidth="0.6"
            opacity="0.05"
            strokeDasharray="1 5"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r="61"
            fill="none"
            stroke={PALETTE.idea}
            strokeWidth="0.7"
            opacity="0.16"
            strokeDasharray="1 5"
          />

          {monthTicks.map((tick) => {
            const angle = fractionToAngle(tick.fraction)
            const start = pointOnCircle(CENTER, CENTER, 156, angle)
            const end = pointOnCircle(CENTER, CENTER, tick.month % 3 === 1 ? 163 : 160, angle)
            return (
              <line
                key={`tick-${tick.month}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={PALETTE.ink}
                strokeWidth={tick.month % 3 === 1 ? 0.9 : 0.55}
                opacity={tick.month % 3 === 1 ? 0.28 : 0.16}
              />
            )
          })}

          {monthTicks.map((tick, index) => {
            const next = monthTicks[index + 1]?.fraction ?? 1
            const angle = fractionToAngle((tick.fraction + next) / 2)
            const point = pointOnCircle(CENTER, CENTER, 173, angle)
            const isCurrent = currentMonth === tick.month
            return (
              <text
                key={`label-${tick.month}`}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isCurrent ? PALETTE.red : PALETTE.inkFaint}
                fontSize="12"
                fontFamily={BODY_FONT}
                letterSpacing="0.04em"
                opacity={isCurrent ? 0.95 : 0.8}
              >
                {tick.label}
              </text>
            )
          })}

          {arcs.map((arc, index) => {
            const angle = fractionToAngle(arc.startFraction)
            const dash = Math.max(arc.endFraction - arc.startFraction, 0) * 100
            const isTiny = dash < 0.85
            const midAngle = fractionToAngle((arc.startFraction + arc.endFraction) / 2)
            const dotPoint = pointOnCircle(CENTER, CENTER, arc.radius, midAngle)
            const knotAngle =
              arc.completedFraction !== null ? fractionToAngle(arc.completedFraction) : null
            const knotPoint =
              knotAngle !== null
                ? pointOnCircle(CENTER, CENTER, arc.radius, knotAngle)
                : null
            return (
              <g key={arc.planId}>
                {isTiny ? (
                  <circle
                    className="ring-arc"
                    cx={dotPoint.x}
                    cy={dotPoint.y}
                    r={arc.strokeWidth * 0.62}
                    fill={arc.color}
                    opacity={arc.opacity}
                    style={{ animationDelay: `${index * 35}ms` }}
                  />
                ) : (
                  <circle
                    className="ring-arc"
                    cx={CENTER}
                    cy={CENTER}
                    r={arc.radius}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={arc.strokeWidth}
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray={`${dash} ${Math.max(0, 100 - dash)}`}
                    transform={`rotate(${angle} ${CENTER} ${CENTER})`}
                    style={{
                      ['--arc-opacity' as string]: arc.opacity,
                      animationDelay: `${index * 35}ms`,
                    }}
                  />
                )}

                {knotPoint && (
                  <g className="ring-knot" style={{ animationDelay: `${320 + index * 35}ms` }}>
                    <circle
                      cx={knotPoint.x}
                      cy={knotPoint.y}
                      r={arc.strokeWidth + 2.2}
                      fill={PALETTE.paper}
                    />
                    <circle
                      cx={knotPoint.x}
                      cy={knotPoint.y}
                      r={2.2}
                      fill={PALETTE.red}
                    />
                  </g>
                )}

                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={arc.radius}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(arc.strokeWidth + 11, 15)}
                  pathLength={100}
                  strokeDasharray={`${dash} ${Math.max(0, 100 - dash)}`}
                  transform={`rotate(${angle} ${CENTER} ${CENTER})`}
                  pointerEvents="stroke"
                  className="ring-hit"
                  onClick={() => onSelectPlan(arc.planId)}
                >
                  <title>{arc.title}</title>
                </circle>
              </g>
            )
          })}

          {isCurrentYear && (
            <g className="ring-today">
              <line
                x1={pointOnCircle(CENTER, CENTER, 54, todayAngle).x}
                y1={pointOnCircle(CENTER, CENTER, 54, todayAngle).y}
                x2={pointOnCircle(CENTER, CENTER, 154, todayAngle).x}
                y2={pointOnCircle(CENTER, CENTER, 154, todayAngle).y}
                stroke={PALETTE.red}
                strokeWidth="1.15"
                strokeLinecap="round"
                opacity="0.58"
              />
              <circle cx={todayPoint.x} cy={todayPoint.y} r="5.2" fill={PALETTE.paper} />
              <circle cx={todayPoint.x} cy={todayPoint.y} r="2.7" fill={PALETTE.red} />
            </g>
          )}

          {ideaGroups.map((mark, index) => {
            const count = mark.ideas.length
            const titles = mark.ideas.map((idea) => idea.title).join('、')
            const isDoneOnly = !mark.hasActive && mark.hasDone
            return (
              <g
                className={`ring-idea${isDoneOnly ? ' is-done' : ''}`}
                key={mark.key}
                style={{ animationDelay: `${380 + index * 45}ms` }}
                role="button"
                tabIndex={0}
                aria-label={`${mark.label}，${count} 个${isDoneOnly ? '已实现' : ''}想法：${titles}`}
                onClick={() => onSelectIdea(mark.first)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectIdea(mark.first)
                  }
                }}
              >
                <circle cx={mark.x} cy={mark.y} r="5.4" fill={PALETTE.paper} opacity="0.94" />
                {isDoneOnly ? (
                  <>
                    <circle
                      cx={mark.x}
                      cy={mark.y}
                      r="3"
                      fill={PALETTE.paper}
                      stroke={PALETTE.idea}
                      strokeWidth="1.4"
                    />
                    <path
                      d={`M ${mark.x - 1.3} ${mark.y} L ${mark.x - 0.2} ${mark.y + 1.1} L ${mark.x + 1.45} ${mark.y - 1.35}`}
                      fill="none"
                      stroke={PALETTE.idea}
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : (
                  <circle cx={mark.x} cy={mark.y} r="2.7" fill={PALETTE.idea} />
                )}
                {count > 1 && (
                  <text
                    x={mark.x + 8}
                    y={mark.y - 7}
                    fill={PALETTE.inkFaint}
                    fontSize="12"
                    fontFamily={BODY_FONT}
                    paintOrder="stroke"
                    stroke={PALETTE.paper}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  >
                    {count}
                  </text>
                )}
                <title>
                  {`${mark.label} · ${count} 个${isDoneOnly ? '已实现' : ''}想法：${titles}`}
                </title>
              </g>
            )
          })}

          <circle
            className="ring-center-disc"
            cx={CENTER}
            cy={CENTER}
            r="53"
            fill="var(--paper)"
            stroke="rgba(40,37,31,0.10)"
            strokeWidth="0.8"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r="48"
            fill="none"
            stroke="rgba(40,37,31,0.055)"
            strokeWidth="0.7"
            strokeDasharray="1 3"
          />

          <text
            x={CENTER}
            y={CENTER + 9}
            textAnchor="middle"
            fill={PALETTE.ink}
            fontSize="28"
            fontFamily={DISPLAY_FONT}
            letterSpacing="0.04em"
          >
            {year}
          </text>
        </svg>
      </div>
    </div>
  )
}
