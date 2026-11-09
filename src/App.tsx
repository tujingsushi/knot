import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import type { Idea, Plan, TabKey } from './types'
import { createDemoIdeas, createDemoPlans } from './lib/demo'
import { formatDateNumeric, yearOf } from './lib/dates'
import { createBackup, parseImport } from './lib/storage'
import { downloadBlob } from './lib/exportImage'
import { shareJsonBackup } from './lib/nativeStorage'
import type { PlanDraft } from './lib/plans'
import type { IdeaDraft } from './lib/ideas'
import { isDesktopApp } from './lib/desktop'
import { usePlans } from './hooks/usePlans'
import { useToday } from './hooks/useToday'
import { useToast } from './hooks/useToast'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { ConfirmDialog } from './components/ConfirmDialog'
import { CreateChoiceSheet } from './components/CreateChoiceSheet'
import { IdeasPage } from './components/IdeasPage'
import { IdeaSheet } from './components/IdeaSheet'
import { PlansPage } from './components/PlansPage'
import { PlanDetail } from './components/PlanDetail'
import { PlanSheet } from './components/PlanSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { SplashScreen } from './components/SplashScreen'
import { Toast } from './components/Toast'
import { TodayPage } from './components/TodayPage'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface ConfirmState {
  title: string
  description: string
  confirmLabel: string
  danger: boolean
  action: () => void
}

interface SheetState {
  mode: 'create' | 'edit'
  planId?: string
}

interface IdeaSheetState {
  mode: 'create' | 'edit'
  ideaId?: string
}

export default function App() {
  const plansApi = usePlans()
  const {
    plans,
    ideas,
    persistError,
    native,
    backupStatus,
    lastNativeSave,
    addPlan,
    updatePlan,
    toggleSubgoal,
    toggleCheckIn,
    completePlan,
    reopenPlan,
    archivePlan,
    deletePlan,
    addIdea,
    updateIdea,
    deleteIdea,
    replacePlans,
    replaceIdeas,
    clearPlans,
    clearIdeas,
  } = plansApi
  const today = useToday()
  const currentYear = yearOf(today)
  const desktop = isDesktopApp()
  const { toast, showToast, dismiss } = useToast()

  const [ringYear, setRingYear] = useState(currentYear)
  const [tab, setTab] = useState<TabKey>('plans')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetState | null>(null)
  const [ideaSheet, setIdeaSheet] = useState<IdeaSheetState | null>(null)
  const [createChoiceOpen, setCreateChoiceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [todayOpen, setTodayOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const finishSplash = useCallback(() => setSplashDone(true), [])
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  const goHome = useCallback(() => {
    setTab('plans')
    scrollToTop()
  }, [scrollToTop])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(display-mode: standalone)')
    setIsStandalone(media.matches)
    const update = () => setIsStandalone(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallPrompt(null)
      setIsStandalone(true)
      showToast('结绳已经放到桌面了')
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [showToast])

  useEffect(() => {
    if (!import.meta.env.PROD || native || desktop || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => undefined)
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
    return () => window.removeEventListener('load', register)
  }, [native, desktop])

  const backStateRef = useRef({
    todayOpen,
    confirmOpen: Boolean(confirm),
    sheetOpen: Boolean(sheet),
    ideaSheetOpen: Boolean(ideaSheet),
    createChoiceOpen,
    detailId,
    settingsOpen,
    tab,
  })
  backStateRef.current = {
    todayOpen,
    confirmOpen: Boolean(confirm),
    sheetOpen: Boolean(sheet),
    ideaSheetOpen: Boolean(ideaSheet),
    createChoiceOpen,
    detailId,
    settingsOpen,
    tab,
  }

  useEffect(() => {
    if (!native) return
    let disposed = false
    let listenerHandle: { remove: () => Promise<void> } | null = null
    void (async () => {
      const handle = await CapacitorApp.addListener('backButton', () => {
        const state = backStateRef.current
        if (state.todayOpen) {
          setTodayOpen(false)
          return
        }
        if (state.confirmOpen) {
          setConfirm(null)
          return
        }
        if (state.sheetOpen) {
          setSheet(null)
          return
        }
        if (state.ideaSheetOpen) {
          setIdeaSheet(null)
          return
        }
        if (state.createChoiceOpen) {
          setCreateChoiceOpen(false)
          return
        }
        if (state.detailId) {
          setDetailId(null)
          return
        }
        if (state.settingsOpen) {
          setSettingsOpen(false)
          return
        }
        if (state.tab !== 'plans') {
          setTab('plans')
          return
        }
        void CapacitorApp.exitApp()
      })
      if (disposed) void handle.remove()
      else listenerHandle = handle
    })()
    return () => {
      disposed = true
      if (listenerHandle) void listenerHandle.remove()
    }
  }, [native])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  useEffect(() => {
    if (detailId && !plans.some((plan) => plan.id === detailId)) {
      setDetailId(null)
    }
  }, [detailId, plans])

  const detailPlan = useMemo(
    () => plans.find((plan) => plan.id === detailId) ?? null,
    [detailId, plans],
  )
  const sheetPlan = useMemo(
    () =>
      sheet?.mode === 'edit' && sheet.planId
        ? plans.find((plan) => plan.id === sheet.planId) ?? null
        : null,
    [plans, sheet],
  )
  const sheetIdea = useMemo(
    () =>
      ideaSheet?.mode === 'edit' && ideaSheet.ideaId
        ? ideas.find((idea) => idea.id === ideaSheet.ideaId) ?? null
        : null,
    [ideas, ideaSheet],
  )

  const openDetail = useCallback((id: string) => {
    setSheet(null)
    setIdeaSheet(null)
    setCreateChoiceOpen(false)
    setSettingsOpen(false)
    setDetailId(id)
  }, [])

  const openCreate = useCallback(() => {
    setDetailId(null)
    setSettingsOpen(false)
    setIdeaSheet(null)
    setCreateChoiceOpen(false)
    setTab('plans')
    setSheet({ mode: 'create' })
  }, [])

  const openEdit = useCallback((plan: Plan) => {
    setDetailId(null)
    setIdeaSheet(null)
    setCreateChoiceOpen(false)
    setTab('plans')
    setSheet({ mode: 'edit', planId: plan.id })
  }, [])

  const openCreateChoice = useCallback(() => {
    setDetailId(null)
    setSheet(null)
    setIdeaSheet(null)
    setSettingsOpen(false)
    setCreateChoiceOpen(true)
  }, [])

  const openIdeaCreate = useCallback(() => {
    setDetailId(null)
    setSheet(null)
    setSettingsOpen(false)
    setCreateChoiceOpen(false)
    setTab('ideas')
    setIdeaSheet({ mode: 'create' })
  }, [])

  const openIdeaEdit = useCallback((idea: Idea) => {
    setDetailId(null)
    setSheet(null)
    setCreateChoiceOpen(false)
    setTab('ideas')
    setIdeaSheet({ mode: 'edit', ideaId: idea.id })
  }, [])

  const openSettings = useCallback(() => {
    setDetailId(null)
    setSheet(null)
    setIdeaSheet(null)
    setCreateChoiceOpen(false)
    setImportError(null)
    setSettingsOpen(true)
  }, [])

  const openToday = useCallback(() => {
    setDetailId(null)
    setSheet(null)
    setIdeaSheet(null)
    setCreateChoiceOpen(false)
    setSettingsOpen(false)
    setTodayOpen(true)
  }, [])

  const closeToday = useCallback(() => {
    setTodayOpen(false)
  }, [])

  const handleSave = (draft: PlanDraft) => {
    if (sheet?.mode === 'edit' && sheet.planId) {
      updatePlan(sheet.planId, draft)
      showToast('这条规划已经改好')
    } else {
      addPlan(draft)
      showToast('已经放进时间里')
    }
    setSheet(null)
    setTab('plans')
    scrollToTop()
  }

  const handleIdeaSave = (draft: IdeaDraft) => {
    if (ideaSheet?.mode === 'edit' && ideaSheet.ideaId) {
      updateIdea(ideaSheet.ideaId, draft)
      showToast('想法已经改好')
    } else {
      addIdea(draft)
      showToast('想法已经收好')
    }
    setIdeaSheet(null)
    setTab('ideas')
    scrollToTop()
  }

  const handleDeleteIdeaRequest = (idea: Idea) => {
    setConfirm({
      title: '删除这个想法？',
      description: `「${idea.title}」会从想法页和年轮上消失，这个动作不能撤销。`,
      confirmLabel: '删除想法',
      danger: true,
      action: () => {
        deleteIdea(idea.id)
        showToast('想法已经删除')
      },
    })
  }

  const handleDeleteRequest = (plan: Plan) => {
    setDetailId(null)
    setConfirm({
      title: '永久删除这条规划？',
      description: `「${plan.title}」会从本机消失，这个动作不能撤销。`,
      confirmLabel: '永久删除',
      danger: true,
      action: () => {
        deletePlan(plan.id)
        showToast('已经删除')
      },
    })
  }

  const handleArchive = (plan: Plan) => {
    archivePlan(plan.id)
    setDetailId(null)
    showToast('已经把它放回时间里')
  }

  const handleComplete = (plan: Plan) => {
    completePlan(plan.id)
  }

  const handleReopen = (plan: Plan) => {
    reopenPlan(plan.id)
  }

  const loadDemo = () => {
    replacePlans(createDemoPlans(today))
    replaceIdeas(createDemoIdeas(today))
    setTab('plans')
    scrollToTop()
    showToast('示例已经放进时间和想法')
  }

  const handleExport = async () => {
    if (plans.length === 0 && ideas.length === 0) {
      showToast('还没有可导出的内容', 'red')
      return
    }
    const backup = createBackup(plans, ideas)
    const json = JSON.stringify(backup, null, 2)
    const filename = `knot-backup-${formatDateNumeric(today).replaceAll('.', '-')}.json`
    const exportedText = `${plans.length} 条规划${ideas.length > 0 ? `、${ideas.length} 个想法` : ''}`
    if (native) {
      setSettingsOpen(false)
      try {
        await shareJsonBackup(json, filename)
        showToast('已打开系统分享，可保存到文件或云盘')
      } catch {
        showToast('没有完成分享，请重试', 'red')
      }
      return
    }
    const blob = new Blob([json], {
      type: 'application/json;charset=utf-8',
    })
    downloadBlob(blob, filename)
    setSettingsOpen(false)
    showToast(`已导出 ${exportedText}`)
  }

  const handleImportFile = async (file: File) => {
    setImportError(null)
    try {
      const text = await file.text()
      const imported = parseImport(text)
      setSettingsOpen(false)
      const importedText = `${imported.plans.length} 条规划${imported.ideas.length > 0 ? `、${imported.ideas.length} 个想法` : ''}`
      setConfirm({
        title: '导入这份备份？',
        description: `将用 ${importedText} 覆盖当前 ${plans.length} 条规划和 ${ideas.length} 个想法。建议先导出当前数据。`,
        confirmLabel: '覆盖并导入',
        danger: false,
        action: () => {
          replacePlans(imported.plans)
          replaceIdeas(imported.ideas)
          setTab('plans')
          showToast(`已导入 ${importedText}`)
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取备份失败'
      setImportError(message)
    }
  }

  const handleClearRequest = () => {
    setSettingsOpen(false)
    setConfirm({
      title: '清空全部内容？',
      description: `当前 ${plans.length} 条规划和 ${ideas.length} 个想法会从本机永久消失。建议先导出一份备份。`,
      confirmLabel: '清空全部',
      danger: true,
      action: () => {
        clearPlans()
        clearIdeas()
        showToast('所有规划和想法已清空')
      },
    })
  }

  const handleInstall = async () => {
    if (!installPrompt) {
      setSettingsOpen(false)
      showToast('请从浏览器菜单添加到桌面')
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setSettingsOpen(false)
      showToast('正在安装结绳')
    }
    setInstallPrompt(null)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <div className="app-frame">
        <AppHeader
          onHome={goHome}
          onOpenToday={openToday}
          onOpenSettings={openSettings}
        />

        {persistError && (
          <div className="storage-warning" role="alert">
            当前浏览器无法保存数据，请及时在设置里导出备份。
          </div>
        )}

        <main className="app-main" id="main-content">
          {tab === 'plans' ? (
            <PlansPage
              plans={plans}
              ideas={ideas}
              today={today}
              ringYear={ringYear}
              onRingYearChange={setRingYear}
              onSelectPlan={openDetail}
              onToggleCheckIn={(planId, date) => toggleCheckIn(planId, date)}
              onNewPlan={openCreate}
              onLoadDemo={loadDemo}
            />
          ) : (
            <IdeasPage
              ideas={ideas}
              onNewIdea={openIdeaCreate}
              onEditIdea={openIdeaEdit}
              onDeleteIdea={handleDeleteIdeaRequest}
            />
          )}
        </main>

        <BottomNav
          activeTab={tab}
          onChange={(nextTab) => {
            setTab(nextTab)
            scrollToTop()
          }}
          onCreate={openCreateChoice}
        />

        <PlanSheet
          open={Boolean(sheet)}
          mode={sheet?.mode ?? 'create'}
          plan={sheetPlan}
          today={today}
          onClose={() => setSheet(null)}
          onSave={handleSave}
        />

        <IdeaSheet
          open={Boolean(ideaSheet)}
          mode={ideaSheet?.mode ?? 'create'}
          idea={sheetIdea}
          today={today}
          onClose={() => setIdeaSheet(null)}
          onSave={handleIdeaSave}
        />

        <CreateChoiceSheet
          open={createChoiceOpen}
          onClose={() => setCreateChoiceOpen(false)}
          onPlan={openCreate}
          onIdea={openIdeaCreate}
        />

        {detailPlan && (
          <PlanDetail
            key={detailPlan.id}
            plan={detailPlan}
            today={today}
            onClose={() => setDetailId(null)}
            onEdit={() => openEdit(detailPlan)}
            onToggleSubgoal={(subgoalId) => toggleSubgoal(detailPlan.id, subgoalId)}
            onToggleCheckIn={(date) => toggleCheckIn(detailPlan.id, date)}
            onComplete={() => handleComplete(detailPlan)}
            onReopen={() => handleReopen(detailPlan)}
            onArchive={() => handleArchive(detailPlan)}
            onDelete={() => handleDeleteRequest(detailPlan)}
          />
        )}

        <SettingsSheet
          open={settingsOpen}
          planCount={plans.length}
          ideaCount={ideas.length}
          canInstall={Boolean(installPrompt)}
          isStandalone={isStandalone}
          isNativeApp={native}
          isDesktopApp={desktop}
          backupStatus={backupStatus}
          lastNativeSave={lastNativeSave}
          importError={importError}
          onClose={() => setSettingsOpen(false)}
          onExport={() => void handleExport()}
          onImportFile={handleImportFile}
          onClearAll={handleClearRequest}
          onInstall={() => void handleInstall()}
        />

        <ConfirmDialog
          open={Boolean(confirm)}
          title={confirm?.title ?? ''}
          description={confirm?.description ?? ''}
          confirmLabel={confirm?.confirmLabel ?? '确定'}
          danger={confirm?.danger ?? false}
          onConfirm={() => {
            if (!confirm) return
            const action = confirm.action
            setConfirm(null)
            action()
          }}
          onCancel={() => setConfirm(null)}
        />

        {todayOpen && (
          <TodayPage
            plans={plans}
            today={today}
            onClose={closeToday}
            onToast={showToast}
          />
        )}

        <Toast toast={toast} onDismiss={dismiss} />
      </div>

      {!splashDone && <SplashScreen onDone={finishSplash} />}
    </div>
  )
}
