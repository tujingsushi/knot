import { useEffect, useRef, useState } from 'react'
import type { Plan } from '../types'
import { formatDateLong } from '../lib/dates'
import { exportTodayCard } from '../lib/exportImage'
import { TodayCardSvg } from './TodayCardSvg'
import { DownloadIcon, XIcon } from './Icons'

interface TodayPageProps {
  plans: Plan[]
  today: string
  onClose: () => void
  onToast: (message: string, tone?: 'ink' | 'paper' | 'red') => void
}

export function TodayPage({ plans, today, onClose, onToast }: TodayPageProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const container = viewRef.current
      if (!container) return
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const save = async () => {
    if (!svgRef.current || saving) return
    setSaving(true)
    try {
      const result = await exportTodayCard(svgRef.current, today)
      onToast(
        result === 'shared'
          ? '图片已生成，请在系统分享面板中保存'
          : '今日一页已生成，1080 × 1920',
        'paper',
      )
    } catch {
      onToast('图片生成或保存没有完成，请重试', 'red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={viewRef}
      className="today-view"
      role="dialog"
      aria-modal="true"
      aria-label="今日一页"
    >
      <header className="today-topbar">
        <button
          ref={closeRef}
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="关闭今日一页"
        >
          <XIcon size={21} />
        </button>
        <div className="today-topbar-title">
          <span>今日一页</span>
          <small>{formatDateLong(today)}</small>
        </div>
        <button
          type="button"
          className="today-save"
          onClick={save}
          disabled={saving}
          aria-label="保存今日一页为图片"
        >
          <DownloadIcon size={18} />
          <span>{saving ? '生成中' : '保存'}</span>
        </button>
      </header>

      <main className="today-scroll">
        <div className="today-preview-wrap">
          <div className="today-preview">
            <TodayCardSvg plans={plans} today={today} svgRef={svgRef} />
          </div>
        </div>

        <div className="today-caption">
          <p className="today-caption-main">1080 × 1920 · 可保存为壁纸</p>
          <p>非实时小组件。规划变化后重新生成。</p>
        </div>
      </main>
    </div>
  )
}
