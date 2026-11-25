import { useState } from 'react'
import type { Idea, IdeaStatus } from '../types'
import { yearOf } from '../lib/dates'
import { EmptyState } from './EmptyState'
import { CheckIcon, SparkIcon, TrashIcon } from './Icons'

type IdeaFilter = IdeaStatus

interface IdeasPageProps {
  ideas: Idea[]
  onNewIdea: () => void
  onEditIdea: (idea: Idea) => void
  onIdeaStatusChange: (idea: Idea, status: IdeaStatus) => void
  onDeleteIdea: (idea: Idea) => void
}

const FILTERS: Array<{ key: IdeaFilter; label: string }> = [
  { key: 'active', label: '进行中' },
  { key: 'done', label: '已实现' },
  { key: 'archived', label: '已归档' },
]

const STATUS_LABELS: Record<IdeaStatus, string> = {
  active: '进行中',
  done: '已实现',
  archived: '已归档',
}

export function IdeasPage({
  ideas,
  onNewIdea,
  onEditIdea,
  onIdeaStatusChange,
  onDeleteIdea,
}: IdeasPageProps) {
  const [filter, setFilter] = useState<IdeaFilter>('active')
  const counts = {
    active: ideas.filter((idea) => idea.status === 'active').length,
    done: ideas.filter((idea) => idea.status === 'done').length,
    archived: ideas.filter((idea) => idea.status === 'archived').length,
  }
  const sorted = [...ideas]
    .filter((idea) => idea.status === filter)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.createdAt.localeCompare(a.createdAt)
    })

  const handleNewIdea = () => {
    onNewIdea()
  }

  return (
    <div className="page page-ideas">
      <header className="ideas-head">
        <h1>想法</h1>
      </header>

      {ideas.length > 0 && (
        <div className="filter-chips" role="group" aria-label="想法状态筛选">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`filter-chip${filter === item.key ? ' is-active' : ''}`}
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
            >
              {item.label}
              <span>{counts[item.key]}</span>
            </button>
          ))}
        </div>
      )}

      {ideas.length === 0 ? (
        <EmptyState
          title="还没有想法"
          description="有些事还没准备好放进时间里，也可以先留在这里。"
          actionLabel="记下第一个想法"
          onAction={handleNewIdea}
        />
      ) : sorted.length === 0 ? (
        <div className="quiet-empty">
          <p>这里还没有想法。</p>
        </div>
      ) : (
        <div className="idea-list">
          {sorted.map((idea) => (
            <article
              className={`idea-item idea-item-${idea.status}`}
              key={idea.id}
            >
              <div className="idea-date" aria-hidden="true">
                <span>{Number(idea.date.slice(5, 7))}月</span>
                <strong>{Number(idea.date.slice(8, 10))}</strong>
              </div>
              <div className="idea-content">
                <button
                  type="button"
                  className="idea-main"
                  onClick={() => onEditIdea(idea)}
                  aria-label={`修改想法：${idea.title}`}
                >
                  <span className="idea-title">{idea.title}</span>
                  {idea.note && <span className="idea-note">{idea.note}</span>}
                  <span className="idea-meta">
                    <SparkIcon size={12} />
                    记于 {yearOf(idea.date)}
                    <span className={`idea-status idea-status-${idea.status}`}>
                      {STATUS_LABELS[idea.status]}
                    </span>
                  </span>
                </button>

                <div className="idea-actions">
                  <button
                    type="button"
                    className="idea-action"
                    onClick={() => onEditIdea(idea)}
                  >
                    修改
                  </button>
                  {idea.status === 'active' && (
                    <>
                      <button
                        type="button"
                        className="idea-action"
                        onClick={() => onIdeaStatusChange(idea, 'done')}
                      >
                        <CheckIcon size={13} />
                        实现
                      </button>
                      <button
                        type="button"
                        className="idea-action"
                        onClick={() => onIdeaStatusChange(idea, 'archived')}
                      >
                        归档
                      </button>
                    </>
                  )}
                  {idea.status === 'done' && (
                    <>
                      <button
                        type="button"
                        className="idea-action"
                        onClick={() => onIdeaStatusChange(idea, 'active')}
                      >
                        重开
                      </button>
                      <button
                        type="button"
                        className="idea-action"
                        onClick={() => onIdeaStatusChange(idea, 'archived')}
                      >
                        归档
                      </button>
                    </>
                  )}
                  {idea.status === 'archived' && (
                    <button
                      type="button"
                      className="idea-action"
                      onClick={() => onIdeaStatusChange(idea, 'active')}
                    >
                      恢复
                    </button>
                  )}
                  <button
                    type="button"
                    className="idea-delete"
                    onClick={() => onDeleteIdea(idea)}
                    aria-label={`删除想法：${idea.title}`}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
