import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Plan, Subgoal } from '../types'
import { addDays, addMonths, diffDays } from '../lib/dates'
import {
  createId,
  validateDraft,
  type PlanDraft,
  type DraftErrors,
} from '../lib/plans'
import { Modal } from './Modal'
import { CheckIcon, XIcon } from './Icons'

interface PlanSheetProps {
  open: boolean
  mode: 'create' | 'edit'
  plan: Plan | null
  today: string
  onClose: () => void
  onSave: (draft: PlanDraft) => void
}

const PRESETS = [
  { label: '1 周', months: 0, days: 7 },
  { label: '1 个月', months: 1, days: 0 },
  { label: '3 个月', months: 3, days: 0 },
  { label: '1 年', months: 12, days: 0 },
]

export function PlanSheet({ open, mode, plan, today, onClose, onSave }: PlanSheetProps) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [subgoals, setSubgoals] = useState<Subgoal[]>([])
  const [checkInEnabled, setCheckInEnabled] = useState(false)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [endTouched, setEndTouched] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const subgoalRefs = useRef(new Map<string, HTMLInputElement>())
  const blurAfterComposition = useRef(false)

  useEffect(() => {
    if (!open) {
      blurAfterComposition.current = false
      return
    }
    if (mode === 'edit' && plan) {
      setTitle(plan.title)
      setStartDate(plan.startDate)
      setEndDate(plan.endDate)
      setNote(plan.note)
      setShowNote(Boolean(plan.note))
      setSubgoals(plan.subgoals.map((subgoal) => ({ ...subgoal })))
      setCheckInEnabled(plan.checkInEnabled)
    } else {
      setTitle('')
      setStartDate(today)
      setEndDate(addDays(today, 29))
      setNote('')
      setShowNote(false)
      setSubgoals([])
      setCheckInEnabled(false)
    }
    setErrors({})
    setEndTouched(false)
    if (titleRef.current) {
      titleRef.current.value = mode === 'edit' && plan ? plan.title : ''
    }
    if (noteRef.current) {
      noteRef.current.value = mode === 'edit' && plan ? plan.note : ''
    }
    const timer = window.setTimeout(() => titleRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [open, mode, plan, today])

  const clearError = (key: keyof DraftErrors) => {
    setErrors((current) => {
      if (!current[key]) return current
      return { ...current, [key]: undefined }
    })
  }

  const changeStart = (next: string) => {
    setStartDate(next)
    clearError('startDate')
    clearError('endDate')
    if (mode === 'create' && !endTouched) {
      setEndDate(addDays(next, 29))
    } else if (next && endDate < next) {
      setEndDate(next)
      setEndTouched(true)
    }
  }

  const applyPreset = (months: number, days: number) => {
    let nextEnd: string
    if (months > 0) {
      nextEnd = addDays(addMonths(startDate, months), -1)
    } else {
      nextEnd = addDays(startDate, days - 1)
    }
    setEndDate(nextEnd)
    setEndTouched(true)
  }

  const duration =
    startDate && endDate && endDate >= startDate
      ? Math.max(1, diffDays(startDate, endDate) + 1)
      : null

  const syncTextFields = () => {
    if (titleRef.current) setTitle(titleRef.current.value)
    if (noteRef.current) setNote(noteRef.current.value)
    if (subgoals.length === 0) return
    setSubgoals((current) =>
      current.map((subgoal) => {
        const node = subgoalRefs.current.get(subgoal.id)
        return node ? { ...subgoal, title: node.value } : subgoal
      }),
    )
  }

  const addSubgoal = () => {
    if (subgoals.length >= 10) return
    syncTextFields()
    setSubgoals((current) => [
      ...current,
      { id: createId(), title: '', done: false, completedAt: null },
    ])
  }

  const updateSubgoalTitle = (id: string, title: string) => {
    setSubgoals((current) =>
      current.map((subgoal) => (subgoal.id === id ? { ...subgoal, title } : subgoal)),
    )
  }

  const removeSubgoal = (id: string) => {
    syncTextFields()
    setSubgoals((current) => current.filter((subgoal) => subgoal.id !== id))
  }

  const saveDraft = () => {
    const draft: PlanDraft = {
      title: titleRef.current?.value ?? title,
      startDate,
      endDate,
      note: showNote ? (noteRef.current?.value ?? note) : note,
      subgoals: subgoals.map((subgoal) => ({
        ...subgoal,
        title: subgoalRefs.current.get(subgoal.id)?.value ?? subgoal.title,
      })),
      checkInEnabled,
    }
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSave(draft)
  }

  const handlePlanKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const isEnter = event.key === 'Enter' || event.keyCode === 13
    if (!isEnter || !(event.target instanceof HTMLInputElement)) return
    event.preventDefault()
    if (event.nativeEvent.isComposing) {
      blurAfterComposition.current = true
      return
    }
    event.target.blur()
  }

  const handleCompositionEnd = () => {
    if (!blurAfterComposition.current) return
    blurAfterComposition.current = false
    const active = document.activeElement
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      active.blur()
    }
  }

  const keepFocus = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={mode === 'edit' ? '编辑规划' : '新建规划'}
      className="sheet plan-sheet"
      closeOnBackdrop={false}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-head">
        <h2>{mode === 'edit' ? '修改规划' : '放进时间里'}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
          <XIcon size={20} />
        </button>
      </div>

      <div
        className="plan-form"
        onKeyDown={handlePlanKeyDown}
        onCompositionEnd={handleCompositionEnd}
      >
        <div className="form-field">
          <label htmlFor="plan-title">这条规划叫什么</label>
          <input
            id="plan-title"
            ref={titleRef}
            className={`text-input title-input${errors.title ? ' has-error' : ''}`}
            defaultValue=""
            onChange={(event) => {
              setTitle(event.target.value)
              clearError('title')
            }}
            onBlur={(event) => setTitle(event.currentTarget.value)}
            enterKeyHint="done"
            placeholder="例如：写完毕业论文初稿"
            maxLength={48}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p className="field-error" id="title-error">
              {errors.title}
            </p>
          )}
        </div>

        <div className="form-field">
          <div className="field-label-row">
            <span className="field-label">时间范围</span>
            {duration && <span className="field-count">共 {duration} 天</span>}
          </div>
          <div className="date-grid">
            <label className="date-field">
              <span>开始</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => changeStart(event.target.value)}
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={errors.startDate ? 'start-error' : undefined}
              />
            </label>
            <label className="date-field">
              <span>结束</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setEndTouched(true)
                  clearError('endDate')
                }}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={errors.endDate ? 'end-error' : undefined}
              />
            </label>
          </div>
          {errors.startDate && (
            <p className="field-error" id="start-error">
              {errors.startDate}
            </p>
          )}
          {errors.endDate && (
            <p className="field-error" id="end-error">
              {errors.endDate}
            </p>
          )}
          <div className="preset-row" aria-label="快捷时长">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="preset-chip"
                onClick={() => applyPreset(preset.months, preset.days)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field subgoal-field">
          <div className="field-label-row">
            <span className="field-label">子目标</span>
            <span className="field-count">
              {subgoals.length > 0 ? `${subgoals.length}/10` : '可选'}
            </span>
          </div>

          {subgoals.length > 0 && (
            <div className="subgoal-fields">
              {subgoals.map((subgoal, index) => (
                <div className="subgoal-field-row" key={subgoal.id}>
                  <span
                    className={`subgoal-index${subgoal.done ? ' is-done' : ''}`}
                    aria-hidden="true"
                  >
                    {subgoal.done ? (
                      <CheckIcon size={11} />
                    ) : (
                      String(index + 1).padStart(2, '0')
                    )}
                  </span>
                  <input
                    className="text-input subgoal-input"
                    ref={(node) => {
                      if (node) subgoalRefs.current.set(subgoal.id, node)
                      else subgoalRefs.current.delete(subgoal.id)
                    }}
                    defaultValue={subgoal.title}
                    onChange={(event) =>
                      updateSubgoalTitle(subgoal.id, event.target.value)
                    }
                    onBlur={(event) =>
                      updateSubgoalTitle(subgoal.id, event.currentTarget.value)
                    }
                    placeholder="一个可以勾掉的小目标"
                    maxLength={60}
                    aria-label={`子目标 ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="subgoal-remove"
                    onPointerDown={keepFocus}
                    onClick={() => removeSubgoal(subgoal.id)}
                    aria-label={`删除子目标 ${index + 1}`}
                  >
                    <XIcon size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="subgoal-add"
            onPointerDown={keepFocus}
            onClick={addSubgoal}
            disabled={subgoals.length >= 10}
          >
            ＋ 添加子目标
          </button>
        </div>

        <div className="form-field">
          <label className="checkin-option">
            <input
              type="checkbox"
              checked={checkInEnabled}
              onChange={(event) => setCheckInEnabled(event.target.checked)}
            />
            <span className="checkin-option-copy">
              <strong>每日打卡</strong>
              <span>开启后可在详情记录每一天的完成情况</span>
            </span>
            <span className="checkin-switch" aria-hidden="true">
              <span />
            </span>
          </label>
        </div>

        {showNote && (
          <div className="form-field">
            <div className="field-label-row">
              <label htmlFor="plan-note">备注</label>
              <button
                type="button"
                className="field-count"
                onPointerDown={keepFocus}
                onClick={() => {
                  syncTextFields()
                  setShowNote(false)
                }}
              >
                收起
              </button>
            </div>
            <textarea
              id="plan-note"
              ref={noteRef}
              className="text-input note-input"
              defaultValue={note}
              onChange={(event) => setNote(event.target.value)}
              onBlur={(event) => setNote(event.currentTarget.value)}
              placeholder="完成的样子，或者为什么要做这件事。"
              rows={3}
              maxLength={500}
            />
          </div>
        )}

        {!showNote && (
          <button
            type="button"
            className="note-toggle"
            onPointerDown={keepFocus}
            onClick={() => {
              syncTextFields()
              setShowNote(true)
            }}
          >
            ＋ 添加备注
          </button>
        )}

        <div className="sheet-footer">
          <div className="sheet-footer-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>
              取消
            </button>
            <button type="button" className="button button-ink" onClick={saveDraft}>
              {mode === 'edit' ? '保存修改' : '放进时间里'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
