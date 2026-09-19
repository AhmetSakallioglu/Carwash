'use client'

import React, { useMemo, useState } from 'react'
import { BlackoutDate } from '@/types'
import { formatDateTimeCT } from '@/lib/utils'
import { createBlackoutAction, deleteBlackoutAction } from '@/app/actions/admin'
import { Plus, Trash2, CalendarOff, X, Loader2, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { ResponsiveSelect } from '@/components/ResponsiveSelect'

interface BlackoutManagerProps {
  initialBlackouts: BlackoutDate[]
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = i % 2 === 0 ? '00' : '30'
  const value = `${String(hours).padStart(2, '0')}:${minutes}`
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return { value, label: `${hours12}:${minutes} ${period}` }
})

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfWeek(date: Date): Date {
  const next = new Date(date)
  next.setDate(next.getDate() - next.getDay())
  return next
}

function formatReadable(value: string): string {
  if (!value) return ''
  return parseISODate(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildMonthCells(viewDate: Date): Array<Date | null> {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const leading = first.getDay()
  const cells: Array<Date | null> = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function BlackoutManager({ initialBlackouts }: BlackoutManagerProps) {
  const today = toISODate(new Date())
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>(initialBlackouts)
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [isFullDay, setIsFullDay] = useState(true)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [viewMonth, setViewMonth] = useState(new Date())
  const [pickingEnd, setPickingEnd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const monthCells = useMemo(() => buildMonthCells(viewMonth), [viewMonth])
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const openModal = () => {
    const now = new Date()
    const iso = toISODate(now)
    setTitle('')
    setStartDate(iso)
    setEndDate(iso)
    setIsFullDay(true)
    setStartTime('08:00')
    setEndTime('18:00')
    setViewMonth(now)
    setPickingEnd(false)
    setErrorMessage(null)
    setIsAdding(true)
  }

  const applyRange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
    setViewMonth(parseISODate(start))
    setPickingEnd(false)
  }

  const handleDayClick = (date: Date) => {
    const iso = toISODate(date)
    if (!pickingEnd) {
      setStartDate(iso)
      setEndDate(iso)
      setPickingEnd(true)
      return
    }

    if (iso < startDate) {
      setStartDate(iso)
      setEndDate(startDate)
    } else {
      setEndDate(iso)
    }
    setPickingEnd(false)
  }

  const isInRange = (date: Date) => {
    const iso = toISODate(date)
    const from = startDate
    const to = endDate || startDate
    return iso >= from && iso <= to
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const from = startDate
    const to = endDate || startDate
    const startIso = isFullDay ? `${from}T00:00:00` : `${from}T${startTime}:00`
    const endIso = isFullDay ? `${to}T23:59:59` : `${to}T${endTime}:00`

    try {
      const result = await createBlackoutAction({
        title,
        start_datetime: new Date(startIso).toISOString(),
        end_datetime: new Date(endIso).toISOString(),
        is_full_day: isFullDay,
      })

      if (result.success && result.data) {
        setBlackouts([...blackouts, result.data])
        setIsAdding(false)
      } else {
        setErrorMessage(result.error || 'Failed to create blackout date')
      }
    } catch {
      setErrorMessage('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!id || deletingId) return
    setDeletingId(id)
    setErrorMessage(null)
    const previous = blackouts
    setBlackouts(current => current.filter(item => item.id !== id))

    try {
      const result = await deleteBlackoutAction(id)
      if (!result.success) {
        setBlackouts(previous)
        setErrorMessage(result.error || 'Failed to delete blackout date')
      }
    } catch {
      setBlackouts(previous)
      setErrorMessage('Error deleting blackout date')
    } finally {
      setDeletingId(null)
    }
  }

  const weekendStart = toISODate(addDays(startOfWeek(new Date()), 6))
  const weekendEnd = toISODate(addDays(startOfWeek(new Date()), 7))

  return (
    <div className="glassmorphism rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-rose-400 shrink-0" /> Blackout Dates & Holidays
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click days on the calendar to block holidays or time off.
          </p>
        </div>

        <button
          onClick={openModal}
          type="button"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-500/10 active:scale-95 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Block Date / Time
        </button>
      </div>

      {errorMessage && !isAdding && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        {blackouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic">
            No active blackout dates or holiday blocks configured.
          </div>
        ) : (
          blackouts.map(b => (
            <div
              key={b.id}
              className="flex items-start justify-between gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition text-xs"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-sm break-words">{b.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {b.is_full_day ? 'Full Day Block' : 'Custom Window'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1">
                  {formatDateTimeCT(b.start_datetime)} — {formatDateTimeCT(b.end_datetime)}
                </div>
              </div>

              <button
                onClick={() => handleDelete(b.id)}
                type="button"
                disabled={deletingId === b.id}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer disabled:opacity-50"
                title="Remove Block"
              >
                {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop">
          <div
            className="relative w-full sm:max-w-lg glassmorphism bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[96dvh] sm:max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Add Blackout Period</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {pickingEnd ? 'Now click the last day of the block.' : 'Click a start date, then an end date.'}
                </p>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                type="button"
                className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="py-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labor Day / Shop Maintenance"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => applyRange(today, today)} className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = toISODate(addDays(new Date(), 1))
                    applyRange(t, t)
                  }}
                  className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => applyRange(weekendStart, weekendEnd)}
                  className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  This Weekend
                </button>
                <button
                  type="button"
                  onClick={() => applyRange(today, toISODate(addDays(new Date(), 2)))}
                  className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  Next 3 Days
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="font-display font-bold text-white text-sm">{monthLabel}</div>
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-[10px] uppercase tracking-wider text-slate-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} />
                    const iso = toISODate(date)
                    const selectedStart = iso === startDate
                    const selectedEnd = iso === (endDate || startDate)
                    const inRange = isInRange(date)
                    const isToday = iso === today

                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => handleDayClick(date)}
                        className={`h-9 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          selectedStart || selectedEnd
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                            : inRange
                              ? 'bg-rose-500/20 text-rose-100'
                              : isToday
                                ? 'border border-brand-cyan/50 text-brand-neon hover:bg-slate-800'
                                : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-100">
                <CalendarDays className="w-4 h-4 text-rose-300 shrink-0" />
                <div>
                  <div className="font-semibold">
                    {formatReadable(startDate)}
                    {endDate && endDate !== startDate ? ` → ${formatReadable(endDate)}` : ' (single day)'}
                  </div>
                  <div className="text-[10px] text-rose-200/80">
                    {pickingEnd ? 'Select an end date, or save for a single-day block.' : 'Range selected. Click another start date to reset.'}
                  </div>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="text-slate-300 font-semibold">Full day block</span>
                <input
                  type="checkbox"
                  checked={isFullDay}
                  onChange={e => setIsFullDay(e.target.checked)}
                  className="rounded border-slate-700 text-brand-cyan focus:ring-0"
                />
              </label>

              {!isFullDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Starts at</label>
                    <ResponsiveSelect
                      value={startTime}
                      onChange={setStartTime}
                      title="Starts at"
                      ariaLabel="Block start time"
                      triggerClassName="bg-slate-950"
                      options={TIME_OPTIONS}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Ends at</label>
                    <ResponsiveSelect
                      value={endTime}
                      onChange={setEndTime}
                      title="Ends at"
                      ariaLabel="Block end time"
                      triggerClassName="bg-slate-950"
                      options={TIME_OPTIONS}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !startDate}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add Blackout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
