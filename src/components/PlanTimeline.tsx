import type { Plan } from '../types'
import {
  addMonths,
  clamp,
  diffDays,
  formatMonthLabel,
  formatRangeShort,
  startOfMonth,
} from '../lib/dates'
import { exactRemaining, getCheckInStats, getPlanTiming } from '../lib/plans'
import { datePercent, isPlanInRange, type RangeBounds } from '../lib/range'
import { getUrgencyColor } from '../lib/urgency'
import { CheckIcon, KnotIcon } from './Icons'

interface PlanTimelineProps {
  plans: Plan[]
  today: string
  bounds: RangeBounds
  onSelectPlan: (id: string) => void
}

interface MonthTick {
  iso: string
  label: string
  percent: number
}

function buildMonthTicks(start: string, end: string): MonthTick[] {
  const ticks: MonthTick[] = []
  let cursor = startOfMonth(start)
  let guard = 0
  while (cursor <= end && guard < 240) {
    if (cursor >= start) {
      ticks.push({
        iso: cursor,
        label: formatMonthLabel(cursor),
        percent: datePercent(cursor, { start, end }),
      })
    }
    cursor = addMonths(cursor, 1)
    guard += 1
  }
  return ticks
}

export function PlanTimeline({ plans, today, bounds, onSelectPlan }: PlanTimelineProps) {
  const totalDays = Math.max(1, diffDays(bounds.start, bounds.end) + 1)
  const todayPercent = ((diffDays(bounds.start, today) + 0.5) / totalDays) * 100
  const visiblePlans = plans
    .filter((plan) => isPlanInRange(plan, bounds))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const monthTicks = buildMonthTicks(bounds.start, bounds.end)
  const labelStep =
    monthTicks.length <= 9 ? 1 : monthTicks.length <= 18 ? 2 : monthTicks.length <= 36 ? 3 : 6

  return (
    <div className="time-chart" aria-label="规划时间轴">
      <div className="time-axis" aria-hidden="true">
        {todayPercent >= 0 && todayPercent <= 100 && (
          <span
            className="time-today-tag"
            style={{
              left: `${todayPercent}%`,
              transform:
                todayPercent < 7
                  ? 'translateX(0)'
                  : todayPercent > 93
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)',
            }}
          >
            今天
          </span>
        )}
        {monthTicks.map((tick, index) => {
          if (index % labelStep !== 0) return null
          const transform =
            tick.percent < 2
              ? 'translateX(0)'
              : tick.percent > 98
                ? 'translateX(-100%)'
                : 'translateX(-50%)'
          return (
            <span
              key={tick.iso}
              className="time-month-label"
              style={{ left: `${tick.percent}%`, transform }}
            >
              {tick.label}
            </span>
          )
        })}
      </div>

      <div className="plan-timeline">
        <div className="time-grid" aria-hidden="true">
          {monthTicks.map((tick) => (
            <span
              key={`grid-${tick.iso}`}
              className="time-grid-line"
              style={{ left: `${tick.percent}%` }}
            />
          ))}
        </div>

        {visiblePlans.map((plan) => {
          const timing = getPlanTiming(plan, today)
          const visibleStart = plan.startDate < bounds.start ? bounds.start : plan.startDate
          const visibleEnd = plan.endDate > bounds.end ? bounds.end : plan.endDate
          const rawLeft = (diffDays(bounds.start, visibleStart) / totalDays) * 100
          const rawWidth = ((diffDays(visibleStart, visibleEnd) + 1) / totalDays) * 100
          const width = clamp(rawWidth, 1.3, 100)
          const left = clamp(rawLeft, 0, 100 - width)
          const completionDate = plan.completedAt ?? plan.endDate
          const knotPercent = clamp(
            (diffDays(bounds.start, completionDate) / totalDays) * 100,
            0,
            100,
          )
          const clippedStart = plan.startDate < bounds.start
          const clippedEnd = plan.endDate > bounds.end
          const isDone = plan.status === 'done'
          const isArchived = plan.status === 'archived'
          const urgencyColor = getUrgencyColor(plan, today)
          const subgoalDone = plan.subgoals.filter((subgoal) => subgoal.done).length
          const shownSubgoals = plan.subgoals.slice(0, 3)
          const checkInStats = plan.checkInEnabled
            ? getCheckInStats(plan, today)
            : null
          return (
            <button
              key={plan.id}
              type="button"
              className={`band-row phase-${timing.phase}${isDone ? ' is-done' : ''}${isArchived ? ' is-archived' : ''}`}
              onClick={() => onSelectPlan(plan.id)}
              aria-label={`${plan.title}，${formatRangeShort(plan.startDate, plan.endDate)}，${exactRemaining(plan, today)}`}
            >
              <span className="band-row-head">
                <span className="band-title">{plan.title}</span>
                <span className="band-remaining">
                  {isDone && <KnotIcon size={12} />}
                  {exactRemaining(plan, today)}
                </span>
              </span>
              {plan.subgoals.length > 0 && (
                <span className="band-subgoals">
                  <span className="band-subgoals-head">
                    子目标 {subgoalDone}/{plan.subgoals.length}
                  </span>
                  {shownSubgoals.map((subgoal) => (
                    <span
                      key={subgoal.id}
                      className={`band-subgoal${subgoal.done ? ' is-done' : ''}`}
                    >
                      <span className="band-subgoal-mark" aria-hidden="true">
                        {subgoal.done && <CheckIcon size={9} />}
                      </span>
                      <span className="band-subgoal-title">{subgoal.title}</span>
                    </span>
                  ))}
                  {plan.subgoals.length > shownSubgoals.length && (
                    <span className="band-subgoal-more">
                      +{plan.subgoals.length - shownSubgoals.length}
                    </span>
                  )}
                </span>
              )}
              {checkInStats && (
                <span
                  className={`band-checkin${checkInStats.checkedToday ? ' is-today' : ''}`}
                >
                  <CheckIcon size={11} />
                  打卡 {checkInStats.total} 天
                  {checkInStats.checkedToday ? ' · 今天已打' : ''}
                </span>
              )}
              <span className="band-track" aria-hidden="true">
                <span
                  className={`band-bar${clippedStart ? ' clip-start' : ''}${clippedEnd ? ' clip-end' : ''}`}
                  style={{ left: `${left}%`, width: `${width}%`, backgroundColor: urgencyColor }}
                >
                  <span className="band-bar-cap" />
                </span>
                {isDone && (
                  <span className="band-knot" style={{ left: `${knotPercent}%` }}>
                    <span />
                  </span>
                )}
                {!isDone && !isArchived && timing.phase === 'overdue' && (
                  <span
                    className="band-overdue-mark"
                    style={{ left: `${Math.min(width + left, 99.3)}%` }}
                  />
                )}
                {todayPercent >= 0 && todayPercent <= 100 && (
                  <span
                    className="band-today"
                    style={{ left: `${todayPercent}%` }}
                    aria-hidden="true"
                  >
                    <span className="band-today-dot" />
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {visiblePlans.length === 0 && (
        <p className="time-empty-note">这个时间段里没有规划，换一个范围看看。</p>
      )}
    </div>
  )
}
