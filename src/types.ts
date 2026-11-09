export type PlanStatus = 'active' | 'done' | 'archived'

export type PlanPhase = 'upcoming' | 'active' | 'overdue' | 'done' | 'archived'

export interface Subgoal {
  id: string
  title: string
  done: boolean
  completedAt: string | null
}

export interface Plan {
  id: string
  title: string
  startDate: string
  endDate: string
  status: PlanStatus
  note: string
  subgoals: Subgoal[]
  checkInEnabled: boolean
  checkInDates: string[]
  parentId: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  archivedAt: string | null
}

export interface PlanBackup {
  app: 'sancheng'
  version: 1 | 2
  exportedAt: string
  plans: Plan[]
  ideas?: Idea[]
}

export interface Idea {
  id: string
  title: string
  note: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface PlanTiming {
  phase: PlanPhase
  totalDays: number
  remainingDays: number
  elapsedRatio: number
  startInDays: number
}

export type TabKey = 'plans' | 'ideas'

export type RangeKey = '3m' | '1y' | 'all'

export type StatusFilter = 'all' | 'active' | 'done' | 'archived'
