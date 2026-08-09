import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, errorMessage } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import type { Booking, Room } from '../lib/types'
import {
  OFFICE_CLOSE_HOUR,
  OFFICE_OPEN_HOUR,
  OFFICE_TZ,
  addDays,
  calParts,
  durationMinutes,
  formatInZone,
  localTz,
  officeMinutesFromOpen,
  officeToday,
  partsInZone,
  sameCalDate,
  slotLabels,
  startOfOfficeWeek,
  zonedTimeToUtc,
} from '../lib/time'
import { BookingModal, type BookingDraft } from './BookingModal'
import { ConfirmDialog } from './ConfirmDialog'
import { Badge } from './ui'

const SLOT_H = 46 // px per 30-minute slot
const TOTAL_MIN = (OFFICE_CLOSE_HOUR - OFFICE_OPEN_HOUR) * 60
const GRID_H = (TOTAL_MIN / 30) * SLOT_H
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function isoToWeekStart(iso: string | null): Date {
  if (iso) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) return startOfOfficeWeek(d)
  }
  return startOfOfficeWeek(officeToday())
}

export function CalendarView() {
  const { user } = useAuth()
  const { route, navigate } = useRouter()
  const toast = useToast()

  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [roomId, setRoomId] = useState<string>(route.params.get('room') ?? '')
  const [weekStart, setWeekStart] = useState<Date>(() =>
    isoToWeekStart(route.params.get('week')),
  )
  const [now, setNow] = useState(() => new Date())

  const [draft, setDraft] = useState<BookingDraft | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Load rooms once.
  useEffect(() => {
    api.listRooms()
      .then((r) => {
        setRooms(r)
        setRoomId((cur) => cur || route.params.get('room') || r[0]?.id || '')
      })
      .catch((err) => toast.error(errorMessage(err)))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch bookings when room or week changes
  useEffect(() => {
    if (!roomId) return
    setLoading(true)

    const start = new Date(weekStart)
    start.setUTCHours(0, 0, 0, 0)
    const startDate = start.toISOString()

    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
    const endDate = end.toISOString()

    api.listBookings({ roomId, startDate, endDate })
      .then((b) => setBookings(b))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [roomId, weekStart])

  // Respond to deep links from "My Bookings".
  useEffect(() => {
    const r = route.params.get('room')
    const w = route.params.get('week')
    if (r) setRoomId(r)
    if (w) setWeekStart(isoToWeekStart(w))
  }, [route.params])

  // Tick the current-time line every 30s.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  // Scroll the grid to a sensible starting point (08:30-ish before open).
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const minsNow = officeMinutesFromOpen(new Date())
      const target = minsNow > 0 && minsNow < TOTAL_MIN ? (minsNow / 30) * SLOT_H - 120 : 0
      scrollRef.current.scrollTop = Math.max(0, target)
    }
  }, [loading])

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )
  const labels = useMemo(() => slotLabels(), [])
  const room = rooms.find((r) => r.id === roomId)
  const today = officeToday()

  // Bookings for the visible room, indexed by day column.
  const byDay = useMemo(() => {
    const map: Booking[][] = days.map(() => [])
    for (const b of bookings) {
      if (b.roomId !== roomId) continue
      const p = partsInZone(new Date(b.startTime), OFFICE_TZ)
      const idx = days.findIndex((d) => sameCalDate(d, p))
      if (idx >= 0) map[idx].push(b)
    }
    return map
  }, [bookings, days, roomId])

  const rangeLabel = useMemo(() => {
    const a = formatInZone(days[0], OFFICE_TZ, { month: 'short', day: 'numeric' })
    const b = formatInZone(days[6], OFFICE_TZ, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${a} - ${b}`
  }, [days])

  // Local-time equivalents of office hours for the banner.
  const localWindow = useMemo(() => {
    const p = calParts(officeToday())
    const open = zonedTimeToUtc(p.y, p.mo, p.d, OFFICE_OPEN_HOUR, 0, OFFICE_TZ)
    const close = zonedTimeToUtc(p.y, p.mo, p.d, OFFICE_CLOSE_HOUR, 0, OFFICE_TZ)
    const fmt = (d: Date) =>
      formatInZone(d, localTz, { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${fmt(open)}-${fmt(close)}`
  }, [])

  const sameTz = localTz === OFFICE_TZ

  const goToday = () => setWeekStart(startOfOfficeWeek(officeToday()))
  const shiftWeek = (n: number) => setWeekStart((w) => addDays(w, n * 7))

  const openDraft = useCallback(
    (day: Date, startLabel: string) => {
      if (!roomId) return
      setDraft({ roomId, day, startLabel })
    },
    [roomId],
  )

  const onCreated = (booking: Booking) => {
    setBookings((prev) => [...prev, booking])
    setDraft(null)
    toast.success('Booking created successfully.')
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await api.cancelBooking(cancelTarget.id)
      setBookings((prev) => prev.filter((b) => b.id !== cancelTarget.id))
      setCancelTarget(null)
      toast.success('Booking cancelled.')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  const nowOffset = officeMinutesFromOpen(now)
  const showNowLine = nowOffset >= 0 && nowOffset <= TOTAL_MIN

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="obk-spin size-8 rounded-full border-[3px] border-slate-200 border-t-indigo-500" />
          <p className="text-sm font-medium">Loading schedule…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Room selector */}
      <div className="mb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Room schedule
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Pick a room, then click any open slot to book.
            </p>
          </div>
        </div>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {rooms.map((r) => {
            const active = r.id === roomId
            return (
              <button
                key={r.id}
                onClick={() => setRoomId(r.id)}
                className={`group flex shrink-0 items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition ${
                  active
                    ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-semibold ${active ? 'text-indigo-800' : 'text-slate-800'}`}
                  >
                    {r.name}
                  </p>
                  <p className={`text-xs ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
                    Floor {r.floor}
                  </p>
                </div>
                <Badge
                  className={
                    active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  }
                >
                  <svg viewBox="0 0 20 20" className="size-3" fill="currentColor">
                    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM13.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2 16.5C2 13.5 4.2 12 7 12s5 1.5 5 4.5V17H2v-.5zM13.4 12c2 .3 3.6 1.6 3.6 4.5v.5h-3.2c.1-1.9-.4-3.5-1.4-4.7.3 0 .7-.2 1-.3z" />
                  </svg>
                  {r.capacity}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Timezone banner */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-800 px-4 py-3 text-sm">
        <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-semibold text-slate-50">
          Office hours · Europe/Kyiv {String(OFFICE_OPEN_HOUR).padStart(2, '0')}:00–
          {OFFICE_CLOSE_HOUR}:00
        </span>
        <span className="text-slate-300">
          {sameTz
            ? 'Shown in office time — your timezone matches the office.'
            : `Shown in your local time (${localTz}) · that's ${localWindow} today.`}
        </span>
      </div>

      {/* Week navigation */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeek(-1)}
            aria-label="Previous week"
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => shiftWeek(1)}
            aria-label="Next week"
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Today
          </button>
        </div>
        <p className="font-display text-base font-semibold text-slate-800">{rangeLabel}</p>
      </div>

    {/* Grid */}
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-[#F8FAFC] shadow-sm shadow-slate-900/[0.04]">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
            <div
              className="sticky top-0 z-20 grid border-b border-slate-300 bg-slate-100"
              style={{ gridTemplateColumns: `56px repeat(7, 1fr)` }}
            >
              <div className="border-r border-slate-300" />
              {days.map((d, i) => {
                const p = calParts(d)
                const isToday = sameCalDate(today, p)
                return (
                  <div
                    key={d.toISOString()}
                    className={`border-r border-slate-300 px-2 py-2.5 text-center last:border-r-0 ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wide ${
                        isToday ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      {WEEKDAY_LABELS[i]}
                    </p>
                    <p
                      className={`mt-0.5 inline-flex size-7 items-center justify-center rounded-full text-sm font-bold ${
                        isToday ? 'bg-blue-700 text-white' : 'text-slate-800'
                      }`}
                    >
                      {p.d}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Time body */}
            <div
              className="grid"
              style={{ gridTemplateColumns: `56px repeat(7, 1fr)`, height: GRID_H }}
            >
              {/* Time gutter */}
              <div className="relative border-r border-slate-300 bg-slate-50">
                {labels.slice(0, -1).map((l, i) => (
                  <div
                    key={l}
                    className="absolute right-2 -translate-y-1/2 font-mono text-[11px] text-slate-400"
                    style={{ top: i * SLOT_H }}
                  >
                    {i % 2 === 0 ? l : ''}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((d, dayIdx) => {
                const p = calParts(d)
                const isToday = sameCalDate(today, p)
                return (
                  <div
                    key={d.toISOString()}
                    className={`relative border-r border-slate-300 last:border-r-0 ${
                      isToday ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Slot lines + click targets */}
                    {labels.slice(0, -1).map((l, i) => (
                      <button
                        key={l}
                        onClick={() => openDraft(d, l)}
                        className={`group absolute inset-x-0 flex items-center justify-center border-b transition hover:bg-indigo-50/80 ${
                          i % 2 === 0 ? 'border-slate-300' : 'border-slate-200'
                        }`}
                        style={{ top: i * SLOT_H, height: SLOT_H }}
                        aria-label={`Book ${l}`}
                      >
                        <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white opacity-0 shadow-sm transition group-hover:opacity-100">
                          <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                            <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                          </svg>
                        </span>
                      </button>
                    ))}

                    {/* Booking cards */}
                    {byDay[dayIdx].map((b) => {
                      const top = (officeMinutesFromOpen(new Date(b.startTime)) / 30) * SLOT_H
                      const dur = durationMinutes(b.startTime, b.endTime)
                      const height = Math.max((dur / 30) * SLOT_H - 3, 22)
                      const mine = b.userId === user?.id
                      const timeStr = `${formatInZone(new Date(b.startTime), localTz, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}–${formatInZone(new Date(b.endTime), localTz, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}`
                      return (
                        <div
                          key={b.id}
                          className={`absolute inset-x-1 overflow-hidden rounded-lg border-l-2 px-2 py-1 text-left ${
                            mine
                              ? 'border-l-blue-700 bg-[#2563EB] shadow-sm shadow-blue-900/20'
                              : 'border-l-slate-400 bg-[#E2E8F0]'
                          }`}
                          style={{ top: top + 1, height }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p
                              className={`truncate text-xs font-semibold ${
                                mine ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {b.title}
                            </p>
                            {mine && (
                              <button
                                onClick={() => setCancelTarget(b)}
                                aria-label="Cancel booking"
                                className="-mr-0.5 -mt-0.5 rounded p-0.5 text-blue-100 transition hover:bg-blue-800 hover:text-white"
                              >
                                <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {height > 34 && (
                            <p
                              className={`truncate font-mono text-[10px] ${
                                mine ? 'text-blue-100' : 'text-slate-600'
                              }`}
                            >
                              {timeStr}
                            </p>
                          )}
                          {height > 52 && (
                            <p
                              className={`truncate text-[11px] ${
                                mine ? 'text-blue-100' : 'text-slate-700'
                              }`}
                            >
                              {mine ? 'You' : b.userName}
                            </p>
                          )}
                        </div>
                      )
                    })}

                    {/* Current-time line */}
                    {isToday && showNowLine && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-10"
                        style={{ top: (nowOffset / 30) * SLOT_H }}
                      >
                        <div className="relative">
                          <span className="absolute -left-1 -top-[5px] size-2.5 rounded-full bg-[#DC2626]" />
                          <span className="block h-0.5 bg-[#DC2626]" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
      </div>
    </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-l-2 border-l-blue-700 bg-[#2563EB]" /> Your booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-l-2 border-l-slate-400 bg-[#E2E8F0]" /> Booked by others
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex items-center">
            <span className="mr-0.5 size-2 rounded-full bg-[#DC2626]" />
            <span className="h-0.5 w-4 bg-[#DC2626]" />
          </span>
          Current time
        </span>
      </div>

      <BookingModal
        open={!!draft}
        draft={draft}
        rooms={rooms}
        weekDays={days}
        onClose={() => setDraft(null)}
        onCreated={onCreated}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this booking?"
        message="This will free up the slot for others. This action cannot be undone."
        detail={
          cancelTarget
            ? `${cancelTarget.title} · ${room?.name ?? ''}`
            : undefined
        }
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, Cancel'}
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  )
}
