import type { Idea } from '../types'
import { isISODate, nowISOString, todayISO } from './dates'
import { createId } from './plans'

export interface IdeaDraft {
  title: string
  note: string
}

export interface IdeaDraftErrors {
  title?: string
}

export function validateIdeaDraft(draft: IdeaDraft): IdeaDraftErrors {
  const errors: IdeaDraftErrors = {}
  const title = draft.title.trim()
  if (!title) errors.title = '写下这个想法'
  else if (title.length > 60) errors.title = '标题最多 60 个字'
  return errors
}

export function createIdea(draft: IdeaDraft, date = todayISO()): Idea {
  const timestamp = nowISOString()
  return {
    id: createId(),
    title: draft.title.trim(),
    note: draft.note.trim(),
    date: isISODate(date) ? date : todayISO(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function updateIdea(idea: Idea, draft: IdeaDraft): Idea {
  return {
    ...idea,
    title: draft.title.trim(),
    note: draft.note.trim(),
    updatedAt: nowISOString(),
  }
}
