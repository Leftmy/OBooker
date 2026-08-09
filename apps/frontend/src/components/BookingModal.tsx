import { useEffect, useMemo, useState } from 'react'
import { api, errorMessage } from '../lib/api'
import type { Booking, Room } from '../lib/types'
import {
  OFFICE_TZ,
  calParts,
  formatInZone,
  labelToMinutes,
  localTz,
  slotLabels,
  zonedTimeToUtc,
} from '../lib/time'
import { Button, Field, Modal, Select, TextInput } from './ui'

export interface BookingDraft {
  roomId: string
  /** office calendar date as a UTC-noon Date */
  day: Date
  startLabel: string
}

interface BookingModalProps {
  open: boolean
  draft: BookingDraft | null
  rooms: Room[]
  weekDays: Date[]
  onClose: () => void
  onCreated: (booking: Booking) => void
}

const MAX_DURATION = 240

export function BookingModal({
  open,
  draft,
  rooms,
  weekDays,
  onClose,
  onCreated,
}: BookingModalProps) {
  const labels = useMemo(() => slotLabels(), [])
  const [title, setTitle] = useState('')
  const [roomId, setRoomId] = useState('')
  const [dayIso, setDayIso] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [titleError, setTitleError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Sync form to the draft each time the modal opens.
  useEffect(() => {
    if (!open || !draft) return
    setTitle('')
    setRoomId(draft.roomId)
    setDayIso(draft.day.toISOString())
    const startMin = labelToMinutes(draft.startLabel)
    setStart(draft.startLabel)
    const defaultEnd = labels.find((l) => labelToMinutes(l) === startMin + 60)
    setEnd(defaultEnd ?? labels[labels.length - 1])
    setTitleError('')
    setFormError('')
  }, [open, draft, labels])

  const startOptions = labels.slice(0, -1)
  const endOptions = useMemo(() => {
    const s = labelToMinutes(start || labels[0])
    return labels.filter((l) => {
      const m = labelToMinutes(l)
      return m > s && m - s <= MAX_DURATION
    })
  }, [start, labels])

  // Keep end valid whenever start moves.
  useEffect(() => {
    if (!start) return
    const s = labelToMinutes(start)
    const e = labelToMinutes(end || '00:00')
    if (e <= s || e - s > MAX_DURATION) {
      setEnd(endOptions[0] ?? '')
    }
  }, [start]) // eslint-disable-line react-hooks/exhaustive-deps

  const durationMin = start && end ? labelToMinutes(end) - labelToMinutes(start) : 0

  const localHint = useMemo(() => {
    if (!dayIso || !start || !end || localTz === OFFICE_TZ) return ''
    const p = calParts(new Date(dayIso))
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const su = zonedTimeToUtc(p.y, p.mo, p.d, sh, sm, OFFICE_TZ)
    const eu = zonedTimeToUtc(p.y, p.mo, p.d, eh, em, OFFICE_TZ)
    const fmt = (d: Date) =>
      formatInZone(d, localTz, { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${fmt(su)}-${fmt(eu)} your time`
  }, [dayIso, start, end])

  if (!draft) return null

  const submit = async () => {
    setTitleError('')
    setFormError('')
    const trimmed = title.trim()
    if (trimmed.length < 1) {
      setTitleError('Give your meeting a title.')
      return
    }
    if (trimmed.length > 100) {
      setTitleError('Title must be 100 characters or fewer.')
      return
    }
    if (durationMin < 30 || durationMin > MAX_DURATION) {
      setFormError('Bookings must be between 30 minutes and 4 hours.')
      return
    }
    const p = calParts(new Date(dayIso))
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const startUtc = zonedTimeToUtc(p.y, p.mo, p.d, sh, sm, OFFICE_TZ)
    const endUtc = zonedTimeToUtc(p.y, p.mo, p.d, eh, em, OFFICE_TZ)
    setSubmitting(true)
    try {
      const booking = await api.createBooking({
        title: trimmed,
        roomId,
        startTime: startUtc.toISOString(),
        endTime: endUtc.toISOString(),
      })
      onCreated(booking)
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const dayLabel = dayIso
    ? formatInZone(new Date(dayIso), OFFICE_TZ, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <Modal open={open} onClose={onClose} labelledBy="booking-title">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 id="booking-title" className="font-display text-lg font-bold text-slate-900">
            New booking
          </h2>
          <p className="text-xs text-slate-500">{dayLabel}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="-mr-1.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        <Field
          label="Title"
          htmlFor="bk-title"
          error={titleError}
          hint={`${title.trim().length}/100`}
        >
          <TextInput
            id="bk-title"
            autoFocus
            maxLength={100}
            placeholder="e.g. Sprint Planning"
            value={title}
            invalid={!!titleError}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Room" htmlFor="bk-room">
            <Select id="bk-room" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · Floor {r.floor}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="bk-date">
            <Select id="bk-date" value={dayIso} onChange={(e) => setDayIso(e.target.value)}>
              {weekDays.map((d) => (
                <option key={d.toISOString()} value={d.toISOString()}>
                  {formatInZone(d, OFFICE_TZ, { weekday: 'short', month: 'short', day: 'numeric' })}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start" htmlFor="bk-start">
            <Select id="bk-start" value={start} onChange={(e) => setStart(e.target.value)}>
              {startOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="End" htmlFor="bk-end">
            <Select id="bk-end" value={end} onChange={(e) => setEnd(e.target.value)}>
              {endOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs">
          <span className="font-medium text-slate-500">
            Office time · Europe/Kyiv
            {localHint && <span className="ml-2 text-slate-400">({localHint})</span>}
          </span>
          <span className="font-mono font-semibold text-indigo-600">
            {durationMin > 0
              ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`.replace('0h ', '')
              : '-'}
          </span>
        </div>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-800"
          >
            <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-rose-500" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            {formError}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} loading={submitting}>
          {submitting ? 'Booking…' : 'Confirm Booking'}
        </Button>
      </div>
    </Modal>
  )
}
