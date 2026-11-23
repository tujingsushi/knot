import { useRef, useState } from 'react'
import type { Idea } from '../types'
import { formatWeekday } from '../lib/dates'
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
  const [date, setDate] = useState(
    mode === 'edit' && idea ? idea.date : today,
  )
  const [errors, setErrors] = useState<IdeaDraftErrors>({})
  const titleRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const save = () => {
    const draft = {
      title: titleRef.current?.value ?? '',
      note: noteRef.current?.value ?? '',
      date: dateRef.current?.value ?? date,
    }
    const nextErrors = validateIdeaDraft(draft)
    if (nextErrors.title || nextErrors.date) {
      setErrors(nextErrors)
      if (nextErrors.title) titleRef.current?.focus()
      return
    }
    onSave(draft)
  }

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
        <div className="sheet-head-actions">
          <button type="button" className="text-action" onClick={save}>
            {mode === 'edit' ? '保存' : '收下'}
          </button>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <XIcon size={20} />
          </button>
        </div>
      </div>

      <div className="plan-form">
        <div className="form-field">
          <label htmlFor="idea-title">这个想法是什么</label>
          <input
            id="idea-title"
            ref={titleRef}
            className={`text-input title-input${errors.title ? ' has-error' : ''}`}
            defaultValue={mode === 'edit' && idea ? idea.title : ''}
            onChange={() => {
              if (errors.title) setErrors({})
            }}
            enterKeyHint="done"
            placeholder="例如：去做一次海边长跑"
            maxLength={60}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault()
                save()
              }
            }}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'idea-title-error' : undefined}
          />
          {errors.title && (
            <p className="field-error" id="idea-title-error">
              {errors.title}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="idea-date">记在哪一天</label>
          <div className="idea-date-input-row">
            <input
              id="idea-date"
              ref={dateRef}
              className={`text-input date-input${errors.date ? ' has-error' : ''}`}
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                if (errors.date) setErrors({})
              }}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'idea-date-error' : undefined}
            />
            <span>{formatWeekday(date)}</span>
          </div>
          {errors.date && (
            <p className="field-error" id="idea-date-error">
              {errors.date}
            </p>
          )}
        </div>

        <div className="idea-date-line">
          <SparkIcon size={15} />
          <span>想法会在年轮上留下一个金色记号</span>
        </div>

        <div className="form-field">
          <label htmlFor="idea-note">补充（可以不写）</label>
          <textarea
            id="idea-note"
            ref={noteRef}
            className="text-input note-input"
            defaultValue={mode === 'edit' && idea ? idea.note : ''}
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
