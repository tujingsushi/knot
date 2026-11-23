import { useCallback, useEffect, useRef, useState } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import type { Idea, Plan } from '../types'
import { IDEAS_STORAGE_KEY, STORAGE_KEY } from '../lib/constants'
import {
  archiveIdea as archiveIdeaData,
  completeIdea as completeIdeaData,
  createIdea,
  reopenIdea as reopenIdeaData,
  restoreIdea as restoreIdeaData,
  updateIdea as updateIdeaData,
  type IdeaDraft,
} from '../lib/ideas'
import {
  archivePlan as archivePlanData,
  completePlan as completePlanData,
  createPlan,
  reopenPlan as reopenPlanData,
  toggleCheckIn as toggleCheckInData,
  toggleSubgoal as toggleSubgoalData,
  updatePlan as updatePlanData,
  type PlanDraft,
} from '../lib/plans'
import { loadIdeas, loadPlans, saveIdeas, savePlans } from '../lib/storage'
import {
  isNativeApp,
  readNativeSnapshot,
  writeNativeSnapshot,
} from '../lib/nativeStorage'

export type NativeBackupStatus =
  | 'unavailable'
  | 'restoring'
  | 'saving'
  | 'saved'
  | 'error'

export interface PlansApi {
  plans: Plan[]
  ideas: Idea[]
  persistError: boolean
  native: boolean
  backupStatus: NativeBackupStatus
  lastNativeSave: string | null
  addPlan: (draft: PlanDraft) => Plan
  updatePlan: (id: string, draft: PlanDraft) => void
  toggleSubgoal: (planId: string, subgoalId: string) => void
  toggleCheckIn: (planId: string, date: string) => void
  completePlan: (id: string) => void
  reopenPlan: (id: string) => void
  archivePlan: (id: string) => void
  deletePlan: (id: string) => void
  addIdea: (draft: IdeaDraft) => Idea
  updateIdea: (id: string, draft: IdeaDraft) => void
  completeIdea: (id: string) => void
  reopenIdea: (id: string) => void
  archiveIdea: (id: string) => void
  restoreIdea: (id: string) => void
  deleteIdea: (id: string) => void
  replacePlans: (plans: Plan[]) => void
  replaceIdeas: (ideas: Idea[]) => void
  clearPlans: () => void
  clearIdeas: () => void
  backupNow: () => Promise<boolean>
}

export function usePlans(): PlansApi {
  const native = isNativeApp()
  const [plans, setPlans] = useState<Plan[]>(() => loadPlans())
  const [ideas, setIdeas] = useState<Idea[]>(() => loadIdeas())
  const [persistError, setPersistError] = useState(false)
  const [nativeReady, setNativeReady] = useState(!native)
  const [backupStatus, setBackupStatus] = useState<NativeBackupStatus>(
    native ? 'restoring' : 'unavailable',
  )
  const [lastNativeSave, setLastNativeSave] = useState<string | null>(null)
  const hasMounted = useRef(false)
  const latestPlans = useRef(plans)
  const latestIdeas = useRef(ideas)
  const nativeReadyRef = useRef(nativeReady)

  latestPlans.current = plans
  latestIdeas.current = ideas
  nativeReadyRef.current = nativeReady

  useEffect(() => {
    const plansOk = savePlans(plans)
    const ideasOk = saveIdeas(ideas)
    if (!plansOk || !ideasOk) setPersistError(true)
    else if (hasMounted.current) setPersistError(false)
    hasMounted.current = true
  }, [plans, ideas])

  useEffect(() => {
    if (!native) return
    let cancelled = false
    setBackupStatus('restoring')
    void (async () => {
      const snapshot = await readNativeSnapshot()
      if (cancelled) return
      if (snapshot) {
        setLastNativeSave(snapshot.savedAt)
        const currentPlans = latestPlans.current
        const currentIdeas = latestIdeas.current
        // Local storage is the live source of truth once the app has data.
        // Only use the native snapshot to seed a fresh install; never let an
        // older background snapshot overwrite a just-saved idea edit.
        if (currentPlans.length === 0 && currentIdeas.length === 0) {
          setPlans(snapshot.plans)
          setIdeas(snapshot.ideas)
        }
      }
      setBackupStatus('saved')
      setNativeReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [native])

  useEffect(() => {
    if (!native || !nativeReady) return
    setBackupStatus('saving')
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const savedAt = await writeNativeSnapshot(plans, ideas)
          setLastNativeSave(savedAt)
          setBackupStatus('saved')
        } catch {
          setBackupStatus('error')
        }
      })()
    }, 350)
    return () => window.clearTimeout(timer)
  }, [plans, ideas, native, nativeReady])

  useEffect(() => {
    if (!native) return
    let listenerHandle: { remove: () => Promise<void> } | null = null
    void (async () => {
      listenerHandle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive || !nativeReadyRef.current) return
        void (async () => {
          try {
            const savedAt = await writeNativeSnapshot(latestPlans.current, latestIdeas.current)
            setLastNativeSave(savedAt)
            setBackupStatus('saved')
          } catch {
            setBackupStatus('error')
          }
        })()
      })
    })()
    return () => {
      if (listenerHandle) void listenerHandle.remove()
    }
  }, [native])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setPlans(loadPlans())
      }
      if (event.key === IDEAS_STORAGE_KEY) {
        setIdeas(loadIdeas())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addPlan = useCallback((draft: PlanDraft): Plan => {
    const plan = createPlan(draft)
    setPlans((current) => [...current, plan])
    return plan
  }, [])

  const updatePlan = useCallback((id: string, draft: PlanDraft) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? updatePlanData(plan, draft) : plan)),
    )
  }, [])

  const toggleSubgoal = useCallback((planId: string, subgoalId: string) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId ? toggleSubgoalData(plan, subgoalId) : plan,
      ),
    )
  }, [])

  const toggleCheckIn = useCallback((planId: string, date: string) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId ? toggleCheckInData(plan, date) : plan,
      ),
    )
  }, [])

  const completePlan = useCallback((id: string) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? completePlanData(plan) : plan)),
    )
  }, [])

  const reopenPlan = useCallback((id: string) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? reopenPlanData(plan) : plan)),
    )
  }, [])

  const archivePlan = useCallback((id: string) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? archivePlanData(plan) : plan)),
    )
  }, [])

  const deletePlan = useCallback((id: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== id))
  }, [])

  const addIdea = useCallback((draft: IdeaDraft): Idea => {
    const idea = createIdea(draft)
    setIdeas((current) => [...current, idea])
    return idea
  }, [])

  const updateIdea = useCallback((id: string, draft: IdeaDraft) => {
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? updateIdeaData(idea, draft) : idea)),
    )
  }, [])

  const completeIdea = useCallback((id: string) => {
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? completeIdeaData(idea) : idea)),
    )
  }, [])

  const reopenIdea = useCallback((id: string) => {
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? reopenIdeaData(idea) : idea)),
    )
  }, [])

  const archiveIdea = useCallback((id: string) => {
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? archiveIdeaData(idea) : idea)),
    )
  }, [])

  const restoreIdea = useCallback((id: string) => {
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? restoreIdeaData(idea) : idea)),
    )
  }, [])

  const deleteIdea = useCallback((id: string) => {
    setIdeas((current) => current.filter((idea) => idea.id !== id))
  }, [])

  const replacePlans = useCallback((nextPlans: Plan[]) => {
    setPlans(nextPlans)
  }, [])

  const replaceIdeas = useCallback((nextIdeas: Idea[]) => {
    setIdeas(nextIdeas)
  }, [])

  const clearPlans = useCallback(() => {
    setPlans([])
  }, [])

  const clearIdeas = useCallback(() => {
    setIdeas([])
  }, [])

  const backupNow = useCallback(async (): Promise<boolean> => {
    if (!native) return false
    setBackupStatus('saving')
    try {
      const savedAt = await writeNativeSnapshot(plans, ideas)
      setLastNativeSave(savedAt)
      setBackupStatus('saved')
      return true
    } catch {
      setBackupStatus('error')
      return false
    }
  }, [native, plans, ideas])

  return {
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
    completeIdea,
    reopenIdea,
    archiveIdea,
    restoreIdea,
    deleteIdea,
    replacePlans,
    replaceIdeas,
    clearPlans,
    clearIdeas,
    backupNow,
  }
}
