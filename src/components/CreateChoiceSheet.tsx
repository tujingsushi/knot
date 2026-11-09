import { BandsIcon, SparkIcon, XIcon } from './Icons'
import { Modal } from './Modal'

interface CreateChoiceSheetProps {
  open: boolean
  onClose: () => void
  onPlan: () => void
  onIdea: () => void
}

export function CreateChoiceSheet({
  open,
  onClose,
  onPlan,
  onIdea,
}: CreateChoiceSheetProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label="新建"
      className="sheet create-choice-sheet"
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-head">
        <h2>想记下什么？</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
          <XIcon size={20} />
        </button>
      </div>

      <div className="create-choice-list">
        <button type="button" className="create-choice" onClick={onPlan}>
          <span className="create-choice-icon create-choice-icon-plan" aria-hidden="true">
            <BandsIcon size={23} />
          </span>
          <span className="create-choice-copy">
            <strong>新建规划</strong>
            <span>有一段时间，想把它放进去</span>
          </span>
        </button>

        <button type="button" className="create-choice" onClick={onIdea}>
          <span className="create-choice-icon create-choice-icon-idea" aria-hidden="true">
            <SparkIcon size={23} />
          </span>
          <span className="create-choice-copy">
            <strong>新建想法</strong>
            <span>先记下来，不急着安排时间</span>
          </span>
        </button>
      </div>

      <div className="sheet-footer">
        <div className="sheet-footer-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </Modal>
  )
}
