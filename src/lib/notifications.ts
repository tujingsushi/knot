import { Capacitor } from '@capacitor/core'
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications'
import type { Plan } from '../types'
import { addDays, parseISODate, todayISO } from './dates'

const LOOKAHEAD_DAYS = 14
const MAX_NOTIFICATIONS = 50
const DEFAULT_CHECK_IN_TIME = '20:00'
const CHANNEL_ID = 'knot-reminders'

export interface NotificationState {
  supported: boolean
  permission: string
  pending: number
  lastError?: string
}

export interface TestNotificationResult {
  ok: boolean
  message?: string
}

function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

let lastNotificationError = ''

export function getLastNotificationError(): string {
  return lastNotificationError
}

async function ensureChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: '规划与打卡提醒',
      description: '规划开始、结束和每日打卡提醒',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
  } catch {
    // Fall back to the plugin's default channel.
  }
}

function localDateTime(date: string, time: string): Date | null {
  const parts = parseISODate(date)
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  if (!parts || !match) return null
  const [year, month, day] = parts
  return new Date(year, month - 1, day, Number(match[1]), Number(match[2]), 0, 0)
}

function stableId(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 2147483000 + 1
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const current = await LocalNotifications.checkPermissions()
    if (current.display === 'granted') return true
    const result = await LocalNotifications.requestPermissions()
    return result.display === 'granted'
  } catch {
    return false
  }
}

export async function getNotificationState(): Promise<NotificationState> {
  if (!isNative()) {
    return { supported: false, permission: 'unsupported', pending: 0 }
  }
  try {
    const permission = await LocalNotifications.checkPermissions()
    const pending = await LocalNotifications.getPending()
    return {
      supported: true,
      permission: permission.display,
      pending: pending.notifications.length,
      lastError: lastNotificationError || undefined,
    }
  } catch {
    return {
      supported: true,
      permission: 'unknown',
      pending: 0,
      lastError: lastNotificationError || undefined,
    }
  }
}

export async function sendTestNotification(): Promise<TestNotificationResult> {
  if (!isNative()) {
    return { ok: false, message: '提醒只在手机 App 中生效' }
  }
  try {
    const granted = await requestNotificationPermission()
    if (!granted) {
      return { ok: false, message: '通知权限未开启，请到系统设置中允许' }
    }
    await ensureChannel()
    const id = stableId(`test:${Date.now()}`)
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: '结绳提醒测试',
          body: '看到这条通知，说明提醒功能已经正常工作。',
          channelId: CHANNEL_ID,
          extra: { kind: 'test' },
        },
      ],
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : '发送测试通知失败',
    }
  }
}

export async function syncPlanNotifications(plans: Plan[]): Promise<void> {
  if (!isNative()) return
  lastNotificationError = ''
  try {
    const permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') return

    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((notification) => ({
          id: notification.id,
        })),
      })
    }

    await ensureChannel()

    const today = todayISO()
    const now = Date.now()
    const scheduled = new Map<number, LocalNotificationSchema>()
    const add = (
      key: string,
      date: string,
      time: string,
      title: string,
      body: string,
      planId: string,
      kind: string,
    ) => {
      const at = localDateTime(date, time)
      if (!at || at.getTime() <= now) return
      const id = stableId(key)
      if (scheduled.has(id)) return
      scheduled.set(id, {
        id,
        title,
        body,
        isExactNotification: false,
        channelId: CHANNEL_ID,
        schedule: {
          at,
          allowWhileIdle: true,
        },
        extra: { planId, kind },
      })
    }

    for (const plan of plans) {
      if (plan.status !== 'active') continue

      if (plan.reminderEnabled) {
        add(
          `${plan.id}:start`,
          plan.startDate,
          '09:00',
          '规划开始',
          `《${plan.title}》从今天开始`,
          plan.id,
          'plan-start',
        )
        add(
          `${plan.id}:end`,
          plan.endDate,
          '20:00',
          '规划即将结束',
          `《${plan.title}》今天结束`,
          plan.id,
          'plan-end',
        )
      }

      if (plan.checkInEnabled && plan.checkInReminderEnabled) {
        const time = plan.checkInReminderTime || DEFAULT_CHECK_IN_TIME
        for (let offset = 0; offset < LOOKAHEAD_DAYS; offset += 1) {
          const date = addDays(today, offset)
          if (date < plan.startDate || date > plan.endDate) continue
          add(
            `${plan.id}:checkin:${date}:${time}`,
            date,
            time,
            '打卡提醒',
            `《${plan.title}》今天还没打卡`,
            plan.id,
            'check-in',
          )
        }
      }
    }

    const notifications = [...scheduled.values()]
      .sort((a, b) => {
        const aTime = a.schedule?.at?.getTime() ?? 0
        const bTime = b.schedule?.at?.getTime() ?? 0
        return aTime - bTime
      })
      .slice(0, MAX_NOTIFICATIONS)

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch (error) {
    lastNotificationError =
      error instanceof Error ? error.message : '安排提醒失败'
  }
}
