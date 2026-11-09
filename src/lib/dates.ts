const DAY_MS = 86_400_000

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function parseISODate(iso: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null
  }
  return [year, month, day]
}

export function isISODate(iso: unknown): iso is string {
  return typeof iso === 'string' && parseISODate(iso) !== null
}

export function toISODateLocal(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function todayISO(): string {
  return toISODateLocal(new Date())
}

export function isoToUTC(iso: string): number {
  const parts = parseISODate(iso)
  if (!parts) return Number.NaN
  return Date.UTC(parts[0], parts[1] - 1, parts[2])
}

export function utcToISO(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

export function diffDays(from: string, to: string): number {
  return Math.round((isoToUTC(to) - isoToUTC(from)) / DAY_MS)
}

export function addDays(iso: string, days: number): string {
  const timestamp = isoToUTC(iso)
  if (Number.isNaN(timestamp)) return iso
  return utcToISO(timestamp + days * DAY_MS)
}

export function addMonths(iso: string, months: number): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  const [year, month, day] = parts
  const targetMonthIndex = year * 12 + (month - 1) + months
  const targetYear = Math.floor(targetMonthIndex / 12)
  const targetMonth = (targetMonthIndex % 12 + 12) % 12 + 1
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth))
  return `${targetYear}-${pad2(targetMonth)}-${pad2(targetDay)}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function startOfMonth(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${parts[0]}-${pad2(parts[1])}-01`
}

export function endOfMonth(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${parts[0]}-${pad2(parts[1])}-${pad2(daysInMonth(parts[0], parts[1]))}`
}

export function startOfYear(year: number): string {
  return `${year}-01-01`
}

export function endOfYear(year: number): string {
  return `${year}-12-31`
}

export function yearOf(iso: string): number {
  return parseISODate(iso)?.[0] ?? new Date().getFullYear()
}

export function monthOf(iso: string): number {
  return parseISODate(iso)?.[1] ?? 1
}

export function dayOfYear(iso: string): number {
  const parts = parseISODate(iso)
  if (!parts) return 1
  const [year, month, day] = parts
  const start = Date.UTC(year, 0, 1)
  return Math.round((Date.UTC(year, month - 1, day) - start) / DAY_MS) + 1
}

export function yearProgressRatio(iso: string): number {
  const year = yearOf(iso)
  return clamp(dayOfYear(iso) / daysInYear(year), 0, 1)
}

export function yearRemainingDays(iso: string): number {
  const year = yearOf(iso)
  return daysInYear(year) - dayOfYear(iso)
}

export function formatDateLong(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${parts[0]}年${parts[1]}月${parts[2]}日`
}

export function formatMonthDay(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${parts[1]}月${parts[2]}日`
}

export function formatDateNumeric(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${parts[0]}.${pad2(parts[1])}.${pad2(parts[2])}`
}

export function formatDateDot(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${pad2(parts[1])}.${pad2(parts[2])}`
}

export function formatMonthNumeric(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${parts[0]}.${pad2(parts[1])}`
}

export function formatMonthLabel(iso: string): string {
  const parts = parseISODate(iso)
  if (!parts) return iso
  return `${parts[1]}月`
}

export function formatWeekday(iso: string): string {
  const timestamp = isoToUTC(iso)
  if (Number.isNaN(timestamp)) return ''
  return WEEKDAYS[new Date(timestamp).getUTCDay()]
}

export function formatRange(start: string, end: string): string {
  return `${formatDateNumeric(start)} — ${formatDateNumeric(end)}`
}

export function formatRangeShort(start: string, end: string): string {
  const startParts = parseISODate(start)
  const endParts = parseISODate(end)
  if (!startParts || !endParts) return formatRange(start, end)
  if (startParts[0] === endParts[0]) {
    if (startParts[1] === endParts[1]) {
      return `${startParts[1]}月${startParts[2]}日 — ${endParts[2]}日`
    }
    return `${startParts[1]}月${startParts[2]}日 — ${endParts[1]}月${endParts[2]}日`
  }
  return `${startParts[0]}.${pad2(startParts[1])} — ${endParts[0]}.${pad2(endParts[1])}`
}

export function formatRangeMonths(start: string, end: string): string {
  const startParts = parseISODate(start)
  const endParts = parseISODate(end)
  if (!startParts || !endParts) return ''
  if (startParts[0] === endParts[0]) {
    return `${startParts[0]}.${pad2(startParts[1])} — ${pad2(endParts[1])}`
  }
  return `${startParts[0]}.${pad2(startParts[1])} — ${endParts[0]}.${pad2(endParts[1])}`
}

export function daysBetweenInclusive(start: string, end: string): number {
  return Math.max(1, diffDays(start, end) + 1)
}

export function nowISOString(): string {
  return new Date().toISOString()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function minISO(dates: string[]): string {
  return [...dates].sort()[0] ?? todayISO()
}

export function maxISO(dates: string[]): string {
  return [...dates].sort().at(-1) ?? todayISO()
}

export function getGreeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}
