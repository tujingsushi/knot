import type { Idea } from '../types'
import { isISODate, nowISOString, todayISO } from './dates'
import { createId } from './plans'

export interface IdeaDraft {
  title: string
  note: string
  date?: string
}

export interface IdeaDraftErrors {
  title?: string
  date?: string
}

export function validateIdeaDraft(draft: IdeaDraft): IdeaDraftErrors {
  const errors: IdeaDraftErrors = {}
  const title = draft.title.trim()
  if (!title) errors.title = '写下这个想法'
  else if (title.length > 60) errors.title = '标题最多 60 个字'
  if (draft.date !== undefined && !isISODate(draft.date)) errors.date = '选择一个有效日期'
  return errors
}

export function createIdea(draft: IdeaDraft, date = todayISO()): Idea {
  const timestamp = nowISOString()
  const ideaDate = draft.date && isISODate(draft.date) ? draft.date : date
  return {
    id: createId(),
    title: draft.title.trim(),
    note: draft.note.trim(),
    date: isISODate(ideaDate) ? ideaDate : todayISO(),
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    archivedAt: null,
  }
}

export function updateIdea(idea: Idea, draft: IdeaDraft): Idea {
  return {
    ...idea,
    title: draft.title.trim(),
    note: draft.note.trim(),
    date: draft.date && isISODate(draft.date) ? draft.date : idea.date,
    updatedAt: nowISOString(),
  }
}

export function completeIdea(idea: Idea): Idea {
  return {
    ...idea,
    status: 'done',
    completedAt: todayISO(),
    archivedAt: null,
    updatedAt: nowISOString(),
  }
}

export function reopenIdea(idea: Idea): Idea {
  return {
    ...idea,
    status: 'active',
    completedAt: null,
    archivedAt: null,
    updatedAt: nowISOString(),
  }
}

export function archiveIdea(idea: Idea): Idea {
  return {
    ...idea,
    status: 'archived',
    archivedAt: todayISO(),
    updatedAt: nowISOString(),
  }
}

export function restoreIdea(idea: Idea): Idea {
  return {
    ...idea,
    status: 'active',
    completedAt: null,
    archivedAt: null,
    updatedAt: nowISOString(),
  }
}
