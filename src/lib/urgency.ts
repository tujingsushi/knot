import type { Plan } from '../types'
import { getPlanTiming } from './plans'

export type UrgencyTone = 'calm' | 'steady' | 'soon' | 'urgent' | 'overdue' | 'done'

export const URGENCY_META: Record<
  UrgencyTone,
  { label: string; color: string; opacity: number }
> = {
  calm: { label: '从容', color: '#5e7f8c', opacity: 0.92 },
  steady: { label: '稳步', color: '#6f8a72', opacity: 0.94 },
  soon: { label: '临近', color: '#bf8540', opacity: 0.96 },
  urgent: { label: '紧迫', color: '#b8462c', opacity: 0.98 },
  overdue: { label: '逾期', color: '#8f2f1c', opacity: 0.98 },
  done: { label: '已完成', color: '#9d9384', opacity: 0.46 },
}

export const URGENCY_LEGEND: UrgencyTone[] = [
  'calm',
  'steady',
  'soon',
  'urgent',
]

export function getUrgencyTone(plan: Plan, today: string): UrgencyTone {
  if (plan.status === 'done' || plan.status === 'archived') return 'done'

  const timing = getPlanTiming(plan, today)
  if (timing.phase === 'overdue') return 'overdue'
  if (timing.phase === 'upcoming') return 'calm'

  const remaining = timing.remainingDays
  const elapsed = timing.elapsedRatio

  if (remaining <= 7 || elapsed >= 0.85) return 'urgent'
  if (remaining <= 30 || elapsed >= 0.6) return 'soon'
  if (remaining <= 120 || elapsed >= 0.3) return 'steady'
  return 'calm'
}

export function getUrgencyStyle(
  plan: Plan,
  today: string,
): { tone: UrgencyTone; color: string; opacity: number } {
  const tone = getUrgencyTone(plan, today)
  const meta = URGENCY_META[tone]
  return { tone, color: meta.color, opacity: meta.opacity }
}

export function getUrgencyColor(plan: Plan, today: string): string {
  return URGENCY_META[getUrgencyTone(plan, today)].color
}
