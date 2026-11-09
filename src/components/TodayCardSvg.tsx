import { useMemo, type RefObject } from 'react'
import type { Plan } from '../types'
import { PALETTE } from '../lib/constants'
import {
  dayOfYear,
  formatDateNumeric,
  formatRangeShort,
  formatWeekday,
  yearOf,
  yearProgressRatio,
  yearRemainingDays,
} from '../lib/dates'
import { getTodayPlans, getYearSegments, softRemaining } from '../lib/plans'
import { getUrgencyColor } from '../lib/urgency'
import {
  buildPlanRingArcs,
  fractionToAngle,
  getMonthTicks,
  pointOnCircle,
  todayFraction,
} from '../lib/ring'

interface TodayCardSvgProps {
  plans: Plan[]
  today: string
  svgRef?: RefObject<SVGSVGElement | null>
}

const DISPLAY_FONT = "'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', STSong, serif"
const BODY_FONT =
  "'HarmonyOS Sans SC', 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif"
const CARD_BG = '#f5f0e5'
const CARD_INK = PALETTE.ink
const CARD_SOFT = PALETTE.inkSoft
const CARD_FAINT = PALETTE.inkFaint
const CARD_LINE = 'rgba(40, 37, 31, 0.12)'
const CARD_RED = PALETTE.red

const RING_CENTER = 540
const RING_Y = 850
const MONTH_NAMES = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]
const MINI_INNER = 92
const MINI_OUTER = 190

function truncate(value: string, max: number): string {
  const chars = Array.from(value)
  if (chars.length <= max) return value
  return `${chars.slice(0, max).join('')}…`
}

export function TodayCardSvg({ plans, today, svgRef }: TodayCardSvgProps) {
  const year = yearOf(today)
  const segments = useMemo(
    () => getYearSegments(plans.filter((plan) => plan.status === 'active'), year),
    [plans, year],
  )
  const arcs = useMemo(
    () =>
      buildPlanRingArcs(segments, today, MINI_INNER, MINI_OUTER).map((arc) => ({
        ...arc,
        strokeWidth: Math.max(
          arc.isDone ? 2.2 : 3.5,
          Math.min(11, arc.strokeWidth * 1.1),
        ),
      })),
    [segments, today],
  )
  const todayPlans = useMemo(() => getTodayPlans(plans, today, 3), [plans, today])
  const progress = yearProgressRatio(today)
  const remainDays = yearRemainingDays(today)
  const monthTicks = getMonthTicks(year)
  const todayAngle = fractionToAngle(todayFraction(today, year))
  const todayPoint = pointOnCircle(RING_CENTER, RING_Y, 190, todayAngle)
  const activeCount = segments.filter((segment) => segment.plan.status === 'active').length
  const monthName = MONTH_NAMES[Number(today.slice(5, 7)) - 1] ?? ''
  const rows = Array.from({ length: 3 }, (_, index) => todayPlans[index] ?? null)

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1080 1920"
      role="img"
      aria-label={`${formatDateNumeric(today)} 的今日一页`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <defs>
        <radialGradient id="today-card-bg" cx="50%" cy="18%" r="100%">
          <stop offset="0%" stopColor="#fbf7ed" />
          <stop offset="58%" stopColor={CARD_BG} />
          <stop offset="100%" stopColor="#ede4d4" />
        </radialGradient>
        <linearGradient id="today-card-rule" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={CARD_RED} stopOpacity="0.9" />
          <stop offset="100%" stopColor={CARD_RED} stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#today-card-bg)" />
      <rect
        x="54"
        y="54"
        width="972"
        height="1812"
        rx="3"
        fill="none"
        stroke="rgba(40,37,31,0.11)"
        strokeWidth="1.2"
      />

      <g transform="translate(92 92)">
        <path
          d="M0 23a23 23 0 0 1 46 0"
          fill="none"
          stroke={CARD_INK}
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M8 23a15 15 0 0 1 30 0"
          fill="none"
          stroke={CARD_INK}
          strokeWidth="2.7"
          strokeLinecap="round"
          opacity="0.68"
        />
        <path
          d="M16 23a7 7 0 0 1 14 0"
          fill="none"
          stroke={CARD_INK}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle cx="50" cy="25" r="4" fill={CARD_RED} />
      </g>
      <text
        x="158"
        y="126"
        fontFamily={DISPLAY_FONT}
        fontSize="36"
        fill={CARD_INK}
        letterSpacing="0.04em"
      >
        结绳
      </text>
      <text
        x="160"
        y="151"
        fontFamily={BODY_FONT}
        fontSize="12"
        fill={CARD_FAINT}
        letterSpacing="0.24em"
      >
        KNOT
      </text>

      <text
        x="988"
        y="116"
        textAnchor="end"
        fontFamily={BODY_FONT}
        fontSize="20"
        fill={CARD_SOFT}
        letterSpacing="0.12em"
      >
        今日一页
      </text>
      <text
        x="988"
        y="148"
        textAnchor="end"
        fontFamily={BODY_FONT}
        fontSize="15"
        fill={CARD_FAINT}
        letterSpacing="0.08em"
      >
        第 {dayOfYear(today)} 天
      </text>

      <line x1="92" y1="194" x2="988" y2="194" stroke={CARD_LINE} strokeWidth="1.2" />

      <text
        x="92"
        y="378"
        fontFamily={DISPLAY_FONT}
        fontSize="142"
        fill={CARD_INK}
        letterSpacing="-0.015em"
      >
        {today.slice(5, 10).replace('-', '.')}
      </text>
      <text
        x="988"
        y="306"
        textAnchor="end"
        fontFamily={DISPLAY_FONT}
        fontSize="34"
        fill={CARD_SOFT}
        letterSpacing="0.06em"
      >
        {year}
      </text>
      <text
        x="988"
        y="356"
        textAnchor="end"
        fontFamily={BODY_FONT}
        fontSize="28"
        fill={CARD_SOFT}
        letterSpacing="0.08em"
      >
        {formatWeekday(today)}
      </text>
      <text
        x="988"
        y="398"
        textAnchor="end"
        fontFamily={BODY_FONT}
        fontSize="18"
        fill={CARD_FAINT}
        letterSpacing="0.08em"
      >
        {monthName}
      </text>

      <text
        x="92"
        y="486"
        fontFamily={BODY_FONT}
        fontSize="21"
        fill={CARD_SOFT}
        letterSpacing="0.06em"
      >
        今年已过 {Math.round(progress * 100)}%
      </text>
      <text
        x="988"
        y="486"
        textAnchor="end"
        fontFamily={BODY_FONT}
        fontSize="21"
        fill={CARD_SOFT}
        letterSpacing="0.04em"
      >
        还剩 {remainDays} 天
      </text>
      <line
        x1="92"
        y1="516"
        x2="988"
        y2="516"
        stroke="rgba(40,37,31,0.13)"
        strokeWidth="1.4"
      />
      <line
        x1="92"
        y1="516"
        x2={92 + 896 * progress}
        y2="516"
        stroke={CARD_RED}
        strokeWidth="2.6"
        opacity="0.66"
      />
      <circle cx={92 + 896 * progress} cy="516" r="4.4" fill={CARD_RED} />

      <text
        x="92"
        y="586"
        fontFamily={BODY_FONT}
        fontSize="16"
        fill={CARD_FAINT}
        letterSpacing="0.16em"
      >
        年度年轮 · {year}
      </text>

      {monthTicks.map((tick) => {
        const angle = fractionToAngle(tick.fraction)
        const start = pointOnCircle(RING_CENTER, RING_Y, 194, angle)
        const end = pointOnCircle(RING_CENTER, RING_Y, tick.month % 3 === 1 ? 202 : 199, angle)
        return (
          <line
            key={`mini-tick-${tick.month}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={CARD_INK}
            strokeWidth={tick.month % 3 === 1 ? 1.5 : 0.9}
            opacity={tick.month % 3 === 1 ? 0.24 : 0.13}
          />
        )
      })}

      {monthTicks.map((tick) => {
        const angle = fractionToAngle(tick.fraction + 0.5 / 12)
        const point = pointOnCircle(RING_CENTER, RING_Y, 218, angle)
        return (
          <text
            key={`mini-month-${tick.month}`}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily={BODY_FONT}
            fontSize="13"
            fill={CARD_FAINT}
            opacity="0.9"
          >
            {tick.label}
          </text>
        )
      })}

      {arcs.map((arc, index) => {
        const dash = Math.max(0, arc.endFraction - arc.startFraction) * 100
        const angle = fractionToAngle(arc.startFraction)
        const midAngle = fractionToAngle((arc.startFraction + arc.endFraction) / 2)
        const dotPoint = pointOnCircle(RING_CENTER, RING_Y, arc.radius, midAngle)
        const knotAngle =
          arc.completedFraction !== null ? fractionToAngle(arc.completedFraction) : null
        const knotPoint =
          knotAngle !== null
            ? pointOnCircle(RING_CENTER, RING_Y, arc.radius, knotAngle)
            : null
        const isTiny = dash < 0.8
        return (
          <g key={`mini-arc-${arc.planId}`}>
            {isTiny ? (
              <circle
                cx={dotPoint.x}
                cy={dotPoint.y}
                r={arc.strokeWidth * 0.62}
                fill={arc.color}
                opacity={arc.opacity}
              />
            ) : (
              <circle
                cx={RING_CENTER}
                cy={RING_Y}
                r={arc.radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={arc.strokeWidth}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${dash} ${Math.max(0, 100 - dash)}`}
                transform={`rotate(${angle} ${RING_CENTER} ${RING_Y})`}
                opacity={arc.opacity}
                style={{ animationDelay: `${index * 30}ms` }}
              />
            )}
            {knotPoint && (
              <>
                <circle
                  cx={knotPoint.x}
                  cy={knotPoint.y}
                  r={arc.strokeWidth + 3.5}
                  fill={CARD_BG}
                />
                <circle cx={knotPoint.x} cy={knotPoint.y} r="3.3" fill={CARD_RED} />
              </>
            )}
          </g>
        )
      })}

      <line
        x1={pointOnCircle(RING_CENTER, RING_Y, 76, todayAngle).x}
        y1={pointOnCircle(RING_CENTER, RING_Y, 76, todayAngle).y}
        x2={pointOnCircle(RING_CENTER, RING_Y, 192, todayAngle).x}
        y2={pointOnCircle(RING_CENTER, RING_Y, 192, todayAngle).y}
        stroke={CARD_RED}
        strokeWidth="2"
        opacity="0.55"
      />
      <circle cx={todayPoint.x} cy={todayPoint.y} r="7.5" fill={CARD_BG} />
      <circle cx={todayPoint.x} cy={todayPoint.y} r="4.4" fill={CARD_RED} />

      <circle
        cx={RING_CENTER}
        cy={RING_Y}
        r="76"
        fill={CARD_BG}
        stroke="rgba(40,37,31,0.1)"
        strokeWidth="1.2"
      />
      <text
        x={RING_CENTER}
        y={RING_Y - 8}
        textAnchor="middle"
        fontFamily={DISPLAY_FONT}
        fontSize="44"
        fill={CARD_INK}
        letterSpacing="0.02em"
      >
        {year}
      </text>
      <text
        x={RING_CENTER}
        y={RING_Y + 22}
        textAnchor="middle"
        fontFamily={BODY_FONT}
        fontSize="12"
        fill={CARD_FAINT}
        letterSpacing="0.28em"
      >
        年 轮
      </text>
      <text
        x={RING_CENTER}
        y={RING_Y + 47}
        textAnchor="middle"
        fontFamily={BODY_FONT}
        fontSize="13"
        fill={CARD_SOFT}
      >
        {activeCount} 条在路上
      </text>

      <g>
        <text
          x="92"
          y="1208"
          fontFamily={DISPLAY_FONT}
          fontSize="34"
          fill={CARD_INK}
          letterSpacing="0.06em"
        >
          正在路上
        </text>
        <text
          x="988"
          y="1204"
          textAnchor="end"
          fontFamily={BODY_FONT}
          fontSize="16"
          fill={CARD_FAINT}
          letterSpacing="0.1em"
        >
          {String(todayPlans.length).padStart(2, '0')} /{' '}
          {String(activeCount).padStart(2, '0')}
        </text>
        <line x1="92" y1="1236" x2="988" y2="1236" stroke={CARD_LINE} strokeWidth="1.2" />
      </g>

      {rows.map((plan, index) => {
        const rowY = 1308 + index * 112
        return (
          <g key={`mini-plan-row-${index}`}>
            <text
              x="92"
              y={rowY}
              fontFamily={BODY_FONT}
              fontSize="16"
              fill={plan ? CARD_RED : 'rgba(167,157,140,0.65)'}
              letterSpacing="0.12em"
            >
              {String(index + 1).padStart(2, '0')}
            </text>
            <rect
              x="140"
              y={rowY - 30}
              width="3.5"
              height="42"
              rx="1.75"
              fill={plan ? getUrgencyColor(plan, today) : 'rgba(167,157,140,0.25)'}
            />
            <text
              x="164"
              y={rowY}
              fontFamily={DISPLAY_FONT}
              fontSize="32"
              fill={plan ? CARD_INK : 'rgba(116,109,96,0.55)'}
              letterSpacing="0.01em"
            >
              {plan ? truncate(plan.title, 17) : '留白'}
            </text>
            {plan ? (
              <>
                <text
                  x="988"
                  y={rowY}
                  textAnchor="end"
                  fontFamily={BODY_FONT}
                  fontSize="19"
                  fill={CARD_SOFT}
                  letterSpacing="0.02em"
                >
                  {softRemaining(plan, today)}
                </text>
                <text
                  x="164"
                  y={rowY + 30}
                  fontFamily={BODY_FONT}
                  fontSize="14"
                  fill={CARD_FAINT}
                  letterSpacing="0.02em"
                >
                  {formatRangeShort(plan.startDate, plan.endDate)}
                </text>
              </>
            ) : (
              <text
                x="164"
                y={rowY + 30}
                fontFamily={BODY_FONT}
                fontSize="14"
                fill="rgba(167,157,140,0.7)"
                letterSpacing="0.04em"
              >
                这段时间还没有规划
              </text>
            )}
            <line
              x1="92"
              y1={rowY + 50}
              x2="988"
              y2={rowY + 50}
              stroke={CARD_LINE}
              strokeWidth="1"
            />
          </g>
        )
      })}

      <line x1="92" y1="1704" x2="254" y2="1704" stroke={CARD_RED} strokeWidth="2" opacity="0.7" />
      <circle cx="258" cy="1704" r="3.4" fill={CARD_RED} />
      <text
        x="92"
        y="1774"
        fontFamily={DISPLAY_FONT}
        fontSize="33"
        fill={CARD_INK}
        letterSpacing="0.08em"
      >
        把远方拆成今天
      </text>
      <text
        x="988"
        y="1772"
        textAnchor="end"
        fontFamily={BODY_FONT}
        fontSize="14"
        fill={CARD_FAINT}
        letterSpacing="0.12em"
      >
        KNOT · {formatDateNumeric(today)}
      </text>

      <text
        x="92"
        y="1814"
        fontFamily={BODY_FONT}
        fontSize="12"
        fill="rgba(167,157,140,0.72)"
        letterSpacing="0.18em"
      >
        今天，是年轮上的一根红线
      </text>
      <text
        x="988"
        y="1814"
        textAnchor="end"
        fontFamily={BODY_FONT}
        fontSize="12"
        fill="rgba(167,157,140,0.72)"
        letterSpacing="0.18em"
      >
        第 {dayOfYear(today)} 天 · {yearRemainingDays(today)} 天
      </text>
    </svg>
  )
}
