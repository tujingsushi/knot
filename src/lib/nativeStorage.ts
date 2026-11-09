import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { Idea, Plan } from '../types'
import { nowISOString } from './dates'
import { parseAppPayload } from './storage'

const DATA_FILE = 'sancheng-plans.json'
const BACKUP_FILE = 'sancheng-plans.backup.json'
let backupMadeThisSession = false

export interface NativeSnapshot {
  plans: Plan[]
  ideas: Idea[]
  savedAt: string
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

async function readTextFile(path: string): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({
      path,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
    if (typeof result.data === 'string') return result.data
    return await result.data.text()
  } catch {
    return null
  }
}

function parseSnapshot(text: string | null): NativeSnapshot | null {
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    const payload = parseAppPayload(parsed)
    if (!payload) return null
    const savedAt =
      typeof parsed.exportedAt === 'string'
        ? parsed.exportedAt
        : typeof parsed.savedAt === 'string'
          ? parsed.savedAt
          : nowISOString()
    return { plans: payload.plans, ideas: payload.ideas, savedAt }
  } catch {
    return null
  }
}

export async function readNativeSnapshot(): Promise<NativeSnapshot | null> {
  const primary = parseSnapshot(await readTextFile(DATA_FILE))
  if (primary) return primary
  return parseSnapshot(await readTextFile(BACKUP_FILE))
}

async function copyCurrentFileToBackup(): Promise<void> {
  if (backupMadeThisSession) return
  backupMadeThisSession = true
  const current = await readTextFile(DATA_FILE)
  if (!current) return
  try {
    await Filesystem.writeFile({
      path: BACKUP_FILE,
      data: current,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
  } catch {
    // Best-effort secondary copy.
  }
}

export async function writeNativeSnapshot(plans: Plan[], ideas: Idea[]): Promise<string> {
  if (!isNativeApp()) throw new Error('当前不是原生运行环境')
  await copyCurrentFileToBackup()
  const savedAt = nowISOString()
  const payload = {
    app: 'sancheng',
    version: 2,
    exportedAt: savedAt,
    plans,
    ideas,
  }
  await Filesystem.writeFile({
    path: DATA_FILE,
    data: JSON.stringify(payload, null, 2),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  })
  return savedAt
}

export async function shareJsonBackup(json: string, filename: string): Promise<void> {
  await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  })
  await Share.share({
    title: '结绳备份',
    url: uri,
    dialogTitle: '保存或分享结绳备份',
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.readAsDataURL(blob)
  })
}

export async function sharePngFile(blob: Blob, filename: string): Promise<void> {
  const base64 = await blobToBase64(blob)
  await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })
  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  })
  await Share.share({
    title: '结绳 · 今日一页',
    url: uri,
    dialogTitle: '保存或分享今日一页',
  })
}

export function formatNativeSaveTime(savedAt: string | null): string {
  if (!savedAt) return '还没有写入过文件'
  const date = new Date(savedAt)
  if (Number.isNaN(date.getTime())) return '刚刚保存'
  const today = new Date()
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return sameDay
    ? `今天 ${time}`
    : `${date.getMonth() + 1}月${date.getDate()}日 ${time}`
}
