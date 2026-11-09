import type { Idea, Plan, PlanBackup, PlanStatus, Subgoal } from '../types'
import { IDEAS_STORAGE_KEY, STORAGE_KEY } from './constants'
import { isISODate, nowISOString, todayISO } from './dates'
import { createId } from './plans'

const STATUSES: PlanStatus[] = ['active', 'done', 'archived']
const MAX_SUBGOALS = 20

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const candidate = value.slice(0, 10)
  return isISODate(candidate) ? candidate : null
}

function normalizeSubgoals(value: unknown): Subgoal[] {
  if (!Array.isArray(value)) return []
  const subgoals: Subgoal[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const title = typeof record.title === 'string' ? record.title.trim().slice(0, 60) : ''
    if (!title) continue
    const done = Boolean(record.done)
    subgoals.push({
      id: typeof record.id === 'string' && record.id ? record.id : createId(),
      title,
      done,
      completedAt: done ? normalizeDate(record.completedAt) : null,
    })
    if (subgoals.length >= MAX_SUBGOALS) break
  }
  return subgoals
}

function normalizeCheckInDates(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const dates = new Set<string>()
  for (const item of value) {
    const date = normalizeDate(item)
    if (date) dates.add(date)
  }
  return [...dates].sort()
}

function normalizePlan(value: unknown): Plan | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const startDate = normalizeDate(record.startDate)
  let endDate = normalizeDate(record.endDate)
  if (!startDate || !endDate) return null
  if (endDate < startDate) endDate = startDate

  const title = typeof record.title === 'string' ? record.title.trim().slice(0, 48) : ''
  if (!title) return null

  const status = STATUSES.includes(record.status as PlanStatus)
    ? (record.status as PlanStatus)
    : 'active'
  const timestamp = nowISOString()
  const createdAt =
    typeof record.createdAt === 'string' && !Number.isNaN(Date.parse(record.createdAt))
      ? record.createdAt
      : timestamp
  const updatedAt =
    typeof record.updatedAt === 'string' && !Number.isNaN(Date.parse(record.updatedAt))
      ? record.updatedAt
      : timestamp
  const completedAt = normalizeDate(record.completedAt)
  const archivedAt = normalizeDate(record.archivedAt)

  return {
    id: typeof record.id === 'string' && record.id ? record.id : createId(),
    title,
    startDate,
    endDate,
    status,
    note: typeof record.note === 'string' ? record.note.trim().slice(0, 1000) : '',
    subgoals: normalizeSubgoals(record.subgoals),
    checkInEnabled: Boolean(record.checkInEnabled),
    checkInDates: normalizeCheckInDates(record.checkInDates),
    parentId: typeof record.parentId === 'string' && record.parentId ? record.parentId : null,
    createdAt,
    updatedAt,
    completedAt: status === 'done' ? completedAt ?? updatedAt.slice(0, 10) : completedAt,
    archivedAt: status === 'archived' ? archivedAt ?? updatedAt.slice(0, 10) : archivedAt,
  }
}

function parsePlanArray(value: unknown): Plan[] | null {
  if (Array.isArray(value)) {
    return value.map(normalizePlan).filter((plan): plan is Plan => plan !== null)
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (Array.isArray(record.plans)) {
      return record.plans.map(normalizePlan).filter((plan): plan is Plan => plan !== null)
    }
  }
  return null
}

function normalizeIdea(value: unknown): Idea | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const title = typeof record.title === 'string' ? record.title.trim().slice(0, 60) : ''
  if (!title) return null
  const timestamp = nowISOString()
  const createdAt =
    typeof record.createdAt === 'string' && !Number.isNaN(Date.parse(record.createdAt))
      ? record.createdAt
      : timestamp
  const updatedAt =
    typeof record.updatedAt === 'string' && !Number.isNaN(Date.parse(record.updatedAt))
      ? record.updatedAt
      : createdAt
  const date =
    normalizeDate(record.date) ??
    normalizeDate(createdAt) ??
    todayISO()
  return {
    id: typeof record.id === 'string' && record.id ? record.id : createId(),
    title,
    note: typeof record.note === 'string' ? record.note.trim().slice(0, 1000) : '',
    date,
    createdAt,
    updatedAt,
  }
}

function parseIdeaArray(value: unknown): Idea[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizeIdea).filter((idea): idea is Idea => idea !== null)
}

export interface AppPayload {
  plans: Plan[]
  ideas: Idea[]
}

export function parseAppPayload(value: unknown): AppPayload | null {
  if (Array.isArray(value)) {
    return { plans: parsePlanArray(value) ?? [], ideas: [] }
  }
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const hasPlans = Array.isArray(record.plans)
  const hasIdeas = Array.isArray(record.ideas)
  if (!hasPlans && !hasIdeas) return null
  return {
    plans: hasPlans ? parsePlanArray(record.plans) ?? [] : [],
    ideas: hasIdeas ? parseIdeaArray(record.ideas) : [],
  }
}

export function parsePlansPayload(value: unknown): Plan[] | null {
  return parsePlanArray(value)
}

export function parseIdeasPayload(value: unknown): Idea[] | null {
  if (Array.isArray(value)) return parseIdeaArray(value)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (Array.isArray(record.ideas)) return parseIdeaArray(record.ideas)
  }
  return null
}

export function loadPlans(): Plan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return parsePlanArray(JSON.parse(raw)) ?? []
  } catch {
    return []
  }
}

export function savePlans(plans: Plan[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
    window.dispatchEvent(new CustomEvent('sancheng:storage', { detail: { count: plans.length } }))
    return true
  } catch {
    return false
  }
}

export function loadIdeas(): Idea[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(IDEAS_STORAGE_KEY)
    if (!raw) return []
    return parseIdeaArray(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveIdeas(ideas: Idea[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas))
    window.dispatchEvent(new CustomEvent('sancheng:storage', { detail: { count: ideas.length } }))
    return true
  } catch {
    return false
  }
}

export function createBackup(plans: Plan[], ideas: Idea[]): PlanBackup {
  return {
    app: 'sancheng',
    version: 2,
    exportedAt: nowISOString(),
    plans,
    ideas,
  }
}

export function parseImport(text: string): AppPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  const payload = parseAppPayload(parsed)
  if (!payload) {
    throw new Error('没有找到结绳的规划或想法数据')
  }
  if (payload.plans.length === 0 && payload.ideas.length === 0) {
    throw new Error('备份里没有可导入的内容')
  }
  return payload
}

export function countImportedPlans(plans: Plan[]): number {
  return plans.length
}
