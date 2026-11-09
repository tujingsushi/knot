import type { PlanStatus, RangeKey, StatusFilter, TabKey } from '../types'

export const STATUS_LABEL: Record<PlanStatus, string> = {
  active: '在路上',
  done: '已完成',
  archived: '已归档',
}

export const TAB_META: Record<TabKey, { label: string; index: string }> = {
  plans: { label: '规划', index: '01' },
  ideas: { label: '想法', index: '02' },
}

export const RANGE_META: Record<RangeKey, { label: string; months: number | null }> = {
  '3m': { label: '3 个月', months: 3 },
  '1y': { label: '1 年', months: 12 },
  all: { label: '全部', months: null },
}

export const FILTER_META: Record<StatusFilter, { label: string }> = {
  all: { label: '全部' },
  active: { label: '在路上' },
  done: { label: '已完成' },
  archived: { label: '已归档' },
}

export const STORAGE_KEY = 'sancheng.plans.v1'
export const IDEAS_STORAGE_KEY = 'sancheng.ideas.v1'
export const STORAGE_EVENT = 'sancheng:storage'

export const PALETTE = {
  paper: '#f4efe4',
  paperDeep: '#e9dfcf',
  card: '#fbf7ed',
  ink: '#28251f',
  inkSoft: '#746d60',
  inkFaint: '#8f8576',
  red: '#b8462c',
  redDeep: '#96341f',
  accent: '#5e7f8c',
  accentSoft: '#9db3ba',
  idea: '#a9843f',
  line: 'rgba(40, 37, 31, 0.13)',
} as const
