import type { Plan, PlanPhase, PlanTiming, Subgoal } from '../types'
import {
  addDays,
  clamp,
  dayOfYear,
  daysInYear,
  diffDays,
  isISODate,
  nowISOString,
  parseISODate,
  startOfYear,
  endOfYear,
  todayISO,
} from './dates'

export interface PlanDraft {
  title: string
  startDate: string
  endDate: string
  note: string
  subgoals: Subgoal[]
  checkInEnabled: boolean
}

export interface DraftErrors {
  title?: string
  startDate?: string
  endDate?: string
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function validateDraft(draft: PlanDraft): DraftErrors {
  const errors: DraftErrors = {}
  if (!draft.title.trim()) {
    errors.title = '给这条规划起一个名字'
  } else if (draft.title.trim().length > 48) {
    errors.title = '标题最多 48 个字'
  }
  if (!isISODate(draft.startDate)) {
    errors.startDate = '请选择开始日期'
  }
  if (!isISODate(draft.endDate)) {
    errors.endDate = '请选择结束日期'
  } else if (isISODate(draft.startDate) && draft.endDate < draft.startDate) {
    errors.endDate = '结束日期不能早于开始日期'
  }
  return errors
}

export function createPlan(draft: PlanDraft): Plan {
  const timestamp = nowISOString()
  return {
    id: createId(),
    title: draft.title.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    status: 'active',
    note: draft.note.trim(),
    subgoals: draft.subgoals
      .map((subgoal) => ({
        ...subgoal,
        title: subgoal.title.trim(),
      }))
      .filter((subgoal) => subgoal.title),
    checkInEnabled: draft.checkInEnabled,
    checkInDates: [],
    parentId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    archivedAt: null,
  }
}

export function updatePlan(plan: Plan, draft: PlanDraft): Plan {
  const existing = new Map(plan.subgoals.map((subgoal) => [subgoal.id, subgoal]))
  return {
    ...plan,
    title: draft.title.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    note: draft.note.trim(),
    subgoals: draft.subgoals
      .map((subgoal) => {
        const title = subgoal.title.trim()
        const previous = existing.get(subgoal.id)
        return {
          id: subgoal.id,
          title,
          done: previous?.done ?? subgoal.done,
          completedAt: previous?.completedAt ?? subgoal.completedAt,
        }
      })
      .filter((subgoal) => subgoal.title),
    checkInEnabled: draft.checkInEnabled,
    updatedAt: nowISOString(),
  }
}

export function toggleSubgoal(
  plan: Plan,
  subgoalId: string,
  today = todayISO(),
): Plan {
  let changed = false
  const subgoals = plan.subgoals.map((subgoal) => {
    if (subgoal.id !== subgoalId) return subgoal
    changed = true
    const done = !subgoal.done
    return {
      ...subgoal,
      done,
      completedAt: done ? today : null,
    }
  })
  if (!changed) return plan
  return {
    ...plan,
    subgoals,
    updatedAt: nowISOString(),
  }
}

export function toggleCheckIn(
  plan: Plan,
  date: string,
  today = todayISO(),
): Plan {
  if (!plan.checkInEnabled || !isISODate(date) || date > today) return plan
  const dates = new Set(plan.checkInDates)
  if (dates.has(date)) dates.delete(date)
  else dates.add(date)
  return {
    ...plan,
    checkInDates: [...dates].sort(),
    updatedAt: nowISOString(),
  }
}

export interface CheckInStats {
  total: number
  checkedToday: boolean
  streak: number
}

export function getCheckInStats(plan: Plan, today = todayISO()): CheckInStats {
  const dates = new Set(plan.checkInDates)
  const checkedToday = dates.has(today)
  let cursor = checkedToday ? today : addDays(today, -1)
  let streak = 0
  while (dates.has(cursor) && streak < 3660) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return { total: dates.size, checkedToday, streak }
}

export function completePlan(plan: Plan): Plan {
  const timestamp = nowISOString()
  return {
    ...plan,
    status: 'done',
    completedAt: todayISO(),
    updatedAt: timestamp,
  }
}

export function reopenPlan(plan: Plan): Plan {
  const timestamp = nowISOString()
  return {
    ...plan,
    status: 'active',
    completedAt: null,
    archivedAt: null,
    updatedAt: timestamp,
  }
}

export function archivePlan(plan: Plan): Plan {
  const timestamp = nowISOString()
  return {
    ...plan,
    status: 'archived',
    archivedAt: todayISO(),
    updatedAt: timestamp,
  }
}

export function getPlanTiming(plan: Plan, today = todayISO()): PlanTiming {
  const totalDays = Math.max(1, diffDays(plan.startDate, plan.endDate))
  const startInDays = diffDays(today, plan.startDate)
  const remainingDays = diffDays(today, plan.endDate)
  const elapsedRatio = clamp(diffDays(plan.startDate, today) / totalDays, 0, 1)

  let phase: PlanPhase
  if (plan.status === 'archived') {
    phase = 'archived'
  } else if (plan.status === 'done') {
    phase = 'done'
  } else if (startInDays > 0) {
    phase = 'upcoming'
  } else if (remainingDays < 0) {
    phase = 'overdue'
  } else {
    phase = 'active'
  }

  return {
    phase,
    totalDays: totalDays + 1,
    remainingDays,
    elapsedRatio,
    startInDays,
  }
}

export function phaseLabel(phase: PlanPhase): string {
  switch (phase) {
    case 'upcoming':
      return '还未开始'
    case 'active':
      return '正在路上'
    case 'overdue':
      return '已逾期'
    case 'done':
      return '已完成'
    case 'archived':
      return '已归档'
  }
}

export function exactRemaining(plan: Plan, today = todayISO()): string {
  const timing = getPlanTiming(plan, today)
  if (timing.phase === 'archived') return '已归档'
  if (timing.phase === 'done') return '已完成'
  if (timing.phase === 'upcoming') {
    return timing.startInDays === 1 ? '明天开始' : `${timing.startInDays} 天后开始`
  }
  if (timing.phase === 'overdue') {
    return `已逾期 ${Math.abs(timing.remainingDays)} 天`
  }
  if (timing.remainingDays === 0) return '今天结束'
  if (timing.remainingDays === 1) return '还剩 1 天'
  return `还剩 ${timing.remainingDays} 天`
}

export function softRemaining(plan: Plan, today = todayISO()): string {
  const timing = getPlanTiming(plan, today)
  if (timing.phase === 'archived') return '已放回时间'
  if (timing.phase === 'done') return '已打结'
  if (timing.phase === 'upcoming') {
    return timing.startInDays === 1 ? '明天开始' : `${timing.startInDays} 天后`
  }
  if (timing.phase === 'overdue') {
    return `逾期 ${Math.abs(timing.remainingDays)} 天`
  }
  const days = timing.remainingDays
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  if (days <= 13) return `还有 ${days} 天`
  if (days <= 56) return `还有 ${Math.ceil(days / 7)} 个周末`
  if (days <= 364) return `还有 ${Math.ceil(days / 30.44)} 个月`
  const years = Math.floor(days / 365)
  const months = Math.round((days % 365) / 30.44)
  if (months === 0) return `还有 ${years} 年`
  return `还有 ${years} 年 ${months} 个月`
}

export function bareRemaining(plan: Plan, today = todayISO()): string {
  return softRemaining(plan, today).replace(/^还有\s*/, '')
}

export function isOpenPlan(plan: Plan): boolean {
  return plan.status === 'active'
}

export function isVisiblePlan(plan: Plan): boolean {
  return plan.status !== 'archived'
}

export function filterPlansByStatus(plans: Plan[], filter: 'all' | 'active' | 'done' | 'archived'): Plan[] {
  if (filter === 'all') return plans
  if (filter === 'active') return plans.filter((plan) => plan.status === 'active')
  return plans.filter((plan) => plan.status === filter)
}

export function sortPlansForDisplay(plans: Plan[], today = todayISO()): Plan[] {
  const phaseRank = (plan: Plan): number => {
    const timing = getPlanTiming(plan, today)
    if (timing.phase === 'overdue') return 0
    if (timing.phase === 'active') return 1
    if (timing.phase === 'upcoming') return 2
    if (timing.phase === 'done') return 3
    return 4
  }

  return [...plans].sort((a, b) => {
    const phaseDelta = phaseRank(a) - phaseRank(b)
    if (phaseDelta !== 0) return phaseDelta
    if (a.status === 'done' && b.status === 'done' && a.completedAt && b.completedAt) {
      return b.completedAt.localeCompare(a.completedAt)
    }
    return a.endDate.localeCompare(b.endDate)
  })
}

export function getOpenPlans(plans: Plan[], today = todayISO()): Plan[] {
  return sortPlansForDisplay(
    plans.filter((plan) => plan.status === 'active'),
    today,
  )
}

export function getTodayPlans(plans: Plan[], today = todayISO(), limit = 3): Plan[] {
  return getOpenPlans(plans, today).slice(0, limit)
}

export interface YearSegment {
  plan: Plan
  startFraction: number
  endFraction: number
  completedFraction: number | null
  spansFullYear: boolean
  clippedStart: boolean
  clippedEnd: boolean
}

export function getYearSegments(plans: Plan[], year: number): YearSegment[] {
  const yearStart = startOfYear(year)
  const yearEnd = endOfYear(year)
  const segments: YearSegment[] = []

  for (const plan of plans) {
    if (plan.status === 'archived') continue
    if (plan.endDate < yearStart || plan.startDate > yearEnd) continue

    const visibleStart = plan.startDate < yearStart ? yearStart : plan.startDate
    const visibleEnd = plan.endDate > yearEnd ? yearEnd : plan.endDate
    const startFraction = (dayOfYear(visibleStart) - 1) / daysInYear(year)
    const endFraction = dayOfYear(visibleEnd) / daysInYear(year)
    let completedFraction: number | null = null

    if (plan.status === 'done' && plan.completedAt) {
      if (plan.completedAt >= yearStart && plan.completedAt <= yearEnd) {
        completedFraction =
          (dayOfYear(plan.completedAt) - 0.5) / daysInYear(year)
      }
    }

    segments.push({
      plan,
      startFraction: clamp(startFraction, 0, 1),
      endFraction: clamp(endFraction, 0, 1),
      completedFraction,
      spansFullYear: plan.startDate <= yearStart && plan.endDate >= yearEnd,
      clippedStart: plan.startDate < yearStart,
      clippedEnd: plan.endDate > yearEnd,
    })
  }

  return segments
}

export function getYearsWithPlans(plans: Plan[]): number[] {
  const years = new Set<number>()
  for (const plan of plans) {
    const start = parseISODate(plan.startDate)
    const end = parseISODate(plan.endDate)
    if (!start || !end) continue
    for (let year = start[0]; year <= end[0]; year += 1) {
      years.add(year)
    }
  }
  return [...years].sort((a, b) => a - b)
}

export function getPlanDurationDays(plan: Plan): number {
  return Math.max(1, diffDays(plan.startDate, plan.endDate) + 1)
}

export function getPlanNotePreview(note: string, maxLength = 48): string {
  if (note.length <= maxLength) return note
  return `${note.slice(0, maxLength).trim()}…`
}
