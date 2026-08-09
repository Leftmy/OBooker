export const OFFICE_TZ = 'Europe/Kyiv'
export const OFFICE_OPEN_HOUR = 9
export const OFFICE_CLOSE_HOUR = 19
export const SLOT_MINUTES = 30

export const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone

/** Minutes that `date` is offset from UTC in the given time zone. */
function zoneOffsetMinutes(date: Date, timeZone: string): number {
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
  const parts = dtf.formatToParts(date)
  const map: Record<string, number> = {}
  for (const p of parts) if (p.type !== 'literal') map[p.type] = Number(p.value)
  const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second)
  return (asUTC - date.getTime()) / 60000
}

/** Convert a wall-clock time in `timeZone` into the corresponding UTC Date. */
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
  weekday: number // 0 = Sunday
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/** Break a UTC instant into its wall-clock parts in the given time zone. */
export function partsInZone(date: Date, timeZone: string): ZonedParts {
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
  for (const p of dtf.formatToParts(date)) if (p.type !== 'literal') map[p.type] = p.value
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
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(date)
}

/** A calendar date represented as a UTC-noon Date, safe from tz shifting. */
export function calDate(y: number, mo: number, d: number): Date {
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
}

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86400000)
}

export function calParts(date: Date) {
  return { y: date.getUTCFullYear(), mo: date.getUTCMonth() + 1, d: date.getUTCDate() }
}

/** Monday-based start of the week containing the given office calendar date. */
export function startOfOfficeWeek(date: Date): Date {
  const dow = date.getUTCDay() // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow
  return addDays(date, diff)
}

/** Today's calendar date in office time, as a UTC-noon Date. */
export function officeToday(): Date {
  const p = partsInZone(new Date(), OFFICE_TZ)
  return calDate(p.y, p.mo, p.d)
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export const SLOTS_PER_DAY =
  ((OFFICE_CLOSE_HOUR - OFFICE_OPEN_HOUR) * 60) / SLOT_MINUTES

/** Labels like "09:00", "09:30" ... for slot starts. */
export function slotLabels(): string[] {
  const out: string[] = []
  for (let i = 0; i <= SLOTS_PER_DAY; i++) {
    const total = OFFICE_OPEN_HOUR * 60 + i * SLOT_MINUTES
    const h = Math.floor(total / 60)
    const m = total % 60
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return out
}

export function labelToMinutes(label: string): number {
  const [h, m] = label.split(':').map(Number)
  return h * 60 + m
}

/** minutes since office open for a booking's office-local start */
export function officeMinutesFromOpen(date: Date): number {
  const p = partsInZone(date, OFFICE_TZ)
  return (p.hour - OFFICE_OPEN_HOUR) * 60 + p.minute
}

export function sameCalDate(a: Date, b: { y: number; mo: number; d: number }) {
  return (
    a.getUTCFullYear() === b.y && a.getUTCMonth() + 1 === b.mo && a.getUTCDate() === b.d
  )
}

export function formatRangeLocal(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const day = formatInZone(start, localTz, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const t = (d: Date) =>
    formatInZone(d, localTz, { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day} · ${t(start)}–${t(end)}`
}

export function durationMinutes(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
}
