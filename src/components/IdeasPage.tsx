import type { Idea } from '../types'
import { yearOf } from '../lib/dates'
import { EmptyState } from './EmptyState'
import { SparkIcon, TrashIcon } from './Icons'

interface IdeasPageProps {
  ideas: Idea[]
  onNewIdea: () => void
  onEditIdea: (idea: Idea) => void
  onDeleteIdea: (idea: Idea) => void
}

export function IdeasPage({
  ideas,
  onNewIdea,
  onEditIdea,
  onDeleteIdea,
}: IdeasPageProps) {
  const sorted = [...ideas].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <div className="page page-ideas">
      <header className="ideas-head">
        <div>
          <p className="eyebrow">未放进时间的</p>
          <h1>想法</h1>
        </div>
        <div className="ideas-head-actions">
          <span className="simple-page-count">{ideas.length} 个</span>
          {ideas.length > 0 && (
            <button type="button" className="text-action" onClick={onNewIdea}>
              ＋ 记一个
            </button>
          )}
        </div>
      </header>

      <p className="ideas-intro">
        先记下来，不必马上安排。它们会成为年轮上的金色小点。
      </p>

      {ideas.length === 0 ? (
        <EmptyState
          title="还没有想法"
          description="有些事还没准备好放进时间里，也可以先留在这里。"
          actionLabel="记下第一个想法"
          onAction={onNewIdea}
        />
      ) : (
        <div className="idea-list">
          {sorted.map((idea) => (
            <article className="idea-item" key={idea.id}>
              <div className="idea-date" aria-hidden="true">
                <span>{Number(idea.date.slice(5, 7))}月</span>
                <strong>{Number(idea.date.slice(8, 10))}</strong>
              </div>
              <button
                type="button"
                className="idea-main"
                onClick={() => onEditIdea(idea)}
              >
                <span className="idea-title">{idea.title}</span>
                {idea.note && <span className="idea-note">{idea.note}</span>}
                <span className="idea-meta">
                  <SparkIcon size={12} />
                  记于 {yearOf(idea.date)}
                </span>
              </button>
              <button
                type="button"
                className="idea-delete"
                onClick={() => onDeleteIdea(idea)}
                aria-label={`删除想法：${idea.title}`}
              >
                <TrashIcon size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
