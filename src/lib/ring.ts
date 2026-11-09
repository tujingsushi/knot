import { clamp, dayOfYear, daysInMonth, daysInYear } from './dates'
import type { YearSegment } from './plans'
import { getUrgencyStyle } from './urgency'

export interface RingArc {
  planId: string
  title: string
  radius: number
  strokeWidth: number
  startFraction: number
  endFraction: number
  completedFraction: number | null
  isDone: boolean
  color: string
  opacity: number
}

export interface MonthTick {
  month: number
  fraction: number
  label: string
}

export function fractionToAngle(fraction: number): number {
  return fraction * 360 - 90
}

export function pointOnCircle(
  cx: number,
  cy: number,
  radius: number,
  angleDegrees: number,
): { x: number; y: number } {
  const angle = (angleDegrees * Math.PI) / 180
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  }
}

export function todayFraction(today: string, year: number): number {
  const total = daysInYear(year)
  const current = clamp(dayOfYear(today) - 0.5, 0.5, total - 0.5)
  return current / total
}

export function getMonthTicks(year: number): MonthTick[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const daysBefore = Array.from({ length: index }, (_, monthIndex) =>
      daysInMonth(year, monthIndex + 1),
    ).reduce((sum, value) => sum + value, 0)
    return {
      month,
      fraction: daysBefore / daysInYear(year),
      label: String(month),
    }
  })
}

export function getDayFractionInYear(iso: string, year: number): number {
  return clamp(dayOfYear(iso) / daysInYear(year), 0, 1)
}

export function buildPlanRingArcs(
  segments: YearSegment[],
  today: string,
  inner = 72,
  outer = 158,
): RingArc[] {
  const sorted = [...segments].sort((a, b) => {
    if (a.startFraction !== b.startFraction) return a.startFraction - b.startFraction
    return a.endFraction - b.endFraction
  })
  if (sorted.length === 0) return []

  const step = (outer - inner) / sorted.length
  const baseStroke = clamp(step * 0.52, 1.8, 8)
  return sorted.map((segment, index) => {
    const isDone = segment.plan.status === 'done'
    const urgency = getUrgencyStyle(segment.plan, today)
    return {
      planId: segment.plan.id,
      title: segment.plan.title,
      radius: inner + step * (index + 0.5),
      strokeWidth: isDone ? Math.max(1.5, baseStroke * 0.58) : baseStroke,
      startFraction: segment.startFraction,
      endFraction: segment.endFraction,
      completedFraction: segment.completedFraction,
      isDone,
      color: urgency.color,
      opacity: urgency.opacity,
    }
  })
}
