import { useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'
import { useRouter } from '../lib/router'
import { useToast } from '../lib/toast'
import type { Booking, Room } from '../lib/types'
import {
  OFFICE_TZ,
  durationMinutes,
  formatInZone,
  localTz,
  partsInZone,
  startOfOfficeWeek,
  zonedTimeToUtc,
} from '../lib/time'
import { ConfirmDialog } from './ConfirmDialog'
import { Badge, Button } from './ui'

type Tab = 'upcoming' | 'past'
const PAGE_SIZE = 6

function durationLabel(b: Booking): string {
  const m = durationMinutes(b.startTime, b.endTime)
  const h = Math.floor(m / 60)
  const min = m % 60
  return [h ? `${h}h` : '', min ? `${min}m` : ''].filter(Boolean).join(' ')
}

export function MyBookings() {
  const { navigate } = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [rooms, setRooms] = useState<Record<string, Room>>({})
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Fetch initial rooms once
  useEffect(() => {
    api.listRooms()
      .then((r) => setRooms(Object.fromEntries(r.map((room) => [room.id, room]))))
      .catch((err) => toast.error(errorMessage(err)))
  }, [])

  // Fetch bookings when tab changes
  useEffect(() => {
    setLoading(true)
    api.myBookings({ type: tab, limit: PAGE_SIZE })
      .then((res) => {
        setBookings(res.items)
        setNextCursor(res.nextCursor)
        setHasMore(res.hasMore)
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [tab])

  const loadMore = () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    api.myBookings({ type: tab, limit: PAGE_SIZE, cursor: nextCursor || undefined })
      .then((res) => {
        setBookings((prev) => [...prev, ...res.items])
        setNextCursor(res.nextCursor)
        setHasMore(res.hasMore)
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoadingMore(false))
  }

  const openInCalendar = (b: Booking) => {
    const p = partsInZone(new Date(b.startTime), OFFICE_TZ)
    const week = startOfOfficeWeek(zonedTimeToUtc(p.y, p.mo, p.d, 12, 0, OFFICE_TZ))
    navigate('/rooms', { room: b.roomId, week: week.toISOString() })
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          My Bookings
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Times shown in your local timezone ({localTz}).
        </p>
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-xl bg-slate-100 p-1">
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-slate-700">
              No {tab} bookings
            </p>
            <p className="text-sm text-slate-400">
              {tab === 'upcoming'
                ? 'Head to the calendar to reserve a room.'
                : 'Your past meetings will show up here.'}
            </p>
          </div>
          {tab === 'upcoming' && (
            <Button variant="secondary" onClick={() => navigate('/rooms')} className="mt-1">
              Open calendar
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => {
            const past = tab === 'past'
            const start = new Date(b.startTime)
            const room = rooms[b.roomId]
            return (
              <li key={b.id}>
                <div
                  className={`group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition ${
                    past
                      ? 'border-slate-200 bg-slate-50/60'
                      : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm hover:shadow-slate-900/[0.03]'
                  }`}
                >
                  <button
                    onClick={() => openInCalendar(b)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left outline-none"
                  >
                    <div
                      className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-lg ${
                        past ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        {formatInZone(start, localTz, { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {formatInZone(start, localTz, { day: 'numeric' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate font-semibold ${past ? 'text-slate-600' : 'text-slate-900'}`}
                      >
                        {b.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
                        <span className="font-mono text-xs">
                          {formatInZone(start, localTz, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                          –
                          {formatInZone(new Date(b.endTime), localTz, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>{durationLabel(b)}</span>
                        <span className="text-slate-300">·</span>
                        <Badge className="bg-slate-100 text-slate-600">
                          {room ? `${room.name} · Fl ${room.floor}` : 'Room'}
                        </Badge>
                      </p>
                    </div>
                  </button>
                  {!past && (
                    <Button
                      variant="danger"
                      onClick={() => setCancelTarget(b)}
                      className="shrink-0 px-3 py-2 text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && !loading && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this booking?"
        message="This will free up the slot for others. This action cannot be undone."
        detail={cancelTarget ? cancelTarget.title : undefined}
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, Cancel'}
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  )
}
