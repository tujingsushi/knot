import type { Plan, RangeKey } from '../types'
import { addDays, addMonths, maxISO, minISO, startOfMonth, diffDays } from './dates'

export interface RangeBounds {
  start: string
  end: string
}

export function getRangeBounds(
  plans: Plan[],
  today: string,
  range: RangeKey,
): RangeBounds {
  if (range === '3m' || range === '1y') {
    const months = range === '3m' ? 3 : 12
    const start = startOfMonth(today)
    return {
      start,
      end: addDays(addMonths(start, months), -1),
    }
  }

  if (plans.length === 0) {
    const start = startOfMonth(today)
    return {
      start,
      end: addDays(addMonths(start, 12), -1),
    }
  }

  const dates = [today]
  for (const plan of plans) {
    dates.push(plan.startDate, plan.endDate)
  }
  return {
    start: addDays(minISO(dates), -7),
    end: addDays(maxISO(dates), 7),
  }
}

export function isPlanInRange(plan: Plan, range: RangeBounds): boolean {
  return plan.startDate <= range.end && plan.endDate >= range.start
}

export function getVisibleRangePlans(plans: Plan[], range: RangeBounds): Plan[] {
  return plans.filter(
    (plan) => plan.status !== 'archived' && isPlanInRange(plan, range),
  )
}

export function getRangeDayCount(range: RangeBounds): number {
  return Math.max(1, diffDays(range.start, range.end) + 1)
}

export function datePercent(iso: string, range: RangeBounds): number {
  return (diffDays(range.start, iso) / Math.max(1, diffDays(range.start, range.end))) * 100
}
