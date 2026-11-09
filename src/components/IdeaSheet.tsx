import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Idea } from '../types'
import { formatMonthDay, formatWeekday } from '../lib/dates'
import { validateIdeaDraft, type IdeaDraft, type IdeaDraftErrors } from '../lib/ideas'
import { Modal } from './Modal'
import { SparkIcon, XIcon } from './Icons'

interface IdeaSheetProps {
  open: boolean
  mode: 'create' | 'edit'
  idea: Idea | null
  today: string
  onClose: () => void
  onSave: (draft: IdeaDraft) => void
}

export function IdeaSheet({
  open,
  mode,
  idea,
  today,
  onClose,
  onSave,
}: IdeaSheetProps) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<IdeaDraftErrors>({})
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTitle(mode === 'edit' && idea ? idea.title : '')
    setNote(mode === 'edit' && idea ? idea.note : '')
    setErrors({})
    const timer = window.setTimeout(() => titleRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [open, mode, idea])

  const save = () => {
    const draft = { title, note }
    const nextErrors = validateIdeaDraft(draft)
    if (nextErrors.title) {
      setErrors(nextErrors)
      titleRef.current?.focus()
      return
    }
    onSave(draft)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
    }
  }

  const date = mode === 'edit' && idea ? idea.date : today

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={mode === 'edit' ? '编辑想法' : '新建想法'}
      className="sheet idea-sheet"
      closeOnBackdrop={false}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-head">
        <h2>{mode === 'edit' ? '修改想法' : '记下一个想法'}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
          <XIcon size={20} />
        </button>
      </div>

      <div className="plan-form" onKeyDown={handleKeyDown}>
        <div className="form-field">
          <label htmlFor="idea-title">这个想法是什么</label>
          <input
            id="idea-title"
            ref={titleRef}
            className={`text-input title-input${errors.title ? ' has-error' : ''}`}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (errors.title) setErrors({})
            }}
            enterKeyHint="done"
            placeholder="例如：去做一次海边长跑"
            maxLength={60}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'idea-title-error' : undefined}
          />
          {errors.title && (
            <p className="field-error" id="idea-title-error">
              {errors.title}
            </p>
          )}
        </div>

        <div className="idea-date-line">
          <SparkIcon size={15} />
          <span>记于 {formatMonthDay(date)}</span>
          <span>{formatWeekday(date)}</span>
        </div>

        <div className="form-field">
          <label htmlFor="idea-note">补充（可以不写）</label>
          <textarea
            id="idea-note"
            className="text-input note-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="它为什么值得被记住？"
            rows={4}
            maxLength={500}
          />
        </div>

        <p className="idea-sheet-hint">
          想法会留在「想法」页，也会在年轮上变成一个金色小点。
        </p>

        <div className="sheet-footer">
          <div className="sheet-footer-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>
              取消
            </button>
            <button type="button" className="button button-ink" onClick={save}>
              {mode === 'edit' ? '保存修改' : '收进想法'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
