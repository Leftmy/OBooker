export const OFFICE_TZ = 'Europe/Kyiv'
export const OFFICE_OPEN_HOUR = 9
export const OFFICE_CLOSE_HOUR = 19
export const SLOT_MINUTES = 30

export const localTz =
  typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC'

export const isDifferentTz = localTz !== OFFICE_TZ

/** Helper to validate Date objects */
export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime())
}

/** Helper to safely parse Date or string into a valid Date object */
export function safeDate(d: Date | string | number | undefined | null): Date {
  if (!d) return new Date()
  const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d
  return isValidDate(date) ? date : new Date()
}

export function getGmtOffsetLabel(timeZone: string, date: Date | string = new Date()): string {
  const safeD = safeDate(date)
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
    const parts = dtf.formatToParts(safeD)
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

export interface SlotInfo {
  index: number
  utcStart: Date
  utcEnd: Date
  userLabel: string
  officeLabel: string
}

export function getOfficeDaySlots(officeCalDate: Date | string): SlotInfo[] {
  const { y, mo, d } = calParts(officeCalDate)

  const officeStartUtc = zonedTimeToUtc(y, mo, d, OFFICE_OPEN_HOUR, 0, OFFICE_TZ)
  const totalSlots = ((OFFICE_CLOSE_HOUR - OFFICE_OPEN_HOUR) * 60) / SLOT_MINUTES

  const slots: SlotInfo[] = []

  for (let i = 0; i < totalSlots; i++) {
    const utcStart = new Date(officeStartUtc.getTime() + i * SLOT_MINUTES * 60000)
    const utcEnd = new Date(utcStart.getTime() + SLOT_MINUTES * 60000)

    const userLabel = formatInZone(utcStart, localTz, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const officeLabel = formatInZone(utcStart, OFFICE_TZ, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    slots.push({
      index: i,
      utcStart,
      utcEnd,
      userLabel,
      officeLabel,
    })
  }

  return slots
}

export function isWithinOfficeHours(startTime: Date | string, endTime: Date | string): boolean {
  const startParts = partsInZone(startTime, OFFICE_TZ)
  const endParts = partsInZone(endTime, OFFICE_TZ)

  const startMinutes = startParts.hour * 60 + startParts.minute
  const endMinutes = endParts.hour * 60 + endParts.minute

  const officeOpenMinutes = OFFICE_OPEN_HOUR * 60
  const officeCloseMinutes = OFFICE_CLOSE_HOUR * 60

  return startMinutes >= officeOpenMinutes && endMinutes <= officeCloseMinutes
}

function zoneOffsetMinutes(date: Date | string, timeZone: string): number {
  const safeD = safeDate(date)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(safeD)
  const map: Record<string, number> = {}
  for (const p of parts) if (p.type !== 'literal') map[p.type] = Number(p.value)
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second)
  return (asUTC - safeD.getTime()) / 60000
}

export function zonedTimeToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi)
  const offset = zoneOffsetMinutes(new Date(utcGuess), timeZone)
  return new Date(utcGuess - offset * 60000)
}

export interface ZonedParts {
  y: number
  mo: number
  d: number
  hour: number
  minute: number
  weekday: number
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

export function partsInZone(date: Date | string, timeZone: string = OFFICE_TZ): ZonedParts {
  const safeD = safeDate(date)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  })
  const map: Record<string, string> = {}
  for (const p of dtf.formatToParts(safeD)) if (p.type !== 'literal') map[p.type] = p.value
  return {
    y: Number(map.year),
    mo: Number(map.month),
    d: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  }
}

export function formatInZone(
  date: Date | string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const safeD = safeDate(date)
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(safeD)
  } catch {
    return ''
  }
}

export function calDate(y: number, mo: number, d: number): Date {
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
}

export function calParts(date: Date | string) {
  const safeD = safeDate(date)
  return { y: safeD.getUTCFullYear(), mo: safeD.getUTCMonth() + 1, d: safeD.getUTCDate() }
}

export function officeToday(): Date {
  const p = partsInZone(new Date(), OFFICE_TZ)
  return calDate(p.y, p.mo, p.d)
}

export function formatRangeLocal(startIso: string, endIso: string): string {
  const start = safeDate(startIso)
  const end = safeDate(endIso)
  const day = formatInZone(start, localTz, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const t = (d: Date) =>
    formatInZone(d, localTz, { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day} · ${t(start)}–${t(end)}`
}

/** Adds the specified number of days to a Date object */
export function addDays(date: Date | string, days: number): Date {
  const safeD = safeDate(date)
  const result = new Date(safeD)
  result.setDate(result.getDate() + days)
  return result
}

/** Calculates the duration between two dates in minutes */
export function durationMinutes(start: Date | string, end: Date | string): number {
  const startDate = safeDate(start)
  const endDate = safeDate(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000)
}

/** Calculates minutes elapsed from office opening time */
export function officeMinutesFromOpen(date: Date | string): number {
  const d = safeDate(date)
  const parts = partsInZone(d, OFFICE_TZ)
  return parts.hour * 60 + parts.minute - OFFICE_OPEN_HOUR * 60
}

/** Checks whether two dates fall on the same calendar day in the given timezone */
export function sameCalDate(d1: Date | string, d2: Date | string, timeZone: string = OFFICE_TZ): boolean {
  const p1 = partsInZone(d1, timeZone)
  const p2 = partsInZone(d2, timeZone)
  return p1.y === p2.y && p1.mo === p2.mo && p1.d === p2.d
}

/** Generates an array of time slot labels (e.g., ["09:00", "09:30", ...]) */
export function slotLabels(
  openHour: number = OFFICE_OPEN_HOUR,
  closeHour: number = OFFICE_CLOSE_HOUR,
  stepMinutes: number = SLOT_MINUTES,
): string[] {
  const labels: string[] = []
  const startTotal = openHour * 60
  const endTotal = closeHour * 60

  for (let m = startTotal; m <= endTotal; m += stepMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    labels.push(`${hh}:${mm}`)
  }
  return labels
}

/** Converts an "HH:MM" string label to total minutes from midnight */
export function labelToMinutes(label: string): number {
  if (!label) return 0
  const [h, m] = label.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Returns Monday of the current week in office timezone */
export function startOfOfficeWeek(date: Date | string = new Date()): Date {
  const safeD = safeDate(date)
  const p = partsInZone(safeD, OFFICE_TZ)
  const todayCal = calDate(p.y, p.mo, p.d)
  const day = p.weekday // 0 = Sun, 1 = Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day
  return addDays(todayCal, diffToMonday)
}