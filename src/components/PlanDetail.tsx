import { useEffect, useMemo, useState } from 'react'
import type { Plan } from '../types'
import {
  addDays,
  clamp,
  diffDays,
  formatDateDot,
  formatDateNumeric,
  formatMonthDay,
} from '../lib/dates'
import {
  getCheckInStats,
  getPlanDurationDays,
  getPlanTiming,
  phaseLabel,
} from '../lib/plans'
import { getUrgencyColor } from '../lib/urgency'
import { Modal } from './Modal'
import {
  ArchiveIcon,
  CheckIcon,
  EditIcon,
  KnotIcon,
  RotateIcon,
  TrashIcon,
  XIcon,
} from './Icons'

interface PlanDetailProps {
  plan: Plan
  today: string
  onClose: () => void
  onEdit: () => void
  onToggleSubgoal: (subgoalId: string) => void
  onToggleCheckIn: (date: string) => void
  onComplete: () => void
  onReopen: () => void
  onArchive: () => void
  onDelete: () => void
}

export function PlanDetail({
  plan,
  today,
  onClose,
  onEdit,
  onToggleSubgoal,
  onToggleCheckIn,
  onComplete,
  onReopen,
  onArchive,
  onDelete,
}: PlanDetailProps) {
  const [justCompleted, setJustCompleted] = useState(false)
  const timing = getPlanTiming(plan, today)
  const duration = getPlanDurationDays(plan)
  const isDone = plan.status === 'done'
  const isArchived = plan.status === 'archived'
  const urgencyColor = getUrgencyColor(plan, today)
  const subgoalDone = plan.subgoals.filter((subgoal) => subgoal.done).length
  const checkInStats = getCheckInStats(plan, today)
  const canCheckInToday =
    !isDone &&
    !isArchived &&
    today >= plan.startDate &&
    today <= plan.endDate
  const recentCheckInDays = Array.from({ length: 14 }, (_, index) =>
    addDays(today, index - 13),
  )
  const checkInSet = new Set(plan.checkInDates)
  const weekdayShort = ['日', '一', '二', '三', '四', '五', '六']

  useEffect(() => {
    setJustCompleted(false)
  }, [plan.id])

  useEffect(() => {
    if (!justCompleted) return
    const timer = window.setTimeout(() => setJustCompleted(false), 2600)
    return () => window.clearTimeout(timer)
  }, [justCompleted])

  const totalDays = Math.max(1, diffDays(plan.startDate, plan.endDate))
  const todayRatio = clamp(diffDays(plan.startDate, today) / totalDays, 0, 1)
  const completedDuration = plan.completedAt
    ? Math.max(1, diffDays(plan.startDate, plan.completedAt) + 1)
    : null

  const progress = useMemo(() => {
    if (isDone) {
      const completionDate = plan.completedAt ?? plan.endDate
      return clamp(diffDays(plan.startDate, completionDate) / totalDays, 0, 1)
    }
    if (isArchived) return todayRatio
    return todayRatio
  }, [isArchived, isDone, plan.completedAt, plan.endDate, plan.startDate, todayRatio, totalDays])

  const showTodayMarker =
    !isDone && !isArchived && timing.phase !== 'upcoming'
  const startLabel = formatDateNumeric(plan.startDate)
  const endLabel = formatDateNumeric(plan.endDate)
  const facts = isDone
    ? `共 ${duration} 天 · 用时 ${completedDuration ?? '—'} 天`
    : isArchived
      ? `共 ${duration} 天 · 已归档`
      : timing.phase === 'upcoming'
        ? `共 ${duration} 天 · ${timing.startInDays} 天后开始`
        : timing.phase === 'overdue'
          ? `共 ${duration} 天 · 已逾期 ${Math.abs(timing.remainingDays)} 天`
          : timing.remainingDays === 0
            ? `共 ${duration} 天 · 今天结束`
            : `共 ${duration} 天 · 还剩 ${timing.remainingDays} 天`

  const complete = () => {
    setJustCompleted(true)
    onComplete()
  }

  return (
    <Modal
      open
      onClose={onClose}
      label="规划详情"
      className="sheet detail-sheet"
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-head detail-head">
        <div className="detail-badge-wrap">
          <span className={`phase-badge phase-${timing.phase}`}>
            <span
              className="horizon-dot"
              aria-hidden="true"
              style={{ backgroundColor: urgencyColor }}
            />
            {phaseLabel(timing.phase)}
          </span>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
          <XIcon size={20} />
        </button>
      </div>

      <div className="detail-title-row">
        <h2 className="detail-title">{plan.title}</h2>
        {isDone && (
          <div
            className={`detail-seal${justCompleted ? ' is-stamping' : ''}`}
            aria-label={`已完成，${plan.completedAt ? formatDateNumeric(plan.completedAt) : ''}`}
          >
            <span className="seal-inner">
              <span className="seal-title">完成</span>
              <span className="seal-date">
                {plan.completedAt ? formatDateDot(plan.completedAt).slice(5) : '已打结'}
              </span>
            </span>
          </div>
        )}
      </div>

      {justCompleted && (
        <p className="completion-copy" role="status">
          <KnotIcon size={15} />
          这一程，打了一个结。
        </p>
      )}

      <div className="detail-dates">
        <div className="detail-date-item">
          <span>开始</span>
          <strong>{startLabel}</strong>
        </div>
        <span className="detail-date-line" aria-hidden="true">
          <i />
        </span>
        <div className="detail-date-item is-end">
          <span>结束</span>
          <strong>{endLabel}</strong>
        </div>
      </div>

      <div className="detail-time">
        <div className="detail-track" aria-hidden="true">
          <span className="detail-track-ghost" />
          <span
            className="detail-track-fill"
            style={{ width: `${progress * 100}%`, backgroundColor: urgencyColor }}
          />
          {showTodayMarker && (
            <span
              className="detail-track-today"
              style={{ left: `${todayRatio * 100}%` }}
            >
              <i />
            </span>
          )}
          {isDone && (
            <span
              className="detail-track-knot"
              style={{ left: `${progress * 100}%` }}
            >
              <span />
            </span>
          )}
        </div>
        <div className="detail-track-labels">
          <span>{formatDateDot(plan.startDate)}</span>
          <span className="detail-track-center">
            {isDone
              ? '打结'
              : isArchived
                ? '归档'
                : timing.phase === 'upcoming'
                  ? '等待开始'
                  : '今天'}
          </span>
          <span>{formatDateDot(plan.endDate)}</span>
        </div>
        <p className={`detail-facts${timing.phase === 'overdue' ? ' is-red' : ''}`}>
          {facts}
        </p>
      </div>

      {plan.subgoals.length > 0 && (
        <section className="detail-subgoals" aria-labelledby="subgoals-heading">
          <div className="detail-subgoals-head">
            <h3 id="subgoals-heading">子目标</h3>
            <span className="detail-subgoals-count">
              {subgoalDone}/{plan.subgoals.length}
            </span>
          </div>
          <div className="detail-subgoal-list">
            {plan.subgoals.map((subgoal, index) => (
              <button
                key={subgoal.id}
                type="button"
                className={`detail-subgoal${subgoal.done ? ' is-done' : ''}`}
                onClick={() => onToggleSubgoal(subgoal.id)}
                disabled={isDone || isArchived}
                aria-pressed={subgoal.done}
              >
                <span className="detail-subgoal-check" aria-hidden="true">
                  {subgoal.done && <CheckIcon size={12} />}
                </span>
                <span className="detail-subgoal-title">{subgoal.title}</span>
                <span className="detail-subgoal-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {plan.checkInEnabled && (
        <section className="detail-checkin" aria-labelledby="checkin-heading">
          <div className="detail-checkin-head">
            <h3 id="checkin-heading">打卡</h3>
            <span className="detail-checkin-count">
              {checkInStats.total} 天
              {checkInStats.streak > 0 ? ` · 连续 ${checkInStats.streak} 天` : ''}
            </span>
          </div>

          <button
            type="button"
            className={`checkin-today-button${checkInStats.checkedToday ? ' is-checked' : ''}`}
            onClick={() => onToggleCheckIn(today)}
            disabled={!canCheckInToday}
            aria-label={checkInStats.checkedToday ? '取消今天的打卡' : '今天打卡'}
          >
            {isDone
              ? '已完成'
              : isArchived
                ? '已归档'
                : !canCheckInToday
                  ? '不在打卡时间'
                  : checkInStats.checkedToday
                    ? '今天已打卡'
                    : '今天打卡'}
          </button>

          <p className="checkin-hint">最近 14 天 · 点亮日期可补打卡或取消</p>

          <div className="checkin-grid" role="group" aria-label="最近十四天打卡记录">
            {recentCheckInDays.map((date) => {
              const inPlan = date >= plan.startDate && date <= plan.endDate
              const canToggle =
                !isDone && !isArchived && inPlan && date <= today
              const checked = checkInSet.has(date)
              const weekday = weekdayShort[new Date(`${date}T00:00:00`).getDay()]
              return (
                <button
                  key={date}
                  type="button"
                  className={`checkin-day${checked ? ' is-checked' : ''}${date === today ? ' is-today' : ''}${inPlan ? '' : ' is-outside'}`}
                  onClick={() => onToggleCheckIn(date)}
                  disabled={!canToggle}
                  aria-label={`${formatMonthDay(date)} 周${weekday}，${checked ? '已打卡' : '未打卡'}`}
                  aria-pressed={checked}
                >
                  <span className="checkin-day-weekday">周{weekday}</span>
                  <span className="checkin-day-number">
                    {Number(date.slice(8, 10))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {plan.note && (
        <blockquote className="detail-note">
          <span className="quote-mark" aria-hidden="true">
            “
          </span>
          <p>{plan.note}</p>
        </blockquote>
      )}

      <div className="detail-actions">
        {!isArchived && !isDone && (
          <button type="button" className="button button-ink detail-primary" onClick={complete}>
            <KnotIcon size={17} />
            完成，并打一个结
          </button>
        )}
        {isDone && (
          <button type="button" className="button button-outline detail-primary" onClick={onReopen}>
            <RotateIcon size={17} />
            重新打开这条规划
          </button>
        )}
        {isArchived && (
          <button type="button" className="button button-ink detail-primary" onClick={onReopen}>
            <RotateIcon size={17} />
            恢复这条规划
          </button>
        )}

        <div className="detail-secondary-actions">
          {!isArchived && (
            <button type="button" className="button button-quiet" onClick={onEdit}>
              <EditIcon size={16} />
              编辑
            </button>
          )}
          {!isArchived && (
            <button type="button" className="button button-quiet" onClick={onArchive}>
              <ArchiveIcon size={16} />
              归档
            </button>
          )}
          <button
            type="button"
            className="button button-danger-quiet"
            onClick={onDelete}
          >
            <TrashIcon size={16} />
            删除
          </button>
        </div>
      </div>
    </Modal>
  )
}
