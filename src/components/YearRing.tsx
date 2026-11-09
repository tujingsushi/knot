import type { Idea } from '../types'
import type { YearSegment } from '../lib/plans'
import { PALETTE } from '../lib/constants'
import { URGENCY_LEGEND, URGENCY_META } from '../lib/urgency'
import {
  buildPlanRingArcs,
  fractionToAngle,
  getDayFractionInYear,
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
}

const CENTER = 180
const BODY_FONT =
  "'HarmonyOS Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif"
const DISPLAY_FONT =
  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Songti SC', 'Noto Serif CJK SC', STSong, SimSun, serif"

export function YearRing({ segments, ideas, year, currentYear, today, onSelectPlan }: YearRingProps) {
  const arcs = buildPlanRingArcs(segments, today, 70, 158)
  const monthTicks = getMonthTicks(year)
  const isCurrentYear = year === currentYear
  const currentMonth = isCurrentYear ? Number(today.slice(5, 7)) : null
  const todayAngle = fractionToAngle(todayFraction(today, year))
  const todayPoint = pointOnCircle(CENTER, CENTER, 160, todayAngle)
  const activeCount = segments.filter((segment) => segment.plan.status === 'active').length
  const doneCount = segments.filter((segment) => segment.plan.status === 'done').length
  const yearIdeas = ideas
    .filter((idea) => Number(idea.date.slice(0, 4)) === year)
    .sort((a, b) => a.date.localeCompare(b.date))
  const ideaMarks = yearIdeas.map((idea, index) => {
    const sameDate = yearIdeas.filter((item) => item.date === idea.date)
    const position = sameDate.findIndex((item) => item.id === idea.id)
    const offset = (position - (sameDate.length - 1) / 2) * 1.35
    const radius = 60 + (index % 2) * 4
    const point = pointOnCircle(
      CENTER,
      CENTER,
      radius,
      fractionToAngle(getDayFractionInYear(idea.date, year)) + offset,
    )
    return { idea, x: point.x, y: point.y }
  })

  return (
    <div className={`ring-block${segments.length === 0 && ideas.length === 0 ? ' is-empty' : ''}`}>
      <div className="ring-stage">
        <svg
          className="year-ring"
          viewBox="0 0 360 360"
          role="img"
          aria-label={`${year} 年年轮，${activeCount} 条在路上的规划，${doneCount} 条已完成，${yearIdeas.length} 个想法`}
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

          {monthTicks.map((tick) => {
            const angle = fractionToAngle(tick.fraction + 0.5 / 12)
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

          {ideaMarks.map((mark, index) => (
            <g
              className="ring-idea"
              key={mark.idea.id}
              style={{ animationDelay: `${380 + index * 45}ms` }}
              pointerEvents="none"
            >
              <circle cx={mark.x} cy={mark.y} r="5.4" fill={PALETTE.paper} opacity="0.92" />
              <path
                d={`M ${mark.x} ${mark.y - 4.1} L ${mark.x + 1.15} ${mark.y - 1.15} L ${mark.x + 4.1} ${mark.y} L ${mark.x + 1.15} ${mark.y + 1.15} L ${mark.x} ${mark.y + 4.1} L ${mark.x - 1.15} ${mark.y + 1.15} L ${mark.x - 4.1} ${mark.y} L ${mark.x - 1.15} ${mark.y - 1.15} Z`}
                fill={PALETTE.idea}
              />
              <title>{`想法：${mark.idea.title}`}</title>
            </g>
          ))}

          <circle
            cx={CENTER}
            cy={CENTER}
            r="53"
            fill={PALETTE.paper}
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

          {segments.length === 0 && yearIdeas.length === 0 ? (
            <>
              <text
                x={CENTER}
                y={CENTER - 2}
                textAnchor="middle"
                fill={PALETTE.inkSoft}
                fontSize="12"
                fontFamily={DISPLAY_FONT}
                letterSpacing="0.24em"
              >
                空白
              </text>
              <text
                x={CENTER}
                y={CENTER + 17}
                textAnchor="middle"
                fill={PALETTE.inkFaint}
                fontSize="12"
                fontFamily={BODY_FONT}
                letterSpacing="0.12em"
              >
                暂无在路上的规划
              </text>
            </>
          ) : (
            <>
              <text
                x={CENTER}
                y={CENTER - 5}
                textAnchor="middle"
                fill={PALETTE.ink}
                fontSize="25"
                fontFamily={DISPLAY_FONT}
                letterSpacing="0.04em"
              >
                {year}
              </text>
              <text
                x={CENTER}
                y={CENTER + 13}
                textAnchor="middle"
                fill={PALETTE.inkFaint}
                fontSize="12"
                fontFamily={BODY_FONT}
                letterSpacing="0.28em"
              >
                年 轮
              </text>
              <text
                x={CENTER}
                y={CENTER + 30}
                textAnchor="middle"
                fill={PALETTE.inkSoft}
                fontSize="12"
                fontFamily={BODY_FONT}
              >
                {activeCount > 0
                  ? `${activeCount} 条在路上`
                  : doneCount > 0
                    ? `${doneCount} 条已完成`
                    : `${yearIdeas.length} 个想法`}
              </text>
              {activeCount > 0 && doneCount > 0 && (
                <text
                  x={CENTER}
                  y={CENTER + 44}
                  textAnchor="middle"
                  fill={PALETTE.inkFaint}
                  fontSize="12"
                  fontFamily={BODY_FONT}
                >
                  {doneCount} 条已完成
                </text>
              )}
            </>
          )}
        </svg>
      </div>

      <div className="urgency-legend" aria-label="年轮图例">
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
        {yearIdeas.length > 0 && (
          <span className="urgency-legend-item">
            <i className="ring-idea-legend" aria-hidden="true" />
            想法
          </span>
        )}
      </div>
    </div>
  )
}
