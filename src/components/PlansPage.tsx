import { useMemo, useState } from 'react'
import type { Idea, Plan, RangeKey, StatusFilter } from '../types'
import { FILTER_META, RANGE_META } from '../lib/constants'
import { formatMonthDay, formatRangeMonths, formatWeekday, yearOf } from '../lib/dates'
import {
  filterPlansByStatus,
  getCheckInStats,
  getYearSegments,
} from '../lib/plans'
import { getRangeBounds } from '../lib/range'
import { CheckIcon } from './Icons'
import { EmptyState } from './EmptyState'
import { PlanTimeline } from './PlanTimeline'
import { YearRing } from './YearRing'
import { YearSwitcher } from './YearSwitcher'

interface PlansPageProps {
  plans: Plan[]
  ideas: Idea[]
  today: string
  ringYear: number
  onRingYearChange: (year: number) => void
  onSelectPlan: (id: string) => void
  onToggleCheckIn: (planId: string, date: string) => void
  onNewPlan: () => void
  onLoadDemo: () => void
}

const RANGE_OPTIONS: RangeKey[] = ['3m', '1y', 'all']
const FILTERS: StatusFilter[] = ['all', 'active', 'done', 'archived']

export function PlansPage({
  plans,
  ideas,
  today,
  ringYear,
  onRingYearChange,
  onSelectPlan,
  onToggleCheckIn,
  onNewPlan,
  onLoadDemo,
}: PlansPageProps) {
  const [rangeKey, setRangeKey] = useState<RangeKey>('3m')
  const [filter, setFilter] = useState<StatusFilter>('active')
  const currentYear = yearOf(today)
  const activePlans = plans.filter((plan) => plan.status === 'active')
  const ringPlans = plans.filter((plan) => plan.status !== 'archived')
  const segments = getYearSegments(ringPlans, ringYear)
  const filtered = useMemo(() => filterPlansByStatus(plans, filter), [plans, filter])
  const bounds = useMemo(
    () => getRangeBounds(filtered, today, rangeKey),
    [filtered, today, rangeKey],
  )
  const checkInPlans = activePlans
    .filter(
      (plan) =>
        plan.checkInEnabled &&
        plan.startDate <= today &&
        plan.endDate >= today,
    )
    .sort((a, b) => {
      const aChecked = getCheckInStats(a, today).checkedToday
      const bChecked = getCheckInStats(b, today).checkedToday
      if (aChecked !== bChecked) return aChecked ? 1 : -1
      return a.endDate.localeCompare(b.endDate)
    })

  return (
    <div className="page page-overview page-plans">
      <section className="overview-intro plans-hero" aria-labelledby="plans-date">
        <div className="plans-hero-meta">
          <p className="eyebrow">规划</p>
          {plans.length > 0 && (
            <span className="simple-page-count">{filtered.length} 条</span>
          )}
        </div>
        <div className="date-row">
          <h1 id="plans-date">{formatMonthDay(today)}</h1>
          <span className="date-weekday">{formatWeekday(today)}</span>
        </div>
        <p className="today-note">
          <span className="red-thread" aria-hidden="true" />
          今天，是年轮上的一根红线
        </p>
      </section>

      {plans.length === 0 && (
        <section className="first-plan" aria-label="开始第一条规划">
          <div className="first-plan-copy">
            <p className="eyebrow">从一条开始</p>
            <p className="first-plan-line">把一件想做的事，放进一段时间里。</p>
          </div>
          <div className="first-plan-actions">
            <button type="button" className="button button-ink" onClick={onNewPlan}>
              写下第一条规划
            </button>
            <button type="button" className="first-plan-demo" onClick={onLoadDemo}>
              先看看示例
            </button>
          </div>
        </section>
      )}

      <section className="ring-section" aria-labelledby="ring-heading">
        <div className="ring-section-head">
          <h2 id="ring-heading">年度年轮</h2>
          <YearSwitcher
            year={ringYear}
            currentYear={currentYear}
            onChange={onRingYearChange}
          />
        </div>
        <YearRing
          segments={segments}
          ideas={ideas}
          year={ringYear}
          currentYear={currentYear}
          today={today}
          onSelectPlan={onSelectPlan}
        />
        {ringYear !== currentYear && (
          <button
            type="button"
            className="ring-back-today"
            onClick={() => onRingYearChange(currentYear)}
          >
            回到今年
          </button>
        )}
      </section>

      {checkInPlans.length > 0 && (
        <section className="overview-checkin" aria-labelledby="overview-checkin-heading">
          <div className="recent-head">
            <h2 id="overview-checkin-heading">今日打卡</h2>
            <span className="simple-page-count">{checkInPlans.length} 条</span>
          </div>
          <div className="checkin-quick-list">
            {checkInPlans.map((plan) => {
              const stats = getCheckInStats(plan, today)
              return (
                <div className="checkin-quick-row" key={plan.id}>
                  <button
                    type="button"
                    className="checkin-quick-main"
                    onClick={() => onSelectPlan(plan.id)}
                  >
                    <span className="checkin-quick-title">{plan.title}</span>
                    <span className="checkin-quick-meta">
                      已打 {stats.total} 天
                      {stats.streak > 0 ? ` · 连续 ${stats.streak} 天` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`checkin-quick-action${stats.checkedToday ? ' is-checked' : ''}`}
                    onClick={() => onToggleCheckIn(plan.id, today)}
                    aria-label={
                      stats.checkedToday
                        ? `取消《${plan.title}》今天的打卡`
                        : `为《${plan.title}》打卡`
                    }
                  >
                    {stats.checkedToday && <CheckIcon size={13} />}
                    {stats.checkedToday ? '已打' : '打卡'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {plans.length > 0 && (
        <section className="plans-list-section" aria-label="规划列表">
          <div className="filter-chips" role="group" aria-label="筛选规划">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                className={`filter-chip${filter === key ? ' is-active' : ''}`}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
              >
                {FILTER_META[key].label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              compact
              title={
                filter === 'archived'
                  ? '没有归档的规划'
                  : filter === 'active'
                    ? '没有在路上的规划'
                    : '这里暂时是空的'
              }
              description="换一个筛选，或者继续留白。"
              actionLabel="看全部"
              onAction={() => setFilter('all')}
            />
          ) : (
            <>
              <div className="range-and-summary">
                <div className="segmented" role="group" aria-label="时间范围">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`segment${rangeKey === option ? ' is-active' : ''}`}
                      onClick={() => setRangeKey(option)}
                      aria-pressed={rangeKey === option}
                    >
                      {RANGE_META[option].label}
                    </button>
                  ))}
                </div>
                <span className="range-date">
                  {formatRangeMonths(bounds.start, bounds.end)}
                </span>
              </div>
              <PlanTimeline
                plans={filtered}
                today={today}
                bounds={bounds}
                onSelectPlan={onSelectPlan}
              />
            </>
          )}
        </section>
      )}
    </div>
  )
}
