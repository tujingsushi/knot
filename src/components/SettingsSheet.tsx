import { useRef, useState } from 'react'
import { ArrowUpRightIcon, CardIcon, DownloadIcon, ShareIcon, TrashIcon, XIcon } from './Icons'
import { Modal } from './Modal'
import { formatNativeSaveTime } from '../lib/nativeStorage'
import { desktopPlatformLabel } from '../lib/desktop'
import type { NativeBackupStatus } from '../hooks/usePlans'

interface SettingsSheetProps {
  open: boolean
  planCount: number
  ideaCount: number
  canInstall: boolean
  isStandalone: boolean
  isNativeApp: boolean
  isDesktopApp: boolean
  backupStatus: NativeBackupStatus
  lastNativeSave: string | null
  importError: string | null
  onClose: () => void
  onExport: () => void
  onImportFile: (file: File) => void
  onClearAll: () => void
  onInstall: () => void
}

export function SettingsSheet({
  open,
  planCount,
  ideaCount,
  canInstall,
  isStandalone,
  isNativeApp,
  isDesktopApp,
  backupStatus,
  lastNativeSave,
  importError,
  onClose,
  onExport,
  onImportFile,
  onClearAll,
  onInstall,
}: SettingsSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setImporting(true)
    try {
      await onImportFile(file)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const backupText =
    backupStatus === 'restoring'
      ? '正在读取本机文件…'
      : backupStatus === 'saving'
        ? '正在写入 App 文件…'
        : backupStatus === 'saved'
          ? `已自动保存 · ${formatNativeSaveTime(lastNativeSave)}`
          : backupStatus === 'error'
            ? '写入失败，请立即导出备份'
            : 'WebView 本地存储'

  return (
    <Modal open={open} onClose={onClose} label="设置" className="sheet settings-sheet">
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-head settings-head">
        <h2>设置</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
          <XIcon size={20} />
        </button>
      </div>

      <div className="settings-body">
        <section className="settings-section" aria-labelledby="settings-data">
          <div className="settings-section-head">
            <h3 id="settings-data">本机数据</h3>
            <span className="settings-count">
              {planCount} 规划 · {ideaCount} 想法
            </span>
          </div>
          <p className="settings-description">
            {isDesktopApp
              ? '保存在这台电脑的桌面应用用户目录；清理应用数据会丢失。'
              : isNativeApp
                ? '自动写入 App 私有文件；卸载或清除应用数据会丢失。'
                : '只保存在这个浏览器里；清理站点数据会丢失。'}
          </p>

          {isNativeApp && (
            <div className={`native-backup-status is-${backupStatus}`}>
              <span className="native-backup-dot" aria-hidden="true" />
              <span>{backupText}</span>
            </div>
          )}

          <div className="settings-button-row">
            <button
              type="button"
              className="button button-outline"
              onClick={onExport}
              disabled={planCount === 0 && ideaCount === 0}
            >
              <DownloadIcon size={16} />
              {isNativeApp ? '分享备份' : '导出备份'}
            </button>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              <ShareIcon size={16} />
              {importing ? '正在读取…' : '导入备份'}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="visually-hidden"
              accept="application/json,.json"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </div>
          {importError && (
            <p className="settings-error" role="alert">
              {importError}
            </p>
          )}
          <button type="button" className="danger-link" onClick={onClearAll}>
            <TrashIcon size={15} />
            清空全部内容
          </button>
        </section>

        <details className="settings-details">
          <summary>
            <span>{isNativeApp || isDesktopApp ? '运行信息与关于' : '安装与关于'}</span>
            <span aria-hidden="true">＋</span>
          </summary>

          <div className="settings-details-body">
            {isDesktopApp ? (
              <>
                <div className="install-status">
                  <span className="install-status-dot" aria-hidden="true" />
                  桌面版 · {desktopPlatformLabel()}
                </div>
                <p className="settings-description">
                  数据保存在这台电脑的桌面应用用户目录；清理应用数据会丢失。
                </p>
                <div className="native-path">
                  <span>数据方式</span>
                  <code>桌面应用本地存储 / Knot</code>
                </div>
              </>
            ) : isNativeApp ? (
              <>
                <div className="install-status">
                  <span className="install-status-dot" aria-hidden="true" />
                  已作为独立 App 运行
                </div>
                <p className="settings-description">
                  数据在应用沙箱内，不依赖浏览器缓存。
                </p>
                <div className="native-path">
                  <span>数据位置</span>
                  <code>应用私有存储 / sancheng-plans.json</code>
                </div>
              </>
            ) : (
              <>
                {isStandalone ? (
                  <div className="install-status">
                    <span className="install-status-dot" aria-hidden="true" />
                    已经作为独立页面运行
                  </div>
                ) : (
                  <>
                    <p className="settings-description">
                      可以从浏览器菜单添加到桌面。
                    </p>
                    {canInstall && (
                      <button type="button" className="button button-ink" onClick={onInstall}>
                        <CardIcon size={17} />
                        安装结绳
                      </button>
                    )}
                    <div className="install-guide">
                      <p>
                        <span>华为浏览器</span>
                        菜单 → 添加到桌面
                      </p>
                      <p>
                        <span>Chrome / 其他</span>
                        菜单 → 安装应用
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            <p className="about-line">把远方拆成今天，把完成打成一个结。</p>
            <div className="about-meta">
              <span>版本 2.2.2</span>
              <span>本地优先</span>
              <span>
                {isDesktopApp ? '桌面 App' : isNativeApp ? 'Android App' : '无账号'}
              </span>
            </div>
          </div>
        </details>

        <div className="settings-developer">
          <div className="settings-developer-row">
            <span>开发者</span>
            <strong>tujingsushi</strong>
          </div>
          <a
            className="settings-developer-link"
            href="https://github.com/tujingsushi/knot"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/tujingsushi/knot
            <ArrowUpRightIcon size={12} />
          </a>
        </div>
      </div>
    </Modal>
  )
}
